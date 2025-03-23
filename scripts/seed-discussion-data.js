const { createClient } = require('@supabase/supabase-js');
const { mockUserIds } = require('./seed-mock-data');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

// Mock data
const mockDiscussions = [
  {
    title: "Managing Long COVID Symptoms in Primary Care",
    content: "I'm seeing an increasing number of patients with persistent symptoms following COVID-19 infection. What strategies are other primary care physicians finding effective for managing these cases? Particularly interested in approaches for fatigue and brain fog.",
    author_id: mockUserIds.elena,
    category_id: "5" // Will be replaced with actual category ID for General Discussion
  },
  {
    title: "New SGLT2 Inhibitor Guidelines for Heart Failure",
    content: "The latest cardiology guidelines now recommend SGLT2 inhibitors for patients with heart failure, regardless of diabetes status. Has anyone had experience implementing this in their practice? Any challenges with insurance coverage?",
    author_id: mockUserIds.alice,
    category_id: "1" // Will be replaced with actual category ID for Research
  },
  {
    title: "Pediatric Mental Health Crisis: Resources",
    content: "I'm overwhelmed with the number of pediatric patients presenting with anxiety and depression in my practice. Wait times for child psychiatrists are 6+ months in my area. What resources are other pediatricians using to bridge the gap?",
    author_id: mockUserIds.claire,
    category_id: "4" // Will be replaced with actual category ID for Education
  },
  {
    title: "Unusual Case: Atypical Presentation of Kawasaki Disease",
    content: "Recently diagnosed a 6-year-old with Kawasaki Disease who presented with minimal rash and no conjunctivitis, but had coronary artery dilation on echo. Has anyone else seen atypical presentations increasing? Would love to discuss diagnostic challenges.",
    author_id: mockUserIds.david,
    category_id: "2" // Will be replaced with actual category ID for Clinical Cases
  },
  {
    title: "Integrating AI Tools into Clinical Practice",
    content: "Our hospital is piloting several AI assistance tools for radiology, clinical documentation, and decision support. Curious about others' experiences with implementing AI in clinical workflows - what's working, what's failing, and lessons learned.",
    author_id: mockUserIds.bob,
    category_id: "3" // Will be replaced with actual category ID for Technology
  },
  {
    title: "Burnout Prevention Strategies That Actually Work",
    content: "Beyond the usual self-care advice, what concrete strategies have actually helped reduce burnout in your practice or institution? Looking for systems-level interventions rather than individual wellness tips.",
    author_id: mockUserIds.frank,
    category_id: "5" // Will be replaced with actual category ID for General Discussion
  },
  {
    title: "Biologics for Severe Atopic Dermatitis: Real-world Experience",
    content: "Now that we have several biologics approved for atopic dermatitis (dupilumab, tralokinumab, etc.), I'm interested in hearing real-world experiences beyond the clinical trials. Which patients are you selecting for these treatments? Any unexpected outcomes?",
    author_id: mockUserIds.grace,
    category_id: "1" // Will be replaced with actual category ID for Research
  },
  {
    title: "Transitioning to Direct Primary Care Model",
    content: "I'm considering transitioning my practice to a Direct Primary Care model. For those who have made this change, what were the biggest challenges? How did your patient population respond? Any regrets?",
    author_id: mockUserIds.henry,
    category_id: "5" // Will be replaced with actual category ID for General Discussion
  }
];

