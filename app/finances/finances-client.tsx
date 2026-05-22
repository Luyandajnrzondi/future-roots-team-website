'use client';

import { useState, useMemo } from 'react';
import { TeamMember, Contribution, Expense } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Plus, TrendingUp, TrendingDown, Wallet, PiggyBank, Pencil, Trash2, Loader2, Receipt, DollarSign } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { format, parseISO } from 'date-fns';
import { Header } from '@/components/header';

interface FinancesClientProps {
  members: TeamMember[];
  initialContributions: Contribution[];
  initialExpenses: Expense[];
  currentMemberId: string | null;
}

const EXPENSE_CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'supplies', label: 'Supplies' },
  { value: 'travel', label: 'Travel' },
  { value: 'food', label: 'Food & Refreshments' },
  { value: 'events', label: 'Events' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'other', label: 'Other' },
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(amount);
}

export function FinancesClient({ members, initialContributions, initialExpenses, currentMemberId }: FinancesClientProps) {
  const [contributions, setContributions] = useState<Contribution[]>(initialContributions);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [activeTab, setActiveTab] = useState('overview');
  // Filter contributions by member - default to current user's member if logged in
  const [selectedContributionMember, setSelectedContributionMember] = useState<string>(currentMemberId || 'all');
  
  // Contribution dialog state
  const [contributionDialogOpen, setContributionDialogOpen] = useState(false);
  const [editingContribution, setEditingContribution] = useState<Contribution | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');
  const [contributionDate, setContributionDate] = useState('');
  const [contributionMember, setContributionMember] = useState('');
  const [contributionDescription, setContributionDescription] = useState('');
  
  // Expense dialog state
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('general');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expensePaidBy, setExpensePaidBy] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createClient();

  // Filter contributions based on selected member
  const filteredContributions = selectedContributionMember === 'all'
    ? contributions
    : contributions.filter(c => c.member_id === selectedContributionMember);

  // Calculate totals - use filtered contributions for personal view
  const totals = useMemo(() => {
    const totalContributions = filteredContributions.reduce((sum, c) => sum + Number(c.amount), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const balance = totalContributions - totalExpenses;
    
    // Calculate contributions by member
    const memberContributions = members.map(member => {
      const memberTotal = contributions
        .filter(c => c.member_id === member.id)
        .reduce((sum, c) => sum + Number(c.amount), 0);
      return { member, total: memberTotal };
    }).sort((a, b) => b.total - a.total);

    // Calculate expenses by category
    const categoryExpenses = EXPENSE_CATEGORIES.map(cat => {
      const catTotal = expenses
        .filter(e => e.category === cat.value)
        .reduce((sum, e) => sum + Number(e.amount), 0);
      return { category: cat.label, total: catTotal };
    }).filter(c => c.total > 0);

    return { totalContributions, totalExpenses, balance, memberContributions, categoryExpenses };
  }, [filteredContributions, expenses, members]);

  // Contribution handlers
  const resetContributionForm = () => {
    setContributionAmount('');
    setContributionDate('');
    setContributionMember('');
    setContributionDescription('');
    setEditingContribution(null);
  };

  const openEditContribution = (contribution: Contribution) => {
    setEditingContribution(contribution);
    setContributionAmount(contribution.amount.toString());
    setContributionDate(contribution.contribution_date);
    setContributionMember(contribution.member_id || '');
    setContributionDescription(contribution.description || '');
    setContributionDialogOpen(true);
  };

  const handleContributionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = {
        amount: parseFloat(contributionAmount),
        contribution_date: contributionDate,
        member_id: contributionMember || null,
        description: contributionDescription || null,
      };

      if (editingContribution) {
        const { error } = await supabase
          .from('contributions')
          .update(data)
          .eq('id', editingContribution.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('contributions')
          .insert(data);
        if (error) throw error;
      }

      resetContributionForm();
      setContributionDialogOpen(false);

      // Refetch
      const { data: newContributions } = await supabase
        .from('contributions')
        .select('*')
        .order('contribution_date', { ascending: false });
      if (newContributions) setContributions(newContributions);
    } catch (error) {
      console.error('Error saving contribution:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteContribution = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contribution?')) return;
    
    try {
      await supabase.from('contributions').delete().eq('id', id);
      setContributions(contributions.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting contribution:', error);
    }
  };

  // Expense handlers
  const resetExpenseForm = () => {
    setExpenseTitle('');
    setExpenseAmount('');
    setExpenseDate('');
    setExpenseCategory('general');
    setExpenseDescription('');
    setExpensePaidBy('');
    setEditingExpense(null);
  };

  const openEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseTitle(expense.title);
    setExpenseAmount(expense.amount.toString());
    setExpenseDate(expense.expense_date);
    setExpenseCategory(expense.category);
    setExpenseDescription(expense.description || '');
    setExpensePaidBy(expense.paid_by || '');
    setExpenseDialogOpen(true);
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = {
        title: expenseTitle,
        amount: parseFloat(expenseAmount),
        expense_date: expenseDate,
        category: expenseCategory,
        description: expenseDescription || null,
        paid_by: expensePaidBy || null,
      };

      if (editingExpense) {
        const { error } = await supabase
          .from('expenses')
          .update(data)
          .eq('id', editingExpense.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('expenses')
          .insert(data);
        if (error) throw error;
      }

      resetExpenseForm();
      setExpenseDialogOpen(false);

      // Refetch
      const { data: newExpenses } = await supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false });
      if (newExpenses) setExpenses(newExpenses);
    } catch (error) {
      console.error('Error saving expense:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    
    try {
      await supabase.from('expenses').delete().eq('id', id);
      setExpenses(expenses.filter(e => e.id !== id));
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const getMemberName = (memberId: string | null) => {
    if (!memberId) return 'Unknown';
    const member = members.find(m => m.id === memberId);
    return member?.name || 'Unknown';
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Finances</h1>
          <p className="text-muted-foreground mt-1">
            Track contributions, expenses, and savings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={contributionDialogOpen} onOpenChange={(open) => {
            setContributionDialogOpen(open);
            if (!open) resetContributionForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4" />
                Add Contribution
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] bg-white">
              <DialogHeader>
                <DialogTitle>{editingContribution ? 'Edit Contribution' : 'Add Contribution'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleContributionSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Amount (ZAR)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={contributionAmount}
                    onChange={(e) => setContributionAmount(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={contributionDate}
                    onChange={(e) => setContributionDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Contributed By</Label>
                  <Select value={contributionMember} onValueChange={setContributionMember}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select member" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={contributionDescription}
                    onChange={(e) => setContributionDescription(e.target.value)}
                    placeholder="Optional description"
                    rows={2}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : editingContribution ? 'Update Contribution' : 'Add Contribution'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={expenseDialogOpen} onOpenChange={(open) => {
            setExpenseDialogOpen(open);
            if (!open) resetExpenseForm();
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] bg-white">
              <DialogHeader>
                <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleExpenseSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={expenseTitle}
                    onChange={(e) => setExpenseTitle(e.target.value)}
                    placeholder="What was purchased?"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Amount (ZAR)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={expenseCategory} onValueChange={setExpenseCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Paid By</Label>
                  <Select value={expensePaidBy} onValueChange={setExpensePaidBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select member" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={expenseDescription}
                    onChange={(e) => setExpenseDescription(e.target.value)}
                    placeholder="Additional details"
                    rows={2}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : editingExpense ? 'Update Expense' : 'Add Expense'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card className="bg-white/70 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contributions</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totals.totalContributions)}
            </div>
            <p className="text-xs text-muted-foreground">
              {contributions.length} contribution{contributions.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totals.totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totals.balance >= 0 ? 'text-primary' : 'text-red-600'}`}>
              {formatCurrency(totals.balance)}
            </div>
            <p className="text-xs text-muted-foreground">
              Available funds
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Contributor</CardTitle>
            <PiggyBank className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">
              {totals.memberContributions[0]?.member.name || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {totals.memberContributions[0]?.total 
                ? formatCurrency(totals.memberContributions[0].total)
                : 'No contributions yet'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Contributions and Expenses */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contributions">Contributions</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Contributions by Member */}
            <Card className="bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Contributions by Member</CardTitle>
              </CardHeader>
              <CardContent>
                {totals.memberContributions.filter(mc => mc.total > 0).length > 0 ? (
                  <div className="space-y-4">
                    {totals.memberContributions
                      .filter(mc => mc.total > 0)
                      .map((mc) => (
                        <div key={mc.member.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">
                                {mc.member.name.charAt(0)}
                              </span>
                            </div>
                            <span className="font-medium">{mc.member.name}</span>
                          </div>
                          <span className="font-semibold text-green-600">
                            {formatCurrency(mc.total)}
                          </span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    No contributions recorded yet
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Expenses by Category */}
            <Card className="bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Expenses by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {totals.categoryExpenses.length > 0 ? (
                  <div className="space-y-4">
                    {totals.categoryExpenses.map((ce) => (
                      <div key={ce.category} className="flex items-center justify-between">
                        <span className="font-medium">{ce.category}</span>
                        <span className="font-semibold text-red-600">
                          {formatCurrency(ce.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    No expenses recorded yet
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contributions">
          <Card className="bg-white/70 backdrop-blur-sm">
            <CardContent className="p-0">
              {contributions.length > 0 ? (
                <div className="divide-y">
                  {contributions.map((contribution) => (
                    <div
                      key={contribution.id}
                      className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <DollarSign className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium text-green-600">
                            +{formatCurrency(Number(contribution.amount))}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {getMemberName(contribution.member_id)} • {format(parseISO(contribution.contribution_date), 'MMM d, yyyy')}
                          </div>
                          {contribution.description && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {contribution.description}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditContribution(contribution)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => handleDeleteContribution(contribution.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <PiggyBank className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No contributions yet. Add your first contribution!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card className="bg-white/70 backdrop-blur-sm">
            <CardContent className="p-0">
              {expenses.length > 0 ? (
                <div className="divide-y">
                  {expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                          <Receipt className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <div className="font-medium">{expense.title}</div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="text-red-600 font-medium">
                              -{formatCurrency(Number(expense.amount))}
                            </span>
                            <span>•</span>
                            <Badge variant="secondary" className="text-xs">
                              {expense.category}
                            </Badge>
                            <span>•</span>
                            <span>{format(parseISO(expense.expense_date), 'MMM d, yyyy')}</span>
                          </div>
                          {expense.paid_by && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Paid by {getMemberName(expense.paid_by)}
                            </div>
                          )}
                          {expense.description && (
                            <div className="text-xs text-muted-foreground">
                              {expense.description}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditExpense(expense)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => handleDeleteExpense(expense.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No expenses yet. Add your first expense!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </main>
    </div>
  );
}
