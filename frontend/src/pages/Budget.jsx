import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { FiPlus, FiDollarSign, FiEdit2, FiDownload } from 'react-icons/fi';
import { MOCK } from '../utils/constants';
import { formatCurrency } from '../utils/format';
import { useLocalStorage } from '../hooks/useLocalStorage';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import SkeletonLoader from '../components/feedback/SkeletonLoader';
import { useToast } from '../context/ToastContext';
import { createBudgetTransaction, fetchBudgetTransactions, updateBudgetTransaction } from '../api/production';
import { getApiErrorMessage } from '../api/auth';

const getBudgetBreakdown = (departments, transactions) => {
  const actualByCategory = transactions.reduce((totals, transaction) => {
    const category = transaction.category || 'Other';
    totals.set(category, (totals.get(category) || 0) + transaction.amount);
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

export default function Budget() {
  const { toast } = useToast();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ transactions: [] });
  const [plannedBudgets, setPlannedBudgets] = useLocalStorage('chuttee-budget-departments', MOCK.budgetByDept);
  const [addOpen, setAddOpen] = useState(Boolean(location.state?.openAdd));
  const [saving, setSaving] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [plannedAmount, setPlannedAmount] = useState('');
  const [actualCategory, setActualCategory] = useState(null);
  const [newExpense, setNewExpense] = useState({ description: '', category: '', amount: '', date: new Date().toISOString().slice(0, 10) });

  useEffect(() => {
    if (location.state?.openAdd) setAddOpen(true);
  }, [location.key, location.state]);

  useEffect(() => {
    let cancelled = false;
    fetchBudgetTransactions()
      .then((transactions) => {
        if (cancelled) return;
        setData({ transactions });
      })
      .catch((error) => {
        if (!cancelled) toast(getApiErrorMessage(error, 'Could not load budget transactions.'), 'error');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [toast]);

  const total = data.transactions.reduce((s, t) => s + t.amount, 0);
  const budgetBreakdown = getBudgetBreakdown(plannedBudgets, data.transactions);
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
    const exists = plannedBudgets.some((department) => department.name === editingDepartment);
    const updatedBudgets = exists
      ? plannedBudgets.map((department) => department.name === editingDepartment ? { ...department, budget: amount } : department)
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
  const openEditActual = (category) => setActualCategory(category);
  const openEditExpense = (transaction) => {
    setEditingTransaction(transaction);
    setNewExpense({
      description: transaction.description || '',
      category: transaction.category || '',
      amount: String(transaction.amount ?? ''),
      date: transaction.date || '',
    });
    setAddOpen(true);
  };
  const openAddExpense = () => {
    setEditingTransaction(null);
    setNewExpense({ description: '', category: '', amount: '', date: new Date().toISOString().slice(0, 10) });
    setAddOpen(true);
  };
  const exportExpenses = () => {
    if (!data.transactions.length) {
      toast('There are no expenses to export.', 'info');
      return;
    }
    try {
      const columns = [
        { label: 'Date', value: (transaction) => transaction.date },
        { label: 'Description', value: (transaction) => transaction.description },
        { label: 'Category', value: (transaction) => transaction.category || 'Other' },
        { label: 'Amount', value: (transaction) => transaction.amount },
      ];
      const escapeCell = (value) => {
        let text = String(value ?? '');
        if (/^[\t\r\n ]*[=+\-@]/.test(text)) text = `'${text}`;
        return `"${text.replaceAll('"', '""')}"`;
      };
      const csv = [
        columns.map(({ label }) => escapeCell(label)).join(','),
        ...data.transactions.map((transaction) => columns.map(({ value }) => escapeCell(value(transaction))).join(',')),
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
  const closeExpenseModal = () => {
    setAddOpen(false);
    setEditingTransaction(null);
  };
  const saveExpense = async (e) => {
    e.preventDefault();
    const amount = Number(newExpense.amount);
    setSaving(true);
    try {
      const transaction = editingTransaction
        ? await updateBudgetTransaction({ ...newExpense, amount, id: editingTransaction.id })
        : await createBudgetTransaction({ ...newExpense, amount });
      setData((current) => {
        const transactions = editingTransaction
          ? current.transactions.map((item) => item.id === transaction.id ? transaction : item)
          : [transaction, ...current.transactions];
        return { transactions };
      });
      setNewExpense({ description: '', category: '', amount: '', date: new Date().toISOString().slice(0, 10) });
      setEditingTransaction(null);
      setAddOpen(false);
      toast(editingTransaction ? 'Expense updated' : 'Expense added', 'success');
    } catch (error) {
      toast(getApiErrorMessage(error, 'Could not save expense.'), 'error');
    } finally {
      setSaving(false);
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
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Budget</h1>
          <p className="text-sm text-zinc-400">Total spent: <span className="font-semibold text-brand-400">{formatCurrency(total)}</span></p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" icon={FiDownload} onClick={exportExpenses} disabled={loading}>Export CSV</Button>
          <Button variant="primary" icon={FiPlus} onClick={openAddExpense}>Add Expense</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Budget by Department" subtitle="Planned vs actual" icon={FiDollarSign} />
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
                  <Bar dataKey="actual" fill="#d13f4d" radius={[4, 4, 0, 0]} name="Actual" onClick={(entry) => openEditActual(entry.payload.name)} cursor="pointer" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-zinc-500">Select a Planned bar to edit its budget, or an Actual bar to edit its expenses.</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Recent Expenses" icon={FiDollarSign} />
          <CardBody className="space-y-3">
            {data.transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between border-b border-zinc-800/60 pb-2.5 last:border-0">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-zinc-200">{tx.description}</p>
                    <p className="text-xs text-zinc-500">{tx.category} · {tx.date}</p>
                  </div>
                  <button onClick={() => openEditExpense(tx)} title={`Edit ${tx.description}`} aria-label={`Edit ${tx.description}`} className="shrink-0 rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-100">
                    <FiEdit2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <span className="ml-2 shrink-0 text-sm font-medium text-brand-400">{formatCurrency(tx.amount)}</span>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      <Modal open={addOpen} onClose={closeExpenseModal} title={editingTransaction ? 'Edit Expense' : 'Add Expense'} icon={FiDollarSign} size="sm">
        <form onSubmit={saveExpense} className="space-y-4">
          <Input label="Description" value={newExpense.description} onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })} required />
          <Input label="Department or category" value={newExpense.category} onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })} required />
          <Input label="Amount" type="number" min="0.01" step="0.01" value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} required />
          <Input label="Date" type="date" value={newExpense.date} onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })} required />
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
              className="flex w-full items-center justify-between rounded-lg border border-zinc-800 p-3 text-left hover:bg-zinc-800/70"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm text-zinc-200">{transaction.description}</span>
                <span className="text-xs text-zinc-500">{transaction.date}</span>
              </span>
              <span className="ml-3 shrink-0 text-sm font-medium text-brand-400">{formatCurrency(transaction.amount)}</span>
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