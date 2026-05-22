'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TeamMember } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

interface MemberContextType {
  currentMember: TeamMember | null;
  setCurrentMember: (member: TeamMember | null) => void;
  members: TeamMember[];
  isLoading: boolean;
}

const MemberContext = createContext<MemberContextType | undefined>(undefined);

export function MemberProvider({ children }: { children: ReactNode }) {
  const [currentMember, setCurrentMemberState] = useState<TeamMember | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadMembers() {
      const supabase = createClient();
      const { data } = await supabase
        .from('team_members')
        .select('*')
        .order('name');
      
      if (data) {
        setMembers(data);
        
        // Try to restore the selected member from sessionStorage
        const savedMemberId = sessionStorage.getItem('currentMemberId');
        if (savedMemberId) {
          const savedMember = data.find(m => m.id === savedMemberId);
          if (savedMember) {
            setCurrentMemberState(savedMember);
          }
        }
      }
      setIsLoading(false);
    }
    
    loadMembers();
  }, []);

  const setCurrentMember = (member: TeamMember | null) => {
    setCurrentMemberState(member);
    if (member) {
      sessionStorage.setItem('currentMemberId', member.id);
    } else {
      sessionStorage.removeItem('currentMemberId');
    }
  };

  return (
    <MemberContext.Provider value={{ currentMember, setCurrentMember, members, isLoading }}>
      {children}
    </MemberContext.Provider>
  );
}

export function useCurrentMember() {
  const context = useContext(MemberContext);
  if (context === undefined) {
    throw new Error('useCurrentMember must be used within a MemberProvider');
  }
  return context;
}
