// Test script to check upload_sessions table
const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUploadSessions() {
  try {
    console.log('Testing upload_sessions table...');
    
    // Check if table exists by trying to select from it
    const { data, error } = await supabase
      .from('upload_sessions')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error accessing upload_sessions table:', error);
      return;
    }
    
    console.log('upload_sessions table exists!');
    console.log('Sample data:', data);
    
    // Check table structure
    const { data: structure, error: structureError } = await supabase
      .rpc('get_table_structure', { table_name: 'upload_sessions' });
    
    if (structureError) {
      console.log('Could not get table structure, but table exists');
    } else {
      console.log('Table structure:', structure);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testUploadSessions();
