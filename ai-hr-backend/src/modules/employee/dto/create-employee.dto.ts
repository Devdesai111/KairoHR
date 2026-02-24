import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsEnum, IsDateString, IsBoolean } from 'class-validator';
import { EmploymentType, Gender } from '@prisma/client';

export class CreateEmployeeDto {
  @ApiProperty() @IsString() firstName: string;
  @ApiProperty() @IsString() lastName: string;
  @ApiProperty() @IsEmail() email: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dateOfBirth?: string;
  @ApiPropertyOptional({ enum: Gender }) @IsOptional() @IsEnum(Gender) gender?: Gender;
  @ApiPropertyOptional() @IsOptional() @IsString() designation?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() departmentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() locationId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reportingManagerId?: string;
  @ApiProperty() @IsDateString() dateOfJoining: string;
  @ApiPropertyOptional({ enum: EmploymentType }) @IsOptional() @IsEnum(EmploymentType) employmentType?: EmploymentType;
  @ApiPropertyOptional() @IsOptional() personalDetails?: Record<string, unknown>;
  @ApiPropertyOptional() @IsOptional() emergencyContacts?: unknown[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() createUserAccount?: boolean;
}
