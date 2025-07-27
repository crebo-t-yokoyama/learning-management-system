"use client";

import { useState, useEffect } from "react";
import { UserPlus, UserMinus, Search, Filter, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingDisplay } from "@/components/ui/loading-display";
import { ErrorDisplay } from "@/components/ui/error-display";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { User, Enrollment, Course } from "@/types/database";
import { toast } from "sonner";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface EnrollmentManagerProps {
  courseId: string;
  course?: Course;
}

interface EnrollmentWithUser extends Enrollment {
  user: User;
}

interface EnrollmentManagerState {
  enrollments: EnrollmentWithUser[];
  availableUsers: User[];
  isLoading: boolean;
  error: string | null;
  filters: {
    search: string;
    status: string;
    department: string;
  };
  selectedUsers: string[];
  isAssigning: boolean;
}

export function EnrollmentManager({ courseId, course }: EnrollmentManagerProps) {
  const [state, setState] = useState<EnrollmentManagerState>({
    enrollments: [],
    availableUsers: [],
    isLoading: true,
    error: null,
    filters: {
      search: "",
      status: "",
      department: "",
    },
    selectedUsers: [],
    isAssigning: false,
  });

  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [removingEnrollmentId, setRemovingEnrollmentId] = useState<string | null>(null);

  // 受講者一覧取得
  const fetchEnrollments = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const params = new URLSearchParams({ course_id: courseId });
      if (state.filters.status) params.set("status", state.filters.status);

      const response = await fetch(`/api/enrollments?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("受講者一覧の取得に失敗しました");
      }

      const result = await response.json();
      
      // ユーザー情報も含めて取得
      const enrollmentsWithUsers = await Promise.all(
        result.data.map(async (enrollment: Enrollment) => {
          const userResponse = await fetch(`/api/users/${enrollment.learner_id}`);
          if (userResponse.ok) {
            const userResult = await userResponse.json();
            return { ...enrollment, user: userResult.data };
          }
          return enrollment;
        })
      );

      setState(prev => ({
        ...prev,
        enrollments: enrollmentsWithUsers.filter(e => e.user),
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "エラーが発生しました",
        isLoading: false,
      }));
    }
  };

  // 利用可能なユーザー一覧取得
  const fetchAvailableUsers = async () => {
    try {
      const params = new URLSearchParams({
        role: "learner",
        limit: "100",
      });
      
      if (state.filters.search) params.set("search", state.filters.search);
      if (state.filters.department) params.set("department", state.filters.department);

      const response = await fetch(`/api/users?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("ユーザー一覧の取得に失敗しました");
      }

      const result = await response.json();
      
      // 既に割り当て済みのユーザーを除外
      const enrolledUserIds = state.enrollments.map(e => e.learner_id);
      const availableUsers = result.data.filter(
        (user: User) => !enrolledUserIds.includes(user.id)
      );

      setState(prev => ({ ...prev, availableUsers }));
    } catch (error) {
      console.error("利用可能ユーザー取得エラー:", error);
    }
  };

  // 初期データ読み込み
  useEffect(() => {
    fetchEnrollments();
  }, [courseId, state.filters.status]);

  useEffect(() => {
    if (showAssignDialog) {
      fetchAvailableUsers();
    }
  }, [showAssignDialog, state.filters.search, state.filters.department]);

  // 検索フィルター変更
  const handleFiltersChange = (filters: Partial<typeof state.filters>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...filters },
    }));
  };

  // ユーザー選択変更
  const handleUserSelection = (userId: string, checked: boolean) => {
    setState(prev => ({
      ...prev,
      selectedUsers: checked
        ? [...prev.selectedUsers, userId]
        : prev.selectedUsers.filter(id => id !== userId),
    }));
  };

  // 受講者割り当て
  const handleAssignUsers = async () => {
    if (state.selectedUsers.length === 0) {
      toast.error("割り当てするユーザーを選択してください");
      return;
    }

    setState(prev => ({ ...prev, isAssigning: true }));

    try {
      const assignments = state.selectedUsers.map(userId => ({
        learner_id: userId,
        course_id: courseId,
        status: "assigned",
      }));

      const response = await fetch("/api/enrollments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ enrollments: assignments }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "割り当てに失敗しました");
      }

      toast.success(`${state.selectedUsers.length}名の受講者を割り当てました`);
      setShowAssignDialog(false);
      setState(prev => ({ ...prev, selectedUsers: [] }));
      fetchEnrollments();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "割り当てに失敗しました");
    } finally {
      setState(prev => ({ ...prev, isAssigning: false }));
    }
  };

  // 受講者割り当て解除
  const handleRemoveEnrollment = async (enrollmentId: string) => {
    try {
      const response = await fetch(`/api/enrollments/${enrollmentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "割り当て解除に失敗しました");
      }

      toast.success("受講者の割り当てを解除しました");
      fetchEnrollments();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "割り当て解除に失敗しました");
    } finally {
      setRemovingEnrollmentId(null);
    }
  };

  // ステータス表示
  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "assigned":
        return <Badge variant="secondary">割り当て済み</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800">受講中</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-800">完了</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">キャンセル</Badge>;
      default:
        return <Badge variant="secondary">不明</Badge>;
    }
  };

  if (state.error) {
    return (
      <ErrorDisplay
        title="エラーが発生しました"
        message={state.error}
        onRetry={fetchEnrollments}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">受講者管理</h2>
          {course && (
            <p className="text-gray-600 mt-1">
              コース: {course.title}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => {
              // CSV エクスポート機能 (後で実装)
              toast.info("エクスポート機能は開発中です");
            }}
          >
            <Download className="h-4 w-4" />
            エクスポート
          </Button>
          <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                受講者を割り当て
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>受講者の割り当て</DialogTitle>
                <DialogDescription>
                  このコースに割り当てる受講者を選択してください。
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* 検索・フィルター */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="user-search">受講者検索</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="user-search"
                        placeholder="名前またはメールアドレスで検索..."
                        value={state.filters.search}
                        onChange={(e) => handleFiltersChange({ search: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="w-48">
                    <Label htmlFor="department-filter">部署</Label>
                    <Select
                      value={state.filters.department}
                      onValueChange={(value) =>
                        handleFiltersChange({ department: value === "all" ? "" : value })
                      }
                    >
                      <SelectTrigger id="department-filter">
                        <SelectValue placeholder="部署を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">すべて</SelectItem>
                        <SelectItem value="開発部">開発部</SelectItem>
                        <SelectItem value="営業部">営業部</SelectItem>
                        <SelectItem value="管理部">管理部</SelectItem>
                        <SelectItem value="人事部">人事部</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* ユーザー一覧 */}
                <div className="max-h-96 overflow-y-auto border rounded-lg">
                  {state.availableUsers.length === 0 ? (
                    <EmptyState
                      title="割り当て可能な受講者がいません"
                      description="すべてのユーザーが既に割り当てられているか、条件に一致するユーザーがいません。"
                    />
                  ) : (
                    <div className="space-y-2 p-4">
                      {state.availableUsers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50"
                        >
                          <Checkbox
                            id={`user-${user.id}`}
                            checked={state.selectedUsers.includes(user.id)}
                            onCheckedChange={(checked) =>
                              handleUserSelection(user.id, !!checked)
                            }
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {user.full_name || user.name}
                              </span>
                              {user.department && (
                                <Badge variant="secondary">{user.department}</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{user.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 選択状況 */}
                {state.selectedUsers.length > 0 && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-800">
                      {state.selectedUsers.length}名のユーザーが選択されています
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowAssignDialog(false)}
                >
                  キャンセル
                </Button>
                <Button
                  onClick={handleAssignUsers}
                  disabled={state.selectedUsers.length === 0 || state.isAssigning}
                >
                  {state.isAssigning ? "割り当て中..." : "割り当て"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* フィルター */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="w-48">
              <Label htmlFor="status-filter">ステータス</Label>
              <Select
                value={state.filters.status}
                onValueChange={(value) =>
                  handleFiltersChange({ status: value === "all" ? "" : value })
                }
              >
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="ステータスを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="assigned">割り当て済み</SelectItem>
                  <SelectItem value="in_progress">受講中</SelectItem>
                  <SelectItem value="completed">完了</SelectItem>
                  <SelectItem value="cancelled">キャンセル</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 受講者一覧 */}
      {state.isLoading ? (
        <LoadingDisplay message="受講者一覧を読み込み中..." />
      ) : state.enrollments.length === 0 ? (
        <EmptyState
          title="受講者が割り当てられていません"
          description="このコースにはまだ受講者が割り当てられていません。上記のボタンから受講者を割り当ててください。"
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>受講者一覧 ({state.enrollments.length}名)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {state.enrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {enrollment.user.full_name || enrollment.user.name}
                        </span>
                        {enrollment.user.department && (
                          <Badge variant="secondary">
                            {enrollment.user.department}
                          </Badge>
                        )}
                        {getStatusBadge(enrollment.status)}
                      </div>
                      <p className="text-sm text-gray-600">
                        {enrollment.user.email}
                      </p>
                      <div className="flex gap-4 text-xs text-gray-500 mt-1">
                        <span>
                          割り当て日: {enrollment.assigned_at 
                            ? format(new Date(enrollment.assigned_at), "yyyy/MM/dd", { locale: ja })
                            : "不明"
                          }
                        </span>
                        {enrollment.progress_percentage !== null && (
                          <span>進捗: {enrollment.progress_percentage}%</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={removingEnrollmentId === enrollment.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>受講者の割り当て解除</AlertDialogTitle>
                          <AlertDialogDescription>
                            {enrollment.user.full_name || enrollment.user.name}さんの
                            このコースへの割り当てを解除しますか？
                            <br />
                            この操作は取り消せません。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>キャンセル</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              setRemovingEnrollmentId(enrollment.id);
                              handleRemoveEnrollment(enrollment.id);
                            }}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            割り当て解除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}