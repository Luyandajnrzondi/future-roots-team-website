'use client';

import { useCurrentMember } from '@/contexts/member-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, ChevronDown, Check } from 'lucide-react';

export function MemberSelector() {
  const { currentMember, setCurrentMember, members, isLoading } = useCurrentMember();

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-2">
        <User className="h-4 w-4" />
        Loading...
      </Button>
    );
  }

  const getInitials = (name: string) => {
    return name
      .replace(/\([^)]*\)/g, '')
      .trim()
      .split(' ')
      .filter((n) => n.length > 0)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 min-w-[140px]">
          {currentMember ? (
            <>
              <Avatar className="h-5 w-5">
                {currentMember.avatar_url ? (
                  <AvatarImage src={currentMember.avatar_url} alt={currentMember.name} />
                ) : null}
                <AvatarFallback className="text-[10px]">
                  {getInitials(currentMember.name)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate max-w-[100px]">{currentMember.name.split(' ')[0]}</span>
            </>
          ) : (
            <>
              <User className="h-4 w-4" />
              Select Profile
            </>
          )}
          <ChevronDown className="h-3 w-3 ml-auto opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Select Your Profile</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {members.map((member) => (
          <DropdownMenuItem
            key={member.id}
            onClick={() => setCurrentMember(member)}
            className="gap-2 cursor-pointer"
          >
            <Avatar className="h-6 w-6">
              {member.avatar_url ? (
                <AvatarImage src={member.avatar_url} alt={member.name} />
              ) : null}
              <AvatarFallback className="text-[10px]">
                {getInitials(member.name)}
              </AvatarFallback>
            </Avatar>
            <span className="flex-1 truncate">{member.name}</span>
            {currentMember?.id === member.id && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        {currentMember && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setCurrentMember(null)}
              className="text-muted-foreground cursor-pointer"
            >
              Clear selection
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
