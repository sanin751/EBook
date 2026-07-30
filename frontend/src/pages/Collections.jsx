import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import ProductImage from '../components/ui/ProductImage';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import CategoryFormModal from '../components/admin/CategoryFormModal';
import getErrorMessage from '../utils/getErrorMessage';
import { useAuth } from '../context/AuthContext';
import * as categoryService from '../services/categoryService';
import * as productService from '../services/productService';

const VALUE_COLLECTIONS = [
  { tag: 'Bestseller', title: 'Bestsellers', copy: 'The titles our readers keep coming back for, across every genre.' },
  { tag: 'Award Winner', title: 'Award Winners', copy: 'Critically acclaimed reads that earned their recognition.' },
  { tag: 'New Arrival', title: 'New Arrivals', copy: 'Fresh additions to the catalog, added in small, carefully chosen batches.' },
];

export default function Collections() {
  const [categories, setCategories] = useState([]);
  const [categoryPreviews, setCategoryPreviews] = useState({});
  const [valuePreviews, setValuePreviews] = useState({});
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const { isAdmin } = useAuth();

  function loadCategories() {
    categoryService.getCategories().then(async (cats) => {
      setCategories(cats);
      const entries = await Promise.all(
        cats.map(async (cat) => {
          const { products } = await productService.getProducts({ category: cat._id, limit: 1 });
          return [cat._id, products[0] || null];
        })
      );
      setCategoryPreviews(Object.fromEntries(entries));
    });
  }

  useEffect(() => {
    loadCategories();

    Promise.all(
      VALUE_COLLECTIONS.map(async (v) => {
        const { products } = await productService.getProducts({ tag: v.tag, limit: 1 });
        return [v.tag, products[0] || null];
      })
    ).then((entries) => setValuePreviews(Object.fromEntries(entries)));
  }, []);

  function openAddCollection() {
    setEditingCategory(null);
    setFormOpen(true);
  }

  function openEditCollection(e, category) {
    e.preventDefault();
    e.stopPropagation();
    setEditingCategory(category);
    setFormOpen(true);
  }

  function handleCollectionSaved() {
    setFormOpen(false);
    setEditingCategory(null);
    loadCategories();
  }

  function requestDeleteCollection(e, category) {
    e.preventDefault();
    e.stopPropagation();
    setDeletingCategory(category);
  }

  async function confirmDeleteCollection() {
    try {
      await categoryService.deleteCategory(deletingCategory._id);
      toast.success('Collection deleted');
      setDeletingCategory(null);
      loadCategories();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="container-page py-14">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-plum-500">Explore</p>
        <h1 className="mt-2 text-3xl font-bold text-ink-900">Collections</h1>
        <p className="mx-auto mt-3 max-w-xl text-ink-600">
          Every book in our catalog was chosen on purpose. Browse by genre, or by what made the shortlist.
        </p>
      </div>

      <div className="mt-12">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-ink-900">Shop by Category</h2>
          {isAdmin && (
            <Button size="sm" onClick={openAddCollection}>
              + Add Collection
            </Button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((cat) => {
            const preview = categoryPreviews[cat._id];
            return (
              <Link
                key={cat._id}
                to={`/shop?category=${cat._id}`}
                className="group relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink-100/60"
              >
                <div className="aspect-square overflow-hidden">
                  <ProductImage
                    src={preview?.images?.[0]}
                    alt={preview?.name || cat.name}
                    imgClassName="transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <p className="font-semibold text-ink-900">{cat.name}</p>
                  {cat.description && <p className="mt-1 text-xs text-ink-500 line-clamp-2">{cat.description}</p>}
                </div>
                {isAdmin && (
                  <div className="absolute right-2 top-2 flex gap-1">
                    <button
                      onClick={(e) => openEditCollection(e, cat)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink-700 shadow-sm hover:bg-white"
                      aria-label="Edit collection"
                    >
                      ✎
                    </button>
                    <button
                      onClick={(e) => requestDeleteCollection(e, cat)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-red-600 shadow-sm hover:bg-white"
                      aria-label="Delete collection"
                    >
                      🗑
                    </button>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-16">
        <h2 className="mb-5 text-xl font-bold text-ink-900">Shop by Value</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {VALUE_COLLECTIONS.map((v) => {
            const preview = valuePreviews[v.tag];
            return (
              <Link
                key={v.tag}
                to={`/shop?tag=${encodeURIComponent(v.tag)}`}
                className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink-100/60"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <ProductImage
                    src={preview?.images?.[0]}
                    alt={preview?.name || v.tag}
                    imgClassName="transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <p className="font-semibold text-ink-900">{v.title}</p>
                  <p className="mt-1 text-sm text-ink-600">{v.copy}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {isAdmin && (
        <>
          <CategoryFormModal
            open={formOpen}
            onClose={() => setFormOpen(false)}
            onSaved={handleCollectionSaved}
            category={editingCategory}
          />
          <ConfirmDialog
            open={Boolean(deletingCategory)}
            onClose={() => setDeletingCategory(null)}
            onConfirm={confirmDeleteCollection}
            title="Delete Collection"
            message={`Delete the "${deletingCategory?.name}" collection? This cannot be undone.`}
          />
        </>
      )}
    </div>
  );
}
