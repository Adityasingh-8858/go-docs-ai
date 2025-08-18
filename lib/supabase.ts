import { createClient } from '@supabase/supabase-js'

// It's important to use the NEXT_PUBLIC variables for client-side access
// and the SERVICE_ROLE_KEY for server-side (admin) access.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// This client is safe to use on the client-side
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// For server-side operations that require elevated privileges,
// you would create a separate admin client.
// This should ONLY be used in server-side code (e.g., API routes, server components).
export const getSupabaseAdmin = () => {
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseServiceRoleKey) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set in .env");
    }
    return createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}
