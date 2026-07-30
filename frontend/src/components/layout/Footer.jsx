import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Button from '../ui/Button';

const COLUMNS = [
  {
    title: 'Shop',
    links: [
      { label: 'Shop All', to: '/shop' },
      { label: 'Collections', to: '/collections' },
      { label: 'Shipping & Returns', to: '/support' },
      { label: 'Wholesale', to: '/support' },
    ],
  },
  {
    title: 'About',
    links: [
      { label: 'Our Story', to: '/our-story' },
      { label: 'Journal', to: '/journal' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Contact', to: '/support' },
      { label: 'FAQs', to: '/support' },
    ],
  },
];

export default function Footer() {
  const [email, setEmail] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    toast.success('Thanks for joining the EBook journal!');
    setEmail('');
  }

  return (
    <footer className="border-t border-ink-100 bg-cream-100">
      <div className="container-page grid grid-cols-2 gap-10 py-14 md:grid-cols-5">
        <div className="col-span-2">
          <Link to="/" className="text-xl font-bold text-plum-600">
            EBook
          </Link>
          <p className="mt-3 max-w-xs text-sm text-ink-600">
            Books hand-picked by people who read them. &copy; {new Date().getFullYear()} EBook. Stories, delivered.
          </p>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="text-sm font-semibold text-ink-800">{col.title}</h4>
            <ul className="mt-4 space-y-2 text-sm text-ink-600">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="hover:text-plum-600">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h4 className="text-sm font-semibold text-ink-800">Newsletter</h4>
          <p className="mt-4 text-sm text-ink-600">Join our journey and get updates on new drops.</p>
          <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full rounded-full border border-ink-100 bg-white px-3 py-2 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-plum-300"
            />
            <Button type="submit" size="sm" className="shrink-0 px-4">
              Join
            </Button>
          </form>
        </div>
      </div>
    </footer>
  );
}
