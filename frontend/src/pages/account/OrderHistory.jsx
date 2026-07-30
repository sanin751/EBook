import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import OrderStatusBadge from '../../components/ui/OrderStatusBadge';
import Button from '../../components/ui/Button';
import formatCurrency from '../../utils/formatCurrency';
import * as orderService from '../../services/orderService';

export default function OrderHistory() {
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    orderService.getOrders().then(setOrders);
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-ink-900">Order History</h1>
      <p className="mt-1 text-ink-600">Manage your orders and track recent deliveries.</p>

      {orders === null ? (
        <p className="mt-10 text-ink-400">Loading orders...</p>
      ) : orders.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-ink-500">You haven&apos;t placed any orders yet.</p>
          <Button as={Link} to="/shop">
            Start Shopping
          </Button>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink-100/60">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <OrderStatusBadge status={order.status} />
                  <span className="text-sm text-ink-500">Order #{order._id.slice(-8).toUpperCase()}</span>
                </div>
                <p className="text-lg font-bold text-plum-600">{formatCurrency(order.totalAmount)}</p>
              </div>
              <p className="mt-2 text-lg font-semibold text-ink-900">
                Placed on{' '}
                {new Date(order.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <p className="mt-1 text-sm text-ink-500">
                {order.items.map((i) => i.name).join(', ')}
              </p>
              <div className="mt-4 flex gap-3">
                <Button as={Link} to={`/checkout/confirmation/${order._id}`} size="sm" variant="neutral">
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
