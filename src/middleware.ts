import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { UserRole } from "@/types/database";

export default auth((req) => {
	const { pathname } = req.nextUrl;
	const session = req.auth;

	// 認証が必要なページのパターン
	const protectedRoutes = [
		"/dashboard",
		"/admin",
		"/learner",
		"/courses",
		"/users",
		"/learning-records",
		"/items", // 既存のitemページも保護
	];
	
	// 管理者のみアクセス可能なページ
	const adminOnlyRoutes = [
		"/admin",
		"/users",
		"/courses/create",
		"/courses/edit",
		"/courses/assign",
	];
	
	// 受講者のみアクセス可能なページ
	const learnerOnlyRoutes = [
		"/learner",
		"/learning-records/create",
		"/learning-records/edit",
	];

	const isProtectedRoute = protectedRoutes.some((route) =>
		pathname.startsWith(route),
	);
	const isAdminOnlyRoute = adminOnlyRoutes.some((route) =>
		pathname.startsWith(route),
	);
	const isLearnerOnlyRoute = learnerOnlyRoutes.some((route) =>
		pathname.startsWith(route),
	);

	// ログインページ
	const isLoginPage = pathname === "/login";

	// 認証済みユーザーがログインページにアクセスした場合
	if (isLoginPage && session) {
		const userRole = session.user.role;
		// 役割に応じてダッシュボードにリダイレクト
		const dashboardUrl = userRole === "admin" ? "/admin" : "/learner";
		return NextResponse.redirect(new URL(dashboardUrl, req.url));
	}

	// 未認証ユーザーが保護されたページにアクセスした場合
	if (isProtectedRoute && !session) {
		return NextResponse.redirect(new URL("/login", req.url));
	}

	// 認証済みユーザーの役割ベースアクセス制御
	if (session) {
		const userRole: UserRole = session.user.role;

		// 管理者以外が管理者専用ページにアクセスした場合
		if (isAdminOnlyRoute && userRole !== "admin") {
			return NextResponse.redirect(new URL("/learner", req.url));
		}

		// 受講者以外が受講者専用ページにアクセスした場合
		if (isLearnerOnlyRoute && userRole !== "learner") {
			return NextResponse.redirect(new URL("/admin", req.url));
		}

		// ルートアクセス時の役割別リダイレクト
		if (pathname === "/" || pathname === "/dashboard") {
			const dashboardUrl = userRole === "admin" ? "/admin" : "/learner";
			return NextResponse.redirect(new URL(dashboardUrl, req.url));
		}
	}

	return NextResponse.next();
});

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 */
		"/((?!api|_next/static|_next/image|favicon.ico).*)",
	],
};
