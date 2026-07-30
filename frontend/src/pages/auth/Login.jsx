import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import AuthLayout from '../../layouts/AuthLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import FormField from '../../components/ui/FormField';
import { useAuth } from '../../context/AuthContext';
import * as authService from '../../services/authService';
import getErrorMessage from '../../utils/getErrorMessage';

const schema = yup.object({
  email: yup.string().trim().email('Enter a valid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});

function useCountdown(seconds) {
  const [remaining, setRemaining] = useState(seconds || 0);
  useEffect(() => {
    setRemaining(seconds || 0);
    if (!seconds) return undefined;
    const interval = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(interval);
  }, [seconds]);
  return remaining;
}

function CaptchaField({ captcha, onRefresh, value, onChange }) {
  if (!captcha) return null;
  return (
    <FormField label="Enter the characters shown below">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line react/no-danger */}
        <div className="h-14 w-36 overflow-hidden rounded-lg border border-ink-100" dangerouslySetInnerHTML={{ __html: captcha.svg }} />
        <button type="button" onClick={onRefresh} className="text-sm font-medium text-plum-600 hover:underline">
          New code
        </button>
      </div>
      <Input
        className="mt-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Captcha answer"
        autoComplete="off"
      />
    </FormField>
  );
}

export default function Login() {
  const { login, completeMfaLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitError, setSubmitError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captcha, setCaptcha] = useState(null);
  const [captchaText, setCaptchaText] = useState('');
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [mfaChallengeToken, setMfaChallengeToken] = useState(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaSubmitting, setMfaSubmitting] = useState(false);
  const lastPayload = useRef(null);
  const remainingLockout = useCountdown(lockoutSeconds);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(schema) });

  async function loadCaptcha() {
    try {
      const next = await authService.getCaptcha();
      setCaptcha(next);
      setCaptchaText('');
    } catch {
      // Non-fatal — the user just won't see a captcha field until they retry.
    }
  }

  async function onSubmit(values) {
    setSubmitError('');
    const payload = { ...values, ...(captcha ? { captchaId: captcha.captchaId, captchaText } : {}) };
    lastPayload.current = payload;
    try {
      const result = await login(payload);
      if (result?.mfaRequired) {
        setMfaChallengeToken(result.mfaChallengeToken);
        return;
      }
      toast.success('Welcome back!');
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      const details = err?.response?.data?.details;
      if (err?.response?.status === 423 && details?.retryAfterSeconds) {
        setLockoutSeconds(details.retryAfterSeconds);
        setSubmitError('Account temporarily locked due to too many failed attempts.');
        return;
      }
      if (details?.captchaRequired) {
        await loadCaptcha();
        setSubmitError('Please solve the captcha and try again.');
        return;
      }
      setSubmitError(getErrorMessage(err, 'Incorrect email or password'));
    }
  }

  async function onSubmitMfa(e) {
    e.preventDefault();
    setMfaSubmitting(true);
    setSubmitError('');
    try {
      await completeMfaLogin(mfaChallengeToken, mfaCode);
      toast.success('Welcome back!');
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      setSubmitError(getErrorMessage(err, 'Invalid authentication code'));
    } finally {
      setMfaSubmitting(false);
    }
  }

  if (mfaChallengeToken) {
    return (
      <AuthLayout heading="One more step." subtext="Enter the 6-digit code from your authenticator app.">
        <h1 className="text-3xl font-bold text-ink-900">Two-Factor Verification</h1>
        <p className="mt-2 text-ink-600">Enter your authentication code or a backup code.</p>

        <form onSubmit={onSubmitMfa} className="mt-8 space-y-5">
          {submitError && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{submitError}</p>}
          <FormField label="Authentication Code" htmlFor="mfa-code">
            <Input
              id="mfa-code"
              autoFocus
              placeholder="123456 or backup code"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
            />
          </FormField>
          <Button type="submit" className="w-full" disabled={mfaSubmitting || !mfaCode}>
            {mfaSubmitting ? 'Verifying...' : 'Verify'}
          </Button>
          <button
            type="button"
            onClick={() => setMfaChallengeToken(null)}
            className="w-full text-center text-sm text-ink-500 hover:underline"
          >
            Back to sign in
          </button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      heading="Welcome back to EBook."
      subtext="Pick up right where you left off — your cart, your wishlist, and your next book are all waiting."
    >
      <h1 className="text-3xl font-bold text-ink-900">Sign In</h1>
      <p className="mt-2 text-ink-600">Access your curated collection and history.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        {submitError && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{submitError}</p>}

        <FormField label="Email Address" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" placeholder="name@example.com" {...register('email')} />
        </FormField>

        <FormField
          label="Password"
          htmlFor="password"
          error={errors.password?.message}
          action={
            <Link to="/forgot-password" className="text-sm font-medium text-plum-600 hover:underline">
              Forgot Password?
            </Link>
          }
        >
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              className="pr-12"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? '🙈' : '👁'}
            </button>
          </div>
        </FormField>

        <CaptchaField captcha={captcha} onRefresh={loadCaptcha} value={captchaText} onChange={setCaptchaText} />

        {remainingLockout > 0 ? (
          <p className="text-sm text-ink-500">Try again in {remainingLockout}s.</p>
        ) : (
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Login →'}
          </Button>
        )}
      </form>

      <p className="mt-4 text-center text-sm text-ink-600">
        <Link to="/passwordless-login" className="font-medium text-plum-600 hover:underline">
          Email me a login link instead
        </Link>
      </p>

      <p className="mt-4 text-center text-sm text-ink-600">
        New to EBook?{' '}
        <Link to="/register" className="font-semibold text-plum-600 hover:underline">
          Create Account
        </Link>
      </p>
    </AuthLayout>
  );
}
