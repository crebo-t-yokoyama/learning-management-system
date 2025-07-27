import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { UserForm } from "@/components/users/user-form";
import type { User } from "@/types/database";

interface EditUserPageProps {
	params: {
		id: string;
	};
}

export async function generateMetadata({ params }: EditUserPageProps): Promise<Metadata> {
	try {
		const supabase = await createServerSupabaseClient();
		const { data: user } = await supabase
			.from("users")
			.select("name, email")
			.eq("id", params.id)
			.single();

		const userName = user?.name || user?.email || "受講者";
		
		return {
			title: `${userName}の編集 | 学習管理システム`,
			description: `${userName}の情報を編集します`,
		};
	} catch {
		return {
			title: "受講者編集 | 学習管理システム",
			description: "受講者の情報を編集します",
		};
	}
}

async function getUser(id: string): Promise<User | null> {
	try {
		const supabase = await createServerSupabaseClient();
		const { data: user, error } = await supabase
			.from("users")
			.select("*")
			.eq("id", id)
			.single();

		if (error || !user) {
			return null;
		}

		return user;
	} catch (error) {
		console.error("ユーザー取得エラー:", error);
		return null;
	}
}

export default async function EditUserPage({ params }: EditUserPageProps) {
	const user = await getUser(params.id);

	if (!user) {
		notFound();
	}

	return <UserForm mode="edit" user={user} />;
}