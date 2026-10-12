import { useEffect, useMemo, useState } from 'react';
import { FiCreditCard, FiDownload, FiCheck, FiPlus, FiFileText, FiTrash2 } from 'react-icons/fi';
import { MOCK } from '../utils/constants';
import { formatCurrency, formatDate } from '../utils/format';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import SkeletonLoader from '../components/feedback/SkeletonLoader';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 8000,
    tagline: 'For solo creators',
    features: ['3 active projects', '2 team seats', 'Standard support'],
  },
  {
    id: 'studio',
    name: 'Studio',
    price: 24000,
    tagline: 'For growing production teams',
    features: ['Unlimited projects', '25 team seats', 'Priority support'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 60000,
    tagline: 'For large studios',
    features: ['Unlimited everything', 'Unlimited seats', 'Dedicated manager', 'Custom integrations'],
  },
];

const BILL_DEPARTMENTS = [
  'Cast',
  'Crew',
  'Direction',
  'Camera',
  'Sound',
  'Art',
  'Costume',
  'Makeup',
  'Editing',
  'VFX',
  'Production',
  'Other',
];

const BILL_MEMBERS = [
  { id: 'm1', name: 'Trupti Deore',  department: 'Cast',   role: 'Actor' },
  { id: 'm2', name: 'Rohan Joshi',   department: 'Cast',   role: 'Actor' },
  { id: 'm3', name: 'Neha Gupta',    department: 'Cast',   role: 'Actor' },
  { id: 'm4', name: 'Vikram Desai',  department: 'Cast',   role: 'Actor' },
  { id: 'm5', name: 'Meera Iyer',    department: 'Cast',   role: 'Actor' },
  { id: 'm6', name: 'Kiran Patil',   department: 'Cast',   role: 'Actor' },
  { id: 'm7', name: 'Sneha Reddy',   department: 'Cast',   role: 'Actor' },
  { id: 'm8', name: 'Arun Kulkarni', department: 'Camera', role: 'Cinematographer' },
  { id: 'm9', name: 'Priya Nair',    department: 'Sound',  role: 'Sound Engineer' },
  { id: 'm10', name: 'Rahul Mehta',  department: 'Crew',   role: 'Gaffer' },
];

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));

