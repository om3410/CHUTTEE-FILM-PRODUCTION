import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import {
  FiPlus, FiDollarSign, FiEdit2, FiDownload, FiSearch, FiX, FiArrowRight,
  FiUsers, FiCamera, FiEdit3, FiMonitor, FiMusic, FiVideo,
  FiCheckCircle, FiHelpCircle, FiInbox, FiFileText, FiTarget,
} from 'react-icons/fi';
import { MOCK } from '../utils/constants';
import { formatCurrency, formatShortCurrency } from '../utils/format';
import { useLocalStorage } from '../hooks/useLocalStorage';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import SkeletonLoader from '../components/feedback/SkeletonLoader';
import PageHero from '../components/ui/PageHero';
import { useToast } from '../context/ToastContext';
import {
  createBudgetTransaction,
  fetchBudgetTransactions,
  updateBudgetTransaction,
  fetchAllPages,
} from '../api/production';
import { getApiErrorMessage } from '../api/auth';

/* ═══════════════════════════════════════════════════════════
   HELPERS & CONSTANTS
   ═══════════════════════════════════════════════════════════ */

const getBudgetBreakdown = (departments, transactions) => {
  const actualByCategory = transactions.reduce((totals, transaction) => {
    const category = transaction.category || 'Other';
    totals.set(category, (totals.get(category) || 0) + Number(transaction.amount || 0));
    return totals;
  }, new Map());

  const knownDepartments = new Set(departments.map((department) => department.name));
  const breakdown = departments.map((department) => ({
    ...department,
    actual: actualByCategory.get(department.name) || 0,
  }));

  actualByCategory.forEach((actual, name) => {
    if (!knownDepartments.has(name)) breakdown.push({ name, budget: 0, actual });
  });

  return breakdown;
};

const normalizeTransaction = (raw) => ({
  id: raw.id,
  description: raw.description ?? raw.name ?? 'Untitled',
  category: raw.category ?? 'Other',
  amount: Number(raw.amount ?? 0),
  date: raw.date ?? raw.created_at?.slice(0, 10) ?? '',
  project: raw.project ?? '',
  transaction_type: raw.transaction_type ?? 'expense',
  payment_status: raw.payment_status ?? 'pending',
  notes: raw.notes ?? '',
});

const serializeTransaction = (ui) => ({
  project: ui.project || null,
  transaction_type: ui.transaction_type || 'expense',
  category: ui.category || 'Other',
  description: ui.description,
  amount: Number(ui.amount),
  date: ui.date,
  payment_status: ui.payment_status || 'pending',
  notes: ui.notes || '',
});

const CATEGORY_ROUTES = [
  { number: '01', icon: FiUsers,   eyebrow: 'Above the Line',  title: 'Cast & Talent',        description: 'Lead actors, supporting cast, cameo fees and residual payments.',           dept: 'Cast' },
  { number: '02', icon: FiCamera,  eyebrow: 'Below the Line',  title: 'Crew & Technicians',   description: 'Directors, DOPs, editors, sound engineers, gaffers and production staff.',   dept: 'Crew' },
  { number: '03', icon: FiMonitor, eyebrow: 'On Location',     title: 'Locations & Sets',     description: 'Location fees, permits, set construction, transport and on-site catering.',   dept: 'Locations' },
  { number: '04', icon: FiVideo,   eyebrow: 'Equipment',       title: 'Gear & Vehicles',      description: 'Camera bodies, lenses, lighting, sound gear, generators and transport.',      dept: 'Equipment' },
  { number: '05', icon: FiEdit3,   eyebrow: 'Post-Production', title: 'Edit, Colour & Sound', description: 'Editorial, colour grading, sound design, mixing, VFX and animation.',         dept: 'Post' },
  { number: '06', icon: FiMusic,   eyebrow: 'Creative',        title: 'Music & Licensing',    description: 'Score, playback, licensing, ADR and final audio mastering.',                  dept: 'Music' },
];

const POPULAR_DEPARTMENTS = ['Cast', 'Crew', 'Locations', 'Equipment', 'Post', 'Music', 'Other'];

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */

