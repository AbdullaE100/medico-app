const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

// Helper function to generate UUIDs
function generateUUID() {
  return uuidv4();
}

// Generate UUIDs for mock users
const mockUserIds = {
  alice: generateUUID(),
  bob: generateUUID(),
  claire: generateUUID(),
  david: generateUUID(),
  elena: generateUUID(),
  frank: generateUUID(),
  grace: generateUUID(),
  henry: generateUUID()
};

// Mock profiles with UUIDs
const mockProfiles = [
  {
    id: mockUserIds.alice,
    first_name: 'Alice',
    last_name: 'Johnson',
    specialty: 'Cardiology',
    bio: 'Experienced cardiologist specializing in preventive care and heart disease management.',
    pronouns: 'she/her',
    is_verified: true,
    avatar_url: 'https://api.dicebear.com/7.x/micah/svg?seed=alice'
  },
  {
    id: mockUserIds.bob,
    first_name: 'Bob',
    last_name: 'Smith',
    specialty: 'Oncology',
    bio: 'Medical oncologist with focus on novel immunotherapies.',
    pronouns: 'he/him',
    is_verified: true,
    avatar_url: 'https://api.dicebear.com/7.x/micah/svg?seed=bob'
  },
  {
    id: mockUserIds.claire,
    first_name: 'Claire',
    last_name: 'Wu',
    specialty: 'Pediatrics',
    bio: 'Dedicated to providing comprehensive care for children from infancy through adolescence.',
    pronouns: 'she/her',
    is_verified: true,
    avatar_url: 'https://api.dicebear.com/7.x/micah/svg?seed=claire'
  },
  {
    id: mockUserIds.david,
    first_name: 'David',
    last_name: 'Garcia',
    specialty: 'Neurology',
    bio: 'Neurologist with expertise in movement disorders and neurodegenerative diseases.',
    pronouns: 'he/him',
    is_verified: true,
    avatar_url: 'https://api.dicebear.com/7.x/micah/svg?seed=david'
  },
  {
    id: mockUserIds.elena,
    first_name: 'Elena',
    last_name: 'Patel',
    specialty: 'Emergency Medicine',
    bio: 'ER physician passionate about improving acute care delivery systems.',
    pronouns: 'she/her',
    is_verified: true,
    avatar_url: 'https://api.dicebear.com/7.x/micah/svg?seed=elena'
  },
  {
    id: mockUserIds.frank,
    first_name: 'Frank',
    last_name: 'Rodriguez',
    specialty: 'Psychiatry',
    bio: 'Psychiatrist focused on integrative approaches to mental health treatment.',
    pronouns: 'he/him',
    is_verified: true,
    avatar_url: 'https://api.dicebear.com/7.x/micah/svg?seed=frank'
  },
  {
    id: mockUserIds.grace,
    first_name: 'Grace',
    last_name: 'Kim',
    specialty: 'Dermatology',
    bio: 'Dermatologist specializing in skin cancer prevention and treatment.',
    pronouns: 'she/her',
    is_verified: true,
    avatar_url: 'https://api.dicebear.com/7.x/micah/svg?seed=grace'
  },
  {
    id: mockUserIds.henry,
    first_name: 'Henry',
    last_name: 'Thompson',
    specialty: 'Family Medicine',
    bio: 'Family physician dedicated to providing holistic primary care across the lifespan.',
    pronouns: 'he/him',
    is_verified: true,
    avatar_url: 'https://api.dicebear.com/7.x/micah/svg?seed=henry'
  }
];

