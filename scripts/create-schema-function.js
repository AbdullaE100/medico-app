const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function createSchemaFunction() {
  try {
    console.log('Creating PostgreSQL function to view table schema...');
    
    // Create a PostgreSQL function to get table schema information
    // This will need to be run as a SQL query through the dashboard
    const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION public.get_table_schema(table_name text)
    RETURNS TABLE(
      column_name text,
      data_type text,
      character_maximum_length integer,
      column_default text,
      is_nullable text
    )
    LANGUAGE 'sql'
    AS $BODY$
      SELECT 
        column_name::text,
        data_type::text,
        character_maximum_length,
        column_default::text,
        is_nullable::text
      FROM 
        information_schema.columns
      WHERE 
        table_schema = 'public'
        AND table_name = $1
      ORDER BY 
        ordinal_position;
    $BODY$;
    `;
    
    console.log('SQL to create function:');
    console.log(createFunctionSQL);
    
    console.log('\nPlease run this SQL in the Supabase SQL Editor in the dashboard.');
    console.log('After creating the function, you can run the check-schema.js script.');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

createSchemaFunction(); 