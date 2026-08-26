export type Currency = 'SGD';

export type BookingStatus = 'New' | 'Contacted' | 'Confirmed' | 'Cancelled';

export interface Money {
  amountMinor: number;
  currency: Currency;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  displayOrder: number;
  isActive: boolean;
}

export interface ProductOption {
  id: string;
  productId: string;
  name: string;
  price: Money;
  isRequired: boolean;
  displayOrder: number;
  isActive: boolean;
}

export interface AddOn {
  id: string;
  name: string;
  description: string | null;
  price: Money;
  priceOnRequest?: boolean;
  isActive: boolean;
}

export interface ProductImage {
  id: string;
  productId: string;
  storagePath: string;
  altText: string;
  imageUrl?: string;
  isPrimary: boolean;
  displayOrder: number;
}

export interface Product {
  id: string;
  categoryId: string | null;
  name: string;
  slug: string;
  description: string;
  sku: string;
  basePrice: Money;
  tags: string[];
  included: string[];
  highlightLabel?: string;
  frontImageName?: string;
  displayOrder: number;
  isActive: boolean;
  options: ProductOption[];
  addOns: AddOn[];
  images: ProductImage[];
}

export interface BookingItemInput {
  productId: string;
  quantity: number;
  optionIds: string[];
  addOnIds: string[];
}

export interface EventDetails {
  eventDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  postalCode: string;
  specialRequirements: string | null;
}

export interface CustomerDetails {
  name: string;
  email: string;
  mobile: string;
  whatsappOptIn: boolean;
}

export interface BookingRequest {
  customer: CustomerDetails;
  event: EventDetails;
  items: BookingItemInput[];
}

export interface BookingTotal {
  items: Money;
  delivery: Money;
  setup: Money;
  total: Money;
}
