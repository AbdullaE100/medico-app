require('dotenv').config();
const { seedChatData } = require('./seed-chat-data');

// Function to run all seeding scripts in the correct order
async function seedAll() {
  try {
    console.log('Starting full database seeding...');

    // Step 1: Seed mock profiles and posts - this creates the base data including UUIDs for users
    console.log('\n=== STEP 1: SEEDING PROFILES AND POSTS ===');
    await require('./seed-mock-data').seedMockData();

    // Step 2: Seed discussion data - this uses user UUIDs from the previous step
    console.log('\n=== STEP 2: SEEDING DISCUSSIONS ===');
    await require('./seed-discussion-data').seedDiscussionData();

    // Step 3: Seed chat data - this uses user UUIDs from the profile seeding step
    console.log('\n=== STEP 3: SEEDING CHATS ===');
    await seedChatData();

    console.log('\n=== ALL DATA SEEDED SUCCESSFULLY! ===');
  } catch (error) {
    console.error('Error during seeding process:', error);
    process.exit(1);
  }
}

// Execute the seeding function if this file is run directly
if (require.main === module) {
  seedAll();
}

// Export the function for potential programmatic use
module.exports = { seedAll }; 