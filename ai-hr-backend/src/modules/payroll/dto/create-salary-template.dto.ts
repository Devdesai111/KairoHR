import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsOptional, Min } from 'class-validator';

export class SalaryComponentDto {
  name: string;
  type: 'EARNING' | 'DEDUCTION';
  calculationType: 'FIXED' | 'PERCENTAGE';
  value: number;
  basedOn?: string;
  isStatutory?: boolean;
}

export class CreateSalaryTemplateDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsNumber() @Min(0) ctc: number;
  @ApiProperty({ type: [Object] }) @IsArray() components: SalaryComponentDto[];
}
