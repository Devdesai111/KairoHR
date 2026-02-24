import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class CheckInDto {
  @ApiPropertyOptional() @IsOptional() @IsString() locationId?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isRemote?: boolean;
  @ApiPropertyOptional() @IsOptional() geoLocation?: { lat: number; lng: number };
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
