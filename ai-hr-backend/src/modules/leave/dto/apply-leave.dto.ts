import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { HalfDayType } from '@prisma/client';

export class ApplyLeaveDto {
  @ApiProperty() @IsString() leaveTypeId: string;
  @ApiProperty() @IsDateString() fromDate: string;
  @ApiProperty() @IsDateString() toDate: string;
  @ApiProperty() @IsString() reason: string;
  @ApiPropertyOptional({ enum: HalfDayType }) @IsOptional() @IsEnum(HalfDayType) halfDayType?: HalfDayType;
  @ApiPropertyOptional() @IsOptional() @IsString() attachmentUrl?: string;
}
