export interface PublicUserRecord {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface UserFilters {
  role?: string;
}
