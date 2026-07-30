import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

const NAV_LINKS = [
  { to: '/shop', label: 'Shop All' },
  { to: '/collections', label: 'Collections' },
  { to: '/our-story', label: 'Our Story', hideForAdmin: true },
  { to: '/journal', label: 'Journal', hideForAdmin: true },
];

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 20s-7-4.35-9.5-8.5C.7 8.1 2.4 4.5 6 4.5c2 0 3.5 1 6 3.5 2.5-2.5 4-3.5 6-3.5 3.6 0 5.3 3.6 3.5 7-2.5 4.15-9.5 8.5-9.5 8.5Z" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 4h2l2.4 12.2a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.6L20 8H6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9.5" cy="21" r="1.3" />
      <circle cx="17.5" cy="21" r="1.3" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1.5-4 4.5-6 7.5-6s6 2 7.5 6" strokeLinecap="round" />
    </svg>
  );
}

function IconLink({ to, badge, children, ariaLabel }) {
  return (
    <Link to={to} aria-label={ariaLabel} className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink-800 hover:bg-cream-100">
      {children}
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-plum-500 px-1 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}

export default function Navbar() {
  const { isAuthenticated, isAdmin } = useAuth();
  const { totalItems } = useCart();
  const { productIds } = useWishlist();
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const navLinks = NAV_LINKS.filter((link) => !(isAdmin && link.hideForAdmin));

  function handleSearchSubmit(e) {
    e.preventDefault();
    navigate(search.trim() ? `/shop?search=${encodeURIComponent(search.trim())}` : '/shop');
  }

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-cream-50/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link to="/" className="shrink-0 text-xl font-bold text-plum-600">
          EBook
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-ink-600 md:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                isActive ? 'text-plum-600 underline underline-offset-8' : 'hover:text-ink-800'
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-3">
          <form onSubmit={handleSearchSubmit} className="hidden max-w-xs flex-1 md:block">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search books, authors, genres..."
              className="w-full rounded-full border border-ink-100 bg-white px-4 py-2 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-plum-300"
            />
          </form>

          {!isAdmin && (
            <>
              <IconLink to="/wishlist" ariaLabel="Wishlist" badge={productIds.size}>
                <HeartIcon />
              </IconLink>
              <IconLink to="/cart" ariaLabel="Cart" badge={totalItems}>
                <CartIcon />
              </IconLink>
            </>
          )}
          <IconLink to={isAuthenticated ? '/account' : '/login'} ariaLabel="Account">
            <UserIcon />
          </IconLink>
        </div>
      </div>
    </header>
  );
}
