import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class ChatMessageDto {
  @ApiProperty() @IsString() message: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sessionId?: string;
}
