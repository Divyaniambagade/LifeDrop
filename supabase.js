const SUPABASE_URL = "https://enqlhnrhimtznqoclaaf.supabase.co";
// Apni anon key yahan quotes (" ") ke andar paste karein:
const SUPABASE_ANON_KEY = "sb_publishable_Foqu_CSKfbor3ei545CtGA_9UMzRa-C";

// Initialize Supabase Client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabase = supabase;
