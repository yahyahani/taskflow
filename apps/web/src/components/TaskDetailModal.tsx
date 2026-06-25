'use client';

import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createComment, deleteComment, fetchComments } from '@/lib/comments-api';
import { fetchMembers } from '@/lib/organizations-api';
import { useAuthStore } from '@/store/auth.store';
import { LabelPicker } from './LabelPicker';
import type { Comment, Member, Priority, Task } from '@/types';

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'LOW',    label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH',   label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

const AVATAR_COLORS = ['bg-violet', 'bg-sky', 'bg-coral', 'bg-mint', 'bg-amber'];

function avatarColor(name: string) {
  const sum = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function TaskDetailModal({
  task,
  orgId,
  onClose,
  onSave,
}: {
  task: Task;
  orgId: string;
  onClose: () => void;
  onSave: (updates: {
    description?: string;
    assigneeId?: string | null;
    dueDate?: string;
    priority?: Priority;
    labelIds?: string[];
  }) => void;
}) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const [description, setDescription] = useState(task.description ?? '');
  const [assigneeId, setAssigneeId] = useState(task.assignee?.id ?? '');
  const [labelIds, setLabelIds] = useState(task.labels.map((l) => l.id));
  const [dueDate, setDueDate] = useState(task.dueDate ? task.dueDate.slice(0, 10) : '');
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [body, setBody] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: members = [] } = useQuery<Member[]>({
    queryKey: ['members', orgId],
    queryFn: () => fetchMembers(orgId),
  });

  const selectedMember = members.find((m) => m.user.id === assigneeId);

  const commentsKey = ['comments', task.id];

  const { data: comments = [] } = useQuery({
    queryKey: commentsKey,
    queryFn: () => fetchComments(task.projectId, task.id),
  });

  const addMutation = useMutation({
    mutationFn: (text: string) => createComment(task.projectId, task.id, text),
    onSuccess: (comment) => {
      queryClient.setQueryData<Comment[]>(commentsKey, (old) => [...(old ?? []), comment]);
      setBody('');
      textareaRef.current?.focus();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => deleteComment(task.projectId, task.id, commentId),
    onSuccess: (_void, commentId) => {
      queryClient.setQueryData<Comment[]>(commentsKey, (old) =>
        (old ?? []).filter((c) => c.id !== commentId),
      );
    },
  });

  function toggleLabel(labelId: string) {
    setLabelIds((ids) =>
      ids.includes(labelId) ? ids.filter((id) => id !== labelId) : [...ids, labelId],
    );
  }

  function handleSave() {
    onSave({
      description: description || undefined,
      assigneeId: assigneeId || null,
      dueDate: dueDate || undefined,
      priority,
      labelIds,
    });
    onClose();
  }

  function handleSubmitComment() {
    const trimmed = body.trim();
    if (!trimmed || addMutation.isPending) return;
    addMutation.mutate(trimmed);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass flex w-full max-w-lg flex-col rounded-2xl shadow-card-hover"
        style={{ maxHeight: 'min(90vh, 740px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-0">
          <h2 className="font-display text-lg font-bold text-ink">{task.title}</h2>
          <button onClick={onClose} className="ml-4 shrink-0 text-muted hover:text-ink" aria-label="Close">
            ×
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 pb-0">
          <div className="mt-5 space-y-5">

            {/* Description */}
            <div>
              <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-ink">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description…"
                rows={3}
                className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-violet focus:outline-none"
              />
            </div>

            {/* Assignee */}
            <div>
              <label htmlFor="assignee" className="mb-1.5 block text-sm font-medium text-ink">
                Assignee
              </label>
              <div className="flex items-center gap-2">
                {selectedMember ? (
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${avatarColor(selectedMember.user.name)}`}
                  >
                    {initials(selectedMember.user.name)}
                  </div>
                ) : (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-border text-muted">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                )}
                <select
                  id="assignee"
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-violet focus:outline-none"
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.user.id} value={m.user.id}>
                      {m.user.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Labels */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Labels</label>
              <LabelPicker selectedIds={labelIds} onToggle={toggleLabel} />
            </div>

            {/* Priority + Due date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="priority" className="mb-1.5 block text-sm font-medium text-ink">
                  Priority
                </label>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-violet focus:outline-none"
                >
                  {PRIORITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
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
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-violet focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Comment thread */}
          <div className="mt-6 border-t border-border pt-5">
            <p className="mb-3 text-sm font-medium text-ink">
              Comments
              {comments.length > 0 && (
                <span className="ml-1.5 rounded-full bg-surface-hover px-1.5 py-0.5 text-xs font-medium text-muted">
                  {comments.length}
                </span>
              )}
            </p>

            {comments.length === 0 && (
              <p className="text-sm text-muted">No comments yet. Be the first to add one.</p>
            )}

            <ul className="space-y-4">
              {comments.map((comment) => (
                <li key={comment.id} className="flex gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet text-[11px] font-bold text-white">
                    {initials(comment.author.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-semibold text-ink">{comment.author.name}</span>
                      <span className="shrink-0 text-xs text-muted">
                        {formatRelativeTime(comment.createdAt)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-start justify-between gap-2">
                      <p className="break-words text-sm text-ink/80">{comment.body}</p>
                      {comment.author.id === user?.id && (
                        <button
                          onClick={() => deleteMutation.mutate(comment.id)}
                          disabled={deleteMutation.isPending}
                          className="shrink-0 text-base leading-none text-muted opacity-0 transition-opacity hover:text-coral group-hover:opacity-100 focus:opacity-100"
                          aria-label="Delete comment"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* New comment input */}
            <div className="mt-4 flex gap-2">
              <textarea
                ref={textareaRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitComment();
                  }
                }}
                placeholder="Add a comment… (Enter to send, Shift+Enter for newline)"
                rows={2}
                className="flex-1 resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-violet focus:outline-none"
              />
              <button
                onClick={handleSubmitComment}
                disabled={!body.trim() || addMutation.isPending}
                className="self-end rounded-lg bg-violet px-3 py-2 text-sm font-semibold text-white shadow-glow disabled:opacity-40"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
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
