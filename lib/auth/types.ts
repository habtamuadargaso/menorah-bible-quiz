// Placeholder auth types. When real accounts are added (see AuthContext.tsx
// for the planned Supabase wiring), extend this shape rather than replacing
// it — components already read `user` and `isGuest` from useAuth().
export interface AppUser {
  id: string;
  displayName: string;
  isGuest: boolean;
}
