export interface Post {
  id?: string;
  user_id?: string;
  content: string;
  media_url?: string[];
  hashtags?: string[];
  visibility?: 'public' | 'followers';
  created_at?: string;
  updated_at?: string;
  profile?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    verified?: boolean;
  };
  likes_count?: number;
  comments_count?: number;
  reposts_count?: number;
  is_liked_by_me?: boolean;
  is_repost?: boolean;
  has_liked?: boolean;
  has_reposted?: boolean;
  original_post_id?: string | null;
  quoted_post_id?: string | null;
  quoted_post_content?: string;
} 