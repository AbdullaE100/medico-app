const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function checkSchema() {
  try {
    console.log('Checking database schema for profiles table...');
    
    // Run a query to get the column information directly from PostgreSQL
    const { data, error } = await supabase.rpc('get_table_schema', { 
      table_name: 'profiles' 
    });
    
    if (error) {
      throw error;
    }
    
    console.log('Profiles table schema:');
    console.table(data);
    
    // Also check other related tables
    console.log('\nRunning a direct query to check if job_title is used anywhere else...');
    const { data: jobTitleUsage, error: searchError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);
      
    if (searchError) {
      console.error('Error checking for job_title usage:', searchError);
    } else {
      console.log('Sample data from profiles table:');
      console.log(JSON.stringify(jobTitleUsage, null, 2));
    }
    
  } catch (error) {
    console.error('Error checking schema:', error);
  }
}

checkSchema(); 