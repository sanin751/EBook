import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import { toast } from 'react-toastify';
import ProductCard from '../components/product/ProductCard';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import ProductFormModal from '../components/admin/ProductFormModal';
import getErrorMessage from '../utils/getErrorMessage';
import * as productService from '../services/productService';
import * as categoryService from '../services/categoryService';
import { useCompare } from '../context/CompareContext';
import { useAuth } from '../context/AuthContext';

const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest' },
  { value: 'price', label: 'Price: Low to High' },
  { value: '-price', label: 'Price: High to Low' },
  { value: '-ratingsAverage', label: 'Top Rated' },
];

const FORMAT_OPTIONS = ['Hardcover', 'Paperback', 'E-book'];
const RATING_OPTIONS = [5, 4];
const LIMIT = 12;

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const compare = useCompare();
  const { isAdmin } = useAuth();

  const page = Number(searchParams.get('page')) || 1;
  const category = searchParams.get('category') || '';
  const format = searchParams.get('format') || '';
  const tag = searchParams.get('tag') || '';
  const minRating = searchParams.get('minRating') || '';
  const sort = searchParams.get('sort') || '-createdAt';
  const search = searchParams.get('search') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  useEffect(() => {
    categoryService.getCategories().then(setCategories);
  }, []);

  function loadProducts() {
    setIsLoading(true);
    return productService
      .getProducts({ page, limit: LIMIT, category, format, tag, minRating, sort, search, minPrice, maxPrice })
      .then(({ products: results, meta: pageMeta }) => {
        setProducts(results);
        setMeta(pageMeta);
      })
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, category, format, tag, minRating, sort, search, minPrice, maxPrice]);

  function openAddProduct() {
    setEditingProduct(null);
    setFormOpen(true);
  }

  function openEditProduct(product) {
    setEditingProduct(product);
    setFormOpen(true);
  }

  function handleProductSaved() {
    setFormOpen(false);
    setEditingProduct(null);
    loadProducts();
  }

  async function confirmDeleteProduct() {
    try {
      await productService.deleteProduct(deletingProduct._id);
      toast.success('Product deleted');
      setDeletingProduct(null);
      loadProducts();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  }

  function toggleParam(key, value) {
    updateParam(key, searchParams.get(key) === String(value) ? '' : String(value));
  }

  function goToPage(nextPage) {
    const next = new URLSearchParams(searchParams);
    next.set('page', nextPage);
    setSearchParams(next);
  }

  function clearAll() {
    setSearchParams({});
  }

  const hasFilters = category || format || tag || minRating || minPrice || maxPrice || search;

  return (
    <div className="container-page py-10 pb-28">
      <p className="text-sm text-ink-500">
        <Link to="/" className="hover:text-plum-600">
          Home
        </Link>{' '}
        › Shop
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-ink-900">Shop All Books</h1>
        {isAdmin && <Button onClick={openAddProduct}>+ Add Product</Button>}
      </div>
      {tag && (
        <button
          onClick={() => updateParam('tag', '')}
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-plum-100 px-3 py-1.5 text-sm font-medium text-plum-700"
        >
          {tag} ✕
        </button>
      )}

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-800">Filters</h2>
            {hasFilters && (
              <button onClick={clearAll} className="text-xs font-medium text-plum-600 hover:underline">
                Clear All
              </button>
            )}
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-ink-800">Categories</h3>
            <ul className="space-y-2 text-sm text-ink-600">
              {categories.map((cat) => (
                <li key={cat._id}>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={category === cat._id}
                      onChange={() => toggleParam('category', cat._id)}
                      className="h-4 w-4 rounded border-ink-200 text-plum-500"
                    />
                    {cat.name}
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-ink-800">Price Range (Rs.)</h3>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                placeholder="Min"
                defaultValue={minPrice}
                onBlur={(e) => updateParam('minPrice', e.target.value)}
                className="w-full rounded-lg border border-ink-100 px-2 py-1.5 text-sm"
              />
              <span className="text-ink-400">–</span>
              <input
                type="number"
                min="0"
                placeholder="Max"
                defaultValue={maxPrice}
                onBlur={(e) => updateParam('maxPrice', e.target.value)}
                className="w-full rounded-lg border border-ink-100 px-2 py-1.5 text-sm"
              />
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-ink-800">Rating</h3>
            <ul className="space-y-2 text-sm text-ink-600">
              {RATING_OPTIONS.map((r) => (
                <li key={r}>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={minRating === String(r)}
                      onChange={() => toggleParam('minRating', r)}
                      className="h-4 w-4 rounded border-ink-200 text-plum-500"
                    />
                    {'★'.repeat(r)}
                    {'☆'.repeat(5 - r)} {r < 5 && '& up'}
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-ink-800">Format</h3>
            <div className="flex flex-wrap gap-2">
              {FORMAT_OPTIONS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => toggleParam('format', f)}
                  className={clsx(
                    'rounded-xl border px-3 py-1.5 text-sm font-medium',
                    format === f ? 'border-plum-500 text-plum-600' : 'border-ink-100 text-ink-600'
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-500">
              {isLoading ? 'Loading…' : `Showing ${products.length ? (page - 1) * LIMIT + 1 : 0}-${(page - 1) * LIMIT + products.length} of ${meta.total} results`}
            </p>
            <label className="flex items-center gap-2 text-sm text-ink-600">
              Sort by:
              <select
                value={sort}
                onChange={(e) => updateParam('sort', e.target.value)}
                className="rounded-lg border border-ink-100 bg-white px-3 py-2 text-sm font-medium"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-ink-50" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <p className="py-16 text-center text-ink-500">No products match your filters yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  showCompare
                  onEdit={isAdmin ? openEditProduct : undefined}
                  onDelete={isAdmin ? setDeletingProduct : undefined}
                />
              ))}
            </div>
          )}

          {meta.totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              <button
                onClick={() => goToPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-100 disabled:opacity-40"
              >
                ‹
              </button>
              {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium ${
                    p === page ? 'bg-plum-500 text-white' : 'text-ink-600 hover:bg-ink-50'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => goToPage(Math.min(meta.totalPages, page + 1))}
                disabled={page >= meta.totalPages}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-100 disabled:opacity-40"
              >
                ›
              </button>
            </div>
          )}
        </div>
      </div>

      {compare.ids.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-100 bg-white/95 backdrop-blur">
          <div className="container-page flex items-center justify-between gap-4 py-4">
            <p className="text-sm font-medium text-ink-700">
              Compare Products <span className="text-ink-400">({compare.ids.length}/{compare.max})</span>
            </p>
            <div className="flex items-center gap-3">
              <button onClick={compare.clear} className="text-sm text-ink-500 hover:underline">
                Clear
              </button>
              <Button
                as={Link}
                to={`/compare?ids=${compare.ids.join(',')}`}
                size="sm"
                disabled={compare.ids.length < 2}
                className={compare.ids.length < 2 ? 'pointer-events-none opacity-50' : ''}
              >
                Compare Now
              </Button>
            </div>
          </div>
        </div>
      )}

      {isAdmin && (
        <>
          <ProductFormModal
            open={formOpen}
            onClose={() => setFormOpen(false)}
            onSaved={handleProductSaved}
            categories={categories}
            product={editingProduct}
          />
          <ConfirmDialog
            open={Boolean(deletingProduct)}
            onClose={() => setDeletingProduct(null)}
            onConfirm={confirmDeleteProduct}
            title="Delete Product"
            message={`Delete "${deletingProduct?.name}"? This cannot be undone.`}
          />
        </>
      )}
    </div>
  );
}
