import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettings(orgId: string) {
    const settings = await this.prisma.systemSetting.findMany({ where: { orgId } });
    return settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, unknown>);
  }

  async updateSetting(orgId: string, key: string, value: unknown) {
    return this.prisma.systemSetting.upsert({
      where: { orgId_key: { orgId, key } },
      create: { orgId, key, value: value as any },
      update: { value: value as any },
    });
  }

  async getNotificationPreferences(userId: string) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  async updateNotificationPreferences(userId: string, data: { email?: Record<string, boolean>; inApp?: Record<string, boolean>; push?: Record<string, boolean> }) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId, email: data.email ?? {}, inApp: data.inApp ?? {}, push: data.push ?? {} },
      update: { email: data.email as any, inApp: data.inApp as any, push: data.push as any },
    });
  }

  async getIntegrations(orgId: string) {
    return this.prisma.integration.findMany({ where: { orgId }, orderBy: { name: 'asc' } });
  }

  async upsertIntegration(orgId: string, data: { name: string; type: string; config: Record<string, unknown>; isActive: boolean }) {
    return this.prisma.integration.upsert({
      where: { id: `${orgId}-${data.type}` },
      create: { id: `${orgId}-${data.type}`, orgId, ...(data as any) },
      update: { config: data.config as any, isActive: data.isActive },
    }).catch(() => this.prisma.integration.create({ data: { orgId, ...(data as any) } }));
  }
}
