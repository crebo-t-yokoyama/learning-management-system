import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
	const { pathname } = req.nextUrl;

	// 認証が必要なページのパターン
	const protectedRoutes = ["/dashboard", "/items"];
	const isProtectedRoute = protectedRoutes.some((route) =>
		pathname.startsWith(route),
	);

	// ログインページ
	const isLoginPage = pathname === "/login";

	// 認証済みユーザーがログインページにアクセスした場合はダッシュボードにリダイレクト
	if (isLoginPage && req.auth) {
		return NextResponse.redirect(new URL("/dashboard", req.url));
	}

	// 未認証ユーザーが保護されたページにアクセスした場合はログインページにリダイレクト
	if (isProtectedRoute && !req.auth) {
		return NextResponse.redirect(new URL("/login", req.url));
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
