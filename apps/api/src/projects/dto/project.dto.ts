import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class ReorderColumnDto {
  @IsInt()
  @Min(0)
  position: number;
}

export class CreateColumnDto {
  @IsString()
  @MinLength(1)
  name: string;
}

export class RenameColumnDto {
  @IsString()
  @MinLength(1)
  name: string;
}
