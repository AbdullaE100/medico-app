import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from './useAuthStore';

export interface Post {
  id?: string;
  user_id?: string;
  content: string;
  media_url?: string[];
  hashtags?: string[];
  visibility?: 'public' | 'followers';
  is_anonymous?: boolean;
  created_at?: string;
  updated_at?: string;
  profile?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  likes_count?: number;
  comments_count?: number;
  reposts_count?: number;
  replies_count?: number;
  is_liked_by_me?: boolean;
  is_repost?: boolean;
  original_post_id?: string | null;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  parent_id?: string | null;
  likes_count?: number;
  reposts_count?: number;
  replies_count?: number;
  has_liked?: boolean;
  has_reposted?: boolean;
  replies?: Comment[];
  vote_score?: number;
  user_vote?: boolean | null;
  author?: {
    full_name: string;
    avatar_url: string;
    specialty: string;
    verified?: boolean;
  };
}

interface Hashtag {
  name: string;
  post_count: number;
}

export interface FeedStore extends FeedState {
  // All existing methods plus new ones
  loadMorePosts: (options?: {
    userId?: string;
    hashtag?: string;
    following?: boolean;
  }) => Promise<void>;
  refreshPosts: (options?: {
    userId?: string;
    hashtag?: string;
    following?: boolean;
  }) => Promise<void>;
  deletePost: (postId: string) => Promise<boolean>;
}

interface FeedState {
  posts: Post[];
  trendingHashtags: Hashtag[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMorePosts: boolean;
  currentPage: number;
  error: string | null;
  lastFetched: number | null;
  fetchPosts: (options?: {
    userId?: string;
    hashtag?: string;
    following?: boolean;
    forceRefresh?: boolean;
  }) => Promise<void>;
  createPost: (post: Omit<Post, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  deletePost: (postId: string) => Promise<boolean>;
  likePost: (postId: string) => Promise<void>;
  unlikePost: (postId: string) => Promise<void>;
  repostPost: (postId: string, content?: string) => Promise<void>;
  fetchTrendingHashtags: () => Promise<void>;
  fetchComments: (postId: string) => Promise<Comment[]>;
  createComment: (postId: string, content: string, parentId?: string) => Promise<void>;
  likeComment: (commentId: string) => Promise<void>;
  repostComment: (commentId: string, content?: string) => Promise<void>;
  loadPosts: () => Promise<void>;
}

// Number of posts to fetch per page
const POSTS_PER_PAGE = 5;
// Cache time in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Cache key for anonymous posts
const ANONYMOUS_POSTS_CACHE_KEY = 'medico-anonymous-posts';

// Helper function to load anonymous posts from cache
const loadAnonymousPostsCache = async (): Promise<Set<string>> => {
  // Make sure we're in a browser environment with localStorage
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    console.warn('localStorage is not available in this environment');
    return new Set();
  }
  
  try {
    const cachedData = localStorage.getItem(ANONYMOUS_POSTS_CACHE_KEY);
    if (cachedData) {
      const postIds = JSON.parse(cachedData);
      console.log('Loaded anonymous posts from cache:', postIds);
      return new Set(postIds);
    }
  } catch (error) {
    console.warn('Error loading anonymous posts cache:', error);
  }
  return new Set();
};

// Helper function to save anonymous posts to cache
const saveAnonymousPostsCache = async (postIds: Set<string>) => {
  // Make sure we're in a browser environment with localStorage
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    console.warn('localStorage is not available in this environment');
    return;
  }
  
  try {
    localStorage.setItem(
      ANONYMOUS_POSTS_CACHE_KEY, 
      JSON.stringify(Array.from(postIds))
    );
  } catch (error) {
    console.warn('Error saving anonymous posts cache:', error);
  }
};

// Helper function to add a post to the anonymous posts cache
const addToAnonymousPostsCache = async (postId: string) => {
  if (!postId) return;
  
  try {
    const anonymousPostIds = await loadAnonymousPostsCache();
    anonymousPostIds.add(postId);
    await saveAnonymousPostsCache(anonymousPostIds);
    console.log('Added post to anonymous cache:', postId);
  } catch (error) {
    console.warn('Error adding post to anonymous cache:', error);
  }
};

