import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateReimbursementDto {
  @ApiProperty() @IsString() type: string;
  @ApiProperty() @IsNumber() @Min(0) amount: number;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() receiptUrl?: string;
}
