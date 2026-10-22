export const cn = (...a) => a.filter(Boolean).join(' ');

export const formatINR = (n) => {
  if (n == null || isNaN(n)) return '₹0';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
};

export const formatINRCompact = (n) => {
  if (!n) return '₹0';
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1)} L`;
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(0)}K`;
  return formatINR(n);
};
