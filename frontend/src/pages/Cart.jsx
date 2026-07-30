import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ProductImage from '../components/ui/ProductImage';
import Button from '../components/ui/Button';
import formatCurrency from '../utils/formatCurrency';
import getErrorMessage from '../utils/getErrorMessage';
import { useCart } from '../context/CartContext';
import * as cartService from '../services/cartService';
import * as productService from '../services/productService';

const SHIPPING_FEE = 0;

export default function Cart() {
  const { cart, refreshCart } = useCart();
  const navigate = useNavigate();
  const [busyId, setBusyId] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    productService.getProducts({ limit: 3, sort: '-createdAt' }).then(({ products }) => setSuggestions(products));
  }, []);

  async function handleQuantityChange(itemId, quantity) {
    if (quantity < 1) return;
    setBusyId(itemId);
    try {
      await cartService.updateCartItem(itemId, quantity);
      await refreshCart();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemove(itemId) {
    setBusyId(itemId);
    try {
      await cartService.removeCartItem(itemId);
      await refreshCart();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  const items = cart?.items || [];
  const subtotal = cart?.totalPrice || 0;
  const total = items.length ? subtotal + SHIPPING_FEE : 0;

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-bold text-ink-900">Your Basket</h1>
      <p className="mt-1 text-ink-600">Review your selection before checkout.</p>

      {items.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-ink-500">Your basket is empty.</p>
          <Button as={Link} to="/shop">
            Continue Shopping
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {items.map((item) => {
              const product = item.product;
              const isBusy = busyId === item._id;
              return (
                <div key={item._id} className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-ink-100/60">
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl">
                    <ProductImage src={product?.images?.[0]} alt={product?.name} />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between">
                      <div>
                        <Link
                          to={`/products/${product?._id}`}
                          className="font-semibold text-ink-900 hover:text-plum-600"
                        >
                          {product?.name || 'Product'}
                        </Link>
                        {(item.selectedColor || item.variantLabel) && (
                          <p className="text-xs uppercase tracking-wide text-ink-400">
                            {[item.selectedColor, item.variantLabel].filter(Boolean).join(' • ')}
                          </p>
                        )}
                        {item.engravingText && (
                          <p className="text-xs italic text-ink-400">Engraving: &ldquo;{item.engravingText}&rdquo;</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemove(item._id)}
                        disabled={isBusy}
                        aria-label="Remove item"
                        className="text-ink-400 hover:text-red-500"
                      >
                        🗑
                      </button>
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center rounded-full border border-ink-100">
                        <button
                          disabled={isBusy}
                          onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                          className="px-3 py-1.5"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          disabled={isBusy}
                          onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                          className="px-3 py-1.5"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-ink-400">{formatCurrency(item.price)} ea.</p>
                        <p className="font-bold text-plum-600">{formatCurrency(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {suggestions.length > 0 && (
              <div className="pt-6">
                <h2 className="mb-4 text-xl font-bold text-ink-900">Complete the look</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {suggestions.map((p) => (
                    <div key={p._id} className="flex items-center gap-3 rounded-xl bg-cream-100 p-3">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                        <ProductImage src={p.images?.[0]} alt={p.name} />
                      </div>
                      <div>
                        <Link to={`/products/${p._id}`} className="text-sm font-medium text-ink-800 hover:text-plum-600">
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

          <aside className="h-fit rounded-2xl bg-cream-100 p-6">
            <h2 className="text-xl font-bold text-ink-900">Order Summary</h2>
            <div className="mt-4 space-y-2 text-sm text-ink-700">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <span className="font-semibold text-sage-600">Free</span>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-ink-200 pt-4">
              <span className="text-lg font-bold text-ink-900">Total</span>
              <span className="text-lg font-bold text-plum-600">{formatCurrency(total)}</span>
            </div>
            <Button className="mt-6 w-full" onClick={() => navigate('/checkout/shipping')}>
              Proceed to Checkout
            </Button>
          </aside>
        </div>
      )}
    </div>
  );
}
