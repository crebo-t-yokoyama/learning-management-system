import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock Next.js router
vi.mock("next/navigation", () => ({
	useRouter() {
		return {
			push: vi.fn(),
			replace: vi.fn(),
			back: vi.fn(),
		};
	},
	useSearchParams() {
		return new URLSearchParams();
	},
	usePathname() {
		return "/";
	},
}));

// Mock next-auth
vi.mock("next-auth/react", () => ({
	useSession() {
		return {
			data: {
				user: {
					id: "test-user-id",
					email: "test@example.com",
					name: "Test User",
				},
			},
			status: "authenticated",
		};
	},
	SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock Supabase client
vi.mock("@/lib/supabase", () => ({
	createClient: () => ({
		from: vi.fn(() => ({
			select: vi.fn(() => Promise.resolve({ data: [], error: null })),
			insert: vi.fn(() => Promise.resolve({ data: [], error: null })),
			update: vi.fn(() => Promise.resolve({ data: [], error: null })),
			delete: vi.fn(() => Promise.resolve({ data: [], error: null })),
			eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
			single: vi.fn(() => Promise.resolve({ data: null, error: null })),
		})),
	}),
}));

// Mock toast notifications
vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
		info: vi.fn(),
		warning: vi.fn(),
	},
}));