// Seed the database with all mock data
async function seedAll() {
  try {
    console.log('Starting database seeding...');

    // PART 1: SEED PROFILES
    console.log('\n=== SEEDING PROFILES ===');
    
    // Delete existing data (in reverse order of dependencies)
    console.log('Clearing existing data...');
    await supabase.from('follows').delete().not('id', 'is', null);
    await supabase.from('hashtags').delete().not('id', 'is', null);
    await supabase.from('comments').delete().not('id', 'is', null);
    await supabase.from('posts').delete().not('id', 'is', null);
    await supabase.from('profiles').delete().not('id', 'is', null);

    // Insert profiles
    console.log('Inserting profiles...');
    for (const profile of mockProfiles) {
      const { error } = await supabase.from('profiles').insert(profile);
      if (error) {
        console.error('Error inserting profile:', error);
        throw error;
      }
    }
    
    console.log('Profiles seeded successfully!');

    // PART 2: SEED POSTS (SIMPLIFIED)
    console.log('\n=== SEEDING POSTS ===');
    
    // Simplified posts
    const posts = [
      {
        profile_id: mockUserIds.alice,
        content: 'Just published our latest research on cardiac stent placements.',
        created_at: new Date().toISOString()
      },
      {
        profile_id: mockUserIds.bob,
        content: 'Attended an excellent symposium on targeted therapies for cancer treatment.',
        created_at: new Date().toISOString()
      },
      {
        profile_id: mockUserIds.claire,
        content: 'New vaccination guidelines are now available for pediatric patients.',
        created_at: new Date().toISOString()
      }
    ];
    
    for (const post of posts) {
      const { error } = await supabase.from('posts').insert(post);
      if (error) {
        console.error('Error inserting post:', error);
        throw error;
      }
    }
    
    console.log('Posts seeded successfully!');

    // PART 3: SEED DISCUSSIONS
    console.log('\n=== SEEDING DISCUSSIONS ===');
    
    // Get category IDs
    const { data: categories, error: categoriesError } = await supabase
      .from('discussion_categories')
      .select('id, slug');
      
    if (categoriesError) {
      console.warn('Error getting discussion categories:', categoriesError);
      console.log('Skipping discussion seeding...');
    } else {
      // Map categories to IDs
      const categoryMap = categories.reduce((map, category) => {
        map[category.slug] = category.id;
        return map;
      }, {});
      
      // Create some discussions
      const discussions = [
        {
          title: "Managing Long COVID Symptoms",
          content: "What strategies are effective for managing long COVID symptoms?",
          author_id: mockUserIds.elena,
          category_id: categoryMap['general'] || null
        },
        {
          title: "New Treatment Guidelines for Heart Failure",
          content: "The latest cardiology guidelines now recommend new treatments.",
          author_id: mockUserIds.alice,
          category_id: categoryMap['research'] || null
        }
      ];
      
      // Insert discussions
      for (const discussion of discussions) {
        if (!discussion.category_id) continue; // Skip if category not found
        
        const { error } = await supabase.from('discussions').insert(discussion);
        if (error) {
          console.error('Error inserting discussion:', error);
          throw error;
        }
      }
      
      console.log('Discussions seeded successfully!');
    }

    // PART 4: SEED CHATS
    console.log('\n=== SEEDING CHATS ===');
    
    // Create a chat room
    const roomId = uuidv4();
    const { error: roomError } = await supabase
      .from('chat_rooms')
      .insert({ id: roomId });
      
    if (roomError) {
      console.warn('Error creating chat room:', roomError);
      console.log('Skipping chat seeding...');
    } else {
      // Add participants
      for (const participantId of [mockUserIds.alice, mockUserIds.bob]) {
        const { error: participantError } = await supabase
          .from('chat_participants')
          .insert({
            room_id: roomId,
            user_id: participantId
          });
          
        if (participantError) {
          console.warn('Error adding participant:', participantError);
        }
      }
      
      // Add messages
      const messages = [
        {
          room_id: roomId,
          sender_id: mockUserIds.alice,
          content: "Hi Bob, how are you doing today?",
          type: "text"
        },
        {
          room_id: roomId,
          sender_id: mockUserIds.bob,
          content: "Doing well, thanks! Just finished reviewing some case files.",
          type: "text"
        }
      ];
      
      for (const message of messages) {
        const { error: messageError } = await supabase
          .from('chat_messages')
          .insert(message);
          
        if (messageError) {
          console.warn('Error adding message:', messageError);
        }
      }
      
      // Update last message
      const { error: updateError } = await supabase
        .from('chat_rooms')
        .update({
          last_message: "Doing well, thanks! Just finished reviewing some case files.",
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', roomId);
        
      if (updateError) {
        console.warn('Error updating chat room:', updateError);
      }
      
      console.log('Chats seeded successfully!');
    }

    console.log('\n=== ALL DATA SEEDED SUCCESSFULLY! ===');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Execute the seeding
seedAll(); 