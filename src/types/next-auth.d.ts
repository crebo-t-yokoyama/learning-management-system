import type { UserRole } from "./database";

declare module "next-auth" {
	interface Session {
		user: {
			id: string;
			email: string;
			name?: string | null;
			image?: string | null;
			role: UserRole;
			fullName?: string | null;
			department?: string | null;
		};
	}

	interface User {
		id: string;
		email: string;
		name?: string | null;
		image?: string | null;
		role: UserRole;
		fullName?: string | null;
		department?: string | null;
	}
}

declare module "next-auth/jwt" {
	interface JWT {
		id: string;
		role: UserRole;
		fullName?: string | null;
		department?: string | null;
	}
}