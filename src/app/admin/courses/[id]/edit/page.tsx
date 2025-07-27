import { redirect, notFound } from "next/navigation";
import { getServerSession, isAdmin } from "@/lib/auth-helpers";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { CourseForm } from "@/components/courses/course-form";
import { Breadcrumb } from "@/components/navigation/breadcrumb";
import type { Course } from "@/types/database";

interface EditCoursePageProps {
  params: {
    id: string;
  };
}

async function getCourse(id: string): Promise<Course | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: course, error } = await supabase
      .from("courses")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !course) {
      return null;
    }

    return course;
  } catch (error) {
    console.error("コース取得エラー:", error);
    return null;
  }
}

export default async function EditCoursePage({ params }: EditCoursePageProps) {
  // セッション確認と管理者権限チェック
  const session = await getServerSession();
  
  if (!session) {
    redirect("/login");
  }
  
  if (!isAdmin(session)) {
    redirect("/dashboard");
  }

  // コース情報取得
  const course = await getCourse(params.id);
  
  if (!course) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb
        items={[
          { label: "管理画面", href: "/admin/dashboard" },
          { label: "コース管理", href: "/admin/courses" },
          { label: course.title, href: `/admin/courses/${course.id}` },
          { label: "編集", href: `/admin/courses/${course.id}/edit`, current: true },
        ]}
      />
      
      <CourseForm mode="edit" initialData={course} />
    </div>
  );
}