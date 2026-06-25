'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth.store';
import type { BoardColumn, Task } from '@/types';

const WS_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

interface BoardSocketHandlers {
  onTaskCreated?: (task: Task) => void;
  onTaskUpdated?: (task: Task) => void;
  onTaskMoved?: (task: Task) => void;
  onTaskDeleted?: (payload: { id: string }) => void;
  onColumnReordered?: (columns: BoardColumn[]) => void;
}

/**
 * Opens one socket per mounted board, joins the active org's room, and
 * wires up the event handlers passed in. Handlers are stored in a ref so
 * the socket isn't torn down and recreated every time a handler closure
 * changes identity on re-render.
 */
export function useBoardSocket(handlers: BoardSocketHandlers) {
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const accessToken = useAuthStore((s) => s.accessToken);
  const organizationId = useAuthStore((s) => s.activeOrganization?.id);

  useEffect(() => {
    if (!accessToken || !organizationId) return;

    const socket = io(`${WS_URL}/board`, {
      auth: { token: accessToken },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-organization', { organizationId });
    });

    socket.on('task:created', (task: Task) => handlersRef.current.onTaskCreated?.(task));
    socket.on('task:updated', (task: Task) => handlersRef.current.onTaskUpdated?.(task));
    socket.on('task:moved', (task: Task) => handlersRef.current.onTaskMoved?.(task));
    socket.on('task:deleted', (payload: { id: string }) =>
      handlersRef.current.onTaskDeleted?.(payload),
    );
    socket.on('column:reordered', (columns: BoardColumn[]) =>
      handlersRef.current.onColumnReordered?.(columns),
    );

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, organizationId]);
}
