import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import FormField from '../../components/ui/FormField';
import PasswordStrengthMeter from '../../components/ui/PasswordStrengthMeter';
import getErrorMessage from '../../utils/getErrorMessage';
import { useAuth } from '../../context/AuthContext';
import * as authService from '../../services/authService';
import * as addressService from '../../services/addressService';

const profileSchema = yup.object({
  name: yup.string().trim().required('Name is required'),
});

const changePasswordSchema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup
    .string()
    .min(10, 'At least 10 characters long')
    .matches(/[a-z]/, 'Must include a lowercase letter')
    .matches(/[A-Z]/, 'Must include an uppercase letter')
    .matches(/\d/, 'Must include a number')
    .matches(/[^A-Za-z0-9]/, 'Must include a special character')
    .required('New password is required'),
});

function ChangePasswordForm() {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(changePasswordSchema) });
  const newPasswordValue = watch('newPassword');

  async function onSubmit(values) {
    try {
      await authService.changePassword(values.currentPassword, values.newPassword);
      toast.success('Password changed successfully. Other devices have been signed out.');
      reset();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Current password is incorrect'));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Current Password" htmlFor="currentPassword" error={errors.currentPassword?.message}>
          <Input id="currentPassword" type="password" {...register('currentPassword')} />
        </FormField>
        <FormField label="New Password" htmlFor="newPassword" error={errors.newPassword?.message}>
          <Input id="newPassword" type="password" {...register('newPassword')} />
          <PasswordStrengthMeter password={newPasswordValue} />
        </FormField>
      </div>
      <Button type="submit" size="sm" disabled={isSubmitting}>
        {isSubmitting ? 'Updating...' : 'Update Password'}
      </Button>
    </form>
  );
}

