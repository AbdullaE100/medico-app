const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const { mockUserIds } = require('./seed-mock-data');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

// Define some chat rooms between users
const mockChatRooms = [
  {
    // Chat between Alice and Bob
    participants: [mockUserIds.alice, mockUserIds.bob]
  },
  {
    // Chat between Alice and Claire
    participants: [mockUserIds.alice, mockUserIds.claire]
  },
  {
    // Chat between Bob and David
    participants: [mockUserIds.bob, mockUserIds.david]
  },
  {
    // Chat between Claire and Elena
    participants: [mockUserIds.claire, mockUserIds.elena]
  },
  {
    // Chat between Frank and Grace
    participants: [mockUserIds.frank, mockUserIds.grace]
  },
  {
    // Group chat with multiple participants
    participants: [
      mockUserIds.alice,
      mockUserIds.bob,
      mockUserIds.claire,
      mockUserIds.david
    ]
  }
];

// Define messages for each chat room
const mockMessages = [
  // Chat between Alice and Bob
  [
    {
      sender_id: mockUserIds.alice,
      content: "Hi Bob, I saw your recent case presentation on the unusual response to immunotherapy. Very interesting!",
      type: "text"
    },
    {
      sender_id: mockUserIds.bob,
      content: "Thanks Alice! It was quite unexpected. Have you encountered similar cases?",
      type: "text"
    },
    {
      sender_id: mockUserIds.alice,
      content: "Not exactly, but I did have a patient with an atypical reaction to pembrolizumab last month. Would you have time to discuss it this week?",
      type: "text"
    },
    {
      sender_id: mockUserIds.bob,
      content: "Absolutely! I'm free Thursday afternoon if that works for you.",
      type: "text"
    }
  ],
  
  // Chat between Alice and Claire
  [
    {
      sender_id: mockUserIds.alice,
      content: "Claire, do you have the slides from your grand rounds on adrenal insufficiency?",
      type: "text"
    },
    {
      sender_id: mockUserIds.claire,
      content: "Yes, I'll send them over! They're still being updated with the latest guidelines though.",
      type: "text"
    },
    {
      sender_id: mockUserIds.alice,
      content: "That's fine, I'm particularly interested in your approach to the diagnostic workup.",
      type: "text"
    },
    {
      sender_id: mockUserIds.claire,
      content: "Here's the draft presentation. Let me know if you have questions!",
      type: "media",
      file_url: "https://placehold.it/300x200",
      file_name: "Adrenal_Insufficiency_Workup.pdf",
      file_type: "application/pdf"
    }
  ],
  
  // Chat between Bob and David
  [
    {
      sender_id: mockUserIds.bob,
      content: "David, are you going to the cardiology conference next month?",
      type: "text"
    },
    {
      sender_id: mockUserIds.david,
      content: "Planning to! Are you presenting your research on TAVR outcomes?",
      type: "text"
    },
    {
      sender_id: mockUserIds.bob,
      content: "Yes, our abstract was accepted. I'd love your input on the presentation if you have time.",
      type: "text"
    },
    {
      sender_id: mockUserIds.david,
      content: "Happy to help. Send over what you have so far, and we can discuss.",
      type: "text"
    }
  ],
  
  // Chat between Claire and Elena
  [
    {
      sender_id: mockUserIds.claire,
      content: "Elena, quick question about the new diabetes guidelines - are you implementing the lower A1c targets for elderly patients?",
      type: "text"
    },
    {
      sender_id: mockUserIds.elena,
      content: "Actually, I'm being more cautious with the elderly. The hypoglycemia risk outweighs benefits in most of my frail patients.",
      type: "text"
    },
    {
      sender_id: mockUserIds.claire,
      content: "That makes sense. I've been individualizing targets too. What A1c are you generally aiming for in the 80+ population?",
      type: "text"
    },
    {
      sender_id: mockUserIds.elena,
      content: "Usually 7.5-8.0% for most, up to 8.5% for the very frail or those with limited life expectancy. Safety first.",
      type: "text"
    }
  ],
  
  // Chat between Frank and Grace
  [
    {
      sender_id: mockUserIds.frank,
      content: "Grace, do you have a preferred protocol for IV iron administration in your CKD patients?",
      type: "text"
    },
    {
      sender_id: mockUserIds.grace,
      content: "I've been using low-molecular-weight iron dextran with good results. Single-dose administration is convenient for patients.",
      type: "text"
    },
    {
      sender_id: mockUserIds.frank,
      content: "Any reactions I should watch for specifically?",
      type: "text"
    },
    {
      sender_id: mockUserIds.grace,
      content: "Here's our monitoring protocol. We do a test dose for all patients regardless of history.",
      type: "media",
      file_url: "https://placehold.it/300x200",
      file_name: "IV_Iron_Protocol.pdf",
      file_type: "application/pdf"
    }
  ],
  
  // Group chat with multiple participants
  [
    {
      sender_id: mockUserIds.alice,
      content: "Welcome to our multidisciplinary discussion group! I thought this would be a good way to collaborate on complex cases.",
      type: "text"
    },
    {
      sender_id: mockUserIds.bob,
      content: "Great idea, Alice. I'm currently working with a patient with overlapping autoimmune conditions that don't fit neatly into a single specialty.",
      type: "text"
    },
    {
      sender_id: mockUserIds.claire,
      content: "Happy to contribute from the rheumatology perspective. Those cases are often challenging.",
      type: "text"
    },
    {
      sender_id: mockUserIds.david,
      content: "Count me in too. The cardiovascular complications of autoimmune conditions are often underrecognized.",
      type: "text"
    },
    {
      sender_id: mockUserIds.alice,
      content: "Perfect! Let's plan to discuss a case every two weeks. Bob, would you like to present first next Thursday?",
      type: "text"
    }
  ]
];

