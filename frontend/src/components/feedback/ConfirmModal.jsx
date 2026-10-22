import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { FiTrash2 } from 'react-icons/fi';

export default function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm' }) {
  return (
    <Modal open={open} onClose={onClose} title={title} icon={FiTrash2} size="sm">
      <div className="space-y-4">
        <p className="text-sm text-zinc-300">{message}</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm} icon={FiTrash2}>{confirmLabel}</Button>
        </div>
      </div>
    </Modal>
  );
}
