import { FilmIcon } from "../../icons";
import Button from './Button';

export function EmptyState({title, description, action}){
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-900/40 py-16 text-center">
      <div className="mb-4 rounded-full bg-zinc-800 p-4">
        <FilmIcon className='h-8 w-8 text-zinc-500' />
      </div>
      <h3 className="text-base font-semibold text-zinc-200">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-zinc-500">{description}</p>}
      {action && (
        <Button variant="primary" className="mt-5" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}