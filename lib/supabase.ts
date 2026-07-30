import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * True when env vars still hold the post-sanitisation placeholder values
 * (no real Supabase project connected yet). Pages can use this to skip
 * remote calls and render the local placeholder UI without spamming the
 * console.
 */
const lowerUrl = supabaseUrl.toLowerCase();
const lowerKey = supabaseKey.toLowerCase();
export const isSupabaseConfigured =
    !!supabaseUrl &&
    !!supabaseKey &&
    !lowerUrl.includes('your_project_ref') &&
    !lowerUrl.includes('your-project-ref') &&
    !lowerUrl.includes('your_supabase') &&
    !lowerKey.includes('your_supabase') &&
    !lowerKey.includes('your-supabase') &&
    supabaseUrl.startsWith('https://') &&
    supabaseKey.length > 20;

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
    if (_client) return _client;
    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase environment variables');
    }
    _client = createClient(supabaseUrl, supabaseKey);
    return _client;
}

/** Browser / shared supabase-js client (lazy — safe for `next build` without env). */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
    get(_target, prop, receiver) {
        const client = getClient();
        const value = Reflect.get(client, prop, receiver);
        return typeof value === 'function' ? (value as Function).bind(client) : value;
    },
});
