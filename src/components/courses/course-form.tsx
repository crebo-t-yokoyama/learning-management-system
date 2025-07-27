"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { LoadingDisplay } from "@/components/ui/loading-display";
import { courseCreateSchema, courseUpdateSchema, type CourseCreateSchema, type CourseUpdateSchema } from "@/lib/validations";
import type { Course } from "@/types/database";
import { toast } from "sonner";

interface CourseFormProps {
  mode: "create" | "edit";
  initialData?: Course | null;
  onSubmit?: (data: CourseCreateSchema | CourseUpdateSchema) => Promise<void>;
}

// カテゴリの選択肢
const CATEGORIES = [
  "技術研修",
  "マネジメント",
  "コンプライアンス",
  "セキュリティ",
  "営業スキル",
  "コミュニケーション",
  "その他",
];

export function CourseForm({ mode, initialData, onSubmit }: CourseFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schema = mode === "create" ? courseCreateSchema : courseUpdateSchema;
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CourseCreateSchema | CourseUpdateSchema>({
    resolver: zodResolver(schema),
    defaultValues: initialData
      ? {
          title: initialData.title,
          overview: initialData.overview || "",
          description: initialData.description || "",
          category: initialData.category || "",
          difficulty_level: initialData.difficulty_level as "beginner" | "intermediate" | "advanced" | undefined,
          estimated_hours: initialData.estimated_hours || undefined,
          is_active: initialData.is_active ?? true,
        }
      : {
          title: "",
          overview: "",
          description: "",
          category: "",
          difficulty_level: "beginner",
          estimated_hours: undefined,
          is_active: true,
        },
  });

  const watchedValues = watch();

  const handleFormSubmit = async (data: CourseCreateSchema | CourseUpdateSchema) => {
    setIsSubmitting(true);
    
    try {
      if (onSubmit) {
        await onSubmit(data);
      } else {
        // デフォルトの送信処理
        const url = mode === "create" 
          ? "/api/courses"
          : `/api/courses/${initialData?.id}`;
        
        const method = mode === "create" ? "POST" : "PUT";
        
        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "保存に失敗しました");
        }

        toast.success(mode === "create" ? "コースを作成しました" : "コースを更新しました");
        router.push("/admin/courses");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "エラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) {
    return (
      <LoadingDisplay 
        message={mode === "create" ? "コースを作成中..." : "コースを更新中..."} 
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          戻る
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {mode === "create" ? "新規コース作成" : "コース編集"}
          </h1>
          <p className="text-gray-600">
            {mode === "create" 
              ? "新しいコースを作成します。必須項目を入力してください。"
              : "コース情報を編集します。変更後は保存ボタンをクリックしてください。"
            }
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* 基本情報 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              基本情報
              <Badge variant="secondary">必須</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* コースタイトル */}
            <div className="space-y-2">
              <Label htmlFor="title" className="required">
                コースタイトル
              </Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="例: JavaScript基礎講座"
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && (
                <p className="text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            {/* コース概要 */}
            <div className="space-y-2">
              <Label htmlFor="overview">概要</Label>
              <Textarea
                id="overview"
                {...register("overview")}
                placeholder="コースの簡潔な説明を入力してください（500文字以内）"
                rows={3}
                className={errors.overview ? "border-red-500" : ""}
              />
              {errors.overview && (
                <p className="text-sm text-red-600">{errors.overview.message}</p>
              )}
              <p className="text-xs text-gray-500">
                {watchedValues.overview?.length || 0}/500文字
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* カテゴリ */}
              <div className="space-y-2">
                <Label htmlFor="category">カテゴリ</Label>
                <Select
                  value={watchedValues.category || ""}
                  onValueChange={(value) => setValue("category", value)}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="カテゴリを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-red-600">{errors.category.message}</p>
                )}
              </div>

              {/* 難易度 */}
              <div className="space-y-2">
                <Label htmlFor="difficulty_level" className="required">
                  難易度
                </Label>
                <Select
                  value={watchedValues.difficulty_level || ""}
                  onValueChange={(value) => setValue("difficulty_level", value as "beginner" | "intermediate" | "advanced")}
                >
                  <SelectTrigger id="difficulty_level">
                    <SelectValue placeholder="難易度を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">初級</SelectItem>
                    <SelectItem value="intermediate">中級</SelectItem>
                    <SelectItem value="advanced">上級</SelectItem>
                  </SelectContent>
                </Select>
                {errors.difficulty_level && (
                  <p className="text-sm text-red-600">{errors.difficulty_level.message}</p>
                )}
              </div>

              {/* 推定学習時間 */}
              <div className="space-y-2">
                <Label htmlFor="estimated_hours" className="required">
                  推定学習時間（時間）
                </Label>
                <Input
                  id="estimated_hours"
                  type="number"
                  step="0.5"
                  min="0.1"
                  max="1000"
                  {...register("estimated_hours", { valueAsNumber: true })}
                  placeholder="例: 8.5"
                  className={errors.estimated_hours ? "border-red-500" : ""}
                />
                {errors.estimated_hours && (
                  <p className="text-sm text-red-600">{errors.estimated_hours.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 詳細情報 */}
        <Card>
          <CardHeader>
            <CardTitle>詳細情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* コース詳細説明 */}
            <div className="space-y-2">
              <Label htmlFor="description">詳細説明</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="コースの詳細な説明、学習目標、対象者、前提知識等を記載してください"
                rows={8}
                className={errors.description ? "border-red-500" : ""}
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 設定 */}
        <Card>
          <CardHeader>
            <CardTitle>コース設定</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="is_active">アクティブ状態</Label>
                <p className="text-sm text-gray-600">
                  アクティブなコースのみ受講者に表示されます
                </p>
              </div>
              <Switch
                id="is_active"
                checked={watchedValues.is_active ?? true}
                onCheckedChange={(checked) => setValue("is_active", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* 送信ボタン */}
        <div className="flex justify-end gap-4 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            キャンセル
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {mode === "create" ? "作成" : "更新"}
          </Button>
        </div>
      </form>
    </div>
  );
}