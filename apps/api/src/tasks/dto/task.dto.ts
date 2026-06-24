import { IsDateString, IsEnum, IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export enum TaskStatusDto {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE',
}

export class CreateTaskDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  columnId: string;

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

// Used specifically for drag-and-drop: move a task to a (possibly new)
// column and position, which also updates its status.
export class MoveTaskDto {
  @IsString()
  columnId: string;

  @IsInt()
  position: number;

  @IsEnum(TaskStatusDto)
  status: TaskStatusDto;
}
