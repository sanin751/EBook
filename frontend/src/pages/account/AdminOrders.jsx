import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import OrderStatusBadge from '../../components/ui/OrderStatusBadge';
import formatCurrency from '../../utils/formatCurrency';
import { useAuth } from '../../context/AuthContext';
import * as orderService from '../../services/orderService';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Order Placed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'In Transit' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function AdminOrders() {
  const { isAdmin } = useAuth();
  const [orders, setOrders] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    if (!isAdmin) return;
    orderService.getAllOrders().then(setOrders);
  }, [isAdmin]);

  if (!isAdmin) {
    return <Navigate to="/account" replace />;
  }

  async function handleStatusChange(orderId, status) {
    setUpdatingId(orderId);
    try {
      const updated = await orderService.updateOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => (o._id === orderId ? updated : o)));
      toast.success('Delivery status updated');
    } catch {
      toast.error('Could not update order status');
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-ink-900">Order Details</h1>
      <p className="mt-1 text-ink-600">View every customer order and update delivery status as it moves.</p>

      {orders === null ? (
        <p className="mt-10 text-ink-400">Loading orders...</p>
      ) : orders.length === 0 ? (
        <p className="mt-16 text-center text-ink-500">No orders have been placed yet.</p>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink-100/60">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <OrderStatusBadge status={order.status} />
                    <span className="text-sm text-ink-500">Order #{order._id.slice(-8).toUpperCase()}</span>
                  </div>
                  <p className="mt-2 text-lg font-semibold text-ink-900">
                    {order.user?.name || 'Deleted User'}{' '}
                    <span className="font-normal text-ink-500">— {order.user?.email}</span>
                  </p>
                  <p className="mt-1 text-sm text-ink-500">
                    Placed on{' '}
                    {new Date(order.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <p className="text-lg font-bold text-plum-600">{formatCurrency(order.totalAmount)}</p>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Items</p>
                  <p className="mt-1 text-sm text-ink-700">{order.items.map((i) => `${i.name} ×${i.quantity}`).join(', ')}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Delivering To</p>
                  <p className="mt-1 text-sm text-ink-700">
                    {order.shippingAddress.fullName}, {order.shippingAddress.street}, {order.shippingAddress.city}
                    {order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ''}, {order.shippingAddress.country}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-ink-100 pt-4">
                <label htmlFor={`status-${order._id}`} className="text-sm font-semibold text-ink-700">
                  Update Delivery Status
                </label>
                <select
                  id={`status-${order._id}`}
                  value={order.status}
                  disabled={updatingId === order._id}
                  onChange={(e) => handleStatusChange(order._id, e.target.value)}
                  className="rounded-xl border border-transparent bg-cream-100 px-4 py-2 text-sm font-medium text-ink-800 focus:outline-none focus:ring-2 focus:ring-plum-300 disabled:opacity-50"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
                {updatingId === order._id && <span className="text-xs text-ink-400">Saving...</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
