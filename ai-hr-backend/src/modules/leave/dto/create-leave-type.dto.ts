import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateLeaveTypeDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() code: string;
  @ApiPropertyOptional() @IsOptional() @IsString() color?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPaid?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) maxDaysPerYear?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) carryForwardMax?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isEncashable?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isProRata?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsNumber() applicableFromMonths?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() genderRestriction?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() requiresApproval?: boolean;
}
