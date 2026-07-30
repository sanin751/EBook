import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import OrderStatusBadge from '../../components/ui/OrderStatusBadge';
import formatCurrency from '../../utils/formatCurrency';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import * as orderService from '../../services/orderService';

export default function AccountOverview() {
  const { user, isAdmin } = useAuth();
  const { wishlist } = useWishlist();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    orderService.getOrders().then(setOrders);
  }, []);

  const activeOrders = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status));
  const recentOrders = orders.slice(0, 5);

  return (
    <div>
      <h1 className="text-3xl font-bold text-ink-900">Welcome back, {user?.name?.split(' ')[0]}</h1>
      <p className="mt-2 max-w-xl text-ink-600">
        Your bookshelf is growing. Here&apos;s a quick look at your orders and tracking details.
      </p>

      {!isAdmin && (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-plum-100 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-plum-700">Active Orders</p>
            <p className="mt-2 text-3xl font-bold text-ink-900">{activeOrders.length}</p>
          </div>
          <div className="rounded-2xl bg-cream-100 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Wishlist</p>
            <p className="mt-2 text-3xl font-bold text-ink-900">{wishlist?.products?.length || 0}</p>
          </div>
        </div>
      )}

      {!isAdmin && (
        <div className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-ink-900">Recent Orders</h2>
            <Link to="/account/orders" className="text-sm font-semibold text-plum-600 hover:underline">
              View All History
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-ink-500">You haven&apos;t placed any orders yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-ink-100/60">
              <table className="w-full min-w-[500px] text-left text-sm">
                <thead className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                  <tr>
                    <th className="px-5 py-3">Order #</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order._id} className="border-t border-ink-100">
                      <td className="px-5 py-4 font-medium text-ink-800">#{order._id.slice(-8).toUpperCase()}</td>
                      <td className="px-5 py-4 text-ink-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-4">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-plum-600">
                        {formatCurrency(order.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="mt-10 rounded-2xl bg-cream-100 p-8">
        <h2 className="text-xl font-bold text-ink-900">Our Promise</h2>
        <p className="mt-2 max-w-2xl text-ink-600">
          Every book in your order was chosen, not just listed. We use crush-resistant, minimal packaging for
          every delivery.
        </p>
        <div className="mt-4 flex gap-4 text-sm font-medium text-sage-700">
          <span>✓ Curated Catalog</span>
          <span>✓ Careful Packaging</span>
        </div>
      </div>
    </div>
  );
}
