import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class CreateShiftDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty({ example: '09:00' }) @IsString() startTime: string;
  @ApiProperty({ example: '18:00' }) @IsString() endTime: string;
  @ApiProperty() @IsNumber() @Min(1) @Max(24) workHours: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() breakDuration?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() gracePeriod?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() color?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() type?: string;
}
