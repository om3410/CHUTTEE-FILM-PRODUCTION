import { FiInbox } from 'react-icons/fi';
import Button from '../ui/Button';

export default function EmptyState({ icon: Icon = FiInbox, title, description, action, actions }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-900/40 px-6 py-14 text-center animate-slide-up">
      <div className="mb-4 rounded-full bg-zinc-800 p-4 animate-scale-in">
        <Icon className="h-8 w-8 text-zinc-500" />
      </div>
      <h3 className="text-base font-semibold text-zinc-200">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-zinc-500">{description}</p>}
      {action && (
        <Button variant="primary" className="mt-5" icon={action.icon} onClick={action.onClick}>{action.label}</Button>
      )}
      {actions && (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {actions.map((a, i) => (
            <Button key={i} variant={a.variant || 'outline'} icon={a.icon} onClick={a.onClick}>{a.label}</Button>
          ))}
        </div>
      )}
    </div>
  );
}