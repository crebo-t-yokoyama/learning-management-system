"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit, Trash2, Users, Eye, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
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
import { Pagination } from "@/components/ui/pagination";
import type { Course, CourseStatistics } from "@/types/database";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface CourseListProps {
  courses: Course[];
  statistics: CourseStatistics[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onDeleteCourse: (courseId: string) => void;
}

export function CourseList({
  courses,
  statistics,
  pagination,
  onPageChange,
  onDeleteCourse
}: CourseListProps) {
  const router = useRouter();
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);

  // 統計データを取得するヘルパー関数
  const getCourseStats = (courseId: string) => {
    return statistics.find(stat => stat.course_id === courseId);
  };

  // 難易度レベルの表示テキスト
  const getDifficultyText = (level: string | null) => {
    switch (level) {
      case "beginner": return "初級";
      case "intermediate": return "中級";
      case "advanced": return "上級";
      default: return "未設定";
    }
  };

  // 難易度レベルの色
  const getDifficultyColor = (level: string | null) => {
    switch (level) {
      case "beginner": return "bg-green-100 text-green-800";
      case "intermediate": return "bg-yellow-100 text-yellow-800";
      case "advanced": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // 削除確認
  const handleDeleteConfirm = (courseId: string) => {
    setDeletingCourseId(courseId);
    onDeleteCourse(courseId);
    setDeletingCourseId(null);
  };

  if (courses.length === 0) {
    return (
      <EmptyState
        title="コースがありません"
        description="まだコースが作成されていません。新しいコースを作成してください。"
        action={
          <Button onClick={() => router.push("/admin/courses/new")}>
            コースを作成
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* コースカード一覧 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {courses.map((course) => {
          const stats = getCourseStats(course.id);
          
          return (
            <Card key={course.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate" title={course.title}>
                      {course.title}
                    </h3>
                    {course.category && (
                      <Badge variant="secondary" className="mt-1">
                        {course.category}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Badge
                      className={getDifficultyColor(course.difficulty_level)}
                      variant="secondary"
                    >
                      {getDifficultyText(course.difficulty_level)}
                    </Badge>
                    <Badge
                      variant={course.is_active ? "default" : "secondary"}
                      className={course.is_active ? "bg-green-600" : ""}
                    >
                      {course.is_active ? "アクティブ" : "非アクティブ"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* コース概要 */}
                {course.overview && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {course.overview}
                  </p>
                )}

                {/* 統計情報 */}
                {stats && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span>受講者数</span>
                      </div>
                      <span className="font-medium">{stats.total_learners || 0}名</span>
                    </div>

                    {stats.avg_progress_percentage !== null && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>平均進捗率</span>
                          <span className="font-medium">
                            {Math.round(stats.avg_progress_percentage)}%
                          </span>
                        </div>
                        <Progress value={stats.avg_progress_percentage} className="h-2" />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        完了: {stats.completed_learners || 0}名
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        受講中: {stats.in_progress_learners || 0}名
                      </div>
                    </div>
                  </div>
                )}

                {/* コース詳細情報 */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {course.estimated_hours ? `${course.estimated_hours}時間` : "時間未設定"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {course.created_at 
                        ? format(new Date(course.created_at), "yyyy/MM/dd", { locale: ja })
                        : "作成日不明"
                      }
                    </span>
                  </div>
                </div>

                {/* アクションボタン */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/courses/${course.id}`)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    詳細
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/courses/${course.id}/edit`)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={deletingCourseId === course.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>コースの削除</AlertDialogTitle>
                        <AlertDialogDescription>
                          「{course.title}」を削除しますか？
                          <br />
                          この操作は取り消せません。受講者が割り当てられている場合は削除できません。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>キャンセル</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteConfirm(course.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          削除
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ページネーション */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}

      {/* 結果サマリー */}
      <div className="text-center text-sm text-gray-600">
        {pagination.total}件中 {((pagination.page - 1) * pagination.limit) + 1}〜
        {Math.min(pagination.page * pagination.limit, pagination.total)}件を表示
      </div>
    </div>
  );
}