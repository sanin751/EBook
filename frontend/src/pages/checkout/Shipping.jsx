import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import CheckoutSteps from '../../components/checkout/CheckoutSteps';
import OrderSummarySidebar from '../../components/checkout/OrderSummarySidebar';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import FormField from '../../components/ui/FormField';
import getErrorMessage from '../../utils/getErrorMessage';
import { useCart } from '../../context/CartContext';
import * as orderService from '../../services/orderService';

const schema = yup.object({
  fullName: yup.string().trim().required('Full name is required'),
  phone: yup.string().trim().required('Phone number is required'),
  street: yup.string().trim().required('Street address is required'),
  city: yup.string().trim().required('City is required'),
  state: yup.string().trim(),
  postalCode: yup.string().trim(),
  country: yup.string().trim().required('Country is required'),
});

export default function CheckoutShipping() {
  const { cart, refreshCart } = useCart();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(schema), defaultValues: { country: 'Nepal' } });

  const items = cart?.items || [];
  const subtotal = cart?.totalPrice || 0;

  async function onSubmit(values) {
    setSubmitError('');
    try {
      const order = await orderService.createOrder(values);
      await refreshCart();
      navigate('/checkout/payment', { state: { order } });
    } catch (err) {
      setSubmitError(getErrorMessage(err, 'Could not create your order'));
      toast.error(getErrorMessage(err));
    }
  }

  if (items.length === 0) {
    return (
      <div className="container-page py-16 text-center">
        <p className="text-ink-500">Your basket is empty. Add something lovely before checking out.</p>
        <Button as="a" href="/shop" className="mt-4">
          Continue Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <CheckoutSteps current="shipping" />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <h1 className="text-3xl font-bold text-ink-900">Shipping Address</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            {submitError && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{submitError}</p>}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormField label="Full Name" htmlFor="fullName" error={errors.fullName?.message}>
                <Input id="fullName" placeholder="E.g. Rowan Thorne" {...register('fullName')} />
              </FormField>
              <FormField label="Phone Number" htmlFor="phone" error={errors.phone?.message}>
                <Input id="phone" placeholder="+977 98 0000 0000" {...register('phone')} />
              </FormField>
            </div>

            <FormField label="Street Address" htmlFor="street" error={errors.street?.message}>
              <Input id="street" placeholder="123 Reader Ave" {...register('street')} />
            </FormField>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <FormField label="City" htmlFor="city" error={errors.city?.message}>
                <Input id="city" placeholder="Kathmandu" {...register('city')} />
              </FormField>
              <FormField label="State / Province" htmlFor="state">
                <Input id="state" placeholder="Optional" {...register('state')} />
              </FormField>
              <FormField label="Postal Code" htmlFor="postalCode">
                <Input id="postalCode" placeholder="44600" {...register('postalCode')} />
              </FormField>
            </div>

            <FormField label="Country" htmlFor="country" error={errors.country?.message}>
              <Input id="country" {...register('country')} />
            </FormField>

            <Button type="submit" className="mt-2" disabled={isSubmitting}>
              {isSubmitting ? 'Continuing...' : 'Continue to Payment'}
            </Button>
          </form>
        </div>

        <OrderSummarySidebar
          items={items}
          subtotal={subtotal}
          total={subtotal}
          note="Your order will ship in crush-resistant, book-safe packaging."
        />
      </div>
    </div>
  );
}
