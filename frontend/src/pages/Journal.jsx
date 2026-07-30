import { toast } from 'react-toastify';
import Badge from '../components/ui/Badge';

const ARTICLES = [
  {
    title: 'Building a Reading Habit That Actually Sticks',
    excerpt:
      'Why "read more" fails as a goal, and what to try instead if your to-be-read pile keeps growing untouched.',
    category: 'Reading Life',
    date: 'June 2, 2026',
    image: '/images/shelf-8.svg',
  },
  {
    title: 'Caring for Your Books',
    excerpt: 'A simple guide to storing, shelving, and living with a growing collection without wrecking the spines.',
    category: 'Care Guide',
    date: 'May 18, 2026',
    image: '/images/shelf-5.svg',
  },
  {
    title: 'Meet the Team: What We’re Reading This Month',
    excerpt: 'Three of our booksellers on the titles currently on their nightstands, and why they picked them.',
    category: 'Staff Picks',
    date: 'April 30, 2026',
    image: '/images/reading-1.svg',
  },
  {
    title: 'Our Packaging Promise',
    excerpt: 'Why every EBook order ships in crush-resistant, minimal packaging, and what that costs us to do right.',
    category: 'Behind the Scenes',
    date: 'April 9, 2026',
    image: '/images/shelf-6.svg',
  },
  {
    title: 'Hardcover, Paperback, or E-book: How to Choose',
    excerpt: 'The real trade-offs between formats, beyond just price — durability, portability, and resale value.',
    category: 'Reading Life',
    date: 'March 22, 2026',
    image: '/images/shelf-1.svg',
  },
  {
    title: 'Styling a Bookshelf You Actually Want to Look At',
    excerpt: 'A few notes on arranging books by color, size, or genre — from our own customers’ shelves.',
    category: 'Home',
    date: 'March 3, 2026',
    image: '/images/shelf-3.svg',
  },
];

export default function Journal() {
  return (
    <div className="container-page py-14">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-plum-500">Journal</p>
        <h1 className="mt-2 text-3xl font-bold text-ink-900">Notes for Readers</h1>
        <p className="mx-auto mt-3 max-w-xl text-ink-600">
          Notes on reading, care, and the people behind every EBook order.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {ARTICLES.map((article) => (
          <article
            key={article.title}
            className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink-100/60"
          >
            <div className="aspect-[4/3] overflow-hidden">
              <img src={article.image} alt={article.title} className="h-full w-full object-cover" />
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3 text-xs text-ink-400">
                <Badge tone="neutral">{article.category}</Badge>
                <span>{article.date}</span>
              </div>
              <h2 className="mt-3 text-lg font-bold text-ink-900">{article.title}</h2>
              <p className="mt-2 text-sm text-ink-600">{article.excerpt}</p>
              <button
                onClick={() => toast.info('Full articles are coming soon to the Journal.')}
                className="mt-4 text-sm font-semibold text-plum-600 hover:underline"
              >
                Read More →
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
