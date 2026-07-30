import { Link } from 'react-router-dom';

export default function AuthLayout({ heading, subtext, children }) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div
        className="relative hidden overflow-hidden bg-cover bg-center lg:flex lg:flex-col lg:justify-between lg:p-10"
        style={{ backgroundImage: "url('/images/reading-1.svg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-ink-900/70 via-ink-900/20 to-ink-900/80" />

        <Link to="/" className="relative text-xl font-bold text-white">
          EBook
        </Link>

        {(heading || subtext) && (
          <div className="relative max-w-md text-white">
            {heading && <h2 className="text-3xl font-bold leading-tight">{heading}</h2>}
            {subtext && <p className="mt-3 text-white/80">{subtext}</p>}
          </div>
        )}
      </div>

      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <Link to="/" className="mb-8 text-xl font-bold text-plum-600 lg:hidden">
          EBook
        </Link>
        <div className="mx-auto w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
