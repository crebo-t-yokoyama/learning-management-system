"use client";

import { useSession } from "next-auth/react";
import type { UserRole } from "@/types/database";

export function useAuth() {
	const { data: session, status } = useSession();

	const isLoading = status === "loading";
	const isAuthenticated = !!session?.user;
	const user = session?.user ?? null;

	// 役割チェック関数
	const isAdmin = user?.role === "admin";
	const isLearner = user?.role === "learner";
	const hasRole = (role: UserRole) => user?.role === role;

	// リソースアクセス権限チェック
	const canAccessResource = (resourceUserId: string) => {
		if (!isAuthenticated) return false;
		if (isAdmin) return true;
		return user?.id === resourceUserId;
	};

	return {
		session,
		user,
		isLoading,
		isAuthenticated,
		isAdmin,
		isLearner,
		hasRole,
		canAccessResource,
	};
}