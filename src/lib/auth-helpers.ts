import { auth } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import type { UserRole } from "@/types/database";
import type { Session } from "next-auth";

/**
 * サーバーサイドで現在のセッションを取得
 */
export async function getServerSession() {
	return await auth();
}

/**
 * 管理者権限をチェック
 */
export function isAdmin(session: Session | null): boolean {
	return session?.user?.role === "admin";
}

/**
 * 受講者権限をチェック
 */
export function isLearner(session: Session | null): boolean {
	return session?.user?.role === "learner";
}

/**
 * 特定の役割をチェック
 */
export function hasRole(session: Session | null, role: UserRole): boolean {
	return session?.user?.role === role;
}

/**
 * 認証済みユーザーかチェック
 */
export function isAuthenticated(session: Session | null): boolean {
	return !!session?.user;
}

/**
 * サーバーサイドで管理者権限を要求
 * 権限がない場合は例外を投げる
 */
export async function requireAdmin() {
	const session = await getServerSession();
	if (!isAdmin(session)) {
		throw new Error("管理者権限が必要です");
	}
	return session;
}

/**
 * サーバーサイドで受講者権限を要求
 * 権限がない場合は例外を投げる
 */
export async function requireLearner() {
	const session = await getServerSession();
	if (!isLearner(session)) {
		throw new Error("受講者権限が必要です");
	}
	return session;
}

/**
 * サーバーサイドで認証を要求
 * 認証されていない場合は例外を投げる
 */
export async function requireAuth() {
	const session = await getServerSession();
	if (!isAuthenticated(session)) {
		throw new Error("認証が必要です");
	}
	return session;
}

/**
 * ユーザーが特定のリソースにアクセス権限があるかチェック
 * 管理者は全てにアクセス可能、受講者は自分に関連するもののみ
 */
export async function canAccessResource(
	resourceUserId: string,
	session?: Session | null
): Promise<boolean> {
	const currentSession = session || (await getServerSession());
	
	if (!isAuthenticated(currentSession)) {
		return false;
	}

	// 管理者は全てのリソースにアクセス可能
	if (isAdmin(currentSession)) {
		return true;
	}

	// 受講者は自分のリソースのみアクセス可能
	return currentSession!.user.id === resourceUserId;
}

/**
 * ユーザーがコースにアクセス権限があるかチェック
 * 管理者は全コース、受講者は割り当てられたコースのみ
 */
export async function canAccessCourse(
	courseId: string,
	session?: Session | null
): Promise<boolean> {
	const currentSession = session || (await getServerSession());
	
	if (!isAuthenticated(currentSession)) {
		return false;
	}

	// 管理者は全コースにアクセス可能
	if (isAdmin(currentSession)) {
		return true;
	}

	// 受講者は割り当てられたコースのみアクセス可能
	try {
		const supabase = await createServerSupabaseClient();
		const { data, error } = await supabase
			.from("enrollments")
			.select("id")
			.eq("course_id", courseId)
			.eq("learner_id", currentSession!.user.id)
			.single();

		return !error && !!data;
	} catch {
		return false;
	}
}

/**
 * ユーザーが学習記録にアクセス権限があるかチェック
 */
export async function canAccessLearningRecord(
	recordId: string,
	session?: Session | null
): Promise<boolean> {
	const currentSession = session || (await getServerSession());
	
	if (!isAuthenticated(currentSession)) {
		return false;
	}

	// 管理者は全ての学習記録にアクセス可能
	if (isAdmin(currentSession)) {
		return true;
	}

	// 受講者は自分の学習記録のみアクセス可能
	try {
		const supabase = await createServerSupabaseClient();
		const { data, error } = await supabase
			.from("learning_records")
			.select("learner_id")
			.eq("id", recordId)
			.single();

		return !error && data?.learner_id === currentSession!.user.id;
	} catch {
		return false;
	}
}

/**
 * API Routes用の権限チェックミドルウェア
 */
export async function withAuth(
	handler: (session: Session) => Promise<Response> | Response,
	options?: { requireRole?: UserRole }
): Promise<Response> {
	try {
		const session = await getServerSession();
		
		if (!isAuthenticated(session)) {
			return new Response(
				JSON.stringify({ error: "認証が必要です" }),
				{ status: 401, headers: { "Content-Type": "application/json" } }
			);
		}

		if (options?.requireRole && !hasRole(session, options.requireRole)) {
			return new Response(
				JSON.stringify({ error: "権限が不足しています" }),
				{ status: 403, headers: { "Content-Type": "application/json" } }
			);
		}

		return await handler(session!);
	} catch (error) {
		console.error("認証エラー:", error);
		return new Response(
			JSON.stringify({ error: "内部サーバーエラー" }),
			{ status: 500, headers: { "Content-Type": "application/json" } }
		);
	}
}

/**
 * 管理者権限を要求するAPI Routes用ミドルウェア
 */
export async function withAdminAuth(
	handler: (session: Session) => Promise<Response> | Response
): Promise<Response> {
	return withAuth(handler, { requireRole: "admin" });
}

/**
 * 受講者権限を要求するAPI Routes用ミドルウェア
 */
export async function withLearnerAuth(
	handler: (session: Session) => Promise<Response> | Response
): Promise<Response> {
	return withAuth(handler, { requireRole: "learner" });
}