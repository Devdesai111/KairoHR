import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, Max } from 'class-validator';

export class CreatePayrollRunDto {
  @ApiProperty() @IsNumber() @Min(1) @Max(12) month: number;
  @ApiProperty() @IsNumber() @Min(2020) year: number;
}
