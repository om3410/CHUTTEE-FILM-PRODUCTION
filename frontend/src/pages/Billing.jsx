import { useEffect, useState } from 'react';
import { FiCreditCard, FiDownload, FiCheck } from 'react-icons/fi';
import { MOCK } from '../utils/constants';
import { formatCurrency, formatDate } from '../utils/format';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Table from '../components/ui/Table';
import SkeletonLoader from '../components/feedback/SkeletonLoader';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));

export default function Billing() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    setTimeout(() => { setInvoices(MOCK.billing); setLoading(false); }, 250);
  }, []);

  const printInvoice = (invoice) => {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      toast('Allow pop-ups to print or save this invoice as a PDF.', 'error');
      return;
    }

    const invoiceNumber = `INV-${String(invoice.id).toUpperCase()}`;
    const customerName = user?.name || [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Account holder';
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
          <p class="detail">${escapeHtml(user?.email || '')}</p>
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
            <td>${escapeHtml(invoice.plan)} plan subscription</td>
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
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-brand-500/15 p-3"><FiCreditCard className="h-6 w-6 text-brand-400" /></div>
        <div>
          <h1 className="text-2xl font-bold">Billing</h1>
          <p className="text-sm text-zinc-400">Manage your subscription and invoices.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-500">Current Plan</p>
              <h2 className="mt-1 text-2xl font-bold text-brand-400">Studio</h2>
              <p className="mt-1 text-sm text-zinc-400">Unlimited projects, 25 seats, priority support</p>
            </div>
            <Button variant="outline" onClick={() => toast('Plan changes are not connected to a billing service yet', 'info')}>Change Plan</Button>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {['Unlimited projects', '25 team seats', 'Priority support'].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-zinc-300"><FiCheck className="h-4 w-4 text-emerald-400" /> {f}</div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-zinc-800 p-3 text-brand-400"><FiCreditCard className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-zinc-500">Next invoice</p>
              <p className="text-lg font-semibold">{formatCurrency(24000)}</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-zinc-500">Renews on 1 Oct 2026</p>
        </Card>
      </div>

      <Card>
        <CardHeader title="Invoice history" icon={FiCreditCard} />
        <CardBody className="p-0">
          {loading ? (
            <div className="p-5"><SkeletonLoader variant="card" /></div>
          ) : (
            <Table
              columns={[
                { key: 'date', label: 'Date', render: (r) => formatDate(r.date) },
                { key: 'plan', label: 'Plan' },
                { key: 'amount', label: 'Amount', render: (r) => formatCurrency(r.amount) },
                { key: 'status', label: 'Status', render: (r) => <Badge variant="success">{r.status}</Badge> },
                { key: 'actions', label: '', render: (r) => <Button size="xs" variant="ghost" icon={FiDownload} title={`Print or save invoice ${r.id} as PDF`} onClick={() => printInvoice(r)}>PDF</Button> },
              ]}
              data={invoices}
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}