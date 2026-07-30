import { NavLink, Outlet } from 'react-router-dom';
import clsx from 'clsx';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/account', label: 'Overview', end: true },
  { to: '/account/orders', label: 'Order History', hideForAdmin: true },
  { to: '/account/manage-orders', label: 'Order Details', adminOnly: true },
  { to: '/account/security', label: 'Security Log', adminOnly: true },
  { to: '/wishlist', label: 'Wishlist', hideForAdmin: true },
  { to: '/account/settings', label: 'Settings' },
];

export default function AccountLayout() {
  const { logout, isAdmin } = useAuth();

  async function handleLogout() {
    await logout();
    toast.success('Signed out');
  }

  const navItems = NAV_ITEMS.filter((item) => !(isAdmin && item.hideForAdmin) && !(!isAdmin && item.adminOnly));

  return (
    <div className="container-page py-10">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-1">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">Account Menu</p>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                clsx(
                  'block rounded-xl px-4 py-2.5 text-sm font-medium',
                  isActive ? 'bg-plum-500 text-white' : 'text-ink-700 hover:bg-cream-100'
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="mt-4 block w-full rounded-xl px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Sign Out
          </button>
        </aside>

        <div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
