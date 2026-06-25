'use client';

import { useState } from 'react';
import { LabelPicker } from './LabelPicker';
import type { Task } from '@/types';

export function TaskDetailModal({
  task,
  onClose,
  onSave,
}: {
  task: Task;
  onClose: () => void;
  onSave: (updates: { dueDate?: string; labelIds?: string[] }) => void;
}) {
  const [labelIds, setLabelIds] = useState(task.labels.map((l) => l.id));
  const [dueDate, setDueDate] = useState(task.dueDate ? task.dueDate.slice(0, 10) : '');

  function toggleLabel(labelId: string) {
    setLabelIds((ids) => (ids.includes(labelId) ? ids.filter((id) => id !== labelId) : [...ids, labelId]));
  }

  function handleSave() {
    onSave({ dueDate: dueDate || undefined, labelIds });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass w-full max-w-md rounded-2xl p-6 shadow-card-hover"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 className="font-display text-lg font-bold text-ink">{task.title}</h2>
          <button onClick={onClose} className="text-muted hover:text-ink" aria-label="Close">
            ×
          </button>
        </div>

        <div className="mt-5 space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Labels</label>
            <LabelPicker selectedIds={labelIds} onToggle={toggleLabel} />
          </div>

          <div>
            <label htmlFor="due-date" className="mb-1.5 block text-sm font-medium text-ink">
              Due date
            </label>
            <input
              id="due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-violet"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-ink"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-violet px-4 py-2 text-sm font-semibold text-white shadow-glow"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
