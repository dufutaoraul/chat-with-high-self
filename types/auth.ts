export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  email: string
  full_name?: string
  age?: number
  occupation?: string
  education?: string
  family_status?: string
  personality?: string
  values?: string
  interests?: string
  short_term_goals?: string
  long_term_goals?: string
  current_challenges?: string
  desired_changes?: string
  avatar_url?: string
  profile_completed: boolean
  created_at: string
  updated_at: string
}

export interface AuthState {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  error: string | null
}