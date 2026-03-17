export interface User {
  _id: string;
  email: string;
  username: string;
  displayName: string;
  avatar: string;
  provider: 'local' | 'google';
  subscriptionTier: 'wanderer' | 'hobbyist' | 'gamemaster' | 'pro';
  subscriptionStatus: 'active' | 'past_due' | 'cancelled' | 'expired';
  role: 'user' | 'admin';
  ageVerified: boolean;
  ageVerifiedAt?: string;
  emailVerified: boolean;
  aiUsage: {
    enabled: boolean;
    tier: 'none' | 'starter' | 'pro' | 'ultimate';
    callsThisMonth: number;
  };
  timezone: string;
  preferences: {
    theme: string;
    emailNotifications: {
      sessionReminders: boolean;
      campaignInvites: boolean;
      creditLow: boolean;
    };
    diceAnimation: boolean;
    diceSounds: boolean;
  };
  lastLogin?: string;
}

export interface AuthResponse {
  user: User;
}
