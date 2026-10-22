import { FiFilm } from 'react-icons/fi';
import Button from '../ui/Button';

export default function EmptyState({ icon: Icon = FiFilm, title, description, actionLabel, onAction }) {
  return (
    <div className="premium-card flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-gold-500/10 text-gold-400">
        <Icon className="h-7 w-7" />
      </div>
      <div>
        <h3 className="font-serif text-xl font-semibold text-zinc-100">{title}</h3>
        {description && <p className="mt-1 max-w-md text-sm text-zinc-500">{description}</p>}
      </div>
      {actionLabel && <Button variant="primary" onClick={onAction}>{actionLabel}</Button>}
    </div>
  );
}
