import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength } from 'class-validator';

export class CreateLegalEntityDto {
  @ApiProperty() @IsString() @MinLength(2) name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() registrationNo?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() gstNo?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() panNo?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() tanNo?: string;
  @ApiPropertyOptional() @IsOptional() address?: Record<string, unknown>;
}
