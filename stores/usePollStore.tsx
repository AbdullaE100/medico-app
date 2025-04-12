import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from './useAuthStore';

// Define poll option type
interface PollOption {
  text: string;
  votes: number;
  voters: string[]; // Array of user IDs who voted for this option
  percentage?: number; // Calculated percentage
}

// Define poll type
export interface Poll {
  id?: string;
  post_id: string;
  question: string;
  options: PollOption[];
  duration: number;
  created_at: string;
  expires_at: string;
  totalVotes: number;
  voters: string[]; // All users who voted
  isActive: boolean;
  userVote?: number; // Index of the option the current user voted for
}

interface PollState {
  polls: Record<string, Poll>;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  tableExists: boolean | null;
  isStartupComplete: boolean;
  
  // Create a new poll
  createPoll: (pollData: Omit<Poll, 'id'>) => Promise<Poll | null>;
  
  // Get a specific poll
  getPoll: (postId: string) => Promise<Poll | null>;
  
  // Vote on a poll
  vote: (postId: string, optionIndex: number) => Promise<boolean>;
  
  // Calculate percentages for a poll
  calculatePercentages: (poll: Poll) => Poll;
  
  // Check if poll is expired
  isPollExpired: (poll: Poll) => boolean;
  
  // Check if user has voted on a poll
  hasUserVoted: (poll: Poll, userId: string) => boolean;
  
  // Get poll result stats
  getPollStats: (postId: string) => Promise<{
    totalVotes: number;
    percentages: number[];
    userVote?: number;
  } | null>;
  
  // Check if polls table exists
  checkTableExists: () => Promise<boolean>;
  
  // Set startup as complete
  setStartupComplete: () => void;
}

