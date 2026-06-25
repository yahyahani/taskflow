'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createLabel, fetchLabels } from '@/lib/labels-api';
import type { Label } from '@/types';

const SWATCHES = ['#7C5CFC', '#3B9EFF', '#FF6B9D', '#22C7A9', '#FFA63E'];

export function LabelPicker({
  selectedIds,
  onToggle,
}: {
  selectedIds: string[];
  onToggle: (labelId: string) => void;
}) {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(SWATCHES[0]);

  const { data: labels } = useQuery({ queryKey: ['labels'], queryFn: fetchLabels });

  const createMutation = useMutation({
    mutationFn: createLabel,
    onSuccess: (label: Label) => {
      queryClient.setQueryData<Label[]>(['labels'], (old) => [...(old ?? []), label]);
      onToggle(label.id);
      setName('');
      setCreating(false);
    },
  });

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {labels?.map((label) => {
          const active = selectedIds.includes(label.id);
          return (
            <button
              key={label.id}
              type="button"
              onClick={() => onToggle(label.id)}
              className="rounded-full px-2.5 py-1 text-xs font-semibold transition-all"
              style={{
                backgroundColor: active ? label.color : `${label.color}1A`,
                color: active ? '#fff' : label.color,
              }}
            >
              {label.name}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setCreating((c) => !c)}
          className="rounded-full border border-dashed border-border px-2.5 py-1 text-xs font-medium text-muted hover:text-ink"
        >
          + New
        </button>
      </div>

      {creating && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface p-2">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Label name"
            className="flex-1 bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
          />
          <div className="flex gap-1">
            {SWATCHES.map((swatch) => (
              <button
                key={swatch}
                type="button"
                onClick={() => setColor(swatch)}
                className="h-5 w-5 rounded-full"
                style={{
                  backgroundColor: swatch,
                  outline: color === swatch ? `2px solid ${swatch}` : 'none',
                  outlineOffset: 2,
                }}
                aria-label={`Pick color ${swatch}`}
              />
            ))}
          </div>
          <button
            type="button"
            disabled={!name.trim() || createMutation.isPending}
            onClick={() => createMutation.mutate({ name: name.trim(), color })}
            className="rounded-md bg-violet px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}
