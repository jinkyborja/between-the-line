import { defineEnvVars } from '@sveltejs/kit/env';

const required = (name: string) => (value: string | undefined) => {
	if (!value) throw new Error(`${name} is not set. Copy .env.example to .env and fill it in.`);
	return value;
};

export const variables = defineEnvVars({
	PUBLIC_SUPABASE_URL: {
		public: true,
		static: true,
		schema: required('PUBLIC_SUPABASE_URL'),
		description: 'Supabase project URL (safe for the browser).'
	},
	PUBLIC_SUPABASE_ANON_KEY: {
		public: true,
		static: true,
		schema: required('PUBLIC_SUPABASE_ANON_KEY'),
		description: 'Supabase anon key (safe for the browser; RLS protects data).'
	},
	SUPABASE_SERVICE_ROLE_KEY: {
		// Private + runtime: only importable from server code via $app/env/private.
		public: false,
		static: false,
		schema: (v: string | undefined) => v || undefined,
		description: 'Service-role key. Server-only; used solely to delete an account.'
	}
});
