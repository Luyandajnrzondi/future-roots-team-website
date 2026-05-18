export interface TeamMember {
  id: string;
  name: string;
  position: string;
  avatar_url: string | null;
  bio: string | null;
  email: string | null;
  phone: string | null;
  department: string | null;
  contact: string | null;
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

export interface TimetableEntry {
  id: string;
  member_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  activity: string;
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Meeting {
  id: string;
  title: string;
  description: string | null;
  meeting_date: string;
  start_time: string;
  end_time: string | null;
  location: string | null;
  meeting_type: string;
  created_by: string | null;
  is_recurring: boolean;
  recurrence_pattern: string | null;
  created_at: string;
  updated_at: string;
}

export interface MeetingAttendee {
  id: string;
  meeting_id: string;
  member_id: string;
  status: 'pending' | 'confirmed' | 'declined';
  created_at: string;
}

export interface Contribution {
  id: string;
  member_id: string | null;
  amount: number;
  contribution_date: string;
  description: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  expense_date: string;
  category: string;
  description: string | null;
  receipt_url: string | null;
  paid_by: string | null;
  created_at: string;
}
