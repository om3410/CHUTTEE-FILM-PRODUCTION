export const formatCurrency = (value, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value || 0);

export const formatShortCurrency = (value) => {
  const n = Number(value) || 0;
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${n}`;
};

export const formatDate = (value, opts = { day: '2-digit', month: 'short', year: 'numeric' }) => {
  if (!value) return '—';
  try { return new Date(value).toLocaleDateString('en-IN', opts); } catch { return value; }
};

export const formatRelative = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export const initials = (name = '') =>
  name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();