export default function Budget() {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ transactions: [] });
  const [projects, setProjects] = useState([]);
  const [plannedBudgets, setPlannedBudgets] = useLocalStorage('chuttee-budget-departments', MOCK.budgetByDept);

  // Modals state
  const [addOpen, setAddOpen] = useState(Boolean(location.state?.openAdd));
  const [saving, setSaving] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [plannedAmount, setPlannedAmount] = useState('');
  const [actualCategory, setActualCategory] = useState(null);

  // Form state
  const [newExpense, setNewExpense] = useState({
    description: '',
    category: POPULAR_DEPARTMENTS[0],
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    project: '',
    transaction_type: 'expense',
    payment_status: 'pending',
    notes: '',
  });

  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  useEffect(() => {
    if (location.state?.openAdd) setAddOpen(true);
  }, [location.key, location.state]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchBudgetTransactions(),
      fetchAllPages('/production/projects/').catch(() => []),
    ])
      .then(([transactions, fetchedProjects]) => {
        if (cancelled) return;
        setData({ transactions: (transactions || []).map(normalizeTransaction) });
        setProjects(Array.isArray(fetchedProjects) ? fetchedProjects : (fetchedProjects?.results || []));
      })
      .catch((error) => {
        if (!cancelled) toast(getApiErrorMessage(error, 'Could not load budget data.'), 'error');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [toast]);

  /* ─────────── Derived Data ─────────── */
  const totalSpent = data.transactions.reduce((s, t) => s + Number(t.amount || 0), 0);
  const totalPlanned = plannedBudgets.reduce((s, d) => s + Number(d.budget || 0), 0);
  const remaining = Math.max(totalPlanned - totalSpent, 0);
  const pct = totalPlanned > 0 ? Math.round((totalSpent / totalPlanned) * 100) : 0;
  const budgetBreakdown = getBudgetBreakdown(plannedBudgets, data.transactions);

  const filteredTransactions = data.transactions.filter((t) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || [t.description, t.category].some((v) => String(v ?? '').toLowerCase().includes(q));
    const matchesDept = !departmentFilter || t.category === departmentFilter;
    return matchesSearch && matchesDept;
  });

  const hasActiveFilters = Boolean(search || departmentFilter);
  const clearFilters = () => { setSearch(''); setDepartmentFilter(''); };
  const scrollToTable = () => setTimeout(() => document.getElementById('budget-table')?.scrollIntoView({ behavior: 'smooth' }), 100);

  /* ─────────── Actions ─────────── */
  const openAddExpense = () => {
    setEditingTransaction(null);
    setNewExpense({
      description: '', category: POPULAR_DEPARTMENTS[0], amount: '',
      date: new Date().toISOString().slice(0, 10),
      project: projects[0]?.id ?? '',
      transaction_type: 'expense', payment_status: 'pending', notes: '',
    });
    setAddOpen(true);
  };

  const openEditExpense = (transaction) => {
    setEditingTransaction(transaction);
    setNewExpense({
      description: transaction.description || '',
      category: transaction.category || POPULAR_DEPARTMENTS[0],
      amount: String(transaction.amount ?? ''),
      date: transaction.date || new Date().toISOString().slice(0, 10),
      project: transaction.project || '',
      transaction_type: transaction.transaction_type || 'expense',
      payment_status: transaction.payment_status || 'pending',
      notes: transaction.notes || '',
    });
    setAddOpen(true);
  };

  const closeExpenseModal = () => {
    setAddOpen(false);
    setEditingTransaction(null);
  };

  const saveExpense = async (e) => {
    e.preventDefault();
    const amount = Number(newExpense.amount);
    setSaving(true);
    try {
      const payload = serializeTransaction(newExpense);
      const transaction = editingTransaction
        ? await updateBudgetTransaction({ ...payload, id: editingTransaction.id })
        : await createBudgetTransaction(payload);

      setData((current) => {
        const transactions = editingTransaction
          ? current.transactions.map((item) => item.id === transaction.id ? normalizeTransaction(transaction) : item)
          : [normalizeTransaction(transaction), ...current.transactions];
        return { ...current, transactions };
      });
      closeExpenseModal();
      toast(editingTransaction ? 'Expense updated' : 'Expense added', 'success');
    } catch (error) {
      toast(getApiErrorMessage(error, 'Could not save expense. Check console for details.'), 'error');
      // Log the exact backend error so you can fix any remaining field mismatches
      console.error('BudgetTransaction POST/PUT failed:', {
        payload: serializeTransaction(newExpense),
        response: error.response?.data,
      });
    } finally {
      setSaving(false);
    }
  };

  /* ─────────── Planned budget edit ─────────── */
  const openEditDepartment = (department) => {
    setEditingDepartment(department.name);
    setPlannedAmount(String(department.budget ?? 0));
  };
  const closeDepartmentModal = () => setEditingDepartment(null);

  const saveDepartmentBudget = (e) => {
    e.preventDefault();
    const amount = Number(plannedAmount);
    if (!Number.isFinite(amount) || amount < 0) {
      toast('Enter a valid planned budget.', 'error');
      return;
    }
    const exists = plannedBudgets.some((d) => d.name === editingDepartment);
    const updatedBudgets = exists
      ? plannedBudgets.map((d) => d.name === editingDepartment ? { ...d, budget: amount } : d)
      : [...plannedBudgets, { name: editingDepartment, budget: amount, actual: 0 }];
    try {
      localStorage.setItem('chuttee-budget-departments', JSON.stringify(updatedBudgets));
    } catch {
      toast('Could not save the planned budget in this browser.', 'error');
      return;
    }
    setPlannedBudgets(updatedBudgets);
    closeDepartmentModal();
    toast('Planned budget updated', 'success');
  };

  /* ─────────── Export ─────────── */
  const exportExpenses = () => {
    if (!data.transactions.length) { toast('There are no expenses to export.', 'info'); return; }
    try {
      const columns = [
        { label: 'Date', value: (t) => t.date },
        { label: 'Description', value: (t) => t.description },
        { label: 'Category', value: (t) => t.category || 'Other' },
        { label: 'Amount', value: (t) => t.amount },
      ];
      const escapeCell = (value) => {
        let text = String(value ?? '');
        if (/^[\t\r\n ]*[=+\-@]/.test(text)) text = `'${text}`;
        return `"${text.replaceAll('"', '""')}"`;
      };
      const csv = [
        columns.map(({ label }) => escapeCell(label)).join(','),
        ...data.transactions.map((t) => columns.map(({ value }) => escapeCell(value(t))).join(',')),
      ].join('\r\n');
      const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `chuttee-expenses-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast('Expenses exported to CSV', 'success');
    } catch (error) {
      toast(getApiErrorMessage(error, 'Could not export expenses.'), 'error');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonLoader variant="title" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonLoader key={i} variant="card" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-16 animate-fade-in">

      {/* HERO */}
      <PageHero
        image="/images/hero/hero-bg.jpg"
        eyebrow="The Money, the Ledger and the Story Behind Every Rupee"
        title="Every Rupee, Accounted For."
        subtitle="Every Cost, Under Control."
        lead="Track planned versus actual spend across every department. Log expenses with receipts. Monitor payments, approvals and forecasts. Generate GST-ready invoices. See exactly where your production stands — financially, at every step of the journey."
        slogan="Every rupee has a reason. Every expense tells a story. The right budget, the right tracking and the right oversight can turn a production into something that respects both the craft and the capital."
      />

      {/* QUICK SEARCH STRIP */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Find the Expense</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">
            Start with the Cost You Need to See.
          </h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            Search by description or category. Filter to find the exact rupee that matters.
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block lg:col-span-2">
            <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-zinc-500">Search</span>
            <div className="relative">
              <FiSearch className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Description or category…" className="input pl-10" />
            </div>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-zinc-500">Department</span>
            <select value={departmentFilter} onChange={(e) => { setDepartmentFilter(e.target.value); scrollToTable(); }} className="input">
              <option value="">All Departments</option>
              {POPULAR_DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="primary" size="sm" icon={FiPlus} onClick={openAddExpense}>Log Expense</Button>
          <Button variant="outline" size="sm" icon={FiDownload} onClick={exportExpenses} disabled={!data.transactions.length}>Export CSV</Button>
          {hasActiveFilters && (
            <>
              <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1 rounded-premium border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-gold-500/40 hover:text-gold-400">
                <FiX className="h-3 w-3" /> Clear filters
              </button>
              <span className="text-xs text-zinc-500">Showing {filteredTransactions.length} of {data.transactions.length} expenses</span>
            </>
          )}
        </div>
      </section>

      {/* STATS */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatNumber value={formatShortCurrency(totalSpent)} label="Total Spent" note="Across all departments" icon={FiDollarSign} />
        <StatNumber value={formatShortCurrency(totalPlanned)} label="Planned Budget" note="Total allocated" icon={FiTarget} />
        <StatNumber value={formatShortCurrency(remaining)} label="Remaining" note={`${100 - pct}% of planned budget`} icon={FiCheckCircle} />
        <StatNumber value={data.transactions.length} label="Transactions" note="Recorded expenses" icon={FiFileText} />
      </section>

      <Quote>"A budget is not a limit. It is a map of what the story can afford to become."</Quote>

      {/* SIX CATEGORY ROUTES */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Where CHUTTEE Can Help You</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">What Are You Spending On?</h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            Every rupee belongs to a department. Choose the one you need to see, and CHUTTEE surfaces the numbers.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORY_ROUTES.map((route) => {
            const dataForDept = budgetBreakdown.find((b) => b.name === route.dept) || { actual: 0 };
            return (
              <RouteCard
                key={route.number}
                number={route.number}
                icon={route.icon}
                eyebrow={route.eyebrow}
                title={route.title}
                description={route.description}
                count={formatShortCurrency(dataForDept.actual)}
                isActive={departmentFilter === route.dept}
                action={departmentFilter === route.dept ? 'Clear filter' : 'View expenses →'}
                onAction={() => {
                  if (departmentFilter === route.dept) setDepartmentFilter('');
                  else { setDepartmentFilter(route.dept); scrollToTable(); }
                }}
              />
            );
          })}
        </div>
      </section>

      <Quote>"An overrun is rarely a single mistake. It is a dozen small decisions made without the numbers in front of you."</Quote>

      {/* DEPT CHIPS */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Explore by Department</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">Search the Way Producers Actually Think.</h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            Every expense belongs to a department. One click shows everything that department has cost you.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {POPULAR_DEPARTMENTS.map((dept) => {
            const deptData = budgetBreakdown.find((b) => b.name === dept) || { actual: 0 };
            return (
              <DepartmentChip
                key={dept}
                label={dept}
                sub={formatShortCurrency(deptData.actual)}
                isActive={departmentFilter === dept}
                onClick={() => {
                  if (departmentFilter === dept) setDepartmentFilter('');
                  else { setDepartmentFilter(dept); scrollToTable(); }
                }}
              />
            );
          })}
        </div>
      </section>

      {/* SPLIT JOURNEYS */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Built for Both Sides of the Money</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">
            A Producer Wants Control. An Accountant Wants Clarity.
          </h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            CHUTTEE supports both journeys — one for the person making the spend, one for the person tracking it.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <JourneyCard
            title="For Producers & Line Producers"
            steps={['Plan', 'Approve', 'Spend', 'Track', 'Reconcile', 'Report']}
            description="Set the budget. Approve large expenses. Log real-time spend. Track against plan. Reconcile at wrap. Report to stakeholders."
            onStepClick={(step) => {
              if (step === 'Plan' || step === 'Approve') scrollToTable();
              if (step === 'Spend' || step === 'Track') openAddExpense();
              if (step === 'Reconcile' || step === 'Report') navigate('/billing');
            }}
          />
          <JourneyCard
            title="For Accountants & Finance"
            steps={['Receive', 'Verify', 'File', 'GST', 'Bill', 'Close']}
            description="Receive expense requests. Verify receipts and GST. File department-wise. Generate compliant invoices. Close the production books."
            onStepClick={(step) => {
              if (step === 'Receive' || step === 'Verify') scrollToTable();
              if (['File', 'GST', 'Bill', 'Close'].includes(step)) navigate('/billing');
            }}
          />
        </div>
      </section>

      <Quote>"The films that endure are rarely the ones with the biggest budgets. They are the ones where every rupee was spent on purpose."</Quote>

      {/* CHARTS */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Money & Metrics</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">See Where the Money Goes.</h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            Planned versus actual spend across every department. Click any bar to edit the planned budget or view its expenses.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader title="Budget by Department" subtitle="Planned vs actual (click to edit)" icon={FiDollarSign} />
            <CardBody>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={budgetBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#71717a', fontSize: 11 }} tickFormatter={(v) => `${v / 1000}k`} />
                    <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 12 }} formatter={(v) => formatCurrency(v)} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="budget" fill="#3f3f46" radius={[4, 4, 0, 0]} name="Planned" onClick={(entry) => openEditDepartment(entry.payload)} cursor="pointer" />
                    <Bar dataKey="actual" fill="#d4af37" radius={[4, 4, 0, 0]} name="Actual" onClick={(entry) => setActualCategory(entry.payload.name)} cursor="pointer" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 text-center text-xs text-zinc-500">Select a Planned bar to edit its budget, or an Actual bar to edit its expenses.</p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Recent Expenses" icon={FiDollarSign} />
            <CardBody className="space-y-3">
              {data.transactions.length === 0 ? (
                <p className="py-4 text-center text-sm text-zinc-500">No expenses logged yet.</p>
              ) : (
                data.transactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between border-b border-zinc-800/60 pb-2.5 last:border-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm text-zinc-200">{tx.description}</p>
                        <p className="text-xs text-zinc-500">{tx.category} · {tx.date}</p>
                      </div>
                      <button onClick={() => openEditExpense(tx)} title={`Edit ${tx.description}`} aria-label={`Edit ${tx.description}`} className="shrink-0 rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-gold-400">
                        <FiEdit2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className="ml-2 shrink-0 text-sm font-serif font-bold text-gold-gradient">{formatCurrency(tx.amount)}</span>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </div>
      </section>

      <Quote>"Every invoice is a promise. Every payment is the moment the promise is kept."</Quote>

      {/* MAIN TABLE */}
      <section id="budget-table" className="scroll-mt-24">
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">The Ledger</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">Every Expense, in One Place.</h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            {filteredTransactions.length} of {data.transactions.length} expenses shown
            {departmentFilter && ` — ${departmentFilter}`}.
          </p>
        </div>

        <div className="mt-8">
          {filteredTransactions.length === 0 ? (
            <div className="premium-card p-8 text-center">
              <p className="text-sm text-zinc-500">No expenses found. Try adjusting your filters or log a new expense.</p>
            </div>
          ) : (
            <div className="premium-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-zinc-800 text-left text-zinc-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Description</th>
                    <th className="px-5 py-3 font-medium">Category</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium">Amount</th>
                    <th className="px-5 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((e) => (
                    <tr key={e.id} className="border-b border-zinc-800 last:border-0">
                      <td className="px-5 py-4">
                        <p className="font-medium text-zinc-100">{e.description}</p>
                      </td>
                      <td className="px-5 py-4">
                        <button type="button" onClick={() => { setDepartmentFilter(e.category); scrollToTable(); }} className="text-xs text-gold-400 transition-colors hover:text-gold-300">
                          {e.category || 'Other'}
                        </button>
                      </td>
                      <td className="px-5 py-4 text-xs text-zinc-500">{e.date}</td>
                      <td className="px-5 py-4 font-serif font-bold text-gold-gradient">{formatCurrency(e.amount)}</td>
                      <td className="px-5 py-4 text-right">
                        <button type="button" onClick={() => openEditExpense(e)} className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-gold-400">
                          <FiEdit2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <Quote>"You do not run out of money on the last day. You run out of money on the day you stopped paying attention."</Quote>

      {/* QUICK ACTIONS */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Ready to Balance the Books?</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">Start with the Number You Need Most.</h2>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickAction icon={FiPlus} title="Log Expense" description="Record a new cost against a department budget." onAction={openAddExpense} />
          <QuickAction icon={FiFileText} title="Generate Invoice" description="Create a branded, GST-ready invoice for a client." onAction={() => navigate('/billing')} />
          <QuickAction icon={FiDownload} title="Export Report" description="Download a CSV of the full ledger." onAction={exportExpenses} />
        </div>
      </section>

      {/* CONTACT STRIP */}
      <section className="premium-card relative overflow-hidden p-8 sm:p-10">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Contact CHUTTEE</p>
            <h3 className="mt-3 font-serif text-2xl font-bold text-zinc-100">Facing a Budget Crunch? Tell Us What You Need.</h3>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Email</p>
            <a href="mailto:finance@chuttee.in" className="mt-2 block text-sm text-zinc-300 transition-colors hover:text-gold-400">finance@chuttee.in</a>
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-zinc-500">Phone</p>
            <a href="tel:+919876543210" className="mt-2 block text-sm text-zinc-300 transition-colors hover:text-gold-400">+91 98765 43210</a>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Need help?</p>
            <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
              Reach out to our finance desk for budget reviews and cost optimisation.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="primary" size="sm" icon={FiHelpCircle} onClick={() => navigate('/help')}>Talk to us</Button>
              <Button variant="outline" size="sm" icon={FiInbox} onClick={() => navigate('/inbox')}>Open Inbox</Button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ MODALS ═══════════ */}

      <Modal open={addOpen} onClose={closeExpenseModal} title={editingTransaction ? 'Edit Expense' : 'Add Expense'} icon={FiDollarSign} size="sm">
        <form onSubmit={saveExpense} className="space-y-4">
          {projects.length > 0 && (
            <label className="block space-y-1.5 text-xs font-medium text-zinc-400">
              <span>Project</span>
              <select value={newExpense.project} onChange={(e) => setNewExpense({ ...newExpense, project: e.target.value })} className="input" required>
                <option value="">Select project…</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.title || p.name}</option>)}
              </select>
            </label>
          )}
          <Input label="Description" value={newExpense.description} onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })} required />
          <label className="block space-y-1.5 text-xs font-medium text-zinc-400">
            <span>Department or category</span>
            <select value={newExpense.category} onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })} className="input" required>
              {POPULAR_DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
          <Input label="Amount" type="number" min="0.01" step="0.01" value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} required />
          <Input label="Date" type="date" value={newExpense.date} onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })} required />
          <label className="block space-y-1.5 text-xs font-medium text-zinc-400">
            <span>Status</span>
            <select value={newExpense.payment_status} onChange={(e) => setNewExpense({ ...newExpense, payment_status: e.target.value })} className="input" required>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </label>
          <Input label="Notes (optional)" value={newExpense.notes} onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })} placeholder="Vendor, invoice #, etc." />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={closeExpenseModal}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving…' : editingTransaction ? 'Save changes' : 'Add Expense'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(editingDepartment)} onClose={closeDepartmentModal} title={`Edit Planned Budget${editingDepartment ? ` — ${editingDepartment}` : ''}`} icon={FiDollarSign} size="sm">
        <form onSubmit={saveDepartmentBudget} className="space-y-4">
          <Input label="Planned amount" type="number" min="0" step="0.01" value={plannedAmount} onChange={(e) => setPlannedAmount(e.target.value)} required />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={closeDepartmentModal}>Cancel</Button>
            <Button type="submit" variant="primary">Save budget</Button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(actualCategory)} onClose={() => setActualCategory(null)} title={`Edit Actual Expenses${actualCategory ? ` — ${actualCategory}` : ''}`} icon={FiDollarSign} size="sm">
        <div className="space-y-2">
          {data.transactions.filter((transaction) => (transaction.category || 'Other') === actualCategory).map((transaction) => (
            <button
              key={transaction.id}
              type="button"
              onClick={() => {
                setActualCategory(null);
                openEditExpense(transaction);
              }}
              className="flex w-full items-center justify-between rounded-lg border border-zinc-800 p-3 text-left hover:bg-zinc-800/70 transition-colors"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm text-zinc-200">{transaction.description}</span>
                <span className="text-xs text-zinc-500">{transaction.date}</span>
              </span>
              <span className="ml-3 shrink-0 text-sm font-serif font-bold text-gold-400">{formatCurrency(transaction.amount)}</span>
            </button>
          ))}
          {!data.transactions.some((transaction) => (transaction.category || 'Other') === actualCategory) && (
            <p className="py-4 text-center text-sm text-zinc-500">No expenses are recorded for this category.</p>
          )}
        </div>
      </Modal>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   HELPER COMPONENTS
   ═══════════════════════════════════════════════════════════ */

function StatNumber({ value, label, note, icon: Icon }) {
  return (
    <div className="premium-card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-serif text-3xl font-bold text-gold-gradient">{value}</p>
          <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-zinc-300">{label}</p>
          <p className="mt-1 text-xs text-zinc-500">{note}</p>
        </div>
        {Icon && (
          <div className="grid h-10 w-10 place-items-center rounded-premium bg-gold-500/10 text-gold-400">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );
}

function Quote({ children }) {
  return (
    <section className="premium-card relative overflow-hidden p-8 sm:p-12">
      <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-gold-500/10 blur-3xl" />
      <p className="relative max-w-4xl font-serif italic text-lg sm:text-xl leading-relaxed text-gold-300">{children}</p>
      <div className="relative mt-6 h-[2px] w-20 bg-gradient-to-r from-gold-400 to-transparent" />
    </section>
  );
}

function RouteCard({ number, icon: Icon, eyebrow, title, description, action, onAction, count, isActive }) {
  return (
    <div className={`premium-card group flex flex-col p-6 transition-all ${isActive ? 'border-gold-500/50 shadow-gold' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-premium bg-gold-500/10 text-gold-400">
            <Icon className="h-4 w-4" />
          </span>
          <p className="text-[10px] uppercase tracking-[0.25em] text-gold-400">{number} · {eyebrow}</p>
        </div>
        {count !== undefined && (
          <span className="rounded-full border border-zinc-800 bg-zinc-900/60 px-2.5 py-0.5 text-[10px] font-medium text-zinc-400">{count}</span>
        )}
      </div>
      <h3 className="mt-4 font-serif text-xl font-bold text-zinc-100">{title}</h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-zinc-400">{description}</p>
      <button type="button" onClick={onAction} className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-gold-400 transition-transform group-hover:translate-x-1">
        {action}
      </button>
    </div>
  );
}

function DepartmentChip({ label, sub, isActive, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className={`premium-card group flex items-center justify-between gap-3 p-4 text-left transition-all ${isActive ? 'border-gold-500/50 shadow-gold' : 'hover:border-gold-500/40'}`}>
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold-500/10 text-gold-400">
          <FiDollarSign className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-serif text-base font-semibold text-zinc-100">{label}</p>
          <p className="mt-0.5 text-xs text-zinc-500">{sub}</p>
        </div>
      </div>
    </button>
  );
}

function JourneyCard({ title, steps, description, onStepClick }) {
  return (
    <div className="premium-card p-6">
      <p className="text-[10px] uppercase tracking-[0.25em] text-gold-400">Journey</p>
      <h3 className="mt-3 font-serif text-xl font-bold text-zinc-100">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">{description}</p>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {steps.map((step, i) => (
          <span key={step} className="flex items-center gap-2">
            <button type="button" onClick={() => onStepClick?.(step)}
              className="rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-[11px] font-medium text-zinc-300 transition-all hover:border-gold-500/40 hover:text-gold-400">
              {step}
            </button>
            {i < steps.length - 1 && <FiArrowRight className="h-3 w-3 text-gold-400/60" />}
          </span>
        ))}
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, title, description, onAction }) {
  return (
    <button type="button" onClick={onAction}
      className="group flex flex-col items-start gap-3 rounded-premium border border-zinc-800 bg-zinc-900/40 p-5 text-left transition-all hover:border-gold-500/40 hover:bg-zinc-900/60">
      <span className="grid h-11 w-11 place-items-center rounded-premium bg-gold-500/10 text-gold-400 transition-transform group-hover:scale-110">
        <Icon className="h-5 w-5" />
      </span>
      <span className="font-serif text-lg font-semibold text-zinc-100">{title}</span>
      <span className="text-sm text-zinc-500">{description}</span>
      <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-gold-400 transition-transform group-hover:translate-x-1">
        Continue <FiArrowRight className="h-3 w-3" />
      </span>
    </button>
  );
}