function MfaSection() {
  const { user, setUser } = useAuth();
  const [step, setStep] = useState('idle'); // idle | enrolling | backupCodes
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [manualEntryKey, setManualEntryKey] = useState('');
  const [code, setCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [busy, setBusy] = useState(false);

  async function startEnroll() {
    setBusy(true);
    try {
      const { qrCodeDataUrl: qr, manualEntryKey: key } = await authService.mfaSetup();
      setQrCodeDataUrl(qr);
      setManualEntryKey(key);
      setStep('enrolling');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function confirmEnroll(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const { backupCodes: codes } = await authService.mfaVerifySetup(code);
      setBackupCodes(codes);
      setStep('backupCodes');
      setUser({ ...user, mfaEnabled: true });
      setCode('');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Invalid authentication code'));
    } finally {
      setBusy(false);
    }
  }

  async function handleDisable(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await authService.mfaDisable(disablePassword, disableCode);
      toast.success('MFA disabled');
      setUser({ ...user, mfaEnabled: false });
      setStep('idle');
      setDisablePassword('');
      setDisableCode('');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not disable MFA'));
    } finally {
      setBusy(false);
    }
  }

  if (step === 'backupCodes') {
    return (
      <div className="mt-4 rounded-xl bg-cream-100 p-4">
        <p className="font-semibold text-ink-800">Save your backup codes</p>
        <p className="mt-1 text-sm text-ink-600">
          Each code can be used once to sign in if you lose access to your authenticator app. Store them somewhere safe —
          they won&apos;t be shown again.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-sm text-ink-800 sm:grid-cols-5">
          {backupCodes.map((c) => (
            <span key={c} className="rounded bg-white px-2 py-1 text-center">
              {c}
            </span>
          ))}
        </div>
        <Button size="sm" className="mt-4" onClick={() => setStep('idle')}>
          Done
        </Button>
      </div>
    );
  }

  if (step === 'enrolling') {
    return (
      <form onSubmit={confirmEnroll} className="mt-4 space-y-4">
        <p className="text-sm text-ink-600">Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.).</p>
        {qrCodeDataUrl && <img src={qrCodeDataUrl} alt="MFA QR code" className="h-40 w-40 rounded-lg border border-ink-100" />}
        <p className="text-xs text-ink-500">
          Can&apos;t scan? Enter this key manually: <span className="font-mono">{manualEntryKey}</span>
        </p>
        <FormField label="Enter the 6-digit code from your app">
          <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" />
        </FormField>
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={busy || !code}>
            {busy ? 'Verifying...' : 'Enable MFA'}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setStep('idle')}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  if (user?.mfaEnabled) {
    return (
      <form onSubmit={handleDisable} className="mt-4 space-y-4">
        <p className="text-sm text-sage-700">Two-factor authentication is enabled on your account.</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Current Password">
            <Input type="password" value={disablePassword} onChange={(e) => setDisablePassword(e.target.value)} />
          </FormField>
          <FormField label="Authentication Code">
            <Input value={disableCode} onChange={(e) => setDisableCode(e.target.value)} placeholder="123456 or backup code" />
          </FormField>
        </div>
        <Button type="submit" size="sm" variant="outline" disabled={busy || !disablePassword || !disableCode}>
          {busy ? 'Disabling...' : 'Disable MFA'}
        </Button>
      </form>
    );
  }

  return (
    <div className="mt-4">
      <p className="text-sm text-ink-600">
        Add an extra layer of security by requiring a code from an authenticator app when you sign in.
      </p>
      <Button size="sm" className="mt-3" onClick={startEnroll} disabled={busy}>
        {busy ? 'Loading...' : 'Enable Two-Factor Authentication'}
      </Button>
    </div>
  );
}

const addressSchema = yup.object({
  fullName: yup.string().trim().required('Required'),
  phone: yup.string().trim().required('Required'),
  street: yup.string().trim().required('Required'),
  city: yup.string().trim().required('Required'),
  state: yup.string().trim(),
  postalCode: yup.string().trim(),
  country: yup.string().trim().required('Required'),
});

function AddressForm({ onSaved, onCancel, initial }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(addressSchema), defaultValues: initial || { country: 'Nepal' } });

  async function onSubmit(values) {
    try {
      const saved = initial
        ? await addressService.updateAddress(initial._id, values)
        : await addressService.createAddress(values);
      toast.success('Address saved');
      onSaved(saved);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-3 rounded-xl bg-cream-100 p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField error={errors.fullName?.message}>
          <Input placeholder="Full name" {...register('fullName')} />
        </FormField>
        <FormField error={errors.phone?.message}>
          <Input placeholder="Phone" {...register('phone')} />
        </FormField>
      </div>
      <FormField error={errors.street?.message}>
        <Input placeholder="Street address" {...register('street')} />
      </FormField>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FormField error={errors.city?.message}>
          <Input placeholder="City" {...register('city')} />
        </FormField>
        <FormField>
          <Input placeholder="State (optional)" {...register('state')} />
        </FormField>
        <FormField>
          <Input placeholder="Postal code" {...register('postalCode')} />
        </FormField>
      </div>
      <FormField error={errors.country?.message}>
        <Input placeholder="Country" {...register('country')} />
      </FormField>
      <label className="flex items-center gap-2 text-sm text-ink-600">
        <input type="checkbox" {...register('isDefault')} className="h-4 w-4 rounded border-ink-200 text-plum-500" />
        Set as default address
      </label>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isSubmitting}>
          Save Address
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default function AccountSettings() {
  const { user, setUser } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [addingNew, setAddingNew] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(profileSchema), defaultValues: { name: user?.name } });

  useEffect(() => {
    reset({ name: user?.name });
  }, [user, reset]);

  useEffect(() => {
    addressService.getAddresses().then(setAddresses);
  }, []);

  async function onSaveProfile(values) {
    try {
      const updated = await authService.updateProfile(values);
      setUser(updated);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleDeleteAddress(id) {
    try {
      await addressService.deleteAddress(id);
      setAddresses((list) => list.filter((a) => a._id !== id));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink-100/60">
        <h2 className="text-xl font-bold text-ink-900">Personal Information</h2>
        <form onSubmit={handleSubmit(onSaveProfile)} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Full Name" htmlFor="profile-name" error={errors.name?.message}>
            <Input id="profile-name" {...register('name')} />
          </FormField>
          <FormField label="Email Address" htmlFor="profile-email">
            <Input id="profile-email" value={user?.email || ''} disabled className="opacity-60" />
          </FormField>
          <Button type="submit" size="sm" className="w-fit" disabled={isSubmitting}>
            Save Changes
          </Button>
        </form>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink-100/60">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-ink-900">Saved Addresses</h2>
          {!addingNew && (
            <button
              onClick={() => setAddingNew(true)}
              className="text-sm font-semibold text-plum-600 hover:underline"
            >
              + Add New
            </button>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {addresses.map((address) =>
            editingId === address._id ? (
              <AddressForm
                key={address._id}
                initial={address}
                onCancel={() => setEditingId(null)}
                onSaved={(saved) => {
                  setAddresses((list) => list.map((a) => (a._id === saved._id ? saved : a)));
                  setEditingId(null);
                }}
              />
            ) : (
              <div key={address._id} className="rounded-xl bg-cream-100 p-4">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-ink-800">{address.fullName}</p>
                  {address.isDefault && (
                    <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-ink-600">
                      Default
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-ink-600">
                  {address.street}, {address.city}
                  {address.state ? `, ${address.state}` : ''}
                </p>
                <p className="text-sm text-ink-600">{address.country}</p>
                <div className="mt-3 flex gap-4 text-sm">
                  <button onClick={() => setEditingId(address._id)} className="font-medium text-plum-600 hover:underline">
                    Edit
                  </button>
                  <button onClick={() => handleDeleteAddress(address._id)} className="font-medium text-red-500 hover:underline">
                    Remove
                  </button>
                </div>
              </div>
            )
          )}
        </div>

        {addingNew && (
          <AddressForm
            onCancel={() => setAddingNew(false)}
            onSaved={(saved) => {
              setAddresses((list) => [...list, saved]);
              setAddingNew(false);
            }}
          />
        )}
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink-100/60">
        <h2 className="text-xl font-bold text-ink-900">Security &amp; Privacy</h2>
        <p className="mt-1 text-sm text-ink-600">Update your password using your current password.</p>
        <ChangePasswordForm />
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink-100/60">
        <h2 className="text-xl font-bold text-ink-900">Two-Factor Authentication</h2>
        <MfaSection />
      </div>
    </div>
  );
}
