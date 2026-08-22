import type { User } from '@/lib/models';
import type { IUserRepository } from './interfaces';
import { db } from '@/lib/db';

export class StoreUserRepository implements IUserRepository {
  async findAll(): Promise<User[]> {
    return db.users.get();
  }

  async findById(id: string): Promise<User | undefined> {
    const users = await db.users.get();
    return users.find(u => u.id === id);
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const users = await db.users.get();
    return users.find(u => u.email === email);
  }

  async create(user: User): Promise<void> {
    const users = await db.users.get();
    await db.users.set([...users, user]);
  }

  async update(id: string, data: Partial<User>): Promise<void> {
    const list = await db.users.get();
    const index = list.findIndex(u => u.id === id);
    if (index === -1) return;
    list[index] = { ...list[index], ...data };
    await db.users.set(list);
  }

  async delete(id: string): Promise<boolean> {
    const list = await db.users.get();
    const index = list.findIndex(u => u.id === id);
    if (index === -1) return false;
    list.splice(index, 1);
    await db.users.set(list);
    return true;
  }
}
