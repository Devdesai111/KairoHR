import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo(): { name: string; version: string; status: string } {
    return {
      name: 'AI HR API',
      version: '1.0.0',
      status: 'running',
    };
  }
}
