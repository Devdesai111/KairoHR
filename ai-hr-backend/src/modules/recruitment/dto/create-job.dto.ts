import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber, IsDateString, Min } from 'class-validator';
import { EmploymentType } from '@prisma/client';

export class CreateJobDto {
  @ApiProperty() @IsString() title: string;
  @ApiPropertyOptional() @IsOptional() @IsString() departmentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() locationId?: string;
  @ApiPropertyOptional({ enum: EmploymentType }) @IsOptional() @IsEnum(EmploymentType) employmentType?: EmploymentType;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) experienceMin?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() experienceMax?: number;
  @ApiPropertyOptional() @IsOptional() salaryRange?: { min: number; max: number };
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() requirements?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(1) openings?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() hiringManagerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() closingDate?: string;
}
