import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ProductImage from '../../components/ui/ProductImage';
import Button from '../../components/ui/Button';
import formatCurrency from '../../utils/formatCurrency';
import * as orderService from '../../services/orderService';

const TRACK_STEPS = [
  { key: 'pending', label: 'Order Placed' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'In Transit' },
  { key: 'delivered', label: 'Delivered' },
];

export default function CheckoutConfirmation() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    orderService.getOrder(orderId).then(setOrder);
  }, [orderId]);

  if (!order) {
    return <div className="container-page py-24 text-center text-ink-400">Loading your order...</div>;
  }

  const currentStepIndex = Math.max(0, TRACK_STEPS.findIndex((s) => s.key === order.status));
  const paymentFailed = order.paymentStatus === 'failed';

  return (
    <div className="container-page py-14 text-center">
      {paymentFailed ? (
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl text-red-600">
          ✕
        </span>
      ) : (
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sage-100 text-2xl text-sage-700">
          ✓
        </span>
      )}
      <h1 className="mt-6 text-3xl font-bold text-ink-900">
        {paymentFailed ? 'Payment Not Completed' : 'Thank You for your Order'}
      </h1>
      <p className="mt-2 text-ink-600">
        {paymentFailed
          ? 'Your order is saved, but the payment didn’t go through. Try again or choose Cash on Delivery.'
          : "We're preparing your order with care."}
      </p>
      {paymentFailed && (
        <Button as={Link} to="/checkout/payment" state={{ order }} className="mt-4">
          Retry Payment
        </Button>
      )}

      <div className="mx-auto mt-8 flex max-w-md flex-wrap justify-center gap-4">
        <div className="rounded-xl bg-cream-100 px-6 py-3 text-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Order Number</p>
          <p className="font-bold text-ink-900">#{order._id.slice(-8).toUpperCase()}</p>
        </div>
        <div className="rounded-xl bg-cream-100 px-6 py-3 text-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Payment Status</p>
          <p className="font-bold capitalize text-ink-900">{order.paymentStatus}</p>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-2xl rounded-2xl bg-white p-8 text-left shadow-sm ring-1 ring-ink-100/60">
        <h2 className="text-lg font-bold text-ink-900">Track your delivery</h2>
        <div className="mt-8 flex items-center justify-between">
          {TRACK_STEPS.map((step, i) => (
            <div key={step.key} className="flex flex-1 flex-col items-center text-center">
              <div className="flex w-full items-center">
                <span className={`h-px flex-1 ${i === 0 ? 'invisible' : i <= currentStepIndex ? 'bg-plum-500' : 'bg-ink-100'}`} />
                <span
                  className={`mx-1 h-3 w-3 rounded-full ${i <= currentStepIndex ? 'bg-plum-500' : 'bg-ink-200'}`}
                />
                <span
                  className={`h-px flex-1 ${i === TRACK_STEPS.length - 1 ? 'invisible' : i < currentStepIndex ? 'bg-plum-500' : 'bg-ink-100'}`}
                />
              </div>
              <p className={`mt-2 text-xs font-semibold ${i <= currentStepIndex ? 'text-plum-600' : 'text-ink-400'}`}>
                {step.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-6 text-left sm:grid-cols-2">
        <div className="rounded-2xl bg-cream-100 p-6">
          <h3 className="text-lg font-bold text-ink-900">Order Summary</h3>
          <div className="mt-4 space-y-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                  <ProductImage src={item.image} alt={item.name} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink-800">{item.name}</p>
                  <p className="text-xs text-ink-400">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-plum-600">{formatCurrency(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-cream-100 p-6">
          <h3 className="text-lg font-bold text-ink-900">Payment Details</h3>
          <div className="mt-4 space-y-2 text-sm text-ink-700">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(order.itemsTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery</span>
              <span className="text-sage-600">{order.shippingFee ? formatCurrency(order.shippingFee) : 'Free'}</span>
            </div>
            <div className="flex justify-between border-t border-ink-200 pt-2 text-base font-bold text-ink-900">
              <span>Total</span>
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-400">Delivering To</p>
          <p className="text-sm text-ink-700">
            {order.shippingAddress.city}, {order.shippingAddress.country}
          </p>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Button as={Link} to="/shop">
          Continue Shopping
        </Button>
        <Button as={Link} to="/account/orders" variant="outline">
          View Order History
        </Button>
      </div>
    </div>
  );
}
