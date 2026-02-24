import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsDateString, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class CreateMeetingDto {
  @ApiProperty() @IsString() title: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() roomId?: string;
  @ApiProperty() @IsDateString() startTime: string;
  @ApiProperty() @IsDateString() endTime: string;
  @ApiPropertyOptional() @IsOptional() @IsString() meetingLink?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() agenda?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() participantIds?: string[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isRecurring?: boolean;
  @ApiPropertyOptional() @IsOptional() recurrenceRule?: Record<string, unknown>;
}
