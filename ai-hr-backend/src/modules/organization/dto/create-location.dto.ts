import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { LocationType } from '@prisma/client';

export class CreateLocationDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() code?: string;
  @ApiPropertyOptional({ enum: LocationType }) @IsOptional() @IsEnum(LocationType) type?: LocationType;
  @ApiPropertyOptional() @IsOptional() @IsString() legalEntityId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() timezone?: string;
  @ApiPropertyOptional() @IsOptional() address?: Record<string, unknown>;
  @ApiPropertyOptional() @IsOptional() coordinates?: Record<string, unknown>;
}
