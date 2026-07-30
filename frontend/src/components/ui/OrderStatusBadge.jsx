const STYLES = {
  pending: 'bg-plum-100 text-plum-700',
  processing: 'bg-sage-100 text-sage-700',
  shipped: 'bg-ink-100 text-ink-700',
  delivered: 'bg-sage-500 text-white',
  cancelled: 'bg-red-100 text-red-700',
};

export default function OrderStatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase ${STYLES[status] || STYLES.pending}`}>
      {status}
    </span>
  );
}
