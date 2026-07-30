import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import CheckoutSteps from '../../components/checkout/CheckoutSteps';
import OrderSummarySidebar from '../../components/checkout/OrderSummarySidebar';
import Button from '../../components/ui/Button';
import EsewaLogo from '../../components/ui/EsewaLogo';
import formatCurrency from '../../utils/formatCurrency';
import getErrorMessage from '../../utils/getErrorMessage';
import * as paymentService from '../../services/paymentService';

const PAYMENT_METHODS = [
  {
    id: 'esewa',
    label: 'eSewa Wallet',
    description: 'Pay using your eSewa account',
    icon: <EsewaLogo className="h-8 w-8" />,
  },
  {
    id: 'cod',
    label: 'Cash on Delivery',
    description: 'Pay in cash when your order arrives',
    icon: <span className="text-2xl">💵</span>,
  },
];

function submitEsewaForm(gatewayUrl, fields) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = gatewayUrl;

  Object.entries(fields).forEach(([name, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}

export default function CheckoutPayment() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [order] = useState(location.state?.order || null);
  const [method, setMethod] = useState('esewa');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!order) {
      navigate('/checkout/shipping', { replace: true });
      return;
    }
    const paymentParam = searchParams.get('payment');
    if (paymentParam === 'failed') {
      setError('Your eSewa payment was not completed. Please try again.');
    } else if (paymentParam === 'error') {
      setError('We could not verify your eSewa payment. Please try again or choose Cash on Delivery.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!order) return null;

  async function handlePay() {
    setSubmitting(true);
    setError('');
    try {
      if (method === 'esewa') {
        const { gatewayUrl, fields } = await paymentService.initiateEsewaPayment(order._id);
        submitEsewaForm(gatewayUrl, fields);
        return;
      }

      await paymentService.payWithCod(order._id);
      toast.success('Order placed! Pay with cash when it arrives.');
      navigate(`/checkout/confirmation/${order._id}`);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not process your payment'));
      setSubmitting(false);
    }
  }

  return (
    <div className="container-page py-10">
      <CheckoutSteps current="payment" />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <h1 className="text-3xl font-bold text-ink-900">Payment Method</h1>
          <p className="mt-2 text-ink-600">
            Select how you&apos;d like to complete your purchase. All transactions are encrypted and secure.
          </p>

          <div className="mt-6 flex gap-3 rounded-xl bg-sage-50 p-4 text-sm text-sage-700">
            <span aria-hidden="true">🛡</span>
            <p>
              <span className="font-semibold">Secure Payment Guaranteed.</span> Your payment information is
              processed securely and never stored on our servers.
            </p>
          </div>

          {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

          <div className="mt-6 space-y-3">
            {PAYMENT_METHODS.map((m) => (
              <label
                key={m.id}
                className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-colors ${
                  method === m.id ? 'border-plum-500 bg-plum-50' : 'border-ink-100 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="payment-method"
                  value={m.id}
                  checked={method === m.id}
                  onChange={() => setMethod(m.id)}
                  className="h-4 w-4 text-plum-500"
                />
                {m.icon}
                <span>
                  <span className="block font-semibold text-ink-900">{m.label}</span>
                  <span className="block text-sm text-ink-500">{m.description}</span>
                </span>
              </label>
            ))}
          </div>

          <Button className="mt-8" onClick={handlePay} disabled={submitting}>
            {submitting
              ? 'Processing…'
              : method === 'cod'
                ? `Place Order — Pay ${formatCurrency(order.totalAmount)} on Delivery`
                : `Pay ${formatCurrency(order.totalAmount)}`}
          </Button>

          <button
            onClick={() => navigate('/checkout/shipping')}
            className="mt-6 block text-sm text-ink-500 hover:text-ink-700"
          >
            ← Back to shipping
          </button>
        </div>

        <OrderSummarySidebar
          items={order.items}
          subtotal={order.itemsTotal}
          shippingFee={order.shippingFee}
          total={order.totalAmount}
        />
      </div>
    </div>
  );
}
