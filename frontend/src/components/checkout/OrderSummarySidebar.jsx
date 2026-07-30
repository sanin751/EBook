import ProductImage from '../ui/ProductImage';
import formatCurrency from '../../utils/formatCurrency';

export default function OrderSummarySidebar({ items, subtotal, shippingFee = 0, total, note }) {
  return (
    <aside className="h-fit rounded-2xl bg-cream-100 p-6">
      <h2 className="text-xl font-bold text-ink-900">Order Summary</h2>

      <div className="mt-4 space-y-3">
        {items.map((item, i) => (
          <div key={item._id || item.product?._id || item.product || i} className="flex items-center gap-3">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg">
              <ProductImage src={item.product?.images?.[0] || item.image} alt={item.product?.name || item.name} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink-800">{item.product?.name || item.name}</p>
              <p className="text-xs text-ink-400">
                {[item.selectedColor, item.variantLabel].filter(Boolean).join(' • ') || `Qty: ${item.quantity}`}
              </p>
            </div>
            <p className="text-sm font-semibold text-plum-600">{formatCurrency(item.price * item.quantity)}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-2 border-t border-ink-200 pt-4 text-sm text-ink-700">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="font-semibold">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Delivery</span>
          <span className="font-semibold text-sage-600">{shippingFee ? formatCurrency(shippingFee) : 'Free'}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-ink-200 pt-4">
        <span className="text-lg font-bold text-ink-900">Total</span>
        <span className="text-lg font-bold text-plum-600">{formatCurrency(total)}</span>
      </div>

      {note && (
        <div className="mt-5 flex gap-2 rounded-xl bg-sage-50 p-4 text-sm text-sage-700">
          <span aria-hidden="true">🌱</span>
          <p>{note}</p>
        </div>
      )}
    </aside>
  );
}
