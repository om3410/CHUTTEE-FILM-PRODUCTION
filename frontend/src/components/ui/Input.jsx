import { forwardRef, useId, useState } from 'react';
import { FiX, FiEye, FiEyeOff, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

const Input = forwardRef(function Input(
  { label, hint, error, success, icon: Icon, iconRight: IconRight, type = 'text', clearable = false, className = '', value, onChange, id: inputId, ...props },
  ref
) {
  const [show, setShow] = useState(false);
  const generatedId = useId();
  const id = inputId || generatedId;
  const isPassword = type === 'password';
  const realType = isPassword && show ? 'text' : type;
  const showRight = isPassword || clearable || IconRight || success || error;

  return (
    <div className="space-y-1.5 animate-fade-in">
      {label && <label htmlFor={id} className="block text-xs font-medium text-zinc-400">{label}</label>}
      <div className="relative">
        {Icon && <Icon title={label} className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />}
        <input
          ref={ref}
          id={id}
          type={realType}
          value={value}
          onChange={onChange}
          className={`w-full rounded-lg border bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 ${Icon ? 'pl-10' : ''} ${showRight ? 'pr-10' : ''} ${error ? 'border-red-500/60' : success ? 'border-emerald-500/60' : 'border-zinc-700'} ${className}`}
          {...props}
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {clearable && value && (
            <button type="button" title="Clear input" aria-label="Clear input" onClick={() => onChange?.({ target: { value: '' } })} className="rounded p-1 text-zinc-500 hover:bg-zinc-800">
              <FiX className="h-3.5 w-3.5" />
            </button>
          )}
          {isPassword && (
            <button type="button" title={show ? 'Hide password' : 'Show password'} aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow((s) => !s)} className="rounded p-1 text-zinc-500 hover:bg-zinc-800">
              {show ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
            </button>
          )}
          {IconRight && <IconRight className="h-4 w-4 text-zinc-500" />}
          {success && <FiCheckCircle className="h-4 w-4 text-emerald-400" />}
          {error && <FiAlertCircle className="h-4 w-4 text-red-400" />}
        </div>
      </div>
      {hint && !error && !success && <p className="text-xs text-zinc-500">{hint}</p>}
      {error && <p className="text-xs text-red-400 animate-fade-in">{error}</p>}
      {success && <p className="text-xs text-emerald-400 animate-fade-in">{success}</p>}
    </div>
  );
});

export default Input;