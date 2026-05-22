import { createClient } from '@/lib/supabase/server';
import { FinancesClient } from './finances-client';

export const dynamic = 'force-dynamic';

export default async function FinancesPage() {
  const supabase = await createClient();
  
  // Get current user and their linked member
  const { data: { user } } = await supabase.auth.getUser();
  let currentMemberId: string | null = null;
  
  if (user) {
    const { data: memberData } = await supabase
      .from('team_members')
      .select('id')
      .eq('user_id', user.id)
      .single();
    currentMemberId = memberData?.id || null;
  }
  
  const { data: members } = await supabase
    .from('team_members')
    .select('*')
    .order('name');

  const { data: contributions } = await supabase
    .from('contributions')
    .select('*')
    .order('contribution_date', { ascending: false });

  const { data: expenses } = await supabase
    .from('expenses')
    .select('*')
    .order('expense_date', { ascending: false });

  return (
    <FinancesClient 
      members={members || []} 
      initialContributions={contributions || []}
      initialExpenses={expenses || []}
      currentMemberId={currentMemberId}
    />
  );
}
