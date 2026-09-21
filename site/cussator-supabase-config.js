// cussator-supabase-config.js — public Supabase settings for optional Google
// sign-in (see the auth module in script.js).
//
// Both values below are SAFE to ship to the browser: the anon key is a public
// identifier, and what a signed-in user can actually read/write is enforced by
// row level security on the user_progress table (see supabase_schema.sql).
//
// NEVER put the service_role / sb_secret_* key in this file or anywhere else in
// the frontend — that key bypasses RLS. It only belongs in the server-side
// env vars used by api/ (see .env.example).
//
// Fill these in from Supabase > Project Settings > API. While either is empty,
// the sign-in button stays hidden and the site works as guest-only.
window.CUSSATOR_SUPABASE = {
  url: 'https://uoulocbbxtzctfklsiwj.supabase.co',
  anonKey: 'sb_publishable_79GbJCALXoEZaNo527fSDg_t7szzhYO', // publishable key — safe for the browser; never the secret/service_role key
};
