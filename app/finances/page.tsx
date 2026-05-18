import { createClient } from '@/lib/supabase/server';
import { FinancesClient } from './finances-client';

export default async function FinancesPage() {
  const supabase = await createClient();
  
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
    />
  );
}
