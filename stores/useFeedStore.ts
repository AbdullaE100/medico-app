import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface Post {
  id: string;
  author_id: string;
  content: string;
  media_url: string[];
  hashtags: string[];
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  is_repost: boolean;
  original_post_id: string | null;
  created_at: string;
  updated_at: string;
  author?: {
    full_name: string;
    avatar_url: string;
    specialty: string;
    hospital: string;
    verified?: boolean;
  };
  has_liked?: boolean;
  has_reposted?: boolean;
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
  createPost: (content: string, hashtags?: string[], mediaUrls?: string[]) => Promise<void>;
  deletePost: (postId: string) => Promise<boolean>;
  likePost: (postId: string) => Promise<void>;
  repostPost: (postId: string, content?: string) => Promise<void>;
  fetchTrendingHashtags: () => Promise<void>;
  fetchComments: (postId: string) => Promise<Comment[]>;
  createComment: (postId: string, content: string, parentId?: string) => Promise<void>;
  likeComment: (commentId: string) => Promise<void>;
  repostComment: (commentId: string, content?: string) => Promise<void>;
}

// Number of posts to fetch per page
const POSTS_PER_PAGE = 5;
// Cache time in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

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
          )
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
          )
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

  createPost: async (content, hashtags = [], mediaUrls = []) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('posts')
        .insert({
          author_id: user.id,
          content,
          hashtags,
          media_url: mediaUrls
        });

      if (error) throw error;

      // Refresh feed
      await get().fetchPosts();
    } catch (error) {
      set({ error: (error as Error).message });
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
      await supabase.rpc('like_post', { p_post_id: postId });

      // Optimistic update
      set(state => ({
        posts: state.posts.map(post =>
          post.id === postId
            ? {
                ...post,
                likes_count: post.has_liked
                  ? post.likes_count - 1
                  : post.likes_count + 1,
                has_liked: !post.has_liked
              }
            : post
        )
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  repostPost: async (postId, content?) => {
    try {
      await supabase.rpc('repost_post', {
        p_post_id: postId,
        p_content: content
      });

      // Optimistic update
      set(state => ({
        posts: state.posts.map(post =>
          post.id === postId
            ? {
                ...post,
                reposts_count: post.has_reposted
                  ? post.reposts_count - 1
                  : post.reposts_count + 1,
                has_reposted: !post.has_reposted
              }
            : post
        )
      }));

      // Refresh feed to show the repost
      await get().fetchPosts();
    } catch (error) {
      set({ error: (error as Error).message });
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

      // Update post comments count in database
      try {
        await supabase.rpc('increment_post_comments_count', { 
          p_post_id: postId 
        });
      } catch (e) {
        console.warn('Increment post comments count function not available:', e);
        
        // Fallback: Update the post's comments_count directly if the RPC doesn't exist
        try {
          const { data: post } = await supabase
            .from('posts')
            .select('comments_count')
            .eq('id', postId)
            .single();
            
          if (post) {
            const updatedCount = (post.comments_count || 0) + 1;
            await supabase
              .from('posts')
              .update({ comments_count: updatedCount })
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
  }
}));