export const usePollStore = create<PollState>((set, get) => ({
  polls: {},
  isLoading: false,
  error: null,
  isInitialized: false,
  tableExists: null,
  isStartupComplete: false,
  
  setStartupComplete: () => {
    set({ isStartupComplete: true });
  },
  
  checkTableExists: async () => {
    try {
      // Skip if we already know
      if (get().tableExists !== null) {
        return get().tableExists as boolean;
      }

      console.log('Checking if polls table exists in database...');
      
      // Use a timeout to prevent hanging
      const timeoutPromise = new Promise<{data: null, error: Error}>((_, reject) => 
        setTimeout(() => reject(new Error('Database connection timeout')), 5000)
      );
      
      const queryPromise = supabase
        .from('polls')
        .select('id')
        .limit(1);
        
      // Race between query and timeout
      const { error } = await Promise.race([queryPromise, timeoutPromise]) as any;
      
      // If specific error code, table doesn't exist
      if (error && error.code === '42P01') {
        console.warn('Polls table does not exist in the database - feature will be disabled');
        set({ tableExists: false });
        return false;
      }
      
      // Any other error - assume connection issue, don't disable feature yet
      if (error) {
        console.error('Error checking polls table:', error.message);
        // Don't set tableExists to false yet - might be temporary
        return false;
      }
      
      console.log('Polls table exists and is accessible');
      set({ tableExists: true });
      return true;
    } catch (err) {
      console.error('Unexpected error checking polls table:', err);
      // Don't disable feature on network/temporary errors
      return false;
    }
  },
  
  createPoll: async (pollData) => {
    set({ isLoading: true, error: null });
    
    try {
      // Check if table exists first
      const tableExists = await get().checkTableExists();
      if (!tableExists) {
        set({ error: 'Polls feature not available', isLoading: false });
        return null;
      }
      
      const { data, error } = await supabase
        .from('polls')
        .insert(pollData)
        .select('*')
        .single();
        
      if (error) {
        set({ error: error.message, isLoading: false });
        return null;
      }
      
      const poll = data as Poll;
      
      // Update local state
      set(state => ({
        polls: { ...state.polls, [poll.post_id]: poll },
        isLoading: false,
      }));
      
      return poll;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return null;
    }
  },
  
  getPoll: async (postId) => {
    // Don't attempt to load polls during app startup to avoid cascading errors
    if (!get().isStartupComplete && !get().isInitialized) {
      console.log(`Delaying poll load for post ${postId} until app startup is complete`);
      // Return gracefully without an error
      return null;
    }
    
    // Handle initialization gracefully to prevent app crashes
    try {
      if (!postId) {
        console.error('getPoll called with invalid postId:', postId);
        set({ error: 'Invalid post ID', isLoading: false });
        return null;
      }
      
      console.log(`getPoll: Fetching poll for post ${postId}`);
      
      // Check if we already have the poll cached
      const cachedPoll = get().polls[postId];
      if (cachedPoll) {
        console.log(`getPoll: Returning cached poll for post ${postId}`);
        return cachedPoll;
      }
      
      set({ isLoading: true, error: null });
      
      // First verify that polls table exists (only on first request)
      if (get().tableExists === null) {
        const tableExists = await get().checkTableExists();
        if (!tableExists) {
          set({ 
            error: 'Polls feature not configured', 
            isLoading: false, 
            isInitialized: true 
          });
          return null;
        }
      } else if (get().tableExists === false) {
        // If we already know table doesn't exist, exit early
        set({ 
          error: 'Polls feature not configured', 
          isLoading: false, 
          isInitialized: true 
        });
        return null;
      }
      
      // Add a timeout to prevent hanging requests
      const timeoutPromise = new Promise<{data: null, error: Error}>((_, reject) => 
        setTimeout(() => reject(new Error('Poll retrieval timed out')), 5000)
      );
      
      try {
        console.log(`getPoll: Querying database for poll with post_id=${postId}`);
        
        const queryPromise = supabase
          .from('polls')
          .select('*')
          .eq('post_id', postId)
          .single();
          
        // Race between query and timeout  
        const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;
          
        if (error) {
          // Check if it's a "not found" error vs a more serious error
          if (error.code === '42P01') {
            console.warn(`Polls table does not exist in the database`);
            set({ 
              error: 'Polls feature not configured', 
              isLoading: false, 
              isInitialized: true,
              tableExists: false 
            });
            return null;
          } else if (error.code === 'PGRST116') {
            console.warn(`Poll for post ${postId} not found in database`);
            set({ error: null, isLoading: false, isInitialized: true });
            // Don't set error state for missing polls - it's normal
          } else {
            console.error(`Error fetching poll for post ${postId}:`, error);
            set({ error: error.message, isLoading: false, isInitialized: true });
          }
          return null;
        }
        
        if (!data) {
          console.warn(`No poll data returned for post ${postId}`);
          set({ error: null, isLoading: false, isInitialized: true });
          return null;
        }
        
        console.log(`getPoll: Successfully retrieved poll for post ${postId}`);
        
        const poll = data as Poll;
        const authState = useAuthStore.getState();
        const userId = authState.currentUser?.id;
        
        // Check if user has voted and set userVote - with safer null checks
        if (userId && poll.voters && Array.isArray(poll.voters) && poll.voters.includes(userId)) {
          for (let i = 0; i < poll.options.length; i++) {
            const option = poll.options[i];
            if (option && option.voters && Array.isArray(option.voters) && option.voters.includes(userId)) {
              poll.userVote = i;
              break;
            }
          }
        }
        
        // Calculate percentages
        const pollWithPercentages = get().calculatePercentages(poll);
        
        // Update local state
        set(state => ({
          polls: { ...state.polls, [postId]: pollWithPercentages },
          isLoading: false,
          isInitialized: true,
        }));
        
        return pollWithPercentages;
      } catch (innerError: any) {
        // Timeout or query errors
        if (innerError?.message?.includes('timed out')) {
          console.error(`Database query timed out for post ${postId}`);
          set({ 
            error: 'Poll loading timed out. Try again later.', 
            isLoading: false,
            isInitialized: true
          });
        } else {
          console.error(`Database operation error for post ${postId}:`, innerError);
          set({ 
            error: innerError?.message || 'Unexpected database error', 
            isLoading: false,
            isInitialized: true
          });
        }
        return null;
      }
    } catch (outerError: any) {
      console.error(`Unexpected error fetching poll for post ${postId}:`, outerError);
      set({ 
        error: outerError?.message || 'Unexpected error', 
        isLoading: false,
        isInitialized: true 
      });
      return null;
    }
  },
  
  vote: async (postId, optionIndex) => {
    const authState = useAuthStore.getState();
    const userId = authState.currentUser?.id;
    
    if (!userId) {
      set({ error: 'You must be logged in to vote' });
      return false;
    }
    
    // Get the poll
    let poll = get().polls[postId];
    
    if (!poll) {
      const fetchedPoll = await get().getPoll(postId);
      if (!fetchedPoll) {
        set({ error: 'Poll not found' });
        return false;
      }
      poll = fetchedPoll;
    }
    
    // Check if poll is active
    if (get().isPollExpired(poll)) {
      set({ error: 'This poll has expired' });
      return false;
    }
    
    // Check if user has already voted
    if (get().hasUserVoted(poll, userId)) {
      set({ error: 'You have already voted on this poll' });
      return false;
    }
    
    // Clone the poll to avoid direct mutation
    const updatedPoll = { ...poll };
    
    // Add user to voters array for the poll
    updatedPoll.voters = [...updatedPoll.voters, userId];
    
    // Increment vote count for the selected option
    updatedPoll.options = updatedPoll.options.map((option, index) => {
      if (index === optionIndex) {
        return {
          ...option,
          votes: option.votes + 1,
          voters: [...option.voters, userId]
        };
      }
      return option;
    });
    
    // Update total votes
    updatedPoll.totalVotes += 1;
    updatedPoll.userVote = optionIndex;
    
    // Calculate percentages
    const pollWithPercentages = get().calculatePercentages(updatedPoll);
    
    try {
      // First check if table exists
      const tableExists = await get().checkTableExists();
      if (!tableExists) {
        set({ error: 'Polls feature not available' });
        return false;
      }
      
      // Update in database
      const { error } = await supabase
        .from('polls')
        .update({
          options: pollWithPercentages.options,
          totalVotes: pollWithPercentages.totalVotes,
          voters: pollWithPercentages.voters
        })
        .eq('post_id', postId);
        
      if (error) {
        set({ error: error.message });
        return false;
      }
      
      // Update local state
      set(state => ({
        polls: { ...state.polls, [postId]: pollWithPercentages }
      }));
      
      return true;
    } catch (error: any) {
      set({ error: error.message });
      return false;
    }
  },
  
  calculatePercentages: (poll) => {
    // Clone the poll to avoid direct mutation
    const updatedPoll = { ...poll };
    
    // Calculate percentages
    if (updatedPoll.totalVotes > 0) {
      updatedPoll.options = updatedPoll.options.map(option => ({
        ...option,
        percentage: Math.round((option.votes / updatedPoll.totalVotes) * 100)
      }));
    } else {
      // If no votes, all options have 0%
      updatedPoll.options = updatedPoll.options.map(option => ({
        ...option,
        percentage: 0
      }));
    }
    
    return updatedPoll;
  },
  
  isPollExpired: (poll) => {
    const now = new Date();
    const expiresAt = new Date(poll.expires_at);
    return now > expiresAt;
  },
  
  hasUserVoted: (poll, userId) => {
    return poll.voters.includes(userId);
  },
  
  getPollStats: async (postId) => {
    const poll = await get().getPoll(postId);
    
    if (!poll) {
      return null;
    }
    
    return {
      totalVotes: poll.totalVotes,
      percentages: poll.options.map(option => option.percentage || 0),
      userVote: poll.userVote
    };
  }
}));

// Helper function to get the poll store from outside React components
export function getPollStore() {
  return usePollStore.getState();
} 