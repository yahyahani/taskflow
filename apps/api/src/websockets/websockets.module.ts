import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { BoardGateway } from './board.gateway';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
    }),
  ],
  providers: [BoardGateway],
  exports: [BoardGateway],
})
export class WebsocketsModule {}
