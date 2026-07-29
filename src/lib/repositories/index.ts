import { StoreProductRepository } from './store-product-repo';
import { StoreUserRepository } from './store-user-repo';
import { StoreOrderRepository } from './store-order-repo';
import { StoreContactRepository } from './store-contact-repo';
import { StoreSubscriberRepository } from './store-subscriber-repo';

let productRepo: ReturnType<typeof createProductRepo>;
let userRepo: ReturnType<typeof createUserRepo>;
let orderRepo: ReturnType<typeof createOrderRepo>;
let contactRepo: ReturnType<typeof createContactRepo>;
let subscriberRepo: ReturnType<typeof createSubscriberRepo>;

function createProductRepo() { return new StoreProductRepository(); }
function createUserRepo() { return new StoreUserRepository(); }
function createOrderRepo() { return new StoreOrderRepository(); }
function createContactRepo() { return new StoreContactRepository(); }
function createSubscriberRepo() { return new StoreSubscriberRepository(); }

export function getProductRepo() { return productRepo ??= createProductRepo(); }
export function getUserRepo() { return userRepo ??= createUserRepo(); }
export function getOrderRepo() { return orderRepo ??= createOrderRepo(); }
export function getContactRepo() { return contactRepo ??= createContactRepo(); }
export function getSubscriberRepo() { return subscriberRepo ??= createSubscriberRepo(); }

export type {
  IProductRepository,
  IUserRepository,
  IOrderRepository,
  IContactRepository,
  ISubscriberRepository,
} from './interfaces';
