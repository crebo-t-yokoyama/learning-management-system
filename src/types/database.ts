export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[];

export type Database = {
	public: {
		Tables: {
			// Auth.js required tables
			users: {
				Row: {
					id: string;
					email: string;
					name: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					email: string;
					name?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					email?: string;
					name?: string | null;
					created_at?: string;
					updated_at?: string;
				};
			};
			accounts: {
				Row: {
					id: string;
					user_id: string;
					type: string;
					provider: string;
					provider_account_id: string;
					refresh_token: string | null;
					access_token: string | null;
					expires_at: number | null;
					token_type: string | null;
					scope: string | null;
					id_token: string | null;
					session_state: string | null;
				};
				Insert: {
					id?: string;
					user_id: string;
					type: string;
					provider: string;
					provider_account_id: string;
					refresh_token?: string | null;
					access_token?: string | null;
					expires_at?: number | null;
					token_type?: string | null;
					scope?: string | null;
					id_token?: string | null;
					session_state?: string | null;
				};
				Update: {
					id?: string;
					user_id?: string;
					type?: string;
					provider?: string;
					provider_account_id?: string;
					refresh_token?: string | null;
					access_token?: string | null;
					expires_at?: number | null;
					token_type?: string | null;
					scope?: string | null;
					id_token?: string | null;
					session_state?: string | null;
				};
			};
			sessions: {
				Row: {
					id: string;
					session_token: string;
					user_id: string;
					expires: string;
				};
				Insert: {
					id?: string;
					session_token: string;
					user_id: string;
					expires: string;
				};
				Update: {
					id?: string;
					session_token?: string;
					user_id?: string;
					expires?: string;
				};
			};

			// Generic tables - customize for your project
			categories: {
				Row: {
					id: string;
					name: string;
					description: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					name: string;
					description?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					name?: string;
					description?: string | null;
					created_at?: string;
					updated_at?: string;
				};
			};
			items: {
				Row: {
					id: string;
					name: string;
					category_id: string | null;
					description: string | null;
					created_by: string | null;
					updated_by: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					name: string;
					category_id?: string | null;
					description?: string | null;
					created_by?: string | null;
					updated_by?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					name?: string;
					category_id?: string | null;
					description?: string | null;
					created_by?: string | null;
					updated_by?: string | null;
					created_at?: string;
					updated_at?: string;
				};
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			[_ in never]: never;
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};
