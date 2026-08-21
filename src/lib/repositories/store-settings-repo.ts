import type { Settings } from '@/lib/models/settings';
import type { ISettingsRepository } from './interfaces';
import { db } from '@/lib/db';

export class StoreSettingsRepository implements ISettingsRepository {
  get(): Settings {
    return db.settings.get();
  }

  update(data: Partial<Settings>): Settings {
    const next = { ...this.get(), ...data };
    db.settings.set(next);
    return next;
  }
}