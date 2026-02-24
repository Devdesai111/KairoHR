import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { EmployeeStatus, EmploymentType } from '@prisma/client';

export class EmployeeFilterDto extends PaginationDto {
  @ApiPropertyOptional() @IsOptional() @IsString() departmentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() locationId?: string;
  @ApiPropertyOptional({ enum: EmployeeStatus }) @IsOptional() @IsEnum(EmployeeStatus) status?: EmployeeStatus;
  @ApiPropertyOptional({ enum: EmploymentType }) @IsOptional() @IsEnum(EmploymentType) employmentType?: EmploymentType;
  @ApiPropertyOptional() @IsOptional() @IsString() designation?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() managerId?: string;
}
