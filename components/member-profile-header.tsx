'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TeamMember } from '@/lib/types';
import { ProfileImageUpload } from '@/components/profile-image-upload';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Phone } from 'lucide-react';

interface MemberProfileHeaderProps {
  member: TeamMember;
  whatsappNumber: string | null;
}

export function MemberProfileHeader({ member, whatsappNumber }: MemberProfileHeaderProps) {
  const [avatarUrl, setAvatarUrl] = useState(member.avatar_url);
  const router = useRouter();

  const handleUploadComplete = (newUrl: string) => {
    setAvatarUrl(newUrl || null);
    router.refresh();
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-foreground p-8 md:p-12 mb-8">
      <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
        <ProfileImageUpload
          memberId={member.id}
          currentAvatarUrl={avatarUrl}
          memberName={member.name}
          onUploadComplete={handleUploadComplete}
          size="lg"
        />
        
        <div className="text-center md:text-left flex-1">
          <h1 className="text-3xl md:text-4xl font-light text-background mb-2 tracking-tight">
            {member.name}
          </h1>
          <Badge className="bg-background/20 text-background border-0 mb-4">
            {member.position}
          </Badge>
          {member.department && (
            <p className="text-background/70 mb-4">{member.department}</p>
          )}
          {member.bio && (
            <p className="text-background/60 max-w-2xl">{member.bio}</p>
          )}
          
          {/* Contact Buttons */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-6">
            {whatsappNumber && (
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </Button>
              </a>
            )}
            {member.email && (
              <a href={`mailto:${member.email}`}>
                <Button variant="secondary" className="gap-2 bg-background/20 text-background hover:bg-background/30 border-0">
                  <Mail className="h-4 w-4" />
                  Email
                </Button>
              </a>
            )}
            {(member.phone || member.contact) && (
              <a href={`tel:${member.phone || member.contact}`}>
                <Button variant="secondary" className="gap-2 bg-background/20 text-background hover:bg-background/30 border-0">
                  <Phone className="h-4 w-4" />
                  Call
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>
      
      <div className="absolute top-0 right-0 w-64 h-64 bg-background/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-background/5 rounded-full translate-y-1/2 -translate-x-1/2" />
    </div>
  );
}
