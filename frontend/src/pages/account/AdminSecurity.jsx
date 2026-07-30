import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import * as securityService from '../../services/securityService';
import getErrorMessage from '../../utils/getErrorMessage';

function formatDate(value) {
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminSecurity() {
  const { isAdmin } = useAuth();
  const [events, setEvents] = useState(null);
  const [blockedIps, setBlockedIps] = useState(null);
  const [blockIpValue, setBlockIpValue] = useState('');
  const [blockReasonValue, setBlockReasonValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function loadBlockedIps() {
    securityService.getBlockedIps().then(setBlockedIps);
  }

  useEffect(() => {
    if (!isAdmin) return;
    securityService.getSecurityEvents({ limit: 25 }).then((res) => setEvents(res.events));
    loadBlockedIps();
  }, [isAdmin]);

  if (!isAdmin) {
    return <Navigate to="/account" replace />;
  }

  async function handleBlockIp(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await securityService.blockIp(blockIpValue, blockReasonValue);
      toast.success('IP blocked');
      setBlockIpValue('');
      setBlockReasonValue('');
      loadBlockedIps();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUnblock(ip) {
    try {
      await securityService.unblockIp(ip);
      toast.success('IP unblocked');
      loadBlockedIps();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-ink-900">Security Log</h1>
        <p className="mt-1 text-ink-600">Audit trail of authentication and admin activity, plus blocked IP addresses.</p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink-100/60">
        <h2 className="text-xl font-bold text-ink-900">Recent Security Events</h2>
        {events === null ? (
          <p className="mt-6 text-ink-400">Loading events...</p>
        ) : events.length === 0 ? (
          <p className="mt-6 text-ink-500">No security events recorded yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                <tr>
                  <th className="pb-2">Event</th>
                  <th className="pb-2">User</th>
                  <th className="pb-2">IP Address</th>
                  <th className="pb-2">When</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event._id} className="border-t border-ink-100">
                    <td className="py-2 font-medium text-ink-800">{event.type}</td>
                    <td className="py-2 text-ink-600">{event.user?.email || event.email || '—'}</td>
                    <td className="py-2 text-ink-600">{event.ip || '—'}</td>
                    <td className="py-2 text-ink-500">{formatDate(event.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink-100/60">
        <h2 className="text-xl font-bold text-ink-900">Blocked IP Addresses</h2>
        <p className="mt-1 text-sm text-ink-600">
          IPs are auto-blocked for an hour after repeated rate-limit violations, or can be blocked manually below.
        </p>

        <form onSubmit={handleBlockIp} className="mt-4 flex flex-wrap gap-3">
          <Input
            placeholder="IP address"
            value={blockIpValue}
            onChange={(e) => setBlockIpValue(e.target.value)}
            className="max-w-[200px]"
            required
          />
          <Input
            placeholder="Reason (optional)"
            value={blockReasonValue}
            onChange={(e) => setBlockReasonValue(e.target.value)}
            className="max-w-xs"
          />
          <Button type="submit" size="sm" disabled={submitting}>
            Block IP
          </Button>
        </form>

        {blockedIps === null ? (
          <p className="mt-6 text-ink-400">Loading blocked IPs...</p>
        ) : blockedIps.length === 0 ? (
          <p className="mt-6 text-ink-500">No IPs are currently blocked.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {blockedIps.map((entry) => (
              <div
                key={entry._id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-cream-100 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-ink-800">{entry.ip}</p>
                  <p className="text-xs text-ink-500">
                    {entry.reason} · expires {formatDate(entry.expiresAt)}
                  </p>
                </div>
                <button
                  onClick={() => handleUnblock(entry.ip)}
                  className="text-sm font-medium text-red-500 hover:underline"
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
