import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiPlus, FiSearch, FiX, FiArrowRight, FiDownload, FiSend,
  FiCheckCircle, FiClock, FiAlertTriangle, FiFileText, FiEdit2,
  FiTrash2, FiEye, FiCopy, FiHelpCircle, FiInbox, FiDollarSign,
  FiTarget, FiRefreshCw, FiMail, FiPhone, FiUser,
} from 'react-icons/fi';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import SkeletonLoader from '../components/feedback/SkeletonLoader';
import EmptyState from '../components/feedback/EmptyState';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import PageHero from '../components/ui/PageHero';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/format';

const CONTACT = {
  email: 'omrewaskar4@gmail.com',
  phone: '+91 74101 14971',
  phoneRaw: '+917410114971',
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   CONSTANTS
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

const STATUS_ROUTES = [
  { number: '01', icon: FiFileText,      eyebrow: 'Not Sent',   title: 'Drafts',        description: 'Invoices created but not yet sent to the client.',           key: 'draft' },
  { number: '02', icon: FiSend,          eyebrow: 'Awaiting',   title: 'Sent Invoices', description: 'Invoices sent but not yet paid.',                             key: 'sent' },
  { number: '03', icon: FiCheckCircle,   eyebrow: 'Settled',    title: 'Paid Invoices', description: 'Fully paid invoices — the money is in the account.',          key: 'paid' },
  { number: '04', icon: FiAlertTriangle, eyebrow: 'Late',       title: 'Overdue',       description: 'Invoices past their due date — needs a follow-up call.',      key: 'overdue' },
];

const POPULAR_FILTERS = [
  { key: 'draft',   label: 'Drafts' },
  { key: 'sent',    label: 'Sent' },
  { key: 'paid',    label: 'Paid' },
  { key: 'overdue', label: 'Overdue' },
];

const STATUS_STYLES = {
  draft:   'bg-zinc-500/15 text-zinc-300 border-zinc-500/40',
  sent:    'bg-blue-500/15 text-blue-300 border-blue-500/40',
  paid:    'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  overdue: 'bg-red-500/15 text-red-300 border-red-500/40',
};

/* ——————— Seed invoices ——————— */
const SEED_INVOICES = [
  { id: 'INV-001', client: 'Monsoon Letters LLP',  clientEmail: 'accounts@monsoonletters.in', project: 'Monsoon Letters', amount: 450000, gst: 81000,  total: 531000, status: 'paid',    date: '2026-01-12', dueDate: '2026-02-12', notes: 'Post-production milestone 1' },
  { id: 'INV-002', client: 'Salt Road Pictures',   clientEmail: 'finance@saltroad.com',       project: 'The Salt Road',   amount: 820000, gst: 147600, total: 967600, status: 'sent',    date: '2026-09-20', dueDate: '2026-10-20', notes: 'Principal photography wrap' },
  { id: 'INV-003', client: 'Lantern Studios',      clientEmail: 'admin@lantern.com',          project: 'Paper Lanterns',  amount: 180000, gst: 32400,  total: 212400, status: 'overdue', date: '2026-09-02', dueDate: '2026-10-02', notes: 'Development phase 2' },
  { id: 'INV-004', client: 'Silent Frames Pvt Ltd',clientEmail: 'billing@silentframes.in',    project: 'Silent Frames',   amount: 210000, gst: 37800,  total: 247800, status: 'draft',   date: '2026-10-15', dueDate: '2026-11-15', notes: 'Final delivery pending' },
  { id: 'INV-005', client: 'Monsoon Letters LLP',  clientEmail: 'accounts@monsoonletters.in', project: 'Monsoon Letters', amount: 320000, gst: 57600,  total: 377600, status: 'paid',    date: '2026-08-05', dueDate: '2026-09-05', notes: 'Production milestone 2' },
  { id: 'INV-006', client: 'Salt Road Pictures',   clientEmail: 'finance@saltroad.com',       project: 'The Salt Road',   amount: 150000, gst: 27000,  total: 177000, status: 'sent',    date: '2026-10-01', dueDate: '2026-11-01', notes: 'VFX milestone' },
];

const LS_KEY = 'chuttee.invoices';

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MAIN COMPONENT
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

export default function Billing() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [invoices, setInvoices] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      return saved ? JSON.parse(saved) : SEED_INVOICES;
    } catch {
      return SEED_INVOICES;
    }
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({
    id: '', client: '', clientEmail: '', project: '',
    amount: '', gst: '', status: 'draft',
    date: new Date().toISOString().slice(0, 10),
    dueDate: '', notes: '',
  });

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(invoices)); } catch {}
  }, [invoices]);

  /* ——————————— Derived ——————————— */
  const counts = useMemo(() => {
    const c = { all: invoices.length, draft: 0, sent: 0, paid: 0, overdue: 0 };
    invoices.forEach((inv) => { c[inv.status] = (c[inv.status] || 0) + 1; });
    return c;
  }, [invoices]);

  const totals = useMemo(() => {
    const sum = (key, statuses) =>
      invoices.filter((i) => !statuses || statuses.includes(i.status))
        .reduce((s, i) => s + Number(i[key] || 0), 0);
    return {
      totalAmount: sum('total'),
      totalGst: sum('gst'),
      paidAmount: sum('total', ['paid']),
      pendingAmount: sum('total', ['sent', 'overdue']),
      overdueAmount: sum('total', ['overdue']),
    };
  }, [invoices]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices.filter((inv) => {
      const matchesSearch = !q || [inv.id, inv.client, inv.project, inv.notes].some((v) => String(v ?? '').toLowerCase().includes(q));
      const matchesStatus = !statusFilter || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, search, statusFilter]);

  const hasActiveFilters = Boolean(search || statusFilter);
  const clearFilters = () => { setSearch(''); setStatusFilter(''); };
  const scrollToLedger = () => setTimeout(() => document.getElementById('invoice-ledger')?.scrollIntoView({ behavior: 'smooth' }), 100);

  const countByStatus = (status) => invoices.filter((i) => i.status === status).length;

  /* ——————————— Actions ——————————— */
  const openCompose = (invoice = null) => {
    if (invoice) {
      setDraft({ ...invoice, amount: String(invoice.amount), gst: String(invoice.gst) });
    } else {
      const nextNumber = `INV-${String(invoices.length + 1).padStart(3, '0')}`;
      setDraft({
        id: nextNumber, client: '', clientEmail: '', project: '',
        amount: '', gst: '', status: 'draft',
        date: new Date().toISOString().slice(0, 10),
        dueDate: '', notes: '',
      });
    }
    setComposeOpen(true);
  };

  const saveInvoice = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const amount = Number(draft.amount);
      const gst = Number(draft.gst) || Math.round(amount * 0.18);
      const total = amount + gst;
      const existing = invoices.find((i) => i.id === draft.id);
      const payload = { ...draft, amount, gst, total };
      if (existing) {
        setInvoices((list) => list.map((i) => i.id === draft.id ? payload : i));
        toast('Invoice updated', 'success');
      } else {
        setInvoices((list) => [payload, ...list]);
        toast('Invoice created', 'success');
      }
      setComposeOpen(false);
    } catch {
      toast('Could not save invoice.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const sendInvoice = (invoice) => {
    if (invoice.status === 'paid') { toast('Invoice is already paid.', 'info'); return; }
    setInvoices((list) => list.map((i) => i.id === invoice.id ? { ...i, status: 'sent' } : i));
    toast(`Invoice ${invoice.id} sent to ${invoice.clientEmail}`, 'success');
  };

  const markPaid = (invoice) => {
    setInvoices((list) => list.map((i) => i.id === invoice.id ? { ...i, status: 'paid' } : i));
    toast(`Invoice ${invoice.id} marked as paid`, 'success');
  };

  const markOverdue = (invoice) => {
    setInvoices((list) => list.map((i) => i.id === invoice.id ? { ...i, status: 'overdue' } : i));
    toast(`Invoice ${invoice.id} marked as overdue`, 'success');
  };

  const deleteInvoice = () => {
    if (!confirmDelete) return;
    setInvoices((list) => list.filter((i) => i.id !== confirmDelete.id));
    toast(`Invoice ${confirmDelete.id} deleted`, 'success');
    setConfirmDelete(null);
    setActiveInvoice(null);
  };

  const duplicateInvoice = (invoice) => {
    const nextNumber = `INV-${String(invoices.length + 1).padStart(3, '0')}`;
    const copy = { ...invoice, id: nextNumber, status: 'draft', date: new Date().toISOString().slice(0, 10) };
    setInvoices((list) => [copy, ...list]);
    toast(`Invoice duplicated as ${nextNumber}`, 'success');
  };

  const downloadInvoice = (invoice) => {
    const html = `<!DOCTYPE html>
<html><head><title>${invoice.id} — ${invoice.client}</title>
<style>
  body { font-family: Georgia, serif; max-width: 720px; margin: 40px auto; padding: 24px; color: #111; }
  h1 { color: #b8942b; letter-spacing: -0.02em; }
  .meta { display: flex; justify-content: space-between; margin: 24px 0; }
  .meta div { font-size: 14px; }
  .label { color: #666; text-transform: uppercase; letter-spacing: 0.15em; font-size: 10px; }
  table { width: 100%; border-collapse: collapse; margin: 32px 0; }
  th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
  th { background: #f7f7f7; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; }
  .total { font-size: 24px; color: #b8942b; font-weight: bold; }
  .footer { margin-top: 48px; font-size: 11px; color: #666; text-align: center; }
</style></head><body>
<h1>CHUTTEE FILM PRODUCTION</h1>
<p style="color:#666;margin-top:-8px">Invoice ${invoice.id}</p>
<div class="meta">
  <div><div class="label">Billed To</div><strong>${invoice.client}</strong><br>${invoice.clientEmail}</div>
  <div><div class="label">Invoice Date</div>${invoice.date}<br><div class="label" style="margin-top:8px">Due Date</div>${invoice.dueDate}</div>
</div>
<table>
  <thead><tr><th>Project</th><th>Notes</th><th style="text-align:right">Amount</th></tr></thead>
  <tbody>
    <tr><td>${invoice.project}</td><td>${invoice.notes || '—'}</td><td style="text-align:right">₹${Number(invoice.amount).toLocaleString('en-IN')}</td></tr>
    <tr><td colspan="2" style="text-align:right;color:#666">GST (18%)</td><td style="text-align:right">₹${Number(invoice.gst).toLocaleString('en-IN')}</td></tr>
    <tr><td colspan="2" style="text-align:right"><strong>Total</strong></td><td style="text-align:right" class="total">₹${Number(invoice.total).toLocaleString('en-IN')}</td></tr>
  </tbody>
</table>
<p style="text-align:center"><button onclick="window.print()" style="background:#b8942b;color:#111;border:none;padding:12px 24px;border-radius:6px;font-size:14px;cursor:pointer">Print / Save as PDF</button></p>
<div class="footer">CHUTTEE Film Production · ${CONTACT.email} · ${CONTACT.phone}</div>
</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    toast(`Invoice ${invoice.id} opened — save as PDF from Print dialog.`, 'success');
  };

  const exportCSV = () => {
    if (!invoices.length) { toast('No invoices to export.', 'error'); return; }
    const rows = [
      ['ID', 'Client', 'Email', 'Project', 'Amount', 'GST', 'Total', 'Status', 'Date', 'Due Date'],
      ...invoices.map((i) => [i.id, i.client, i.clientEmail, i.project, i.amount, i.gst, i.total, i.status, i.date, i.dueDate]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chuttee-invoices-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast('Invoice ledger exported as CSV', 'success');
  };

  /* ——————————— Bulk actions ——————————— */
  const toggleSelect = (id) => setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const clearSelection = () => setSelectedIds([]);
  const bulkMarkPaid = () => {
    setInvoices((list) => list.map((i) => selectedIds.includes(i.id) ? { ...i, status: 'paid' } : i));
    toast(`${selectedIds.length} invoices marked paid`, 'success');
    clearSelection();
  };
  const bulkSend = () => {
    setInvoices((list) => list.map((i) => selectedIds.includes(i.id) && i.status !== 'paid' ? { ...i, status: 'sent' } : i));
    toast(`${selectedIds.length} invoices sent`, 'success');
    clearSelection();
  };
  const bulkDelete = () => {
    setInvoices((list) => list.filter((i) => !selectedIds.includes(i.id)));
    toast(`${selectedIds.length} invoices deleted`, 'success');
    clearSelection();
  };

  return (
    <div className="space-y-16 animate-fade-in">

      {/* 1. HERO */}
      <PageHero
        image="/images/hero/hero-bg.jpg"
        eyebrow="Craft, Valued Honestly"
        title="Every Invoice, Branded Yours."
        subtitle="Every Payment, On Time."
        lead="Send GST-ready invoices with your company logo. Track draft, sent, paid and overdue statuses. Download as PDF. Keep your billing as considered as your productions — from the first quote to the final receipt."
        slogan="Every invoice tells a story. The right terms, the right timing, the right trust can turn a production into a partnership that lasts."
      />

      {/* 2. QUICK SEARCH STRIP */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Find the Invoice</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">
            Start with the Payment You Need to See.
          </h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            Search by invoice ID, client, project or note. Filter by status. Find the exact rupee.
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block lg:col-span-2">
            <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-zinc-500">Search</span>
            <div className="relative">
              <FiSearch className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Invoice ID, client, project…" className="input pl-10" />
            </div>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-zinc-500">Status</span>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); scrollToLedger(); }} className="input">
              <option value="">All statuses</option>
              <option value="draft">Draft ({countByStatus('draft')})</option>
              <option value="sent">Sent ({countByStatus('sent')})</option>
              <option value="paid">Paid ({countByStatus('paid')})</option>
              <option value="overdue">Overdue ({countByStatus('overdue')})</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="primary" size="sm" icon={FiPlus} onClick={() => openCompose()}>New Invoice</Button>
          <Button variant="outline" size="sm" icon={FiDownload} onClick={exportCSV} disabled={!invoices.length}>Export CSV</Button>
          {hasActiveFilters && (
            <>
              <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1 rounded-premium border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-gold-500/40 hover:text-gold-400">
                <FiX className="h-3 w-3" /> Clear filters
              </button>
              <span className="text-xs text-zinc-500">Showing {filtered.length} of {invoices.length}</span>
            </>
          )}
        </div>
      </section>

      {/* 3. STATS STRIP — clickable filters */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={FiDollarSign}
          value={formatCurrency(totals.totalAmount)}
          label="Total invoiced"
          note={`${invoices.length} invoices · GST ${formatCurrency(totals.totalGst)}`}
          isActive={!statusFilter}
          onClick={() => setStatusFilter('')}
        />
        <StatCard
          icon={FiCheckCircle}
          value={formatCurrency(totals.paidAmount)}
          label="Paid"
          note={`${countByStatus('paid')} settled invoices`}
          isActive={statusFilter === 'paid'}
          onClick={() => setStatusFilter(statusFilter === 'paid' ? '' : 'paid')}
        />
        <StatCard
          icon={FiTarget}
          value={formatCurrency(totals.pendingAmount)}
          label="Pending"
          note={`${countByStatus('sent')} sent · ${countByStatus('overdue')} overdue`}
          isActive={statusFilter === 'sent'}
          onClick={() => setStatusFilter(statusFilter === 'sent' ? '' : 'sent')}
        />
        <StatCard
          icon={FiAlertTriangle}
          value={formatCurrency(totals.overdueAmount)}
          label="Overdue"
          note={`${countByStatus('overdue')} invoices need follow-up`}
          isActive={statusFilter === 'overdue'}
          onClick={() => setStatusFilter(statusFilter === 'overdue' ? '' : 'overdue')}
        />
      </section>

      <Quote>
        "An invoice is a promise. A payment is the moment the promise is kept. Trust is built between them."
      </Quote>

      {/* 5. FOUR STATUS ROUTES */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Where CHUTTEE Can Help You</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">What Are You Looking For?</h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            Every invoice belongs to a status. Choose the one you need and CHUTTEE surfaces the ledger.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATUS_ROUTES.map((route) => (
            <RouteCard
              key={route.number}
              number={route.number}
              icon={route.icon}
              eyebrow={route.eyebrow}
              title={route.title}
              description={route.description}
              count={countByStatus(route.key)}
              isActive={statusFilter === route.key}
              action={statusFilter === route.key ? 'Clear filter' : 'View invoices →'}
              onAction={() => setStatusFilter(statusFilter === route.key ? '' : route.key)}
            />
          ))}
        </div>
      </section>

      <Quote>
        "The best productions are not just well-made. They are well-paid. Craft and commerce must move together."
      </Quote>

      {/* 7. FILTER CHIPS */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Explore by Status</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">Search the Way Producers Actually Think.</h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            One click shows every invoice in that category.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {POPULAR_FILTERS.map((f) => (
            <CategoryChip
              key={f.key}
              label={f.label}
              count={counts[f.key] ?? 0}
              isActive={statusFilter === f.key}
              onClick={() => setStatusFilter(statusFilter === f.key ? '' : f.key)}
            />
          ))}
        </div>
      </section>

      {/* 9. SPLIT JOURNEYS */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Built for Both Sides of the Money</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">
            A Producer Wants Cash Flow. A Client Wants Clarity.
          </h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            CHUTTEE supports both journeys — one for the person sending invoices, one for the person receiving them.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <JourneyCard
            title="For Producers & Finance"
            steps={['Draft', 'Send', 'Track', 'Follow-up', 'Reconcile', 'Close']}
            description="Draft the invoice. Send it with GST ready. Track its status. Follow up on overdue. Reconcile the payment. Close the books."
            onStepClick={(step) => {
              if (step === 'Draft') openCompose();
              if (step === 'Send') setStatusFilter('draft');
              if (step === 'Track' || step === 'Follow-up') setStatusFilter('overdue');
              if (step === 'Reconcile' || step === 'Close') setStatusFilter('paid');
            }}
          />
          <JourneyCard
            title="For Clients & Studios"
            steps={['Receive', 'Review', 'Approve', 'Pay', 'Confirm']}
            description="Receive the invoice. Review the line items. Approve with your finance team. Pay through your preferred channel. Get a receipt confirmation."
            onStepClick={(step) => {
              if (step === 'Receive' || step === 'Review') setStatusFilter('sent');
              if (step === 'Approve' || step === 'Pay') setStatusFilter('overdue');
              if (step === 'Confirm') setStatusFilter('paid');
            }}
          />
        </div>
      </section>

      <Quote>
        "Every payment is a vote of confidence. Every invoice is a chance to earn it again."
      </Quote>

      {/* 11. INVOICE LEDGER */}
      <section id="invoice-ledger" className="scroll-mt-24">
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">The Ledger</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">Every Invoice, in Order.</h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            {filtered.length} of {invoices.length} invoices shown
            {statusFilter && ` — ${POPULAR_FILTERS.find((f) => f.key === statusFilter)?.label}`}.
          </p>
        </div>

        <div className="mt-8">
          {filtered.length === 0 ? (
            <EmptyState
              icon={FiFileText}
              title="No invoices found"
              description={hasActiveFilters ? 'Try clearing the filters.' : 'Create your first invoice to get started.'}
              actionLabel="New Invoice"
              onAction={() => openCompose()}
            />
          ) : (
            <div className="premium-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-zinc-800 text-left text-zinc-500">
                    <tr>
                      <th className="w-10 px-3 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.length === filtered.length && filtered.length > 0}
                          onChange={(e) => setSelectedIds(e.target.checked ? filtered.map((i) => i.id) : [])}
                          className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-900 text-gold-500 focus:ring-gold-500"
                        />
                      </th>
                      <th className="px-5 py-3 font-medium">Invoice</th>
                      <th className="px-5 py-3 font-medium">Client</th>
                      <th className="px-5 py-3 font-medium hidden md:table-cell">Project</th>
                      <th className="px-5 py-3 font-medium hidden lg:table-cell">Date</th>
                      <th className="px-5 py-3 font-medium text-right">Total</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((inv) => (
                      <tr key={inv.id} className={`border-b border-zinc-800 last:border-0 transition-colors ${selectedIds.includes(inv.id) ? 'bg-gold-500/5' : 'hover:bg-zinc-900/40'}`}>
                        <td className="px-3 py-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(inv.id)}
                            onChange={() => toggleSelect(inv.id)}
                            className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-900 text-gold-500 focus:ring-gold-500"
                          />
                        </td>
                        <td className="px-5 py-4">
                          <button onClick={() => setActiveInvoice(inv)} className="font-medium text-zinc-100 hover:text-gold-400 transition-colors">
                            {inv.id}
                          </button>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-zinc-200">{inv.client}</p>
                          <p className="text-xs text-zinc-500">{inv.clientEmail}</p>
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell text-zinc-400">{inv.project}</td>
                        <td className="px-5 py-4 hidden lg:table-cell text-xs text-zinc-500">{inv.date}</td>
                        <td className="px-5 py-4 text-right font-serif font-bold text-gold-gradient">{formatCurrency(inv.total)}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${STATUS_STYLES[inv.status]}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <IconButton title="View" onClick={() => setActiveInvoice(inv)} icon={FiEye} />
                            <IconButton title="Edit" onClick={() => openCompose(inv)} icon={FiEdit2} />
                            {inv.status === 'draft' && (
                              <IconButton title="Send" onClick={() => sendInvoice(inv)} icon={FiSend} accent />
                            )}
                            {(inv.status === 'sent' || inv.status === 'overdue') && (
                              <IconButton title="Mark paid" onClick={() => markPaid(inv)} icon={FiCheckCircle} success />
                            )}
                            {inv.status === 'draft' && (
                              <IconButton title="Mark overdue" onClick={() => markOverdue(inv)} icon={FiClock} warn />
                            )}
                            <IconButton title="Download PDF" onClick={() => downloadInvoice(inv)} icon={FiDownload} />
                            <IconButton title="Duplicate" onClick={() => duplicateInvoice(inv)} icon={FiCopy} />
                            <IconButton title="Delete" onClick={() => setConfirmDelete(inv)} icon={FiTrash2} danger />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>

      <Quote>
        "The films that endure are the ones where every rupee was spent with intention — and every invoice was honoured."
      </Quote>

      {/* 13. BULK ACTIONS BAR */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-20 left-1/2 z-40 -translate-x-1/2 lg:bottom-6">
          <div className="flex items-center gap-2 rounded-premium border border-gold-500/40 bg-zinc-900/95 px-4 py-2 shadow-gold backdrop-blur">
            <span className="text-sm text-zinc-200">{selectedIds.length} selected</span>
            <span className="h-4 w-px bg-zinc-700" />
            <button onClick={bulkSend} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-gold-400" title="Send selected">
              <FiSend className="h-4 w-4" />
            </button>
            <button onClick={bulkMarkPaid} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-gold-400" title="Mark paid">
              <FiCheckCircle className="h-4 w-4" />
            </button>
            <button onClick={bulkDelete} className="rounded-lg p-2 text-red-400 hover:bg-red-500/10" title="Delete">
              <FiTrash2 className="h-4 w-4" />
            </button>
            <button onClick={clearSelection} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800" title="Clear">
              <FiX className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* 14. QUICK ACTIONS */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Ready to Bill?</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">Start with the Action You Need Most.</h2>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickAction icon={FiPlus} title="New Invoice" description="Create a GST-ready invoice for any client." onAction={() => openCompose()} />
          <QuickAction icon={FiDownload} title="Export Ledger" description="Download every invoice as a CSV for accounting." onAction={exportCSV} />
          <QuickAction icon={FiAlertTriangle} title="View Overdue" description="Jump straight to invoices needing follow-up." onAction={() => { setStatusFilter('overdue'); scrollToLedger(); }} />
        </div>
      </section>

      {/* 15. CONTACT STRIP */}
      <section className="premium-card relative overflow-hidden p-8 sm:p-10">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Contact CHUTTEE</p>
            <h3 className="mt-3 font-serif text-2xl font-bold text-zinc-100">Need a Custom Invoice? Talk to Finance.</h3>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Email</p>
            <a href={`mailto:${CONTACT.email}`} className="mt-2 block text-sm text-zinc-300 transition-colors hover:text-gold-400">{CONTACT.email}</a>
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-zinc-500">Phone</p>
            <a href={`tel:${CONTACT.phoneRaw}`} className="mt-2 block text-sm text-zinc-300 transition-colors hover:text-gold-400">{CONTACT.phone}</a>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Need help?</p>
            <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
              Reach out for GST compliance, invoicing templates, and payment terms.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="primary" size="sm" icon={FiHelpCircle} onClick={() => navigate('/help')}>Talk to us</Button>
              <Button variant="outline" size="sm" icon={FiInbox} onClick={() => navigate('/inbox')}>Open Inbox</Button>
            </div>
          </div>
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â• MODALS â•â•â•â•â•â•â•â•â•â•â• */}

      {/* Compose / Edit */}
      <Modal open={composeOpen} onClose={() => setComposeOpen(false)} title={invoices.find((i) => i.id === draft.id) ? 'Edit Invoice' : 'New Invoice'} icon={FiFileText} size="md">
        <form onSubmit={saveInvoice} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Invoice ID" value={draft.id} onChange={(e) => setDraft({ ...draft, id: e.target.value })} required />
            <label className="block space-y-1.5 text-xs font-medium text-zinc-400">
              <span>Status</span>
              <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })} className="input">
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Client name" value={draft.client} onChange={(e) => setDraft({ ...draft, client: e.target.value })} required />
            <Input label="Client email" type="email" value={draft.clientEmail} onChange={(e) => setDraft({ ...draft, clientEmail: e.target.value })} required />
          </div>
          <Input label="Project" value={draft.project} onChange={(e) => setDraft({ ...draft, project: e.target.value })} required />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Amount (₹, pre-GST)" type="number" min="0" step="0.01" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} required />
            <Input label="GST (₹, 18%)" type="number" min="0" step="0.01" value={draft.gst} onChange={(e) => setDraft({ ...draft, gst: e.target.value })} placeholder="Auto-calc if empty" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Invoice date" type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} required />
            <Input label="Due date" type="date" value={draft.dueDate} onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">Notes</label>
            <textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} rows={3} className="input w-full resize-none" placeholder="Milestone, deliverables, etc." />
          </div>
          {draft.amount && (
            <div className="rounded-lg border border-gold-500/20 bg-gold-500/5 p-3">
              <p className="text-xs text-zinc-400">Total (amount + GST)</p>
              <p className="font-serif text-2xl font-bold text-gold-gradient">
                {formatCurrency(Number(draft.amount) + (Number(draft.gst) || Math.round(Number(draft.amount) * 0.18)))}
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setComposeOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving…' : 'Save Invoice'}</Button>
          </div>
        </form>
      </Modal>

      {/* Invoice detail */}
      <Modal open={!!activeInvoice} onClose={() => setActiveInvoice(null)} title="Invoice Details" icon={FiFileText} size="md">
        {activeInvoice && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-serif text-2xl font-bold text-zinc-100">{activeInvoice.id}</p>
                <p className="text-sm text-zinc-500">{activeInvoice.project}</p>
              </div>
              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${STATUS_STYLES[activeInvoice.status]}`}>
                {activeInvoice.status}
              </span>
            </div>
            <div className="grid gap-3 text-sm">
              <InfoRow label="Billed to" value={activeInvoice.client} sub={activeInvoice.clientEmail} />
              <InfoRow label="Invoice date" value={activeInvoice.date} />
              <InfoRow label="Due date" value={activeInvoice.dueDate} />
              {activeInvoice.notes && <InfoRow label="Notes" value={activeInvoice.notes} />}
              <div className="grid grid-cols-3 gap-2 border-t border-zinc-800 pt-3">
                <div>
                  <p className="text-xs text-zinc-500">Subtotal</p>
                  <p className="font-serif font-bold text-zinc-100">{formatCurrency(activeInvoice.amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">GST (18%)</p>
                  <p className="font-serif font-bold text-zinc-100">{formatCurrency(activeInvoice.gst)}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Total</p>
                  <p className="font-serif text-lg font-bold text-gold-gradient">{formatCurrency(activeInvoice.total)}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-zinc-800">
              <Button variant="outline" size="sm" icon={FiEdit2} onClick={() => { setActiveInvoice(null); openCompose(activeInvoice); }}>Edit</Button>
              {activeInvoice.status === 'draft' && (
                <Button variant="outline" size="sm" icon={FiSend} onClick={() => { sendInvoice(activeInvoice); setActiveInvoice({ ...activeInvoice, status: 'sent' }); }}>Send</Button>
              )}
              {(activeInvoice.status === 'sent' || activeInvoice.status === 'overdue') && (
                <Button variant="outline" size="sm" icon={FiCheckCircle} onClick={() => { markPaid(activeInvoice); setActiveInvoice({ ...activeInvoice, status: 'paid' }); }}>Mark Paid</Button>
              )}
              <Button variant="outline" size="sm" icon={FiDownload} onClick={() => downloadInvoice(activeInvoice)}>Download PDF</Button>
              <Button variant="outline" size="sm" icon={FiCopy} onClick={() => { duplicateInvoice(activeInvoice); setActiveInvoice(null); }}>Duplicate</Button>
              <Button variant="destructive" size="sm" icon={FiTrash2} onClick={() => { setConfirmDelete(activeInvoice); setActiveInvoice(null); }}>Delete</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete Invoice" icon={FiTrash2} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-zinc-300">
            Delete <span className="font-semibold text-white">{confirmDelete?.id}</span> for {confirmDelete?.client}?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={deleteInvoice} icon={FiTrash2}>Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   HELPERS
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function StatCard({ icon: Icon, value, label, note, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`premium-card p-6 text-left transition-all ${isActive ? 'border-gold-500/50 shadow-gold' : 'hover:border-gold-500/40'}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-serif text-2xl font-bold text-gold-gradient">{value}</p>
          <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-zinc-300">{label}</p>
          <p className="mt-1 text-xs text-zinc-500">{note}</p>
        </div>
        {Icon && (
          <div className="grid h-10 w-10 place-items-center rounded-premium bg-gold-500/10 text-gold-400">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      {isActive && <p className="mt-2 text-[10px] uppercase tracking-wider text-gold-400">Active filter</p>}
    </button>
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
        {typeof count === 'number' && (
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

function CategoryChip({ label, count, isActive, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className={`premium-card group flex items-center justify-between gap-3 p-4 text-left transition-all ${isActive ? 'border-gold-500/50 shadow-gold' : 'hover:border-gold-500/40'}`}>
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold-500/10 text-gold-400">
          <FiFileText className="h-4 w-4" />
        </span>
        <p className="truncate font-serif text-base font-semibold text-zinc-100">{label}</p>
      </div>
      <span className="rounded-full border border-zinc-800 bg-zinc-900/60 px-2 py-0.5 text-[10px] font-medium text-zinc-400">{count}</span>
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

function IconButton({ icon: Icon, onClick, title, accent, success, warn, danger }) {
  const color = danger
    ? 'text-zinc-500 hover:bg-red-500/10 hover:text-red-400'
    : success
      ? 'text-zinc-500 hover:bg-emerald-500/10 hover:text-emerald-400'
      : warn
        ? 'text-zinc-500 hover:bg-amber-500/10 hover:text-amber-400'
        : accent
          ? 'text-zinc-500 hover:bg-blue-500/10 hover:text-blue-400'
          : 'text-zinc-500 hover:bg-zinc-800 hover:text-gold-400';
  return (
    <button onClick={onClick} title={title} aria-label={title}
      className={`rounded-md p-1.5 transition-colors ${color}`}>
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function InfoRow({ label, value, sub }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs uppercase tracking-[0.15em] text-zinc-500">{label}</span>
      <div className="text-right">
        <p className="text-sm text-zinc-200">{value}</p>
        {sub && <p className="text-xs text-zinc-500">{sub}</p>}
      </div>
    </div>
  );
}