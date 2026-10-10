import { forwardRef } from 'react';
import { FiRefreshCw } from 'react-icons/fi';

const variants = {
  primary: 'bg-brand-500 text-white hover:bg-brand-400',
  default: 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700',
  outline: 'border border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800',
  ghost: 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100',
  destructive: 'bg-red-600 text-white hover:bg-red-500',
  success: 'bg-emerald-600 text-white hover:bg-emerald-500',
};

const sizes = {
  xs: 'h-7 px-2.5 text-xs',
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
  icon: 'h-9 w-9',
};

const Button = forwardRef(function Button(
  { variant = 'default', size = 'md', className = '', loading = false, disabled = false, icon: Icon, iconRight: IconRight, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      {...props}
      title={props.title || (Icon && typeof children === 'string' ? children : undefined)}
      className={`btn hover:scale-[1.02] active:scale-[0.98] ${variants[variant] || variants.default} ${sizes[size] || sizes.md} ${className}`}
      disabled={loading || disabled}
    >
      {loading && <FiRefreshCw className="h-4 w-4 animate-spin" />}
      {!loading && Icon && <Icon className="h-4 w-4" />}
      {children}
      {!loading && IconRight && <IconRight className="h-4 w-4" />}
    </button>
  );
});

export default Button;