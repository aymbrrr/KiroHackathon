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
};
