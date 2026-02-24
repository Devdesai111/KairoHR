import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength } from 'class-validator';

export class CreateDepartmentDto {
  @ApiProperty() @IsString() @MinLength(2) name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() code?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() parentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() locationId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() headEmployeeId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}
