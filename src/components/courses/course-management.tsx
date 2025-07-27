"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Filter, Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CourseList } from "./course-list";
import { CourseFilters } from "./course-filters";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingDisplay } from "@/components/ui/loading-display";
import { ErrorDisplay } from "@/components/ui/error-display";
import type { Course, CourseStatistics } from "@/types/database";
import { toast } from "sonner";

interface CourseManagementState {
  courses: Course[];
  statistics: CourseStatistics[];
  isLoading: boolean;
  error: string | null;
  filters: {
    search: string;
    category: string;
    difficulty_level: string;
    is_active: boolean | null;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function CourseManagement() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [state, setState] = useState<CourseManagementState>({
    courses: [],
    statistics: [],
    isLoading: true,
    error: null,
    filters: {
      search: searchParams.get("search") || "",
      category: searchParams.get("category") || "",
      difficulty_level: searchParams.get("difficulty_level") || "",
      is_active: searchParams.get("is_active") ? searchParams.get("is_active") === "true" : null,
    },
    pagination: {
      page: parseInt(searchParams.get("page") || "1"),
      limit: 20,
      total: 0,
      totalPages: 0,
    },
  });

  const [showFilters, setShowFilters] = useState(false);

  // コース一覧取得
  const fetchCourses = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const params = new URLSearchParams();
      params.set("page", state.pagination.page.toString());
      params.set("limit", state.pagination.limit.toString());
      
      if (state.filters.search) params.set("search", state.filters.search);
      if (state.filters.category) params.set("category", state.filters.category);
      if (state.filters.difficulty_level) params.set("difficulty_level", state.filters.difficulty_level);
      if (state.filters.is_active !== null) params.set("is_active", state.filters.is_active.toString());

      const response = await fetch(`/api/courses?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("コース一覧の取得に失敗しました");
      }

      const result = await response.json();
      
      setState(prev => ({
        ...prev,
        courses: result.data,
        pagination: {
          ...prev.pagination,
          total: result.meta.total,
          totalPages: result.meta.totalPages,
        },
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

  // 統計情報取得
  const fetchStatistics = async () => {
    try {
      const response = await fetch("/api/statistics/course-progress");
      
      if (!response.ok) {
        throw new Error("統計情報の取得に失敗しました");
      }

      const result = await response.json();
      setState(prev => ({ ...prev, statistics: result.data }));
    } catch (error) {
      console.error("統計情報取得エラー:", error);
    }
  };

  // 初期データ読み込み
  useEffect(() => {
    fetchCourses();
    fetchStatistics();
  }, [state.pagination.page, state.filters]);

  // 検索フィルター変更
  const handleSearchChange = (value: string) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, search: value },
      pagination: { ...prev.pagination, page: 1 },
    }));
  };

  // フィルター変更
  const handleFiltersChange = (filters: Partial<typeof state.filters>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...filters },
      pagination: { ...prev.pagination, page: 1 },
    }));
  };

  // フィルタークリア
  const clearFilters = () => {
    setState(prev => ({
      ...prev,
      filters: {
        search: "",
        category: "",
        difficulty_level: "",
        is_active: null,
      },
      pagination: { ...prev.pagination, page: 1 },
    }));
  };

  // ページ変更
  const handlePageChange = (page: number) => {
    setState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, page },
    }));
  };

  // コース削除
  const handleDeleteCourse = async (courseId: string) => {
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "削除に失敗しました");
      }

      toast.success("コースを削除しました");
      fetchCourses();
      fetchStatistics();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "削除に失敗しました");
    }
  };

  // 統計サマリー計算
  const totalCourses = state.pagination.total;
  const activeCourses = state.courses.filter(course => course.is_active).length;
  const totalEnrollments = state.statistics.reduce((sum, stat) => sum + (stat.total_learners || 0), 0);
  const avgProgress = state.statistics.length > 0 
    ? state.statistics.reduce((sum, stat) => sum + (stat.avg_progress_percentage || 0), 0) / state.statistics.length
    : 0;

  if (state.error) {
    return (
      <ErrorDisplay
        title="エラーが発生しました"
        message={state.error}
        onRetry={fetchCourses}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">総コース数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCourses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">アクティブコース</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCourses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">総受講者数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEnrollments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">平均進捗率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgProgress.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* 操作バー */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          {/* 検索 */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="コース名で検索..."
              value={state.filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* フィルター切り替え */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            フィルター
            {(state.filters.category || state.filters.difficulty_level || state.filters.is_active !== null) && (
              <Badge variant="secondary" className="ml-1">
                適用中
              </Badge>
            )}
          </Button>

          {/* フィルタークリア */}
          {(state.filters.search || state.filters.category || state.filters.difficulty_level || state.filters.is_active !== null) && (
            <Button variant="ghost" onClick={clearFilters}>
              クリア
            </Button>
          )}
        </div>

        {/* アクションボタン */}
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
          <Button
            onClick={() => router.push("/admin/courses/new")}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            新規作成
          </Button>
        </div>
      </div>

      {/* フィルター */}
      {showFilters && (
        <CourseFilters
          filters={state.filters}
          onFiltersChange={handleFiltersChange}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* コース一覧 */}
      {state.isLoading ? (
        <LoadingDisplay message="コース一覧を読み込み中..." />
      ) : (
        <CourseList
          courses={state.courses}
          statistics={state.statistics}
          pagination={state.pagination}
          onPageChange={handlePageChange}
          onDeleteCourse={handleDeleteCourse}
        />
      )}
    </div>
  );
}