// Function to seed chat data
async function seedChatData() {
  try {
    console.log('Starting chat data seeding...');
    
    // Create chat rooms and messages
    for (let i = 0; i < mockChatRooms.length; i++) {
      // Create chat room
      console.log(`Creating chat room ${i+1}...`);
      const roomId = uuidv4();
      
      const { error: roomError } = await supabase
        .from('chat_rooms')
        .insert({ id: roomId });
      
      if (roomError) {
        throw roomError;
      }
      
      // Add participants to the room
      for (const participantId of mockChatRooms[i].participants) {
        const { error: participantError } = await supabase
          .from('chat_participants')
          .insert({
            room_id: roomId,
            user_id: participantId
          });
        
        if (participantError) {
          throw participantError;
        }
      }
      
      // Add messages to the room
      console.log(`Adding messages to chat room ${i+1}...`);
      const messages = mockMessages[i];
      const messageTimestampBase = new Date();
      messageTimestampBase.setDate(messageTimestampBase.getDate() - 7); // Start from a week ago
      
      for (let j = 0; j < messages.length; j++) {
        // Calculate a reasonable timestamp, progressing forward in time
        const messageTimestamp = new Date(messageTimestampBase);
        messageTimestamp.setHours(messageTimestamp.getHours() + j * 2); // 2 hour gaps between messages
        
        const { error: messageError } = await supabase
          .from('chat_messages')
          .insert({
            room_id: roomId,
            sender_id: messages[j].sender_id,
            content: messages[j].content,
            type: messages[j].type,
            file_url: messages[j].file_url || null,
            file_name: messages[j].file_name || null,
            file_type: messages[j].file_type || null,
            created_at: messageTimestamp.toISOString()
          });
        
        if (messageError) {
          throw messageError;
        }
        
        // Update the last_message for chat room after the final message
        if (j === messages.length - 1) {
          const { error: updateError } = await supabase
            .from('chat_rooms')
            .update({
              last_message: messages[j].content,
              last_message_at: messageTimestamp.toISOString(),
              updated_at: messageTimestamp.toISOString()
            })
            .eq('id', roomId);
          
          if (updateError) {
            throw updateError;
          }
        }
      }
    }
    
    console.log('Chat data seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding chat data:', error);
  }
}

// Export the function
module.exports = { seedChatData };

// Execute seeding if this file is run directly
if (require.main === module) {
  seedChatData();
} 