export interface User {
  _id: string;
  email: string;
  username: string;
  displayName: string;
  avatar: string;
  provider: 'local' | 'google';
  subscriptionTier: 'free' | 'hobbyist' | 'pro' | 'professional';
  subscriptionStatus: 'active' | 'cancelled' | 'expired';
  ageVerified: boolean;
  ageVerifiedAt?: string;
  aiUsage: {
    enabled: boolean;
    tier: 'none' | 'starter' | 'pro' | 'ultimate';
    callsThisMonth: number;
  };
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}
