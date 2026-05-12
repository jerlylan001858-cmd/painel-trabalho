import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://hcqqrahbbthwpzecusv.supabase.co";

const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjcXJxYWhiYnRod3B6ZWN1c3ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MzkzNDUsImV4cCI6MjA5NDExNTM0NX0.HqK3AcFT9pC2TQQ4LkNJrn5ndq7LTVJDW3eRA2Wbs7E";

export const supabaseEnabled = true;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);