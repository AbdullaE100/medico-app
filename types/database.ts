export interface Profile {
  id: string;
  full_name: string;
  specialty: string;
  hospital: string;
  location: string;
  bio: string;
  avatar_url: string;
  expertise: string[];
  work_experience: WorkExperience[];
  education: Education[];
  skills: string[];
  research: Research[];
  quality_improvement: QualityImprovement[];
  interests: string[];
  languages: Language[];
  followers_count: number;
  following_count: number;
  posts_count: number;
  created_at: string;
  updated_at: string;
  // Additional professional metrics
  years_experience?: string | number;
  rating?: string | number;
  patients_count?: string | number;
  // For storing additional profile settings like anonymity preferences
  metadata?: {
    isAnonymous?: boolean;
    anonymousId?: string;
    [key: string]: any;
  };
  // Connection status for UI display (added at runtime)
  connection_status?: 'none' | 'pending' | 'connected';
}

export interface WorkExperience {
  id?: string;
  title: string;
  organization: string;
  location?: string;
  start_date: string;
  end_date?: string;
  is_current?: boolean;
  description?: string;
}

export interface Education {
  id?: string;
  degree: string;
  institution: string;
  location?: string;
  start_date: string;
  end_date?: string;
  is_current?: boolean;
  description?: string;
}

export interface Research {
  id?: string;
  title: string;
  journal?: string;
  publication_date?: string;
  url?: string;
  description?: string;
}

export interface QualityImprovement {
  id?: string;
  title: string;
  organization?: string;
  date?: string;
  description?: string;
}

export interface Language {
  name: string;
  proficiency: 'basic' | 'conversational' | 'fluent' | 'native';
}

export interface ProfileSettings {
  profile_id: string;
  is_private: boolean;
  allow_messages_from: 'everyone' | 'followers';
  allow_anonymous_posts: boolean;
  created_at: string;
  updated_at: string;
}

export interface DoctorFollow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface DoctorRecommendation {
  doctor_id: string;
  recommended_id: string;
  score: number;
  reason: string;
  created_at: string;
}