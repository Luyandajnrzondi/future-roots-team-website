export interface TeamMember {
  id: string;
  name: string;
  position: string;
  avatar_url: string | null;
  bio: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  member_id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes: string | null;
  created_at: string;
}

export interface Upload {
  id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  file_type: string | null;
  file_size: number | null;
  link_url: string | null;
  uploaded_by: string | null;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface Position {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
}
