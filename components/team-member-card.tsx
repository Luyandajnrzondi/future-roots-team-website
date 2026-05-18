'use client';

import { TeamMember } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface TeamMemberCardProps {
  member: TeamMember;
}

export function TeamMemberCard({ member }: TeamMemberCardProps) {
  const initials = member.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="group overflow-hidden bg-white/70 backdrop-blur-sm border-border/50 hover:shadow-lg hover:border-primary/30 transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center gap-4">
          <Avatar className="h-20 w-20 ring-4 ring-primary/10 group-hover:ring-primary/30 transition-all">
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground text-lg">{member.name}</h3>
            <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
              {member.position}
            </Badge>
          </div>
          {member.bio && (
            <p className="text-sm text-muted-foreground line-clamp-2">{member.bio}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
