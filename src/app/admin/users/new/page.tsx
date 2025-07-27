import type { Metadata } from "next";
import { UserForm } from "@/components/users/user-form";

export const metadata: Metadata = {
	title: "新規受講者追加 | 学習管理システム",
	description: "新しい受講者をシステムに追加します",
};

export default function NewUserPage() {
	return <UserForm mode="create" />;
}