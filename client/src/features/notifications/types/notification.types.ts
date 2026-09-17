export interface Notification {
  id: number;
  title: string;
  message: string | null;
  type: string;
  role: string | null;
  isRead: boolean;
  createdAt: string | null;
}

export interface NotificationsQuery {
  role?: string;
  unreadOnly?: boolean;
}
