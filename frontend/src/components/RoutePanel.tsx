import { useState } from 'react';
import type { ApiRouteDef } from '../data/routes';
import { FieldInput } from './FieldInput';
import { JsonViewer } from './JsonViewer';
import { MethodBadge } from './RouteSidebar';
import { StripePayPanel } from './StripePayPanel';
import { callRoute, type CallResult } from '../lib/callApi';
import { decodeUserFromToken } from '../lib/jwt';
import { useAuthStore } from '../store/auth';

function initialPathValues(route: ApiRouteDef): Record<string, string> {
  const v: Record<string, string> = {};
  for (const p of route.pathParams ?? []) v[p.name] = '';
  return v;
}

function initialBodyValues(route: ApiRouteDef): Record<string, unknown> {
  const v: Record<string, unknown> = {};
  for (const f of route.bodyFields ?? []) {
    v[f.name] = f.type === 'string-array' || f.type === 'order-items' ? [] : '';
  }
  return v;
}

function statusColor(status: number | null) {
  if (status === null) return 'text-slate-muted bg-line/40';
  if (status < 300) return 'text-emerald bg-emerald-soft';
  if (status < 500) return 'text-amber bg-amber-soft';
  return 'text-red bg-red-soft';
}

export function RoutePanel({ route }: { route: ApiRouteDef }) {
  const { user, setSession, setAccessToken, logout } = useAuthStore();
  const [pathValues, setPathValues] = useState(initialPathValues(route));
  const [bodyValues, setBodyValues] = useState(initialBodyValues(route));
  const [result, setResult] = useState<CallResult | null>(null);
  const [sending, setSending] = useState(false);

  const authBlocked = route.auth && !user;
  const roleBlocked = !!(route.roles && user && !route.roles.includes(user.role));
  const disabled = authBlocked || roleBlocked || sending;

  async function handleSend() {
    // auth.logout has no backend route — handle it entirely client-side
    if (route.id === 'auth.logout') {
      logout();
      setResult({ ok: true, status: 200, data: { message: 'Session cleared locally.' } });
      return;
    }

    setSending(true);
    const res = await callRoute(route, pathValues, bodyValues);
    setResult(res);
    setSending(false);

    if (res.ok && route.special === 'login') {
      const token = (res.data as { accessToken?: string })?.accessToken;
      const decoded = token ? decodeUserFromToken(token) : null;
      if (token && decoded) setSession(token, decoded);
    }

    if (res.ok && route.special === 'refresh') {
      const token = (res.data as { accessToken?: string })?.accessToken;
      if (token) {
        const decoded = decodeUserFromToken(token);
        if (decoded) setSession(token, decoded);
        else setAccessToken(token);
      }
    }
  }

  const clientSecret =
    route.special === 'stripe-intent' && result?.ok
      ? (result.data as { clientSecret?: string })?.clientSecret
      : undefined;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 mb-1">
        <MethodBadge method={route.method} />
        <code className="font-mono text-sm">{route.path}</code>
      </div>
      <h2 className="font-display text-xl font-semibold mb-1">{route.summary}</h2>

      <div className="flex gap-2 mb-4">
        {route.auth && (
          <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-line/50 text-slate-muted">
            Auth required
          </span>
        )}
        {route.roles?.map((r) => (
          <span
            key={r}
            className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-line/50 text-slate-muted"
          >
            {r} only
          </span>
        ))}
      </div>

      {route.note && (
        <p className="text-sm text-slate-muted bg-paper border border-line rounded-md px-3 py-2 mb-5">
          {route.note}
        </p>
      )}

      {authBlocked && (
        <p className="text-sm text-red bg-red-soft border border-red/20 rounded-md px-3 py-2 mb-5">
          Sign in first — this route requires a valid access token.
        </p>
      )}
      {roleBlocked && (
        <p className="text-sm text-red bg-red-soft border border-red/20 rounded-md px-3 py-2 mb-5">
          Your account is <strong>{user?.role}</strong>, this route requires{' '}
          <strong>{route.roles?.join(' or ')}</strong>.
        </p>
      )}

      {(route.pathParams?.length || route.bodyFields?.length) ? (
        <div className="space-y-4 border border-line bg-panel rounded-lg p-5 mb-5">
          {route.pathParams?.map((p) => (
            <FieldInput
              key={p.name}
              field={p}
              value={pathValues[p.name]}
              onChange={(v) => setPathValues({ ...pathValues, [p.name]: v as string })}
            />
          ))}
          {route.bodyFields?.map((f) => (
            <FieldInput
              key={f.name}
              field={f}
              value={bodyValues[f.name]}
              onChange={(v) => setBodyValues({ ...bodyValues, [f.name]: v })}
            />
          ))}
        </div>
      ) : null}

      <button
        onClick={handleSend}
        disabled={disabled}
        className="bg-ink text-white rounded-md px-5 py-2.5 text-sm font-medium hover:bg-indigo transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {sending ? 'Sending…' : `Send ${route.method}`}
      </button>

      {result && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-2">
            <span className={`font-mono text-xs font-semibold px-2 py-0.5 rounded ${statusColor(result.status)}`}>
              {result.status ?? 'Network error'}
            </span>
            {result.message && !result.ok && (
              <span className="text-sm text-red">{result.message}</span>
            )}
          </div>
          <JsonViewer data={result.data} />
        </div>
      )}

      {clientSecret && <StripePayPanel clientSecret={clientSecret} />}
    </div>
  );
}
