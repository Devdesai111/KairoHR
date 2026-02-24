import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsDateString, IsOptional } from 'class-validator';

export class CreateRegularizationDto {
  @ApiProperty() @IsDateString() date: string;
  @ApiPropertyOptional() @IsOptional() @IsString() requestedCheckIn?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() requestedCheckOut?: string;
  @ApiProperty() @IsString() reason: string;
}
