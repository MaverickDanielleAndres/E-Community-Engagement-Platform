export interface Announcement {
  id: string;
  community_id: string;
  title: string;
  body?: string;
  tldr?: string;
  image_url?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAnnouncementRequest {
  community_id: string;
  title: string;
  body?: string;
  tldr?: string;
  image_url?: string;
}

export interface UpdateAnnouncementRequest {
  title?: string;
  body?: string;
  tldr?: string;
  image_url?: string;
}

export interface AnnouncementWithCreator extends Announcement {
  creator?: {
    id: string;
    name: string;
    email: string;
  };
  community?: {
    id: string;
    name: string;
    code: string;
  };
}
