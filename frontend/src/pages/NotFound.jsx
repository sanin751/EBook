import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-plum-500">404</p>
      <h1 className="mt-2 text-3xl font-bold text-ink-900">This page hasn&apos;t been written yet.</h1>
      <p className="mt-3 max-w-md text-ink-600">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <Button as={Link} to="/" className="mt-6">
        Back to Home
      </Button>
    </div>
  );
}
