import type { Settings } from '@/lib/models/settings';
import type { ISettingsRepository } from './interfaces';
import { db } from '@/lib/db';

export class StoreSettingsRepository implements ISettingsRepository {
  async get(): Promise<Settings> {
    return db.settings.get();
  }

  async update(data: Partial<Settings>): Promise<Settings> {
    const current = await db.settings.get();
    const next = { ...current, ...data };
    await db.settings.set(next);
    return next;
  }
}
