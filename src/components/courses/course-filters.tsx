"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface CourseFiltersProps {
  filters: {
    search: string;
    category: string;
    difficulty_level: string;
    is_active: boolean | null;
  };
  onFiltersChange: (filters: Partial<CourseFiltersProps["filters"]>) => void;
  onClose: () => void;
}

// カテゴリの選択肢（実際のアプリケーションでは API から取得することを推奨）
const CATEGORIES = [
  "技術研修",
  "マネジメント",
  "コンプライアンス",
  "セキュリティ",
  "営業スキル",
  "コミュニケーション",
  "その他",
];

export function CourseFilters({ filters, onFiltersChange, onClose }: CourseFiltersProps) {
  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">フィルター</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* カテゴリフィルター */}
        <div className="space-y-2">
          <Label htmlFor="category-filter">カテゴリ</Label>
          <Select
            value={filters.category}
            onValueChange={(value) =>
              onFiltersChange({ category: value === "all" ? "" : value })
            }
          >
            <SelectTrigger id="category-filter">
              <SelectValue placeholder="カテゴリを選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              {CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 難易度フィルター */}
        <div className="space-y-2">
          <Label htmlFor="difficulty-filter">難易度</Label>
          <Select
            value={filters.difficulty_level}
            onValueChange={(value) =>
              onFiltersChange({ difficulty_level: value === "all" ? "" : value })
            }
          >
            <SelectTrigger id="difficulty-filter">
              <SelectValue placeholder="難易度を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="beginner">初級</SelectItem>
              <SelectItem value="intermediate">中級</SelectItem>
              <SelectItem value="advanced">上級</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ステータスフィルター */}
        <div className="space-y-2">
          <Label htmlFor="status-filter">ステータス</Label>
          <Select
            value={
              filters.is_active === null
                ? "all"
                : filters.is_active
                ? "active"
                : "inactive"
            }
            onValueChange={(value) =>
              onFiltersChange({
                is_active:
                  value === "all" ? null : value === "active" ? true : false,
              })
            }
          >
            <SelectTrigger id="status-filter">
              <SelectValue placeholder="ステータスを選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="active">アクティブ</SelectItem>
              <SelectItem value="inactive">非アクティブ</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}