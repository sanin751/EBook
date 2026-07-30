import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import ProductImage from '../ui/ProductImage';
import Badge from '../ui/Badge';
import RatingStars from '../ui/RatingStars';
import Button from '../ui/Button';
import formatCurrency from '../../utils/formatCurrency';
import getErrorMessage from '../../utils/getErrorMessage';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useCompare } from '../../context/CompareContext';
import * as cartService from '../../services/cartService';
import * as wishlistService from '../../services/wishlistService';

export default function ProductCard({ product, compact = false, showCompare = false, onEdit, onDelete }) {
  const { isAuthenticated, isAdmin } = useAuth();
  const { refreshCart } = useCart();
  const { isSaved, refreshWishlist } = useWishlist();
  const compareCtx = useCompare();
  const [busy, setBusy] = useState(false);

  const saved = isSaved(product._id);
  const price = product.discountPrice ?? product.price;
  const image = product.images?.[0];

  async function handleAddToCart(e) {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info('Please sign in to add items to your cart');
      return;
    }
    setBusy(true);
    try {
      await cartService.addToCart({ productId: product._id, quantity: 1 });
      await refreshCart();
      toast.success(`${product.name} added to cart`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleWishlist(e) {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info('Please sign in to save items');
      return;
    }
    setBusy(true);
    try {
      if (saved) {
        await wishlistService.removeFromWishlist(product._id);
      } else {
        await wishlistService.addToWishlist(product._id);
      }
      await refreshWishlist();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink-100/60 transition-shadow hover:shadow-md">
      <Link to={`/products/${product._id}`} className="relative block aspect-square overflow-hidden bg-cream-100">
        <ProductImage src={image} alt={product.name} imgClassName="transition-transform duration-300 group-hover:scale-105" />
        {product.tags?.[0] && (
          <Badge tone={product.tags[0] === 'Bestseller' ? 'sage' : 'ink'} className="absolute left-3 top-3">
            {product.tags[0]}
          </Badge>
        )}
        {!isAdmin && (
          <button
            type="button"
            onClick={handleToggleWishlist}
            disabled={busy}
            aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-plum-600 shadow-sm hover:bg-white"
          >
            {saved ? '♥' : '♡'}
          </button>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link to={`/products/${product._id}`} className="font-semibold text-ink-900 hover:text-plum-600">
          {product.name}
        </Link>
        <p className="text-plum-600 font-semibold">{formatCurrency(price)}</p>
        {!compact && <RatingStars rating={product.ratingsAverage} count={product.ratingsCount} />}
        {isAdmin && <p className="text-xs text-ink-400">Stock: {product.stock}</p>}

        {!compact && !isAdmin && (
          <div className="mt-auto flex items-center gap-2 pt-2">
            <Button
              type="button"
              size="sm"
              className="flex-1"
              onClick={handleAddToCart}
              disabled={busy || product.stock === 0}
            >
              {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          </div>
        )}

        {isAdmin && (onEdit || onDelete) && (
          <div className="mt-auto flex items-center gap-2 pt-2">
            {onEdit && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={(e) => {
                  e.preventDefault();
                  onEdit(product);
                }}
              >
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-red-600 hover:bg-red-50"
                onClick={(e) => {
                  e.preventDefault();
                  onDelete(product);
                }}
              >
                Delete
              </Button>
            )}
          </div>
        )}

        {showCompare && !isAdmin && (
          <label className="mt-1 flex items-center gap-2 text-xs text-ink-500">
            <input
              type="checkbox"
              checked={compareCtx.isSelected(product._id)}
              disabled={!compareCtx.isSelected(product._id) && compareCtx.maxReached}
              onChange={() => compareCtx.toggle(product._id)}
              className="h-3.5 w-3.5 rounded border-ink-200 text-plum-500"
            />
            Compare
          </label>
        )}
      </div>
    </div>
  );
}
