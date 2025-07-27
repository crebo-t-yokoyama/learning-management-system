import { redirect } from "next/navigation";
import { getServerSession, isAdmin } from "@/lib/auth-helpers";
import { CourseForm } from "@/components/courses/course-form";
import { Breadcrumb } from "@/components/navigation/breadcrumb";

export default async function NewCoursePage() {
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
          { label: "コース管理", href: "/admin/courses" },
          { label: "新規作成", href: "/admin/courses/new", current: true },
        ]}
      />
      
      <CourseForm mode="create" />
    </div>
  );
}