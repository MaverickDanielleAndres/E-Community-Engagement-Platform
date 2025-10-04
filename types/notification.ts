export interface Notification {
  id: string;
  title: string;
  body: string;
  type?: string;
  link_url?: string;
  is_read: boolean;
  created_at: string;
}
