export type RootStackParamList = {
  Loading: undefined;
  Chat: undefined;
  Models: undefined;
  Settings: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
} 