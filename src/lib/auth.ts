import type { NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { loginSchema } from "./validations";
import { createServerSupabaseClient } from "./supabase";
import type { UserRole } from "@/types/database";

const config = {
	providers: [
		Credentials({
			name: "credentials",
			credentials: {
				email: { label: "メールアドレス", type: "email" },
				password: { label: "パスワード", type: "password" },
			},
			async authorize(credentials) {
				try {
					const { email, password } = loginSchema.parse(credentials);

					// Supabaseからユーザーを検索
					const supabase = await createServerSupabaseClient();
					const { data: user, error } = await supabase
						.from("users")
						.select("id, email, name, full_name, role, department")
						.eq("email", email)
						.single();

					if (error || !user) {
						return null;
					}

					// 開発環境では簡単なパスワードチェック（本番環境ではハッシュ化要）
					if (process.env.NODE_ENV === "development") {
						// デモ用: admin@example.com / password123, learner@example.com / password123
						const validPasswords = ["password123"];
						if (!validPasswords.includes(password)) {
							return null;
						}
					} else {
						// TODO: 本番環境ではパスワードハッシュとの比較
						// const isValidPassword = await bcrypt.compare(password, user.password_hash);
						// if (!isValidPassword) {
						// 	return null;
						// }
						return null; // 本番環境では適切なパスワード認証を実装
					}

					// 最終ログイン日時を更新
					await supabase
						.from("users")
						.update({ last_login_at: new Date().toISOString() })
						.eq("id", user.id);

					return {
						id: user.id,
						email: user.email,
						name: user.name,
						fullName: user.full_name,
						role: user.role as UserRole,
						department: user.department,
					};
				} catch (error) {
					console.error("Auth error:", error);
					return null;
				}
			},
		}),
	],
	pages: {
		signIn: "/login",
		error: "/auth/error",
	},
	callbacks: {
		jwt({ token, user }) {
			if (user) {
				token.id = user.id;
				token.role = user.role;
				token.fullName = user.fullName;
				token.department = user.department;
			}
			return token;
		},
		session({ session, token }) {
			if (token && session.user) {
				session.user.id = token.id as string;
				session.user.role = token.role as UserRole;
				session.user.fullName = token.fullName as string | null;
				session.user.department = token.department as string | null;
			}
			return session;
		},
	},
	session: {
		strategy: "jwt" as const,
	},
	debug: process.env.NODE_ENV === "development",
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(config);
