import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import ProductImage from '../components/ui/ProductImage';
import Button from '../components/ui/Button';
import formatCurrency from '../utils/formatCurrency';
import getErrorMessage from '../utils/getErrorMessage';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import * as wishlistService from '../services/wishlistService';
import * as productService from '../services/productService';

export default function Wishlist() {
  const { wishlist, refreshWishlist } = useWishlist();
  const { refreshCart } = useCart();
  const [busyId, setBusyId] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  const products = wishlist?.products || [];

  useEffect(() => {
    productService.getProducts({ limit: 2, sort: '-ratingsAverage' }).then(({ products: results }) => setSuggestions(results));
  }, []);

  async function handleRemove(productId) {
    setBusyId(productId);
    try {
      await wishlistService.removeFromWishlist(productId);
      await refreshWishlist();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleMoveToCart(productId) {
    setBusyId(productId);
    try {
      await wishlistService.moveToCart(productId, 1);
      await Promise.all([refreshWishlist(), refreshCart()]);
      toast.success('Moved to cart');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="container-page py-10">
      <p className="text-sm text-ink-500">
        <Link to="/" className="hover:text-plum-600">
          Home
        </Link>{' '}
        › My Wishlist
      </p>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink-900">Your Wishlist</h1>
          <p className="mt-1 max-w-xl text-ink-600">
            A space for the books that caught your eye. Save them now, read them later.
          </p>
        </div>
        {products.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              toast.success('Wishlist link copied');
            }}
          >
            Share Wishlist
          </Button>
        )}
      </div>

      {products.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-ink-500">Your wishlist is empty. Start saving books you love.</p>
          <Button as={Link} to="/shop">
            Explore the Shop
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => {
            const isBusy = busyId === product._id;
            return (
              <div key={product._id} className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink-100/60">
                <div className="relative aspect-square">
                  <ProductImage src={product.images?.[0]} alt={product.name} />
                  {product.tags?.[0] && (
                    <span className="absolute left-3 top-3 rounded-md bg-ink-800 px-2 py-1 text-[10px] font-semibold uppercase text-white">
                      {product.tags[0]}
                    </span>
                  )}
                  <button
                    onClick={() => handleRemove(product._id)}
                    disabled={isBusy}
                    aria-label="Remove from wishlist"
                    className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-plum-600 shadow-sm"
                  >
                    ♥
                  </button>
                </div>
                <div className="flex flex-1 flex-col gap-1 p-4">
                  <Link to={`/products/${product._id}`} className="font-semibold text-ink-900 hover:text-plum-600">
                    {product.name}
                  </Link>
                  <p className="font-semibold text-plum-600">{formatCurrency(product.discountPrice ?? product.price)}</p>
                  <Button
                    size="sm"
                    className="mt-auto"
                    onClick={() => handleMoveToCart(product._id)}
                    disabled={isBusy || product.stock === 0}
                  >
                    {product.stock === 0 ? 'Out of Stock' : 'Move to Cart'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="mt-16 border-t border-ink-100 pt-10">
          <h2 className="text-xl font-bold text-ink-900">Recommended for You</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {suggestions.map((p) => (
              <div key={p._id} className="flex items-center gap-4 rounded-xl bg-cream-100 p-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                  <ProductImage src={p.images?.[0]} alt={p.name} />
                </div>
                <div>
                  <Link to={`/products/${p._id}`} className="font-medium text-ink-800 hover:text-plum-600">
                    {p.name}
                  </Link>
                  <p className="text-sm font-semibold text-plum-600">{formatCurrency(p.price)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
