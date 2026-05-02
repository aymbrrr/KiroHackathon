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

export type AppTabParamList = {
  Map: undefined;
  Search: undefined;
  Followed: undefined;
  Journal: undefined;
  Profile: undefined;
};

export type AppRootParamList = {
  MainMap: undefined;
  Rating: { venueId: string; venueName: string };
  VenueDetail: { venueId: string };
};
