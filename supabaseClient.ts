
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://atqfzyctpwxdfbwcuxnw.supabase.co';

// Chave 'calender' do tipo Publishable fornecida pelo usuário
const supabaseKey = 'sb_publishable_oFHsUkdYOaZmQZh6HzVVpQ_5NfXnKM3';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
});