const escapeCsv = (value) => {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const downloadCsv = (filename, rows) => {
  const csv = rows.map((r) => r.map(escapeCsv).join(',')).join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
};

const today = () => new Date().toISOString().slice(0, 10);

export default function Billing() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(PLANS[1]);
  const [changePlanOpen, setChangePlanOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(PLANS[1].id);
  const [savingPlan, setSavingPlan] = useState(false);

  const [billOpen, setBillOpen] = useState(false);
  const [savingBill, setSavingBill] = useState(false);
  const [billForm, setBillForm] = useState({
    department: BILL_DEPARTMENTS[0],
    memberId: '',
    description: '',
    amount: '',
    date: today(),
    status: 'Paid',
  });

  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    setTimeout(() => { setInvoices(MOCK.billing); setLoading(false); }, 250);
  }, []);

  const departmentMembers = useMemo(
    () => BILL_MEMBERS.filter((m) => m.department === billForm.department),
    [billForm.department]
  );

  const openChangePlan = () => {
    setSelectedPlanId(currentPlan.id);
    setChangePlanOpen(true);
  };

  const applyPlanChange = async () => {
    const next = PLANS.find((p) => p.id === selectedPlanId);
    if (!next) return;
    if (next.id === currentPlan.id) {
      setChangePlanOpen(false);
      return;
    }
    setSavingPlan(true);
    try {
      setCurrentPlan(next);
      setChangePlanOpen(false);
      toast(`Switched to ${next.name} plan`, 'success');
    } catch (error) {
      toast('Could not change plan', 'error');
    } finally {
      setSavingPlan(false);
    }
  };

  const openCreateBill = () => {
    setBillForm({
      department: BILL_DEPARTMENTS[0],
      memberId: '',
      description: '',
      amount: '',
      date: today(),
      status: 'Paid',
    });
    setBillOpen(true);
  };

  const submitBill = async (e) => {
    e.preventDefault();
    const member = BILL_MEMBERS.find((m) => m.id === billForm.memberId);
    if (!member) {
      toast('Select a member to bill', 'error');
      return;
    }
    setSavingBill(true);
    try {
      const invoice = {
        id: `b${Date.now()}`,
        date: billForm.date,
        plan: `${member.name} — ${member.role}`,
        memberName: member.name,
        department: member.department,
        description: billForm.description || `${member.role} services`,
        amount: Number(billForm.amount) || 0,
        status: billForm.status,
      };
      setInvoices((list) => [invoice, ...list]);
      setBillOpen(false);
      toast(`Bill created for ${member.name}`, 'success');
    } catch (error) {
      toast('Could not create bill', 'error');
    } finally {
      setSavingBill(false);
    }
  };

  const deleteInvoice = (id) => {
    setInvoices((list) => list.filter((inv) => inv.id !== id));
    setConfirmDelete(null);
    toast('Invoice deleted', 'success');
  };

  const exportCsv = () => {
    if (!invoices.length) {
      toast('No invoices to export', 'info');
      return;
    }
    const header = ['Invoice ID', 'Date', 'Member', 'Department', 'Description', 'Amount', 'Status'];
    const rows = invoices.map((inv) => [
      inv.id,
      inv.date,
      inv.memberName || inv.plan,
      inv.department || '',
      inv.description || inv.plan,
      inv.amount,
      inv.status,
    ]);
    const filename = `billing-history-${today()}.csv`;
    downloadCsv(filename, [header, ...rows]);
    toast(`Exported ${invoices.length} invoices`, 'success');
  };

  const printInvoice = (invoice) => {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      toast('Allow pop-ups to print or save this invoice as a PDF.', 'error');
      return;
    }

    const invoiceNumber = `INV-${String(invoice.id).toUpperCase()}`;
    const customerName = invoice.memberName || user?.name || [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Account holder';
    printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(invoiceNumber)}</title>
    <style>
      @page { size: A4; margin: 18mm; }
      * { box-sizing: border-box; }
      body { margin: 0; color: #18181b; font-family: Arial, sans-serif; font-size: 14px; }
      .invoice { max-width: 760px; margin: 0 auto; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 28px; border-bottom: 2px solid #18181b; }
      .brand { font-size: 20px; font-weight: 700; }
      .label { margin-top: 6px; color: #71717a; font-size: 12px; }
      .title { margin: 0; font-size: 28px; letter-spacing: 2px; }
      .details { display: flex; justify-content: space-between; gap: 32px; margin: 32px 0; }
      .section-label { margin-bottom: 8px; color: #71717a; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
      .detail { margin: 5px 0; }
      .meta { text-align: right; }
      table { width: 100%; border-collapse: collapse; }
      th { padding: 12px 10px; background: #f4f4f5; color: #52525b; font-size: 11px; text-align: left; text-transform: uppercase; }
      td { padding: 16px 10px; border-bottom: 1px solid #e4e4e7; }
      .amount { text-align: right; white-space: nowrap; }
      .total { display: flex; justify-content: flex-end; gap: 40px; margin-top: 20px; font-size: 18px; font-weight: 700; }
      .status { display: inline-block; margin-top: 28px; padding: 7px 12px; border: 1px solid #a1a1aa; border-radius: 20px; font-size: 12px; }
      .footer { margin-top: 64px; padding-top: 16px; border-top: 1px solid #e4e4e7; color: #71717a; font-size: 11px; }
      @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
    </style>
  </head>
  <body>
    <main class="invoice">
      <header class="header">
        <div>
          <div class="brand">CHUTTEE Film Production</div>
          <div class="label">Production management</div>
        </div>
        <div class="meta">
          <h1 class="title">INVOICE</h1>
          <div class="label">${escapeHtml(invoiceNumber)}</div>
        </div>
      </header>
      <section class="details">
        <div>
          <div class="section-label">Billed to</div>
          <p class="detail">${escapeHtml(customerName)}</p>
          <p class="detail">${escapeHtml(invoice.department || '')}</p>
        </div>
        <div class="meta">
          <div class="section-label">Invoice date</div>
          <p class="detail">${escapeHtml(formatDate(invoice.date))}</p>
          <div class="section-label">Status</div>
          <p class="detail">${escapeHtml(invoice.status)}</p>
        </div>
      </section>
      <table>
        <thead>
          <tr><th>Description</th><th>Billing period</th><th class="amount">Amount</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>${escapeHtml(invoice.description || invoice.plan)}</td>
            <td>${escapeHtml(formatDate(invoice.date, { month: 'long', year: 'numeric' }))}</td>
            <td class="amount">${escapeHtml(formatCurrency(invoice.amount))}</td>
          </tr>
        </tbody>
      </table>
      <div class="total"><span>Total</span><span>${escapeHtml(formatCurrency(invoice.amount))}</span></div>
      <div class="status">Payment status: ${escapeHtml(invoice.status)}</div>
      <footer class="footer">Thank you for choosing CHUTTEE Film Production.</footer>
    </main>
  </body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.onafterprint = () => printWindow.close();
    setTimeout(() => {
      if (!printWindow.closed) printWindow.print();
    }, 250);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-brand-500/15 p-3"><FiCreditCard className="h-6 w-6 text-brand-400" /></div>
          <div>
            <h1 className="text-2xl font-bold">Billing</h1>
            <p className="text-sm text-zinc-400">Manage your subscription and invoices.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" icon={FiDownload} onClick={exportCsv}>Download CSV</Button>
          <Button variant="primary" icon={FiPlus} onClick={openCreateBill}>Create Bill</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-500">Current Plan</p>
              <h2 className="mt-1 text-2xl font-bold text-brand-400">{currentPlan.name}</h2>
              <p className="mt-1 text-sm text-zinc-400">{currentPlan.tagline}</p>
            </div>
            <Button variant="outline" onClick={openChangePlan}>Change Plan</Button>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {currentPlan.features.map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-zinc-300"><FiCheck className="h-4 w-4 text-emerald-400" /> {f}</div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-zinc-800 p-3 text-brand-400"><FiCreditCard className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-zinc-500">Next invoice</p>
              <p className="text-lg font-semibold">{formatCurrency(currentPlan.price)}</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-zinc-500">Renews on 1 Oct 2026</p>
        </Card>
      </div>

      <Card>
        <CardHeader title="Invoice history" icon={FiFileText} />
        <CardBody className="p-0">
          {loading ? (
            <div className="p-5"><SkeletonLoader variant="card" /></div>
          ) : invoices.length === 0 ? (
            <div className="p-6 text-center text-sm text-zinc-500">No invoices yet. Create one to get started.</div>
          ) : (
            <Table
              columns={[
                { key: 'date', label: 'Date', render: (r) => formatDate(r.date) },
                { key: 'member', label: 'Member', render: (r) => r.memberName || r.plan },
                { key: 'department', label: 'Department', render: (r) => r.department || '—' },
                { key: 'amount', label: 'Amount', render: (r) => formatCurrency(r.amount) },
                { key: 'status', label: 'Status', render: (r) => <Badge variant={r.status === 'Paid' ? 'success' : 'default'}>{r.status}</Badge> },
                {
                  key: 'actions',
                  label: '',
                  render: (r) => (
                    <div className="flex items-center gap-1">
                      <Button size="xs" variant="ghost" icon={FiDownload} title={`Print or save invoice ${r.id} as PDF`} onClick={() => printInvoice(r)}>PDF</Button>
                      <Button size="xs" variant="ghost" icon={FiTrash2} title="Delete invoice" onClick={() => setConfirmDelete(r)} />
                    </div>
                  ),
                },
              ]}
              data={invoices}
            />
          )}
        </CardBody>
      </Card>

      <Modal open={changePlanOpen} onClose={() => !savingPlan && setChangePlanOpen(false)} title="Change Plan" icon={FiCreditCard} size="md">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {PLANS.map((plan) => {
              const isCurrent = plan.id === currentPlan.id;
              const isSelected = plan.id === selectedPlanId;
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`rounded-lg border p-4 text-left transition-colors ${
                    isSelected
                      ? 'border-brand-500/60 bg-brand-500/10'
                      : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-zinc-100">{plan.name}</p>
                    {isCurrent && <Badge variant="success">Current</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">{plan.tagline}</p>
                  <p className="mt-3 text-lg font-bold text-brand-400">{formatCurrency(plan.price)}</p>
                  <p className="text-[11px] text-zinc-500">per month</p>
                  <ul className="mt-3 space-y-1.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-1.5 text-xs text-zinc-400">
                        <FiCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setChangePlanOpen(false)} disabled={savingPlan}>Cancel</Button>
            <Button type="button" variant="primary" onClick={applyPlanChange} disabled={savingPlan || selectedPlanId === currentPlan.id}>
              {savingPlan ? 'Updating…' : 'Confirm Change'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={billOpen} onClose={() => !savingBill && setBillOpen(false)} title="Create Bill" icon={FiFileText} size="md">
        <form onSubmit={submitBill} className="space-y-4">
          <label className="block space-y-1.5 text-xs font-medium text-zinc-400">
            Department
            <select
              value={billForm.department}
              onChange={(e) => setBillForm({ ...billForm, department: e.target.value, memberId: '' })}
              className="input w-full"
            >
              {BILL_DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5 text-xs font-medium text-zinc-400">
            Member
            <select
              value={billForm.memberId}
              onChange={(e) => setBillForm({ ...billForm, memberId: e.target.value })}
              className="input w-full"
              required
            >
              <option value="">Select a member…</option>
              {departmentMembers.map((m) => (
                <option key={m.id} value={m.id}>{m.name} — {m.role}</option>
              ))}
            </select>
            {departmentMembers.length === 0 && (
              <span className="block pt-1 text-[11px] text-amber-400">
                No members in this department yet.
              </span>
            )}
          </label>

          <Input
            label="Description"
            value={billForm.description}
            onChange={(e) => setBillForm({ ...billForm, description: e.target.value })}
            placeholder="e.g. 3 days shoot — day rate"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Amount"
              type="number"
              min="0"
              step="1"
              value={billForm.amount}
              onChange={(e) => setBillForm({ ...billForm, amount: e.target.value })}
              required
            />
            <Input
              label="Date"
              type="date"
              value={billForm.date}
              onChange={(e) => setBillForm({ ...billForm, date: e.target.value })}
              required
            />
          </div>

          <label className="block space-y-1.5 text-xs font-medium text-zinc-400">
            Status
            <select
              value={billForm.status}
              onChange={(e) => setBillForm({ ...billForm, status: e.target.value })}
              className="input w-full"
            >
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Overdue">Overdue</option>
            </select>
          </label>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setBillOpen(false)} disabled={savingBill}>Cancel</Button>
            <Button type="submit" variant="primary" icon={FiFileText} disabled={savingBill}>
              {savingBill ? 'Creating…' : 'Create Bill'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete Invoice"
        icon={FiTrash2}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-300">
            Delete invoice <span className="font-semibold text-white">{confirmDelete?.id}</span>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button type="button" variant="destructive" icon={FiTrash2} onClick={() => deleteInvoice(confirmDelete.id)}>Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}