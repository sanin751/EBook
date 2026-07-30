import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import ProductImage from '../components/ui/ProductImage';
import Button from '../components/ui/Button';
import formatCurrency from '../utils/formatCurrency';
import getErrorMessage from '../utils/getErrorMessage';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import * as productService from '../services/productService';
import * as cartService from '../services/cartService';

const SPEC_ROWS = [
  ['Author', (p) => p.author],
  ['Publisher', (p) => p.publisher],
  ['Length', (p) => p.pages],
  ['ISBN', (p) => p.isbn],
];

const TRUST_POINTS = [
  { icon: '🚚', title: 'Secure Shipping', copy: 'Crush-resistant packaging for safe arrival.' },
  { icon: '✅', title: 'Verified Editions', copy: 'Every listing is checked against its publisher record.' },
  { icon: '🕐', title: 'Built to Last', copy: 'Bindings chosen to hold up to years of rereading.' },
];

export default function Compare() {
  const [searchParams] = useSearchParams();
  const ids = (searchParams.get('ids') || '').split(',').filter(Boolean);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const { refreshCart } = useCart();

  useEffect(() => {
    if (ids.length < 2) {
      setIsLoading(false);
      return;
    }
    productService
      .compareProducts(ids)
      .then(setProducts)
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get('ids')]);

  async function handleAddToCart(productId, name) {
    if (!isAuthenticated) {
      toast.info('Please sign in to add items to your cart');
      return;
    }
    try {
      await cartService.addToCart({ productId, quantity: 1 });
      await refreshCart();
      toast.success(`${name} added to cart`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-bold text-ink-900">Compare Books</h1>
      <p className="mt-2 max-w-2xl text-ink-600">
        Find the right edition for your shelf. Compare author, publisher, length, and price side by side.
      </p>

      {ids.length < 2 ? (
        <div className="mt-16 flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-ink-500">Pick at least 2 products from the shop to compare them side by side.</p>
          <Button as={Link} to="/shop">
            Browse Products
          </Button>
        </div>
      ) : isLoading ? (
        <div className="mt-16 text-center text-ink-400">Loading comparison...</div>
      ) : (
        <>
          <div className="mt-10 overflow-x-auto rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink-100/60">
            <table className="w-full min-w-[600px] border-collapse text-left">
              <thead>
                <tr>
                  <th className="w-40 pb-4 text-xs font-semibold uppercase tracking-wide text-ink-400">
                    Specifications
                  </th>
                  {products.map((p) => (
                    <th key={p._id} className="px-4 pb-4 text-center">
                      <Link to={`/products/${p._id}`} className="mx-auto block h-32 w-32 overflow-hidden rounded-xl">
                        <ProductImage src={p.images?.[0]} alt={p.name} />
                      </Link>
                      <Link to={`/products/${p._id}`} className="mt-3 block font-bold text-ink-900 hover:text-plum-600">
                        {p.name}
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SPEC_ROWS.filter(([, get]) => products.some((p) => get(p))).map(([label, get]) => (
                  <tr key={label} className="border-t border-ink-100">
                    <td className="py-4 text-sm font-semibold text-ink-800">{label}</td>
                    {products.map((p) => (
                      <td key={p._id} className="px-4 py-4 text-center text-sm text-ink-600">
                        {get(p) || '—'}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-t border-ink-100">
                  <td className="py-4 text-sm font-semibold text-ink-800">Price</td>
                  {products.map((p) => (
                    <td key={p._id} className="px-4 py-4 text-center text-lg font-bold text-plum-600">
                      {formatCurrency(p.discountPrice ?? p.price)}
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-ink-100">
                  <td className="py-4" />
                  {products.map((p) => (
                    <td key={p._id} className="px-4 py-4 text-center">
                      <Button size="sm" onClick={() => handleAddToCart(p._id, p.name)} disabled={p.stock === 0}>
                        {p.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                      </Button>
                      {p.tags?.[0] && <p className="mt-2 text-xs font-medium text-sage-600">🏷️ {p.tags[0]}</p>}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {TRUST_POINTS.map((point) => (
              <div key={point.title} className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-plum-50 text-xl">
                  {point.icon}
                </span>
                <div>
                  <h3 className="font-semibold text-ink-900">{point.title}</h3>
                  <p className="text-sm text-ink-600">{point.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
