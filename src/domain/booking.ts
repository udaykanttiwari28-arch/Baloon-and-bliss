import type { BookingItemInput, BookingTotal, Money, Product } from './types';

const currency = 'SGD' as const;

const money = (amountMinor: number): Money => ({ amountMinor, currency });

/** Calculates a quote from trusted catalogue data, never browser-submitted prices. */
export function calculateBookingTotal(
  items: BookingItemInput[],
  catalogue: Product[],
  deliveryMinor = 0,
  setupMinor = 0,
): BookingTotal {
  const products = new Map(catalogue.map((product) => [product.id, product]));
  const itemsMinor = items.reduce((total, item) => {
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      throw new Error(`Invalid quantity for product ${item.productId}`);
    }

    const product = products.get(item.productId);
    if (!product || !product.isActive) throw new Error(`Product ${item.productId} is unavailable`);

    const options = new Map(product.options.map((option) => [option.id, option]));
    const addOns = new Map(product.addOns.map((addOn) => [addOn.id, addOn]));
    const optionsMinor = item.optionIds.reduce((sum, optionId) => {
      const option = options.get(optionId);
      if (!option || !option.isActive) throw new Error(`Option ${optionId} is unavailable`);
      return sum + option.price.amountMinor;
    }, 0);
    const addOnsMinor = item.addOnIds.reduce((sum, addOnId) => {
      const addOn = addOns.get(addOnId);
      if (!addOn || !addOn.isActive) throw new Error(`Add-on ${addOnId} is unavailable`);
      return sum + addOn.price.amountMinor;
    }, 0);

    return total + (product.basePrice.amountMinor + optionsMinor + addOnsMinor) * item.quantity;
  }, 0);

  return {
    items: money(itemsMinor),
    delivery: money(deliveryMinor),
    setup: money(setupMinor),
    total: money(itemsMinor + deliveryMinor + setupMinor),
  };
}
