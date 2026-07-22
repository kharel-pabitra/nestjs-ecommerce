import { GROUPS, ROUTES, type ApiRouteDef } from '../data/routes';
import { useAuthStore } from '../store/auth';

const METHOD_COLORS: Record<string, string> = {
  GET: 'text-indigo bg-indigo-soft',
  POST: 'text-emerald bg-emerald-soft',
  PATCH: 'text-amber bg-amber-soft',
  DELETE: 'text-red bg-red-soft',
};

export function MethodBadge({ method }: { method: string }) {
  return (
    <span
      className={`font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded ${METHOD_COLORS[method]}`}
    >
      {method}
    </span>
  );
}

export function RouteSidebar({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (route: ApiRouteDef) => void;
}) {
  const user = useAuthStore((s) => s.user);

  return (
    <nav className="w-72 shrink-0 border-r border-line bg-panel h-[calc(100vh-64px)] overflow-y-auto sticky top-16">
      {GROUPS.map((group) => (
        <div key={group} className="py-3">
          <h3 className="px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-muted mb-1">
            {group}
          </h3>
          <ul>
            {ROUTES.filter((r) => r.group === group).map((r) => {
              const locked =
                (r.auth && !user) || (r.roles && user && !r.roles.includes(user.role));
              return (
                <li key={r.id}>
                  <button
                    onClick={() => onSelect(r)}
                    className={`w-full flex items-center gap-2 px-4 py-1.5 text-left text-sm transition-colors ${
                      selectedId === r.id
                        ? 'bg-indigo-soft text-indigo font-medium'
                        : 'hover:bg-paper'
                    }`}
                  >
                    <MethodBadge method={r.method} />
                    <span className="truncate flex-1">{r.summary}</span>
                    {locked && <span className="text-slate-muted text-xs">🔒</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
