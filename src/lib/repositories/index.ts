import { StoreProductRepository } from './store-product-repo';
import { StoreUserRepository } from './store-user-repo';
import { StoreOrderRepository } from './store-order-repo';
import { StoreContactRepository } from './store-contact-repo';
import { StoreSubscriberRepository } from './store-subscriber-repo';
import { StoreSettingsRepository } from './store-settings-repo';
import { StorePromoRepository } from './store-promo-repo';

let productRepo: ReturnType<typeof createProductRepo>;
let userRepo: ReturnType<typeof createUserRepo>;
let orderRepo: ReturnType<typeof createOrderRepo>;
let contactRepo: ReturnType<typeof createContactRepo>;
let subscriberRepo: ReturnType<typeof createSubscriberRepo>;
let settingsRepo: ReturnType<typeof createSettingsRepo>;
let promoRepo: ReturnType<typeof createPromoRepo>;

function createProductRepo() { return new StoreProductRepository(); }
function createUserRepo() { return new StoreUserRepository(); }
function createOrderRepo() { return new StoreOrderRepository(); }
function createContactRepo() { return new StoreContactRepository(); }
function createSubscriberRepo() { return new StoreSubscriberRepository(); }
function createSettingsRepo() { return new StoreSettingsRepository(); }
function createPromoRepo() { return new StorePromoRepository(); }

export function getProductRepo() { return productRepo ??= createProductRepo(); }
export function getUserRepo() { return userRepo ??= createUserRepo(); }
export function getOrderRepo() { return orderRepo ??= createOrderRepo(); }
export function getContactRepo() { return contactRepo ??= createContactRepo(); }
export function getSubscriberRepo() { return subscriberRepo ??= createSubscriberRepo(); }
export function getSettingsRepo() { return settingsRepo ??= createSettingsRepo(); }
export function getPromoRepo() { return promoRepo ??= createPromoRepo(); }

export type {
  IProductRepository,
  IUserRepository,
  IOrderRepository,
  IContactRepository,
  ISubscriberRepository,
  ISettingsRepository,
  IPromoRepository,
} from './interfaces';
