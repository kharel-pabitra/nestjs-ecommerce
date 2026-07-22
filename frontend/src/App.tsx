import { useState } from 'react';
import { TopBar } from './components/TopBar';
import { RouteSidebar, MethodBadge } from './components/RouteSidebar';
import { RoutePanel } from './components/RoutePanel';
import { useSessionBootstrap } from './hooks/useSessionBootstrap';
import { GROUPS, ROUTES, type ApiRouteDef } from './data/routes';

function Overview({ onSelect }: { onSelect: (r: ApiRouteDef) => void }) {
  return (
    <div className="max-w-3xl">
      <h2 className="font-display text-xl font-semibold mb-1">All routes</h2>
      <p className="text-sm text-slate-muted mb-6">
        Pick a route from the sidebar (or a row below) to fill in its form and call it directly
        against your backend.
      </p>

      {GROUPS.map((group) => (
        <div key={group} className="mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-muted mb-2">
            {group}
          </h3>
          <div className="border border-line rounded-lg divide-y divide-line overflow-hidden">
            {ROUTES.filter((r) => r.group === group).map((r) => (
              <button
                key={r.id}
                onClick={() => onSelect(r)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm bg-panel hover:bg-paper transition-colors"
              >
                <MethodBadge method={r.method} />
                <code className="font-mono text-xs text-slate-muted w-56 truncate">{r.path}</code>
                <span className="flex-1">{r.summary}</span>
                {r.auth && <span className="text-[10px] text-slate-muted">🔒</span>}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const ready = useSessionBootstrap();
  const [selected, setSelected] = useState<ApiRouteDef | null>(null);

  if (!ready) return null;

  return (
    <div>
      <TopBar />
      <div className="flex">
        <RouteSidebar selectedId={selected?.id ?? null} onSelect={setSelected} />
        <main className="flex-1 px-8 py-8">
          {selected ? <RoutePanel key={selected.id} route={selected} /> : <Overview onSelect={setSelected} />}
        </main>
      </div>
    </div>
  );
}
