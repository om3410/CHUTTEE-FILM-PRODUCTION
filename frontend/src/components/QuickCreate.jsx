import { useNavigate } from 'react-router-dom';
import { FiCamera, FiDollarSign, FiImage, FiUsers, FiVideo } from 'react-icons/fi';
import Modal from './ui/Modal';
import Button from './ui/Button';

const actions = [
  { label: 'Add Crew Member', description: 'Add someone to the production team.', to: '/crew', icon: FiUsers },
  { label: 'Add Scene', description: 'Create a scene for the production.', to: '/scenes', icon: FiVideo },
  { label: 'Log Expense', description: 'Record a production expense.', to: '/budget', icon: FiDollarSign },
  { label: 'Add Equipment', description: 'Register production equipment.', to: '/assets', icon: FiCamera },
  { label: 'Upload Media Asset', description: 'Add a poster, headshot, or production image.', to: '/assets', icon: FiImage, state: { openMediaAdd: true } },
];

export default function QuickCreate({ open, onClose }) {
  const navigate = useNavigate();

  return (
    <Modal open={open} onClose={onClose} title="Quick Create" icon={FiCamera} size="lg">
      <div className="grid gap-2 sm:grid-cols-2">
        {actions.map(({ label, description, to, icon: Icon, state }) => (
          <Button
            key={label}
            type="button"
            variant="outline"
            className="h-auto justify-start gap-3 p-4 text-left"
            onClick={() => {
              navigate(to, { state: state || { openAdd: true } });
              onClose();
            }}
          >
            <Icon className="h-5 w-5 shrink-0 text-gold-400" />
            <span>
              <span className="block text-sm font-medium">{label}</span>
              <span className="mt-1 block text-xs font-normal text-zinc-500">{description}</span>
            </span>
          </Button>
        ))}
      </div>
    </Modal>
  );
}
