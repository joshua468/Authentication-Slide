export interface SafeUser {
  id: string;
  name: string;
  email: string;
  isEmailVerified: boolean;
}

export type PublicUser = Pick<SafeUser, "id" | "name" | "email">;