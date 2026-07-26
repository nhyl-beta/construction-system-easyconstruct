export interface NotificationRecord {
  id: number;
  recipientRole: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: Date | null;
}

export interface CreateNotificationInput {
  recipientRole: string;
  title: string;
  body: string;
  link?: string;
}

export interface NotificationFilters {
  recipientRole?: string;
  unreadOnly?: boolean;
}