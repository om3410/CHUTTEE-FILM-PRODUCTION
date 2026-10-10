import { initials } from '../../utils/format';

const sizes = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
  xl: 'h-20 w-20 text-2xl',
};

export default function Avatar({ name = '', src, size = 'md', className = '', ring = false }) {
  return (
    <div className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-500/20 font-semibold text-brand-400 ${ring ? 'ring-2 ring-brand-500/40' : ''} ${sizes[size]} ${className}`}>
      {src ? <img src={src} alt={name} className="h-full w-full object-cover" /> : initials(name)}
    </div>
  );
}