export const useFeedStore = create<FeedStore>((set, get) => ({
  posts: [],
  trendingHashtags: [],
  isLoading: false,
  isLoadingMore: false,
  hasMorePosts: true,
  currentPage: 0,
  lastFetched: null,
  error: null,

  fetchPosts: async (options = {}) => {
    const currentState = get();
    const now = Date.now();
    const cacheExpired = !currentState.lastFetched || (now - currentState.lastFetched > CACHE_DURATION);
    
    // Return cached data if available and not forcing refresh
    if (currentState.posts.length > 0 && !cacheExpired && !options.forceRefresh) {
      return;
    }
    
    set({ isLoading: true, error: null });
    try {
      const pageSize = POSTS_PER_PAGE;
      const currentPage = 0; // Reset to first page when fetching new posts
      
      let query = supabase
        .from('posts')
        .select(`
          *,
          author:profiles!posts_author_id_fkey(
            full_name,
            avatar_url,
            specialty,
            hospital
          ),
          likes_count,
          comments_count,
          reposts_count
        `)
        .order('created_at', { ascending: false })
        .range(0, pageSize - 1);

      if (options.userId) {
        query = query.eq('author_id', options.userId);
      }

      if (options.hashtag) {
        query = query.contains('hashtags', [options.hashtag]);
      }

      if (options.following) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data: following } = await supabase
          .from('doctor_follows')
          .select('following_id')
          .eq('follower_id', user.id);

        if (following?.length) {
          query = query.in('author_id', following.map(f => f.following_id));
        }
      }

      const { data: posts, error } = await query;
      if (error) throw error;

      // Fetch user's likes and reposts if authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (user && posts) {
        const [{ data: likes }, { data: reposts }] = await Promise.all([
          supabase
            .from('post_likes')
            .select('post_id')
            .eq('user_id', user.id)
            .in('post_id', posts.map(p => p.id)),
          supabase
            .from('post_reposts')
            .select('post_id')
            .eq('user_id', user.id)
            .in('post_id', posts.map(p => p.id))
        ]);

        const likedPosts = new Set(likes?.map(l => l.post_id));
        const repostedPosts = new Set(reposts?.map(r => r.post_id));

        posts.forEach(post => {
          post.has_liked = likedPosts.has(post.id);
          post.has_reposted = repostedPosts.has(post.id);
        });
      }

      // Load the anonymous posts cache to check which posts should be anonymous
      const anonymousPostIds = await loadAnonymousPostsCache();

      // Set is_anonymous to false for existing posts until the column is added to the database
      if (posts) {
        posts.forEach(post => {
          post.replies_count = post.replies_count || 0;
          
          // If the post has is_anonymous set from the database, use that value
          // Otherwise check our local cache if this post ID is marked as anonymous
          if (post.is_anonymous === undefined || post.is_anonymous === null) {
            const isInCache = post.id ? anonymousPostIds.has(post.id) : false;
            post.is_anonymous = isInCache;
            console.log(`Post ${post.id}: Setting is_anonymous to ${isInCache} from cache`);
          } else {
            console.log(`Post ${post.id}: Using database is_anonymous value: ${post.is_anonymous}`);
          }
        });
      }

      set({ 
        posts: posts || [],
        currentPage,
        hasMorePosts: posts && posts.length === pageSize,
        lastFetched: Date.now()
      });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },
  
  loadMorePosts: async (options = {}) => {
    const { currentPage, posts, isLoadingMore, hasMorePosts } = get();
    
    if (isLoadingMore || !hasMorePosts) return;
    
    set({ isLoadingMore: true });
    try {
      const nextPage = currentPage + 1;
      const from = nextPage * POSTS_PER_PAGE;
      const to = from + POSTS_PER_PAGE - 1;
      
      let query = supabase
        .from('posts')
        .select(`
          *,
          author:profiles!posts_author_id_fkey(
            full_name,
            avatar_url,
            specialty,
            hospital
          ),
          likes_count,
          comments_count,
          reposts_count
        `)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (options.userId) {
        query = query.eq('author_id', options.userId);
      }

      if (options.hashtag) {
        query = query.contains('hashtags', [options.hashtag]);
      }

      if (options.following) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data: following } = await supabase
          .from('doctor_follows')
          .select('following_id')
          .eq('follower_id', user.id);

        if (following?.length) {
          query = query.in('author_id', following.map(f => f.following_id));
        } else {
          // No followed users, return empty result
          set({
            isLoadingMore: false,
            hasMorePosts: false
          });
          return;
        }
      }
      
      const { data: newPosts, error } = await query;
        
      if (error) throw error;
      
      // Fetch user's likes and reposts for new posts
      const { data: { user } } = await supabase.auth.getUser();
      if (user && newPosts && newPosts.length > 0) {
        const [{ data: likes }, { data: reposts }] = await Promise.all([
          supabase
            .from('post_likes')
            .select('post_id')
            .eq('user_id', user.id)
            .in('post_id', newPosts.map(p => p.id)),
          supabase
            .from('post_reposts')
            .select('post_id')
            .eq('user_id', user.id)
            .in('post_id', newPosts.map(p => p.id))
        ]);

        const likedPosts = new Set(likes?.map(l => l.post_id));
        const repostedPosts = new Set(reposts?.map(r => r.post_id));

        newPosts.forEach(post => {
          post.has_liked = likedPosts.has(post.id);
          post.has_reposted = repostedPosts.has(post.id);
        });
      }
      
      // Load the anonymous posts cache to check which posts should be anonymous
      const anonymousPostIds = await loadAnonymousPostsCache();
      
      // Set is_anonymous to false for existing posts until the column is added to the database
      if (newPosts) {
        newPosts.forEach(post => {
          post.replies_count = post.replies_count || 0;
          
          // If the post has is_anonymous set from the database, use that value
          // Otherwise check our local cache if this post ID is marked as anonymous
          if (post.is_anonymous === undefined || post.is_anonymous === null) {
            const isInCache = post.id ? anonymousPostIds.has(post.id) : false;
            post.is_anonymous = isInCache;
            console.log(`Post ${post.id}: Setting is_anonymous to ${isInCache} from cache`);
          } else {
            console.log(`Post ${post.id}: Using database is_anonymous value: ${post.is_anonymous}`);
          }
        });
      }
      
      set({
        posts: [...posts, ...(newPosts || [])],
        currentPage: nextPage,
        hasMorePosts: newPosts && newPosts.length === POSTS_PER_PAGE
      });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoadingMore: false });
    }
  },
  
  refreshPosts: async (options = {}) => {
    return get().fetchPosts({ ...options, forceRefresh: true });
  },

  createPost: async (postData) => {
    set({ isLoading: true, error: null });
    
    try {
      const { currentUser } = useAuthStore.getState();
      
      if (!currentUser) {
        throw new Error('You must be logged in to create a post');
      }
      
      console.log('Creating post with author_id:', currentUser.id);
      console.log('Post data:', JSON.stringify(postData));
      
      // Save the is_anonymous flag for local use
      const isAnonymous = postData.is_anonymous || false;
      
      // First try to create with is_anonymous field included
      try {
        // Include is_anonymous in the initial post creation
        const newPost = {
          author_id: currentUser.id,
          content: postData.content,
          media_url: postData.media_url || [],
          hashtags: postData.hashtags || [],
          is_anonymous: isAnonymous
        };
        
        console.log('Trying to create post with is_anonymous:', JSON.stringify(newPost));
        
        const { data, error } = await supabase
          .from('posts')
          .insert(newPost)
          .select(`
            *,
            profile:profiles!posts_author_id_fkey(
              id, 
              full_name, 
              avatar_url
            )
          `)
          .single();
          
        if (!error && data) {
          // Success! Post created with is_anonymous field
          console.log('Post created successfully with is_anonymous field');
          
          // Add the is_anonymous flag to the post object for UI rendering
          data.is_anonymous = isAnonymous;
          
          // Update the anonymous posts cache in all cases to ensure it's available when reloading
          if (isAnonymous && data.id) {
            await addToAnonymousPostsCache(data.id);
          }
          
          // Add the new post to the local state
          set((state) => ({ 
            posts: [data, ...state.posts],
            isLoading: false
          }));
          
          return data;
        }
        
        // If we get here, there was an error with is_anonymous field
        // Log the error but continue with fallback approach
        console.warn('Could not create post with is_anonymous field:', error);
        console.log('Trying fallback approach without is_anonymous field');
        
        // Don't throw here, we'll try the fallback
      } catch (firstAttemptError) {
        console.warn('Error in first attempt to create post:', firstAttemptError);
        // Continue with fallback
      }
      
      // Fallback: Create post without is_anonymous field
      const fallbackPost = {
        author_id: currentUser.id,
        content: postData.content,
        media_url: postData.media_url || [],
        hashtags: postData.hashtags || [],
        // Omit is_anonymous field
      };
      
      console.log('Submitting fallback post without is_anonymous:', JSON.stringify(fallbackPost));
      
      const { data, error } = await supabase
        .from('posts')
        .insert(fallbackPost)
        .select(`
          *,
          profile:profiles!posts_author_id_fkey(
            id, 
            full_name, 
            avatar_url
          )
        `)
        .single();
        
      if (error) {
        console.error('Post creation error details:', error);
        if (error.code) console.error('Error code:', error.code);
        if (error.details) console.error('Error details:', error.details);
        if (error.hint) console.error('Error hint:', error.hint);
        
        throw error;
      }
      
      if (!data) {
        console.error('No data returned from post creation');
        throw new Error('Failed to create post - no data returned');
      }
      
      // Add the is_anonymous flag to the post object for UI rendering only
      data.is_anonymous = isAnonymous;
      
      // If we're using the fallback approach, always add to cache
      if (isAnonymous && data.id) {
        await addToAnonymousPostsCache(data.id);
        console.log(`Added post ${data.id} to anonymous cache (fallback approach)`);
      }
      
      console.log('Post created successfully with fallback approach, data:', data);
      
      // Add the new post to the local state
      set((state) => ({ 
        posts: [data, ...state.posts],
        isLoading: false
      }));
      
      return data;
    } catch (error: any) {
      console.error('Error creating post:', error);
      if (error.details) console.error('Error details:', error.details);
      if (error.hint) console.error('Error hint:', error.hint);
      
      set({ 
        error: error.message || 'Failed to create post', 
        isLoading: false 
      });
      throw error;
    }
  },

  deletePost: async (postId) => {
    try {
      // First check if the user is the author of the post
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      // Get the post to verify ownership
      const { data: post } = await supabase
        .from('posts')
        .select('author_id')
        .eq('id', postId)
        .single();
      
      if (!post) throw new Error('Post not found');
      
      // Verify ownership
      if (post.author_id !== user.id) {
        throw new Error('You can only delete your own posts');
      }
      
      // Delete the post
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);
      
      if (error) throw error;
      
      // Optimistically update the UI by removing the post
      set(state => ({
        posts: state.posts.filter(p => p.id !== postId)
      }));
      
      return true;
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    }
  },

  likePost: async (postId) => {
    try {
      const { currentUser } = useAuthStore.getState();
      
      if (!currentUser) {
        throw new Error('You must be logged in to like a post');
      }
      
      // Add like to post_likes table
      const { error } = await supabase
        .from('post_likes')
        .insert({
          user_id: currentUser.id,
          post_id: postId
        });
        
      if (error) throw error;
      
      // Update local state
      set((state) => ({
        posts: state.posts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                likes_count: (post.likes_count || 0) + 1,
                is_liked_by_me: true
              }
            : post
        )
      }));
      
    } catch (error: any) {
      console.error('Error liking post:', error);
    }
  },

  unlikePost: async (postId) => {
    try {
      const { currentUser } = useAuthStore.getState();
      
      if (!currentUser) {
        throw new Error('You must be logged in to unlike a post');
      }
      
      // Remove like from post_likes table
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('post_id', postId);
        
      if (error) throw error;
      
      // Update local state
      set((state) => ({
        posts: state.posts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                likes_count: Math.max((post.likes_count || 0) - 1, 0),
                is_liked_by_me: false
              }
            : post
        )
      }));
      
    } catch (error: any) {
      console.error('Error unliking post:', error);
    }
  },

  repostPost: async (postId, content = '') => {
    try {
      const { currentUser } = useAuthStore.getState();
      
      if (!currentUser) {
        throw new Error('You must be logged in to repost');
      }
      
      // Call the repost_post RPC function instead of direct insertion
      const { data, error } = await supabase
        .rpc('repost_post', { 
          p_post_id: postId,
          p_content: content || null
        });
        
      if (error) {
        console.error('Error calling repost_post RPC:', error);
        throw error;
      }
      
      // Update the repost count on the original post in our local state
      set((state) => ({
        posts: state.posts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                reposts_count: (post.reposts_count || 0) + 1
              }
            : post
        )
      }));
      
      // Refresh posts to get the new repost
      await get().loadPosts();
      
    } catch (error: any) {
      console.error('Error reposting:', error);
      throw error; // Propagate error to caller for handling
    }
  },

  fetchTrendingHashtags: async () => {
    try {
      const { data, error } = await supabase
        .from('hashtags')
        .select('name, post_count')
        .order('post_count', { ascending: false })
        .order('last_used_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      set({ trendingHashtags: data });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  fetchComments: async (postId) => {
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          *,
          author:profiles(
            full_name,
            avatar_url,
            specialty
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const comments: Comment[] = data || [];
      
      // Set default values for fields that might not exist in the database yet
      comments.forEach(comment => {
        comment.likes_count = comment.likes_count || 0;
        comment.reposts_count = comment.reposts_count || 0;
        comment.replies_count = comment.replies_count || 0;
        comment.parent_id = comment.parent_id || null;
      });
      
      // Fetch user's likes for comments if authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (user && comments.length > 0) {
        // Try to get like/repost info if the tables exist
        try {
          const [{ data: likes }, { data: reposts }] = await Promise.all([
            supabase
              .from('comment_likes')
              .select('comment_id')
              .eq('user_id', user.id)
              .in('comment_id', comments.map(c => c.id)),
            supabase
              .from('comment_reposts')
              .select('comment_id')
              .eq('user_id', user.id)
              .in('comment_id', comments.map(c => c.id))
          ]);

          const likedComments = new Set(likes?.map(l => l.comment_id) || []);
          const repostedComments = new Set(reposts?.map(r => r.comment_id) || []);

          comments.forEach(comment => {
            comment.has_liked = likedComments.has(comment.id);
            comment.has_reposted = repostedComments.has(comment.id);
          });
        } catch (e) {
          console.warn('Comment interaction tables not available yet:', e);
        }
      }
      
      return comments;
    } catch (error) {
      set({ error: (error as Error).message });
      return [];
    }
  },

  createComment: async (postId, content, parentId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const commentData: any = {
        post_id: postId,
        author_id: user.id,
        content
      };

      // Only add parent_id if it's provided and the column exists
      if (parentId) {
        try {
          commentData.parent_id = parentId;
        } catch (e) {
          console.warn('Parent_id column not available:', e);
        }
      }

      const { error } = await supabase
        .from('post_comments')
        .insert(commentData);

      if (error) throw error;

      // If this is a reply and the increment function exists, update replies_count
      if (parentId) {
        try {
          await supabase.rpc('increment_comment_replies_count', { 
            p_comment_id: parentId 
          });
        } catch (e) {
          console.warn('Increment replies count function not available:', e);
        }
      }

      // Update post comments count in database using the new function
      try {
        await supabase.rpc('increment_post_comments_count', { 
          p_post_id: postId 
        });
      } catch (e) {
        console.warn('Increment post comments count function not available:', e);
        
        // Fallback: Update the post's comments_count directly if the RPC doesn't exist
        try {
          // Get the accurate count of all comments for this post
          const { data: commentsCount, error: countError } = await supabase
            .from('post_comments')
            .select('id', { count: 'exact' })
            .eq('post_id', postId);
            
          if (!countError) {
            const count = commentsCount?.length || 0;
            await supabase
              .from('posts')
              .update({ comments_count: count })
              .eq('id', postId);
          }
        } catch (error) {
          console.error('Error updating post comments count:', error);
        }
      }

      // Update comments count in local state
      set(state => ({
        posts: state.posts.map(post =>
          post.id === postId
            ? { ...post, comments_count: (post.comments_count || 0) + 1 }
            : post
        )
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
  
  likeComment: async (commentId) => {
    try {
      try {
        await supabase.rpc('like_comment', { p_comment_id: commentId });
      } catch (e) {
        console.warn('Like comment function not available:', e);
      }
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
  
  repostComment: async (commentId, content) => {
    try {
      try {
        await supabase.rpc('repost_comment', { 
          p_comment_id: commentId,
          p_content: content
        });
      } catch (e) {
        console.warn('Repost comment function not available:', e);
      }
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  loadPosts: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const { currentUser } = useAuthStore.getState();
      
      if (!currentUser) {
        throw new Error('You must be logged in to load posts');
      }
      
      // First get the relationship details to debug
      console.log('Fetching posts with correct relationship...');
      
      // Modified query to remove the problematic foreign key reference
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profile:profiles!posts_author_id_fkey(id, full_name, avatar_url),
          likes_count,
          comments_count,
          reposts_count
        `)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Query error details:', error);
        throw error;
      }
      
      // Check which posts are liked by the current user
      const { data: likedPosts, error: likedError } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', currentUser.id);
        
      if (likedError) throw likedError;
      
      const likedPostIds = likedPosts?.map(like => like.post_id) || [];
      
      // Get a list of all original post IDs that we need to fetch
      const originalPostIds = data
        .filter(post => post.is_repost && post.original_post_id)
        .map(post => post.original_post_id)
        .filter(Boolean);
      
      // Only fetch original posts if there are any reposts
      const originalPosts: Record<string, any> = {};
      
      if (originalPostIds.length > 0) {
        try {
          // Fetch original posts data in a separate query
          const { data: originals, error: originalsError } = await supabase
            .from('posts')
            .select(`
              id,
              content,
              profile:profiles!posts_author_id_fkey(id, full_name, avatar_url)
            `)
            .in('id', originalPostIds);
            
          if (!originalsError && originals) {
            // Create a lookup object for easy access
            originals.forEach((post) => {
              if (post.id) {
                originalPosts[post.id] = post;
              }
            });
          }
        } catch (err) {
          console.warn('Error fetching original posts:', err);
          // Continue even if this fails - we'll just show posts without original content
        }
      }
      
      // Load the anonymous posts cache to check which posts should be anonymous
      const anonymousPostIds = await loadAnonymousPostsCache();
      
      // Process posts to include repost data for rendering
      const postsWithLikeStatus = data.map(post => {
        // For posts that are reposts with content (quotes), attach the original post data
        const processedPost = {
          ...post,
          is_liked_by_me: likedPostIds.includes(post.id),
          replies_count: post.replies_count || 0, // Ensure replies_count has a default value
        };
        
        // Check if this is an anonymous post - either from the database or our cache
        if (post.is_anonymous === undefined || post.is_anonymous === null) {
          const isInCache = post.id ? anonymousPostIds.has(post.id) : false;
          processedPost.is_anonymous = isInCache;
          console.log(`Post ${post.id}: Setting is_anonymous to ${isInCache} from cache`);
        } else {
          console.log(`Post ${post.id}: Using database is_anonymous value: ${post.is_anonymous}`);
        }
        
        // If this is a repost with content (quote post) and we have the original post data
        if (post.is_repost && post.content && post.original_post_id && originalPosts[post.original_post_id]) {
          const originalPost = originalPosts[post.original_post_id];
          // Add quoted post fields for rendering
          processedPost.quoted_post_id = originalPost.id;
          processedPost.quoted_post_content = originalPost.content;
          processedPost.quoted_post_author = originalPost.profile?.full_name;
          processedPost.quoted_post_avatar = originalPost.profile?.avatar_url;
        }
        
        return processedPost;
      });
      
      set({ 
        posts: postsWithLikeStatus, 
        isLoading: false 
      });
      
    } catch (error: any) {
      console.error('Error loading posts:', error);
      set({ 
        error: error.message || 'Failed to load posts', 
        isLoading: false 
      });
    }
  },
}));