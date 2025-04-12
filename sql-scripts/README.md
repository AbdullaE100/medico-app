# Database Setup for Medico App

This directory contains SQL scripts needed to set up the database tables for the Medico app.

## Setting Up the Polls Feature

The polls feature requires a `polls` table in your Supabase database.

### How to Run the SQL Script

1. Log in to your Supabase dashboard (https://app.supabase.com/)
2. Select your project
3. Go to the "SQL Editor" section in the left sidebar
4. Click "New Query"
5. Copy and paste the contents of `create_polls_table.sql` into the editor
6. Run the query by clicking the "Run" button

### What This Script Does

The script will:
1. Create a `polls` table with all necessary columns
2. Set up appropriate permissions for authenticated users
3. Create indexes for performance
4. Establish referential integrity with the posts table

## Troubleshooting

If you encounter any errors when running the script:

- Make sure your `posts` table already exists
- Check if the `uuid_generate_v4()` function is available (it should be in Supabase by default)
- Verify you have the correct permissions to create tables in your database

## After Setup

Once the table is created, the poll feature in the app should start working properly. You will need to create new posts with polls to test the functionality. 