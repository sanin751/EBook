import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import AuthLayout from '../../layouts/AuthLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import FormField from '../../components/ui/FormField';
import * as authService from '../../services/authService';
import getErrorMessage from '../../utils/getErrorMessage';

const schema = yup.object({
  email: yup.string().trim().email('Enter a valid email').required('Email is required'),
});

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(schema) });

  async function onSubmit(values) {
    setSubmitError('');
    try {
      await authService.forgotPassword(values.email);
      setSent(true);
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    }
  }

  return (
    <AuthLayout>
      <Link to="/login" className="mb-6 inline-block text-sm text-ink-500 hover:text-ink-700">
        ← Back to Login
      </Link>
      <h1 className="text-3xl font-bold text-ink-900">Forgot your password?</h1>
      <p className="mt-2 text-ink-600">
        Enter the email address associated with your account and we&apos;ll send you a link to reset your password.
      </p>

      {sent ? (
        <div className="mt-8 rounded-xl bg-sage-50 px-4 py-4 text-sm text-sage-700">
          If an account exists for that email, you&apos;ll receive reset instructions shortly.
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
          {submitError && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{submitError}</p>}

          <FormField label="Email Address" htmlFor="email" error={errors.email?.message}>
            <Input id="email" type="email" placeholder="e.g. reader@ebook.com" {...register('email')} />
          </FormField>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </form>
      )}

      <div className="mt-8 flex gap-3 rounded-xl bg-ink-50 px-4 py-4 text-sm text-ink-600">
        <span aria-hidden="true">🛡</span>
        <p>
          <span className="font-semibold text-ink-800">Privacy assured. </span>
          We value your security. If an account exists for this email, you will receive instructions shortly.
        </p>
      </div>
    </AuthLayout>
  );
}
