import type { Product } from '../domain/types';

const optionalAddOns = [
  { id: '00000000-0000-4000-8000-000000000306', name: 'Helium cluster', description: 'A floating helium balloon cluster to complement the setup.', price: { amountMinor: 0, currency: 'SGD' as const }, priceOnRequest: true, isActive: true },
  { id: '00000000-0000-4000-8000-000000000307', name: 'Table centrepiece', description: 'A coordinated centrepiece for your celebration table.', price: { amountMinor: 0, currency: 'SGD' as const }, priceOnRequest: true, isActive: true },
  { id: '00000000-0000-4000-8000-000000000308', name: 'Themed plates & cutleries', description: 'Themed plates and cutleries coordinated with your setup.', price: { amountMinor: 0, currency: 'SGD' as const }, priceOnRequest: true, isActive: true },
  { id: '00000000-0000-4000-8000-000000000309', name: 'Additional custom backdrop', description: 'Add another custom backdrop to expand your celebration styling.', price: { amountMinor: 0, currency: 'SGD' as const }, priceOnRequest: true, isActive: true },
  { id: '00000000-0000-4000-8000-000000000310', name: 'Additional themed cutout', description: 'Add another themed cutout to bring more personality to the setup.', price: { amountMinor: 0, currency: 'SGD' as const }, priceOnRequest: true, isActive: true },
  { id: '00000000-0000-4000-8000-000000000311', name: 'Additional pedestal', description: 'Add another display pedestal for cake, florals, or styling details.', price: { amountMinor: 0, currency: 'SGD' as const }, priceOnRequest: true, isActive: true },
  { id: '00000000-0000-4000-8000-000000000312', name: 'Number light / number column', description: 'Add a statement number light or number column.', price: { amountMinor: 0, currency: 'SGD' as const }, priceOnRequest: true, isActive: true },
  { id: '00000000-0000-4000-8000-000000000313', name: 'Welcome board', description: 'Add a coordinated welcome board for your guests.', price: { amountMinor: 0, currency: 'SGD' as const }, priceOnRequest: true, isActive: true },
  { id: '00000000-0000-4000-8000-000000000314', name: 'Entrance decor', description: 'Extend the styling to your venue entrance.', price: { amountMinor: 0, currency: 'SGD' as const }, priceOnRequest: true, isActive: true },
  { id: '00000000-0000-4000-8000-000000000315', name: 'Wall decor', description: 'Add coordinated decor to venue walls.', price: { amountMinor: 0, currency: 'SGD' as const }, priceOnRequest: true, isActive: true },
  { id: '00000000-0000-4000-8000-000000000316', name: 'Floor decor', description: 'Add floor-level styling details to complete the space.', price: { amountMinor: 0, currency: 'SGD' as const }, priceOnRequest: true, isActive: true },
  { id: '00000000-0000-4000-8000-000000000317', name: 'Dessert table decor', description: 'Style the dessert table to match your celebration theme.', price: { amountMinor: 0, currency: 'SGD' as const }, priceOnRequest: true, isActive: true },
];

/** Development-only catalogue data. Prices and copy are approved draft content. */
export const exampleCatalogue: Product[] = [
  {
    id: '00000000-0000-4000-8000-000000000001', categoryId: null,
    name: 'Classic Setup', slug: 'classic-setup',
    description: 'Perfect for a beautiful, simple celebration setup.', sku: 'BBSG-CLASSIC-001', frontImageName: 'IMG_0802.JPG',
    basePrice: { amountMinor: 39800, currency: 'SGD' }, tags: ['classic', 'essential'],
    included: ['1 custom backdrop', '2 themed cutouts', '1 pedestal', 'Stress-free setup and delivery at your venue'], displayOrder: 1, isActive: true,
    options: [], addOns: optionalAddOns,
    images: [{ id: '00000000-0000-4000-8000-000000000401', productId: '00000000-0000-4000-8000-000000000001', storagePath: '/img1.jpeg', altText: 'Classic balloon decoration setup', isPrimary: true, displayOrder: 1 }],
  },
  {
    id: '00000000-0000-4000-8000-000000000002', categoryId: null,
    name: 'Signature Setup', slug: 'signature-setup',
    description: 'A fuller celebration setup with additional styling and personalised elements.', sku: 'BBSG-SIGNATURE-001', frontImageName: 'dji_mimo_20260801_105734_20260801105734_1785553527765_photo.JPG',
    basePrice: { amountMinor: 45000, currency: 'SGD' }, tags: ['signature', 'most popular'], highlightLabel: 'Most Popular',
    included: ['2 custom backdrops', '2 themed cutouts', '2 pedestals', 'Number light / number column', 'Welcome board', 'Stress-free setup and delivery at your venue'], displayOrder: 2, isActive: true,
    options: [], addOns: optionalAddOns,
    images: [{ id: '00000000-0000-4000-8000-000000000402', productId: '00000000-0000-4000-8000-000000000002', storagePath: '/img4.jpeg', altText: 'Signature balloon decoration setup', isPrimary: true, displayOrder: 1 }],
  },
  {
    id: '00000000-0000-4000-8000-000000000003', categoryId: null,
    name: 'Premium Setup', slug: 'premium-setup',
    description: 'The complete event styling experience — from the main backdrop to the entrance, walls, floor, and dessert table.', sku: 'BBSG-PREMIUM-001', frontImageName: 'd059efa2-d557-46dd-a1d5-4f91cf32f4f9.jpg',
    basePrice: { amountMinor: 75000, currency: 'SGD' }, tags: ['premium', 'full event styling'],
    included: ['3+ custom backdrops or 1 large custom backdrop up to 500cm wide', '3+ themed cutouts', '3 pedestals', 'Number light / number column', 'Welcome board', 'Entrance decor', 'Wall decor', 'Floor decor', 'Dessert table decor', 'Stress-free setup and delivery at your venue'], displayOrder: 3, isActive: true,
    options: [], addOns: optionalAddOns,
    images: [{ id: '00000000-0000-4000-8000-000000000403', productId: '00000000-0000-4000-8000-000000000003', storagePath: '/img7.jpeg', altText: 'Premium balloon decoration setup', isPrimary: true, displayOrder: 1 }],
  },
];