const mockDiscussionComments = [
  {
    discussion_id: "1", // Will be replaced with actual discussion ID
    author_id: mockUserIds.frank,
    content: "I've had success with a phased approach to activity for long COVID fatigue - starting with very gentle pacing and gradually increasing. Pushing too hard too fast seems to cause setbacks. For brain fog, I'm seeing some improvement with cognitive rehabilitation exercises similar to those used post-concussion."
  },
  {
    discussion_id: "1", // Will be replaced with actual discussion ID
    author_id: mockUserIds.alice,
    content: "We're tracking a cohort of long COVID patients and finding dysautonomia is surprisingly common. Simple interventions like compression stockings, increased salt/fluid intake, and reclined position exercises have helped some patients significantly."
  },
  {
    discussion_id: "1", // Will be replaced with actual discussion ID
    author_id: mockUserIds.david,
    content: "Don't forget to screen for sleep apnea - we're seeing new onset or worsening sleep apnea in post-COVID patients that contributes significantly to fatigue and cognitive symptoms."
  },
  {
    discussion_id: "2", // Will be replaced with actual discussion ID
    author_id: mockUserIds.henry,
    content: "I've started incorporating SGLT2 inhibitors per the new guidelines. Insurance has been surprisingly cooperative, especially when documented with the specific guideline recommendation and heart failure diagnosis codes. The bigger challenge has been monitoring elderly patients for volume depletion and UTIs."
  },
  {
    discussion_id: "2", // Will be replaced with actual discussion ID
    author_id: mockUserIds.elena,
    content: "Has anyone else noticed more euglycemic DKA cases since broader use of SGLT2 inhibitors? We've had two cases in the ER recently in non-diabetic heart failure patients during acute illness."
  },
  {
    discussion_id: "3", // Will be replaced with actual discussion ID
    author_id: mockUserIds.frank,
    content: "I've been using collaborative care models with embedded behavioral health specialists in our pediatric practice. Also found several telehealth options that have shorter wait times than in-person psychiatry. Happy to share specific resources offline."
  },
  {
    discussion_id: "3", // Will be replaced with actual discussion ID
    author_id: mockUserIds.bob,
    content: "Group therapy sessions run by psychologists have been effective in our community - they can see 8-10 kids at once, making it more accessible. Schools in our area have also implemented the COPE program with good results."
  },
  {
    discussion_id: "4", // Will be replaced with actual discussion ID
    author_id: mockUserIds.claire,
    content: "Yes! I diagnosed a case last year with only fever and lymphadenopathy, no other classic symptoms. Echo showed coronary involvement. The literature suggests up to 10% of cases may be incomplete Kawasaki Disease. Did you treat with IVIG?"
  },
  {
    discussion_id: "4", // Will be replaced with actual discussion ID
    author_id: mockUserIds.alice,
    content: "We should consider if this is part of the MIS-C spectrum post-COVID, even with mild or asymptomatic COVID infections. What was the timing relative to potential COVID exposure?"
  },
  {
    discussion_id: "5", // Will be replaced with actual discussion ID
    author_id: mockUserIds.david,
    content: "Our radiology AI implementation has been positive - mainly for workflow prioritization of urgent findings and standardizing measurements. The key was having radiologists involved in selection and implementation, rather than it being an admin-driven initiative."
  },
  {
    discussion_id: "5", // Will be replaced with actual discussion ID
    author_id: mockUserIds.grace,
    content: "We piloted an AI documentation assistant that was supposed to save time but ended up creating more work in corrections. The technology is promising but not quite there for complex medical reasoning. Currently works best for straightforward follow-up visits."
  },
  {
    discussion_id: "6", // Will be replaced with actual discussion ID
    author_id: mockUserIds.elena,
    content: "The most effective intervention in our ER was implementing a 'physician flow coordinator' role that rotates among attending physicians - this person manages department flow and can step in to help overwhelmed colleagues. Reduced burnout metrics by almost 20%."
  },
  {
    discussion_id: "6", // Will be replaced with actual discussion ID
    author_id: mockUserIds.claire,
    content: "We restructured our clinic schedule to include protected administrative time every day rather than expecting notes and calls to happen after hours. It meant seeing slightly fewer patients but dramatically improved work-life balance and satisfaction."
  },
  {
    discussion_id: "7", // Will be replaced with actual discussion ID
    author_id: mockUserIds.elena,
    content: "I've had several patients develop significant facial edema on dupilumab - more than I expected from the trial data. Still worth it for the patients with severe disease, but requiring closer monitoring."
  },
  {
    discussion_id: "7", // Will be replaced with actual discussion ID
    author_id: mockUserIds.david,
    content: "I'm reserving biologics for patients who have failed multiple conventional therapies, have at least 20% BSA involvement, or have severe face/hand involvement affecting daily function. Response rates have been better than I expected based on trial data."
  },
  {
    discussion_id: "8", // Will be replaced with actual discussion ID
    author_id: mockUserIds.alice,
    content: "Made this transition 3 years ago. Biggest challenges: 1) Administrative setup (legal structure, payment systems) 2) Determining the right monthly fee structure 3) Cash flow during transition. Most patients understood once I explained the benefits of more time and accessibility. No regrets whatsoever."
  }
];

