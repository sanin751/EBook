import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import FormField from '../ui/FormField';
import getErrorMessage from '../../utils/getErrorMessage';
import * as categoryService from '../../services/categoryService';

const schema = yup.object({
  name: yup.string().trim().required('Collection name is required'),
  description: yup.string().trim().optional(),
});

export default function CategoryFormModal({ open, onClose, onSaved, category }) {
  const isEdit = Boolean(category);
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
    setSubmitError('');
    reset(category ? { name: category.name, description: category.description || '' } : { name: '', description: '' });
  }, [open, category, reset]);

  async function onSubmit(values) {
    setSubmitting(true);
    setSubmitError('');
    try {
      const saved = isEdit
        ? await categoryService.updateCategory(category._id, values)
        : await categoryService.createCategory(values);
      toast.success(isEdit ? 'Collection updated' : 'Collection created');
      onSaved(saved);
    } catch (err) {
      setSubmitError(getErrorMessage(err, 'Could not save collection'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Collection' : 'Add Collection'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {submitError && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{submitError}</p>}

        <FormField label="Name" error={errors.name?.message}>
          <Input {...register('name')} />
        </FormField>

        <FormField label="Description" error={errors.description?.message}>
          <textarea
            {...register('description')}
            rows={3}
            className="w-full rounded-xl border border-transparent bg-cream-100 px-4 py-3 text-ink-800 focus:outline-none focus:ring-2 focus:ring-plum-300"
          />
        </FormField>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Collection'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
