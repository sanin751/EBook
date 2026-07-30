import { useState } from 'react';
import Modal from './Modal';
import Button from './Button';

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  danger = true,
}) {
  const [busy, setBusy] = useState(false);

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
      <div className="flex gap-4">
        {danger && (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-xl text-red-600">
            🗑
          </span>
        )}
        <p className="pt-2 text-sm text-ink-600">{message}</p>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
          {cancelLabel}
        </Button>
        <Button
          type="button"
          onClick={handleConfirm}
          disabled={busy}
          className={danger ? 'bg-red-600 hover:bg-red-700' : ''}
        >
          {busy ? 'Deleting...' : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
