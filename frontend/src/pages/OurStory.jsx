import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

const VALUES = [
  { icon: '📚', title: 'Independent Publishers', copy: 'We stock small and independent presses alongside the big names, not just the bestseller table.' },
  { icon: '🤝', title: 'Fair to Authors', copy: 'We work with distributors that pay authors and publishers a fair share of every sale.' },
  { icon: '🔎', title: 'Read Before We Stock', copy: 'Every title on the shelf has been read and recommended by someone on our small team.' },
  { icon: '📦', title: 'Careful Packaging', copy: 'Crush-resistant, book-safe packaging on every order, so it arrives the way it left the shelf.' },
];

const PROCESS = [
  { step: '01', title: 'We Read Widely', copy: 'Our team reads across genres year-round, looking for books worth putting in front of readers.', image: '/images/shelf-4.svg' },
  { step: '02', title: 'We Curate', copy: 'Every title is chosen for the catalog, not auto-listed — quality over sheer quantity.', image: '/images/reading-4.svg' },
  { step: '03', title: 'We Pack with Care', copy: 'Orders are boxed by hand in crush-resistant packaging built to survive the trip.', image: '/images/shelf-2.svg' },
  { step: '04', title: 'We Check Every Order', copy: 'Every order is checked against the invoice before it ever leaves our shelves.', image: '/images/shelf-7.svg' },
];

const STATS = [
  { value: '7', label: 'Curated Genres' },
  { value: '20+', label: 'Independent Publishers' },
  { value: '100%', label: 'Titles Read In-House' },
];

export default function OurStory() {
  return (
    <div>
      <section
        className="relative bg-cover bg-center py-24 text-white"
        style={{ backgroundImage: "url('/images/reading-3.svg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-ink-900/80 via-ink-900/60 to-ink-900/85" />
        <div className="container-page relative text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-plum-200">Our Story</p>
          <h1 className="mx-auto mt-4 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
            Built by Readers, for Readers
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-white/80">
            EBook began with a simple belief — that a good bookshop should feel like it's run by people who
            actually read. Every title in our catalog has been chosen, not just listed, by a small team of
            readers across Nepal.
          </p>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-plum-500">Where it started</p>
            <h2 className="mt-2 text-2xl font-bold text-ink-900 sm:text-3xl">
              From a reading list to a real bookshop
            </h2>
            <p className="mt-4 text-ink-600">
              EBook started as a shared reading list among a handful of friends in Kathmandu who kept lending
              each other books they couldn&apos;t find in stores. What began as a spreadsheet has grown into a
              proper catalog spanning seven genres, sourced from independent and major publishers alike.
            </p>
            <p className="mt-4 text-ink-600">
              We&apos;re intentionally selective. New titles are added in small batches, and every one has been
              read or vetted by someone on our team before it goes up for sale.
            </p>
            <Button as={Link} to="/shop" className="mt-6">
              Shop the Catalog
            </Button>
          </div>
          <div className="relative">
            <img
              src="/images/reading-5.svg"
              alt="A reader curled up with an open book"
              className="aspect-[4/5] w-full rounded-2xl object-cover"
            />
            <div className="absolute -bottom-6 left-1/2 grid w-[92%] -translate-x-1/2 grid-cols-3 gap-4 rounded-2xl bg-white p-6 shadow-lg ring-1 ring-ink-100/60">
              {STATS.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-2xl font-bold text-plum-600 sm:text-3xl">{stat.value}</p>
                  <p className="mt-1 text-xs font-medium text-ink-600">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-ink-100 bg-cream-100 py-16 pt-24">
        <div className="container-page">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-plum-500">What we stand for</p>
            <h2 className="mt-2 text-2xl font-bold text-ink-900 sm:text-3xl">Our Values</h2>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v) => (
              <div key={v.title} className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-ink-100/60">
                <span className="text-2xl">{v.icon}</span>
                <h3 className="mt-3 font-semibold text-ink-900">{v.title}</h3>
                <p className="mt-2 text-sm text-ink-600">{v.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-plum-500">How We Work</p>
          <h2 className="mt-2 text-2xl font-bold text-ink-900 sm:text-3xl">From Shelf to Doorstep</h2>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {PROCESS.map((p) => (
            <div key={p.step}>
              <div className="aspect-square overflow-hidden rounded-2xl">
                <img src={p.image} alt={p.title} className="h-full w-full object-cover" />
              </div>
              <p className="mt-4 text-2xl font-bold text-plum-300">{p.step}</p>
              <h3 className="mt-1 font-semibold text-ink-900">{p.title}</h3>
              <p className="mt-2 text-sm text-ink-600">{p.copy}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
