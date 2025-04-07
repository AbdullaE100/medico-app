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

// Store user UUIDs for reference in other scripts
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

// Mock posts with UUIDs
const mockPosts = [
  {
    profile_id: mockUserIds.alice,
    content: 'Just published our latest research on long-term outcomes of cardiac stent placements in elderly patients. Link in comments!',
    image_url: 'https://placehold.it/500x300',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() // 2 days ago
  },
  {
    profile_id: mockUserIds.bob,
    content: 'Attended an excellent symposium on targeted therapies for HER2+ breast cancer. Exciting developments in the pipeline!',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString() // 1 day ago
  },
  {
    profile_id: mockUserIds.claire,
    content: 'Reminder to colleagues: The new vaccination guidelines for 2023 are now available. Several important updates for our pediatric patients.',
    image_url: 'https://placehold.it/500x300',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString() // 12 hours ago
  },
  {
    profile_id: mockUserIds.david,
    content: 'Case study: 45-year-old presenting with unusual tremor pattern. Any neurologists here with experience in drug-induced movement disorders?',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString() // 6 hours ago
  },
  {
    profile_id: mockUserIds.elena,
    content: 'Working on a quality improvement project for reducing door-to-antibiotic time in sepsis cases. Looking for collaborators with experience in similar initiatives.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() // 3 hours ago
  },
  {
    profile_id: mockUserIds.frank,
    content: 'New meta-analysis shows promising results for ketamine therapy in treatment-resistant depression. Has anyone incorporated this into their practice?',
    image_url: 'https://placehold.it/500x300',
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
  }
];

// Mock comments with UUIDs
const mockComments = [
  {
    post_id: 1, // Will be replaced with actual post ID
    profile_id: mockUserIds.bob,
    content: 'Great work! Could you share the full text of the paper?',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString() // 23 hours ago
  },
  {
    post_id: 1, // Will be replaced with actual post ID
    profile_id: mockUserIds.elena,
    content: 'Interesting findings. Did you observe any differences in outcomes for patients with diabetes?',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString() // 20 hours ago
  },
  {
    post_id: 3, // Will be replaced with actual post ID
    profile_id: mockUserIds.david,
    content: 'Thanks for the heads up! The changes to the HPV vaccination schedule are particularly significant.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString() // 10 hours ago
  },
  {
    post_id: 4, // Will be replaced with actual post ID
    profile_id: mockUserIds.elena,
    content: 'Have you ruled out Wilson\'s disease? Saw a similar case last month.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() // 5 hours ago
  },
  {
    post_id: 4, // Will be replaced with actual post ID
    profile_id: mockUserIds.frank,
    content: 'Consider non-motor symptoms as well. Sometimes psychiatric manifestations precede movement disorders.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString() // 4 hours ago
  },
  {
    post_id: 6, // Will be replaced with actual post ID
    profile_id: mockUserIds.claire,
    content: 'We\'ve incorporated ketamine therapy with good results, but careful patient selection is crucial.',
    created_at: new Date(Date.now() - 1000 * 60 * 20).toISOString() // 20 minutes ago
  }
];

// Mock hashtags with UUIDs
const mockHashtags = [
  {
    post_id: 1, // Will be replaced with actual post ID
    hashtag: 'cardiology'
  },
  {
    post_id: 1, // Will be replaced with actual post ID
    hashtag: 'research'
  },
  {
    post_id: 2, // Will be replaced with actual post ID
    hashtag: 'oncology'
  },
  {
    post_id: 2, // Will be replaced with actual post ID
    hashtag: 'breastcancer'
  },
  {
    post_id: 3, // Will be replaced with actual post ID
    hashtag: 'pediatrics'
  },
  {
    post_id: 3, // Will be replaced with actual post ID
    hashtag: 'vaccines'
  },
  {
    post_id: 4, // Will be replaced with actual post ID
    hashtag: 'neurology'
  },
  {
    post_id: 4, // Will be replaced with actual post ID
    hashtag: 'casestudy'
  },
  {
    post_id: 5, // Will be replaced with actual post ID
    hashtag: 'emergencymedicine'
  },
  {
    post_id: 5, // Will be replaced with actual post ID
    hashtag: 'sepsis'
  },
  {
    post_id: 6, // Will be replaced with actual post ID
    hashtag: 'psychiatry'
  },
  {
    post_id: 6, // Will be replaced with actual post ID
    hashtag: 'depression'
  }
];

// Mock follows with UUIDs
const mockFollows = [
  {
    follower_id: mockUserIds.alice,
    following_id: mockUserIds.bob
  },
  {
    follower_id: mockUserIds.alice,
    following_id: mockUserIds.claire
  },
  {
    follower_id: mockUserIds.bob,
    following_id: mockUserIds.alice
  },
  {
    follower_id: mockUserIds.bob,
    following_id: mockUserIds.david
  },
  {
    follower_id: mockUserIds.claire,
    following_id: mockUserIds.alice
  },
  {
    follower_id: mockUserIds.david,
    following_id: mockUserIds.elena
  },
  {
    follower_id: mockUserIds.elena,
    following_id: mockUserIds.frank
  },
  {
    follower_id: mockUserIds.frank,
    following_id: mockUserIds.grace
  },
  {
    follower_id: mockUserIds.grace,
    following_id: mockUserIds.henry
  },
  {
    follower_id: mockUserIds.henry,
    following_id: mockUserIds.alice
  }
];

// Seed the database with mock data
async function seedMockData() {
  try {
    console.log('Starting database seeding...');

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

    // Insert posts
    console.log('Inserting posts...');
    const postIds = [];
    for (const post of mockPosts) {
      const { data, error } = await supabase.from('posts').insert(post).select();
      if (error) {
        console.error('Error inserting post:', error);
        throw error;
      }
      if (data && data.length > 0) {
        postIds.push(data[0].id);
      }
    }

    // Insert comments (with correct post IDs)
    console.log('Inserting comments...');
    for (const comment of mockComments) {
      const postIndex = comment.post_id - 1;
      if (postIds[postIndex]) {
        const { error } = await supabase.from('comments').insert({
          ...comment,
          post_id: postIds[postIndex]
        });
        if (error) {
          console.error('Error inserting comment:', error);
          throw error;
        }
      }
    }

    // Insert hashtags (with correct post IDs)
    console.log('Inserting hashtags...');
    for (const hashtag of mockHashtags) {
      const postIndex = hashtag.post_id - 1;
      if (postIds[postIndex]) {
        const { error } = await supabase.from('hashtags').insert({
          ...hashtag,
          post_id: postIds[postIndex]
        });
        if (error) {
          console.error('Error inserting hashtag:', error);
          throw error;
        }
      }
    }

    // Insert follows
    console.log('Inserting follows...');
    for (const follow of mockFollows) {
      const { error } = await supabase.from('follows').insert(follow);
      if (error) {
        console.error('Error inserting follow:', error);
        throw error;
      }
    }

    console.log('Database seeding completed successfully!');
    return { success: true };
  } catch (error) {
    console.error('Error seeding database:', error);
    return { success: false, error };
  }
}

// Execute the seeding if this script is run directly
if (require.main === module) {
  seedMockData();
}

// Export the mockUserIds and seedMockData function for use in other scripts
module.exports = {
  mockUserIds,
  seedMockData
}; 