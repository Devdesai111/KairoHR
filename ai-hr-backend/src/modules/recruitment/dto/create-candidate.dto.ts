import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsNumber, IsArray, Min } from 'class-validator';

export class CreateCandidateDto {
  @ApiProperty() @IsString() firstName: string;
  @ApiProperty() @IsString() lastName: string;
  @ApiProperty() @IsEmail() email: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() currentCompany?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() currentDesignation?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) experienceYears?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() expectedCtc?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() noticePeriod?: number;
  @ApiPropertyOptional() @IsOptional() @IsArray() skills?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() source?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() linkedin?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() github?: string;
}
