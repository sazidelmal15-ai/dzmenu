import type { UserRole } from "./auth";

/**
 * User entity representation.
 */
export interface User {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
