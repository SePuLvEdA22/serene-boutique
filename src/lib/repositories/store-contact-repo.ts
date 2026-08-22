import type { Contact } from '@/lib/models';
import type { IContactRepository } from './interfaces';
import { db } from '@/lib/db';

export class StoreContactRepository implements IContactRepository {
  async findAll(): Promise<Contact[]> {
    return db.contacts.get();
  }

  async create(contact: Contact): Promise<void> {
    const contacts = await db.contacts.get();
    await db.contacts.set([...contacts, contact]);
  }

  async markRead(id: string, read: boolean): Promise<Contact | undefined> {
    const contacts = await db.contacts.get();
    const target = contacts.find((c) => c.id === id);
    if (!target) return undefined;
    const updated = { ...target, read };
    await db.contacts.set(contacts.map((c) => (c.id === id ? updated : c)));
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const contacts = await db.contacts.get();
    const next = contacts.filter((c) => c.id !== id);
    if (next.length === contacts.length) return false;
    await db.contacts.set(next);
    return true;
  }
}
