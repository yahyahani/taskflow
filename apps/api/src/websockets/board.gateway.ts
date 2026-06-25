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
import { PrismaService } from '../common/prisma/prisma.service';
import { JwtPayload } from '../common/types/auth.types';

/**
 * Each connected client joins a room named after their active
 * organizationId. Broadcasts are scoped to that room, so a board update
 * in Org A is never sent to a socket connected under Org B — even if
 * that socket is the same physical browser tab switching tenants.
 */
@WebSocketGateway({
  cors: { origin: process.env['WEB_ORIGIN'] ?? 'http://localhost:3000', credentials: true },
  namespace: 'board',
})
export class BoardGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(BoardGateway.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token as string | undefined;
      if (!token) {
        client.disconnect();
        return;
      }
      // Verify the access token and store the userId so join-organization
      // can check real membership before admitting the client to a room.
      const payload = this.jwt.verify<JwtPayload>(token);
      client.data.userId = payload.sub;
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-organization')
  async handleJoinOrganization(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { organizationId: string },
  ) {
    const { organizationId } = data;
    // Verify the authenticated user has a membership row for this org before
    // joining the room. Without this check any valid JWT could subscribe to
    // any org's real-time events by sending an arbitrary organizationId.
    const membership = await this.prisma.membership.findFirst({
      where: { userId: client.data.userId as string, organizationId },
    });
    if (!membership) {
      client.emit('error', { message: 'Access denied' });
      return;
    }
    void client.join(`org:${organizationId}`);
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
