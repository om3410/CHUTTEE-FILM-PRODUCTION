import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { FiAlertTriangle } from 'react-icons/fi';

export default function ConfirmModal({ open, onClose, onConfirm, title = 'Confirm', message, confirmLabel = 'Confirm', variant = 'destructive' }) {
  return (
    <Modal open={open} onClose={onClose} title={title} icon={FiAlertTriangle} size="sm">
      <p className="text-sm text-zinc-400">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant={variant} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}