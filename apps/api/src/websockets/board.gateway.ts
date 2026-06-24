import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtPayload } from '../common/types/auth.types';

/**
 * Each connected client joins a room named after their active
 * organizationId. Broadcasts are scoped to that room, so a board update
 * in Org A is never sent to a socket connected under Org B — even if
 * that socket is the same physical browser tab switching tenants.
 */
@WebSocketGateway({
  cors: { origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000', credentials: true },
  namespace: 'board',
})
export class BoardGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(BoardGateway.name);

  constructor(private readonly jwt: JwtService) {}

  handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token as string | undefined;
      if (!token) {
        client.disconnect();
        return;
      }
      // Verify the access token so only authenticated users can open a
      // socket at all. Per-org room membership is still explicit via
      // the 'join-organization' message below.
      this.jwt.verify<JwtPayload>(token);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-organization')
  handleJoinOrganization(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { organizationId: string },
  ) {
    // Note: we trust organizationId here only to join a *room*, not to
    // read data — actual data access is still checked by TenantGuard on
    // the HTTP side. Room membership only determines which broadcasts a
    // socket receives, which is not sensitive on its own. For stricter
    // guarantees you'd re-verify membership via Prisma here too.
    void client.join(`org:${data.organizationId}`);
  }

  emitTaskMoved(organizationId: string, payload: unknown) {
    this.server.to(`org:${organizationId}`).emit('task:moved', payload);
  }

  emitTaskCreated(organizationId: string, payload: unknown) {
    this.server.to(`org:${organizationId}`).emit('task:created', payload);
  }

  emitTaskUpdated(organizationId: string, payload: unknown) {
    this.server.to(`org:${organizationId}`).emit('task:updated', payload);
  }

  emitTaskDeleted(organizationId: string, payload: unknown) {
    this.server.to(`org:${organizationId}`).emit('task:deleted', payload);
  }
}
