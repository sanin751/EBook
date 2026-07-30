import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import FormField from '../ui/FormField';
import ProductImage from '../ui/ProductImage';
import getErrorMessage from '../../utils/getErrorMessage';
import * as productService from '../../services/productService';

const schema = yup.object({
  name: yup.string().trim().required('Product name is required'),
  description: yup.string().trim().required('Description is required'),
  price: yup.number().typeError('Enter a valid price').positive('Price must be positive').required('Price is required'),
  discountPrice: yup
    .number()
    .transform((value, original) => (original === '' ? undefined : value))
    .typeError('Enter a valid price')
    .positive('Discount price must be positive')
    .lessThan(yup.ref('price'), 'Discount price must be less than the price')
    .optional(),
  category: yup.string().required('Category is required'),
  stock: yup
    .number()
    .transform((value, original) => (original === '' ? 0 : value))
    .typeError('Enter a valid stock number')
    .min(0, 'Stock cannot be negative')
    .optional(),
  sku: yup.string().trim().optional(),
  author: yup.string().trim().optional(),
  publisher: yup.string().trim().optional(),
  pages: yup.string().trim().optional(),
  isbn: yup.string().trim().optional(),
  formats: yup.string().trim().optional(),
  tags: yup.string().trim().optional(),
});

export default function ProductFormModal({ open, onClose, onSaved, categories, product }) {
  const isEdit = Boolean(product);
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  useEffect(() => {
    if (!open) return;
    setFiles([]);
    setSubmitError('');
    reset(
      product
        ? {
            name: product.name,
            description: product.description,
            price: product.price,
            discountPrice: product.discountPrice ?? '',
            category: product.category?._id || product.category || '',
            stock: product.stock,
            sku: product.sku || '',
            author: product.author || '',
            publisher: product.publisher || '',
            pages: product.pages || '',
            isbn: product.isbn || '',
            formats: (product.formats || []).join(', '),
            tags: (product.tags || []).join(', '),
          }
        : { category: categories[0]?._id || '', stock: 0 }
    );
  }, [open, product, categories, reset]);

  async function onSubmit(values) {
    setSubmitting(true);
    setSubmitError('');
    try {
      const payload = { ...values, images: files };
      const saved = isEdit
        ? await productService.updateProduct(product._id, payload)
        : await productService.createProduct(payload);
      toast.success(isEdit ? 'Product updated' : 'Product created');
      onSaved(saved);
    } catch (err) {
      setSubmitError(getErrorMessage(err, 'Could not save product'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Product' : 'Add Product'} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {submitError && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{submitError}</p>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Product Name" error={errors.name?.message}>
            <Input {...register('name')} />
          </FormField>
          <FormField label="Category" error={errors.category?.message}>
            <select
              {...register('category')}
              className="w-full rounded-xl border border-transparent bg-cream-100 px-4 py-3 text-ink-800 focus:outline-none focus:ring-2 focus:ring-plum-300"
            >
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField label="Description" error={errors.description?.message}>
          <textarea
            {...register('description')}
            rows={3}
            className="w-full rounded-xl border border-transparent bg-cream-100 px-4 py-3 text-ink-800 focus:outline-none focus:ring-2 focus:ring-plum-300"
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField label="Price (Rs.)" error={errors.price?.message}>
            <Input type="number" step="0.01" {...register('price')} />
          </FormField>
          <FormField label="Discount Price" error={errors.discountPrice?.message}>
            <Input type="number" step="0.01" {...register('discountPrice')} />
          </FormField>
          <FormField label="Stock" error={errors.stock?.message}>
            <Input type="number" {...register('stock')} />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="SKU">
            <Input {...register('sku')} />
          </FormField>
          <FormField label="Author">
            <Input {...register('author')} />
          </FormField>
          <FormField label="Publisher">
            <Input {...register('publisher')} />
          </FormField>
          <FormField label="Pages">
            <Input placeholder="e.g. 320 pages" {...register('pages')} />
          </FormField>
          <FormField label="ISBN">
            <Input {...register('isbn')} />
          </FormField>
          <FormField label="Formats (comma separated)">
            <Input placeholder="Hardcover, Paperback, E-book" {...register('formats')} />
          </FormField>
        </div>

        <FormField label="Tags (comma separated)">
          <Input placeholder="Bestseller, New Arrival" {...register('tags')} />
        </FormField>

        <FormField label="Images">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, 5))}
            className="block w-full text-sm text-ink-600 file:mr-3 file:rounded-full file:border-0 file:bg-plum-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-plum-700"
          />
          {isEdit && (
            <p className="mt-1 text-xs text-ink-400">
              Uploading new images replaces all existing images. Leave empty to keep the current ones.
            </p>
          )}

          {(files.length > 0 || product?.images?.length > 0) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {files.length > 0
                ? files.map((file, i) => (
                    <div key={i} className="h-16 w-16 overflow-hidden rounded-lg ring-1 ring-ink-100">
                      <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
                    </div>
                  ))
                : product.images.map((src, i) => (
                    <div key={i} className="h-16 w-16 overflow-hidden rounded-lg ring-1 ring-ink-100">
                      <ProductImage src={src} alt={product.name} />
                    </div>
                  ))}
            </div>
          )}
        </FormField>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Product'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
