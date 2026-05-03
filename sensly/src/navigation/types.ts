/**
 * Navigation type definitions.
 * Import these in screens to get typed navigation props.
 */

export type AuthStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
  SignUp: undefined;
  Onboarding: undefined;
};

// Tab order matches designer's Layout.tsx: Home → Journal → Sense → Map → Calm → Profile
export type AppTabParamList = {
  Home: undefined;
  Journal: undefined;
  Map: undefined;
  Calm: undefined;
  Profile: undefined;
};

export type AppRootParamList = {
  MainTabs: undefined;
  Rating: { venueId: string; venueName: string };
  VenueDetail: { venueId: string };
  ProfileEdit: undefined;
  Calm: undefined;
  CurrentSense: {
    risk: number;
    mood: string;
    label: string;
    message: string;
    levelColor: string;
    soundLabel: string;
    motionLabel: string;
    db: number;
  };
  Insight: {
    risk: number;
    soundLabel: string;
    motionLabel: string;
    db: number;
  };
};
