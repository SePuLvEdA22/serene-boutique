import type { Contact } from '@/lib/models';
import type { IContactRepository } from './interfaces';
import { db } from '@/lib/db';

export class StoreContactRepository implements IContactRepository {
  findAll(): Contact[] {
    return db.contacts.get();
  }

  create(contact: Contact): void {
    db.contacts.set([...db.contacts.get(), contact]);
  }
}
