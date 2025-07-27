import type { NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { loginSchema } from "./validations";

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

					// デモ用のテストユーザー
					if (email === "admin@example.com" && password === "password123") {
						return {
							id: "test-user-id",
							email: "admin@example.com",
							name: "管理者",
						};
					}

					// 実際のプロダクションでは、以下のようにSupabaseからユーザーを検索し、
					// パスワードハッシュと比較する必要があります
					// const supabase = await createServerSupabaseClient();
					// const { data: user, error } = await supabase
					// 	.from("users")
					// 	.select("id, email, name, password_hash")
					// 	.eq("email", email)
					// 	.single();
					//
					// if (error || !user) {
					// 	return null;
					// }
					//
					// const isValidPassword = await bcrypt.compare(password, user.password_hash);
					// if (!isValidPassword) {
					// 	return null;
					// }
					//
					// return {
					// 	id: user.id,
					// 	email: user.email,
					// 	name: user.name,
					// };

					return null;
				} catch {
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
			}
			return token;
		},
		session({ session, token }) {
			if (token && session.user) {
				session.user.id = token.id as string;
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
