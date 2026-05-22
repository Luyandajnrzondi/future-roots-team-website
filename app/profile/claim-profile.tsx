'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { TeamMember, Position } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Link2, UserPlus, Search } from 'lucide-react';
import { motion } from 'framer-motion';

interface ClaimProfileProps {
  userEmail: string;
  userName: string;
  allMembers: TeamMember[];
  positions: Position[];
}

export function ClaimProfile({ userEmail, userName, allMembers, positions }: ClaimProfileProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'select' | 'create'>('select');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  
  // New member form state
  const [newName, setNewName] = useState(userName);
  const [newPosition, setNewPosition] = useState('');
  const [newEmail, setNewEmail] = useState(userEmail);
  
  const filteredMembers = allMembers.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleClaimProfile = async () => {
    if (!selectedMemberId) return;
    
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.rpc('link_user_to_member', { member_id: selectedMemberId });
      if (error) throw error;
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to claim profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newName || !newPosition) {
      setError('Please fill in all required fields');
      return;
    }
    
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      // Create new member with user_id
      const { error } = await supabase
        .from('team_members')
        .insert({
          name: newName,
          position: newPosition,
          email: newEmail || null,
          user_id: user.id,
        });

      if (error) throw error;
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Info Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <p className="text-sm text-foreground">
            Your account is not yet linked to a team member profile. You can either claim an existing profile or create a new one.
          </p>
        </CardContent>
      </Card>

      {/* Mode Toggle */}
      <div className="flex gap-2">
        <Button
          variant={mode === 'select' ? 'default' : 'outline'}
          onClick={() => setMode('select')}
          className="flex-1 gap-2"
        >
          <Link2 className="h-4 w-4" />
          Claim Existing Profile
        </Button>
        <Button
          variant={mode === 'create' ? 'default' : 'outline'}
          onClick={() => setMode('create')}
          className="flex-1 gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Create New Profile
        </Button>
      </div>

      {mode === 'select' ? (
        <Card className="bg-card/60 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Claim Your Profile</CardTitle>
            <CardDescription>
              Select your name from the list of unclaimed team members
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background/50"
              />
            </div>

            {/* Members List */}
            <div className="max-h-64 overflow-y-auto space-y-2 rounded-xl border border-border/50 p-2">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => {
                  const initials = member.name
                    .replace(/\([^)]*\)/g, '')
                    .trim()
                    .split(' ')
                    .filter((n) => n.length > 0)
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);
                  
                  const isSelected = selectedMemberId === member.id;
                  
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => setSelectedMemberId(member.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                        isSelected 
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-secondary/50'
                      }`}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className={isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'}>
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left min-w-0 flex-1">
                        <p className="font-medium truncate">{member.name}</p>
                        <p className={`text-xs truncate ${isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {member.position}
                          {member.email && ` • ${member.email}`}
                        </p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'No matching profiles found' : 'No unclaimed profiles available'}
                </p>
              )}
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-destructive/10 border border-destructive/20"
              >
                <p className="text-sm text-destructive">{error}</p>
              </motion.div>
            )}

            <Button
              onClick={handleClaimProfile}
              disabled={!selectedMemberId || isLoading}
              className="w-full gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Claiming Profile...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4" />
                  Claim Selected Profile
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card/60 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Create New Profile</CardTitle>
            <CardDescription>
              Set up a new team member profile linked to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newName">Full Name *</Label>
                <Input
                  id="newName"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className="bg-background/50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPosition">Position *</Label>
                <Select value={newPosition} onValueChange={setNewPosition}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Select a position" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((pos) => (
                      <SelectItem key={pos.id} value={pos.title}>
                        {pos.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newEmail">Email</Label>
                <Input
                  id="newEmail"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="bg-background/50"
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl bg-destructive/10 border border-destructive/20"
                >
                  <p className="text-sm text-destructive">{error}</p>
                </motion.div>
              )}

              <Button
                type="submit"
                disabled={isLoading || !newName || !newPosition}
                className="w-full gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating Profile...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Create Profile
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
