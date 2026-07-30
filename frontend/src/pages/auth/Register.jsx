import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  name: yup.string().trim().required('Full name is required'),
  email: yup.string().trim().email('Enter a valid email').required('Email is required'),
  password: yup
    .string()
    .min(10, 'At least 10 characters long')
    .matches(/[a-z]/, 'Must include a lowercase letter')
    .matches(/[A-Z]/, 'Must include an uppercase letter')
    .matches(/\d/, 'Must include a number')
    .matches(/[^A-Za-z0-9]/, 'Must include a special character')
    .required('Password is required'),
  agree: yup.boolean().oneOf([true], 'You must agree to the terms'),
});

export default function Register() {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captcha, setCaptcha] = useState(null);
  const [captchaText, setCaptchaText] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(schema) });
  const passwordValue = watch('password');

  async function loadCaptcha() {
    try {
      const next = await authService.getCaptcha();
      setCaptcha(next);
      setCaptchaText('');
    } catch {
      // Non-fatal — submit will just fail validation server-side and prompt a retry.
    }
  }

  useEffect(() => {
    loadCaptcha();
  }, []);

  async function onSubmit(values) {
    setSubmitError('');
    try {
      await authService.register({
        name: values.name,
        email: values.email,
        password: values.password,
        captchaId: captcha?.captchaId,
        captchaText,
      });
      await authService.logout();
      toast.success('Account created! Please sign in to continue.');
      navigate('/login', { replace: true });
    } catch (err) {
      setSubmitError(getErrorMessage(err, 'Could not create your account'));
      if (err?.response?.data?.details?.captchaRequired) {
        await loadCaptcha();
      }
    }
  }

  return (
    <AuthLayout
      heading="Your next great read is waiting."
      subtext="Join a community of readers building their perfect shelf, one book at a time."
    >
      <h1 className="text-3xl font-bold text-ink-900">Create your account</h1>
      <p className="mt-2 text-ink-600">Welcome! Please enter your details to start your collection.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        {submitError && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{submitError}</p>}

        <FormField label="Full Name" htmlFor="name" error={errors.name?.message}>
          <Input id="name" placeholder="Eleanor Shellstrop" {...register('name')} />
        </FormField>

        <FormField label="Email Address" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" placeholder="hello@example.com" {...register('email')} />
        </FormField>

        <FormField label="Password" htmlFor="password" error={errors.password?.message}>
          <div className="relative">
            <Input id="password" type={showPassword ? 'text' : 'password'} {...register('password')} className="pr-12" />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? '🙈' : '👁'}
            </button>
          </div>
          <PasswordStrengthMeter password={passwordValue} />
          <p className="mt-1 text-xs text-ink-400">
            At least 10 characters, with uppercase, lowercase, a number, and a special character.
          </p>
        </FormField>

        {captcha && (
          <FormField label="Enter the characters shown below">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line react/no-danger */}
              <div
                className="h-14 w-36 overflow-hidden rounded-lg border border-ink-100"
                dangerouslySetInnerHTML={{ __html: captcha.svg }}
              />
              <button type="button" onClick={loadCaptcha} className="text-sm font-medium text-plum-600 hover:underline">
                New code
              </button>
            </div>
            <Input
              className="mt-2"
              value={captchaText}
              onChange={(e) => setCaptchaText(e.target.value)}
              placeholder="Captcha answer"
              autoComplete="off"
            />
          </FormField>
        )}

        <FormField error={errors.agree?.message}>
          <label className="flex items-start gap-2 text-sm text-ink-600">
            <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-ink-100 text-plum-500" {...register('agree')} />
            <span>
              I agree to the{' '}
              <Link to="/support" className="font-medium text-plum-600 hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/support" className="font-medium text-plum-600 hover:underline">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
        </FormField>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-ink-600">
        Already part of EBook?{' '}
        <Link to="/login" className="font-semibold text-plum-600 hover:underline">
          Login
        </Link>
      </p>
    </AuthLayout>
  );
}
