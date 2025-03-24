const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client 
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log("Supabase URL:", supabaseUrl ? "Found" : "Missing");
console.log("Supabase Key:", supabaseKey ? "Found" : "Missing");

if (!supabaseUrl || !supabaseKey) {
  console.error("ERROR: Missing Supabase credentials in environment variables");
  console.log("Make sure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in your .env file");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectProfile() {
  try {
    console.log('Fetching a sample profile to inspect the structure...');
    
    // Fetch a sample profile
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error("Error fetching profile data:", error.message);
      console.error("Error details:", error);
      throw error;
    }
    
    if (data && data.length > 0) {
      // Show the column names in the profiles table
      console.log('COLUMNS IN PROFILES TABLE:');
      const columns = Object.keys(data[0]);
      console.log(columns);
      
      // Show the data types
      console.log('\nCOLUMN DATA TYPES:');
      for (const key of columns) {
        const value = data[0][key];
        console.log(`${key}: ${typeof value}${Array.isArray(value) ? ' (array)' : ''}`);
      }
      
      // Show the sample data
      console.log('\nSAMPLE PROFILE DATA:');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('No profile data found in the database');
      
      // Try to see if we can list all tables as a fallback
      try {
        console.log('\nAttempting to list available tables...');
        await supabase.from('profiles').select('id').limit(1);
      } catch (listError) {
        console.error('Error listing tables:', listError);
      }
    }
    
  } catch (error) {
    console.error('Error inspecting profile:', error);
  }
}

inspectProfile().catch(err => {
  console.error("Uncaught error:", err);
}); 