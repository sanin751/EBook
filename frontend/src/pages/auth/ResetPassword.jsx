import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import AuthLayout from '../../layouts/AuthLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import FormField from '../../components/ui/FormField';
import PasswordStrengthMeter from '../../components/ui/PasswordStrengthMeter';
import * as authService from '../../services/authService';
import getErrorMessage from '../../utils/getErrorMessage';

const schema = yup.object({
  password: yup
    .string()
    .min(10, 'At least 10 characters long')
    .matches(/[a-z]/, 'Must include a lowercase letter')
    .matches(/[A-Z]/, 'Must include an uppercase letter')
    .matches(/\d/, 'Must include a number')
    .matches(/[^A-Za-z0-9]/, 'Must include a special character')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(schema) });

  const password = watch('password') || '';

  async function onSubmit(values) {
    setSubmitError('');
    if (!token) {
      setSubmitError('This reset link is missing a token. Please request a new one.');
      return;
    }
    try {
      await authService.resetPassword(token, values.password);
      toast.success('Password updated. Please sign in.');
      navigate('/login', { replace: true });
    } catch (err) {
      setSubmitError(getErrorMessage(err, 'This reset link is invalid or has expired'));
    }
  }

  return (
    <AuthLayout>
      <h1 className="text-3xl font-bold text-ink-900">Secure your space.</h1>
      <p className="mt-2 text-ink-600">
        Create a new, strong password for your EBook account to continue your journey.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5 rounded-2xl bg-white p-6 shadow-sm">
        {submitError && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{submitError}</p>}

        <FormField label="New Password" htmlFor="password" error={errors.password?.message}>
          <Input id="password" type="password" {...register('password')} />
          <PasswordStrengthMeter password={password} />
        </FormField>

        <FormField label="Confirm New Password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
          <Input id="confirmPassword" type="password" {...register('confirmPassword')} />
        </FormField>

        <ul className="space-y-1 rounded-xl bg-ink-50 px-4 py-3 text-sm text-ink-600">
          <li className={password.length >= 10 ? 'text-sage-600' : ''}>
            {password.length >= 10 ? '✓' : '○'} At least 10 characters long
          </li>
          <li className={/[a-z]/.test(password) && /[A-Z]/.test(password) ? 'text-sage-600' : ''}>
            {/[a-z]/.test(password) && /[A-Z]/.test(password) ? '✓' : '○'} Upper and lowercase letters
          </li>
          <li className={/\d/.test(password) ? 'text-sage-600' : ''}>
            {/\d/.test(password) ? '✓' : '○'} Must include a number
          </li>
          <li className={/[^A-Za-z0-9]/.test(password) ? 'text-sage-600' : ''}>
            {/[^A-Za-z0-9]/.test(password) ? '✓' : '○'} Must include a special character
          </li>
        </ul>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Updating...' : 'Update Password'}
        </Button>
      </form>

      <Link to="/login" className="mt-6 block text-center text-sm text-ink-500 hover:text-ink-700">
        ← Back to login
      </Link>
    </AuthLayout>
  );
}
