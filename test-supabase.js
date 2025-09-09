import { createClient } from '@supabase/supabase-js';

// Test Supabase connection
async function testSupabaseConnection() {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
    
    console.log('Testing Supabase connection...');
    console.log('URL exists:', !!supabaseUrl);
    console.log('Key exists:', !!supabaseAnonKey);
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Test a simple query
    const { data, error } = await supabase
      .from('taglines')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Supabase query error:', error);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return false;
  }
}

testSupabaseConnection();