// Seed the discussion data
async function seedDiscussionData() {
  try {
    console.log('Starting discussion data seeding...');

    // Get category IDs
    console.log('Fetching category IDs...');
    const { data: categories, error: categoriesError } = await supabase
      .from('discussion_categories')
      .select('id, slug');

    if (categoriesError) {
      throw categoriesError;
    }

    const categoryMap = categories.reduce((map, category) => {
      map[category.slug] = category.id;
      return map;
    }, {});

    // Seed discussions with correct category IDs
    console.log('Seeding discussions...');
    const discussionIds = [];
    for (const discussion of mockDiscussions) {
      // Map the category ID
      let categoryId;
      switch (discussion.category_id) {
        case "1": categoryId = categoryMap['research']; break;
        case "2": categoryId = categoryMap['clinical-cases']; break;
        case "3": categoryId = categoryMap['technology']; break;
        case "4": categoryId = categoryMap['education']; break;
        case "5": categoryId = categoryMap['general']; break;
        default: categoryId = categoryMap['general'];
      }

      const { data, error } = await supabase
        .from('discussions')
        .insert({
          ...discussion,
          category_id: categoryId
        })
        .select();

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        discussionIds.push(data[0].id);
      }
    }
    console.log('Discussions seeded successfully!');

    // Seed discussion comments with correct discussion IDs
    console.log('Seeding discussion comments...');
    for (let i = 0; i < mockDiscussionComments.length; i++) {
      const discussionIndex = parseInt(mockDiscussionComments[i].discussion_id) - 1;
      
      if (discussionIds[discussionIndex]) {
        const comment = {
          ...mockDiscussionComments[i],
          discussion_id: discussionIds[discussionIndex]
        };

        const { error } = await supabase
          .from('discussion_comments')
          .insert(comment);
        
        if (error) {
          throw error;
        }
      }
    }
    console.log('Discussion comments seeded successfully!');

    // Update discussion counts
    console.log('Updating discussion comment counts...');
    for (const discussionId of discussionIds) {
      // Count comments
      const { data: comments, error: commentsError } = await supabase
        .from('discussion_comments')
        .select('id')
        .eq('discussion_id', discussionId);
      
      if (commentsError) {
        throw commentsError;
      }

      // Update counts
      const { error: updateError } = await supabase
        .from('discussions')
        .update({
          comments_count: comments?.length || 0,
          views_count: Math.floor(Math.random() * 50) + 10 // Random view count between 10-60
        })
        .eq('id', discussionId);
      
      if (updateError) {
        throw updateError;
      }
    }
    console.log('Discussion counts updated successfully!');

    // Add some random discussion votes
    console.log('Adding discussion votes...');
    const profiles = Object.values(mockUserIds);
    
    for (let i = 0; i < discussionIds.length; i++) {
      // Each discussion gets 3-7 random votes
      const voteCount = Math.floor(Math.random() * 5) + 3;
      
      for (let j = 0; j < voteCount; j++) {
        // Get a random profile that isn't the author
        const authorId = mockDiscussions[i].author_id;
        let voterId;
        do {
          voterId = profiles[Math.floor(Math.random() * profiles.length)];
        } while (voterId === authorId);
        
        const { error } = await supabase
          .from('discussion_votes')
          .upsert({
            discussion_id: discussionIds[i],
            user_id: voterId,
            vote_type: 'upvote'
          }, { onConflict: ['discussion_id', 'user_id'] });
        
        if (error) {
          console.warn('Error adding vote:', error);
          // Continue despite errors
        }
      }
      
      // Update upvotes count
      const { error: updateError } = await supabase
        .from('discussions')
        .update({
          upvotes_count: voteCount
        })
        .eq('id', discussionIds[i]);
      
      if (updateError) {
        throw updateError;
      }
    }
    console.log('Discussion votes added successfully!');

    console.log('Discussion data seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding discussion data:', error);
  }
}

// Execute seeding
if (require.main === module) {
  seedDiscussionData();
} 