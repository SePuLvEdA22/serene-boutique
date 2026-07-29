import type { User } from '@/lib/models';
import type { IUserRepository } from './interfaces';
import { db } from '@/lib/db';

export class StoreUserRepository implements IUserRepository {
  findAll(): User[] {
    return db.users.get();
  }

  findById(id: string): User | undefined {
    return db.users.get().find(u => u.id === id);
  }

  findByEmail(email: string): User | undefined {
    return db.users.get().find(u => u.email === email);
  }

  create(user: User): void {
    db.users.set([...db.users.get(), user]);
  }

  update(id: string, data: Partial<User>): void {
    const list = db.users.get();
    const index = list.findIndex(u => u.id === id);
    if (index === -1) return;
    list[index] = { ...list[index], ...data };
    db.users.set(list);
  }
}
