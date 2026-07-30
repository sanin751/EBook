import { Route, Routes } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AccountLayout from './layouts/AccountLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import Compare from './pages/Compare';
import CheckoutShipping from './pages/checkout/Shipping';
import CheckoutPayment from './pages/checkout/Payment';
import CheckoutConfirmation from './pages/checkout/Confirmation';
import AccountOverview from './pages/account/Overview';
import OrderHistory from './pages/account/OrderHistory';
import AdminOrders from './pages/account/AdminOrders';
import AdminSecurity from './pages/account/AdminSecurity';
import AccountSettings from './pages/account/Settings';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import PasswordlessLogin from './pages/auth/PasswordlessLogin';
import Support from './pages/Support';
import Collections from './pages/Collections';
import OurStory from './pages/OurStory';
import Journal from './pages/Journal';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/support" element={<Support />} />
        <Route path="/collections" element={<Collections />} />
        <Route path="/our-story" element={<OurStory />} />
        <Route path="/journal" element={<Journal />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/cart" element={<Cart />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/checkout/shipping" element={<CheckoutShipping />} />
          <Route path="/checkout/payment" element={<CheckoutPayment />} />
          <Route path="/checkout/confirmation/:orderId" element={<CheckoutConfirmation />} />

          <Route element={<AccountLayout />}>
            <Route path="/account" element={<AccountOverview />} />
            <Route path="/account/orders" element={<OrderHistory />} />
            <Route path="/account/manage-orders" element={<AdminOrders />} />
            <Route path="/account/security" element={<AdminSecurity />} />
            <Route path="/account/settings" element={<AccountSettings />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/passwordless-login" element={<PasswordlessLogin />} />
    </Routes>
  );
}

export default App;
