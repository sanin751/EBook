import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthLayout from '../../layouts/AuthLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import FormField from '../../components/ui/FormField';
import { useAuth } from '../../context/AuthContext';
import * as authService from '../../services/authService';
import getErrorMessage from '../../utils/getErrorMessage';

function VerifyStep({ token }) {
  const { completePasswordlessLogin, completeMfaLogin } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [error, setError] = useState('');
  const [mfaChallengeToken, setMfaChallengeToken] = useState(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaSubmitting, setMfaSubmitting] = useState(false);

  useEffect(() => {
    let ignore = false;
    completePasswordlessLogin(token)
      .then((result) => {
        if (ignore) return;
        if (result?.mfaRequired) {
          setMfaChallengeToken(result.mfaChallengeToken);
          setStatus('mfa');
        } else {
          toast.success('Welcome back!');
          navigate('/', { replace: true });
        }
      })
      .catch((err) => {
        if (ignore) return;
        setError(getErrorMessage(err, 'This login link is invalid or has expired'));
        setStatus('error');
      });
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function onSubmitMfa(e) {
    e.preventDefault();
    setMfaSubmitting(true);
    setError('');
    try {
      await completeMfaLogin(mfaChallengeToken, mfaCode);
      toast.success('Welcome back!');
      navigate('/', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Invalid authentication code'));
    } finally {
      setMfaSubmitting(false);
    }
  }

  if (status === 'verifying') {
    return <p className="text-ink-600">Verifying your login link...</p>;
  }

  if (status === 'mfa') {
    return (
      <form onSubmit={onSubmitMfa} className="space-y-5">
        {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
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
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      <Link to="/passwordless-login" className="font-medium text-plum-600 hover:underline">
        Request a new login link
      </Link>
    </div>
  );
}

function RequestStep() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await authService.passwordlessRequest(email);
      setSent(true);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <p className="text-ink-600">
        If an account exists for <strong>{email}</strong>, a login link has been sent. It expires in 10 minutes.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <FormField label="Email Address" htmlFor="email">
        <Input
          id="email"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </FormField>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? 'Sending...' : 'Send Login Link'}
      </Button>
    </form>
  );
}

export default function PasswordlessLogin() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  return (
    <AuthLayout heading="Sign in without a password." subtext="We'll email you a secure, one-time link to log in.">
      <h1 className="text-3xl font-bold text-ink-900">{token ? 'Confirming your link' : 'Email Me a Login Link'}</h1>
      <p className="mt-2 text-ink-600">
        {token ? 'Hang tight while we verify your login link.' : "Enter your email and we'll send a link to sign in instantly."}
      </p>

      <div className="mt-8">{token ? <VerifyStep token={token} /> : <RequestStep />}</div>

      <p className="mt-8 text-center text-sm text-ink-600">
        <Link to="/login" className="font-semibold text-plum-600 hover:underline">
          Back to password sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
