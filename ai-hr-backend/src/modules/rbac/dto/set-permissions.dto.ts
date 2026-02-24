import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class SetPermissionsDto {
  @ApiProperty({ type: [String], example: ['employees.view', 'employees.create'] })
  @IsArray()
  @IsString({ each: true })
  permissionIds: string[];
}
