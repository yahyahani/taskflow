import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { WebsocketsModule } from '../websockets/websockets.module';

@Module({
  imports: [WebsocketsModule],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
