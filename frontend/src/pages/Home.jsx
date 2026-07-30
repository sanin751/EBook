import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import ProductCard from '../components/product/ProductCard';
import * as productService from '../services/productService';
import * as categoryService from '../services/categoryService';

const TRUST_POINTS = [
  { icon: '📖', title: 'Curated Selection', copy: 'Every title hand-picked by readers who actually read them.' },
  { icon: '🚚', title: 'Free Nepal Shipping', copy: 'Complimentary delivery to all regions across Nepal.' },
  { icon: '🛡', title: 'Secure Payment', copy: 'Protected transactions with end-to-end encryption.' },
];

const CATEGORY_PHOTOS = [
  '/images/shelf-1.svg',
  '/images/shelf-2.svg',
  '/images/shelf-3.svg',
  '/images/shelf-4.svg',
  '/images/shelf-5.svg',
  '/images/shelf-6.svg',
];

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [cats, { products }] = await Promise.all([
          categoryService.getCategories(),
          productService.getProducts({ limit: 4, sort: '-createdAt' }),
        ]);
        setCategories(cats.slice(0, 6));
        setFeatured(products);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div>
      <section
        className="relative flex min-h-[75vh] items-end overflow-hidden bg-cover bg-center text-white"
        style={{ backgroundImage: "url('/images/reading-2.svg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/90 via-ink-900/40 to-ink-900/20" />
        <div className="container-page relative pb-20 pt-32">
          <p className="text-sm font-semibold uppercase tracking-widest text-plum-200">Delivering across Nepal</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
            Your Next Great Read Starts Here
          </h1>
          <p className="mt-4 max-w-xl text-white/80">
            Discover fiction, non-fiction, and everything in between, hand-picked by people who love to read.
            Every book tells a story — yours starts the moment it arrives.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button as={Link} to="/shop" size="lg">
              Shop Books
            </Button>
            <Button as={Link} to="/our-story" variant="outline" size="lg" className="border-white/50 text-white hover:bg-white/10">
              Our Story
            </Button>
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="container-page py-14">
          <div className="flex flex-wrap justify-center gap-8 sm:gap-12">
            {categories.map((category, i) => (
              <Link
                key={category._id}
                to={`/shop?category=${category._id}`}
                className="flex flex-col items-center gap-3 text-center"
              >
                <span className="h-20 w-20 overflow-hidden rounded-full ring-1 ring-ink-100">
                  <img
                    src={CATEGORY_PHOTOS[i % CATEGORY_PHOTOS.length]}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </span>
                <span className="text-sm font-medium text-ink-800">{category.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="container-page py-14">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-plum-500">New In</p>
            <h2 className="mt-1 text-2xl font-bold text-ink-900 sm:text-3xl">Featured Books</h2>
          </div>
          <Link to="/shop" className="text-sm font-semibold text-plum-600 hover:underline">
            View All Books
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-ink-50" />
            ))}
          {!isLoading && featured.map((product) => <ProductCard key={product._id} product={product} compact />)}
        </div>
      </section>

      <section className="border-y border-ink-100 bg-cream-100 py-14">
        <div className="container-page grid grid-cols-1 gap-8 text-center sm:grid-cols-3">
          {TRUST_POINTS.map((point) => (
            <div key={point.title} className="flex flex-col items-center gap-3">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl shadow-sm">
                {point.icon}
              </span>
              <h3 className="font-semibold text-ink-900">{point.title}</h3>
              <p className="max-w-xs text-sm text-ink-600">{point.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-16 text-center">
        <p className="text-3xl text-plum-300" aria-hidden="true">
          &ldquo;
        </p>
        <blockquote className="mx-auto max-w-2xl text-xl font-medium text-ink-800">
          I've ordered from a lot of bookshops online, but this is the first one that feels like it's run by people
          who actually read the books they sell.
        </blockquote>
        <p className="mt-4 text-sm font-semibold text-ink-600">Anjali Sharma — Book Club Organizer, Kathmandu</p>
      </section>
    </div>
  );
}
