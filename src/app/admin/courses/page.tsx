import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-helpers";
import { isAdmin } from "@/lib/auth-helpers";
import { CourseManagement } from "@/components/courses/course-management";
import { Breadcrumb } from "@/components/navigation/breadcrumb";

export default async function CoursesPage() {
  // セッション確認と管理者権限チェック
  const session = await getServerSession();
  
  if (!session) {
    redirect("/login");
  }
  
  if (!isAdmin(session)) {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb
        items={[
          { label: "管理画面", href: "/admin/dashboard" },
          { label: "コース管理", href: "/admin/courses", current: true },
        ]}
      />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">コース管理</h1>
        <p className="mt-2 text-gray-600">
          システム内のコースを管理します。コースの作成、編集、削除、受講者の割り当てが可能です。
        </p>
      </div>

      <Suspense fallback={<div>読み込み中...</div>}>
        <CourseManagement />
      </Suspense>
    </div>
  );
}