const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client with service role if available, otherwise use anon key
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runDirectQuery() {
  try {
    console.log('Running direct PostgreSQL query to check profiles table schema...');
    
    // We'll use Supabase's SQL execution feature to run a direct query
    const { data, error } = await supabase.rpc('pgtsql_query', {
      query_text: `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM 
          information_schema.columns
        WHERE 
          table_schema = 'public'
          AND table_name = 'profiles'
        ORDER BY 
          ordinal_position;
      `
    });
    
    if (error) {
      console.log('Error running direct query. Trying alternative approach...');
      
      // Fallback: Try to select a sample record from profiles table
      const { data: sample, error: sampleError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);
        
      if (sampleError) {
        throw sampleError;
      }
      
      if (sample && sample.length > 0) {
        console.log('Sample profile data structure:');
        // List all keys in the profile object to see what columns exist
        const profileColumns = Object.keys(sample[0]);
        console.log('Columns in profiles table:', profileColumns);
        console.log('\nSample data:');
        console.log(JSON.stringify(sample[0], null, 2));
      } else {
        console.log('No profile data found in the database.');
      }
    } else {
      console.log('Profiles table schema:');
      console.table(data);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

runDirectQuery(); 