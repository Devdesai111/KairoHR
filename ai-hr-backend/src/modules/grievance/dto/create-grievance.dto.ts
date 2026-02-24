import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { GrievancePriority } from '@prisma/client';

export class CreateGrievanceDto {
  @ApiProperty() @IsString() subject: string;
  @ApiProperty() @IsString() description: string;
  @ApiPropertyOptional() @IsOptional() @IsString() category?: string;
  @ApiPropertyOptional({ enum: GrievancePriority }) @IsOptional() @IsEnum(GrievancePriority) priority?: GrievancePriority;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isAnonymous?: boolean;
}
