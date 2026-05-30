export interface StoreUser {
  id: string;
  name: string;
  email: string;
  password: string;
}

export const db = {
  users: [] as StoreUser[],
};
