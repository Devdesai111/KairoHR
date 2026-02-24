import { PartialType } from '@nestjs/swagger';
import { CreateEmployeeDto } from './create-employee.dto';
import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EmployeeStatus } from '@prisma/client';

export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {
  @ApiPropertyOptional({ enum: EmployeeStatus }) @IsOptional() @IsEnum(EmployeeStatus) status?: EmployeeStatus;
  @ApiPropertyOptional() @IsOptional() dateOfExit?: string;
}
