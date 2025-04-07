// User types
export interface Profile {
  id: string;
  full_name: string;
  email?: string;
  avatar_url?: string;
  is_online?: boolean;
  is_doctor?: boolean;
  specialty?: string;
  hospital?: string;
  bio?: string;
  created_at?: string;
  updated_at?: string;
}

export interface User extends Profile {
  // Any additional user-specific properties
}

export interface Contact {
  id: string;
  full_name?: string;
  avatar_url?: string;
  is_online?: boolean;
}

// Chat types
export interface Chat {
  id: string;
  other_user?: Profile;
  last_message?: string | null;
  last_message_at: string;
  unread_count: number;
  is_muted: boolean;
  is_archived: boolean;
  is_group?: boolean;
  group_name?: string;
  created_by?: string;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  user_id: string;
  content: string;
  created_at: string;
  sender?: Profile;
}

// Feed types
export interface Post {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  author?: Profile;
  like_count: number;
  reply_count: number;
  repost_count: number;
  is_liked_by_me?: boolean;
  is_reposted_by_me?: boolean;
  parent_id?: string;
  parent?: Post;
}

// Connection types
export interface Connection {
  id: string;
  user_id: string;
  connection_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface ConnectionRequestItem {
  id: string;
  profile: Profile;
  created_at: string;
} 