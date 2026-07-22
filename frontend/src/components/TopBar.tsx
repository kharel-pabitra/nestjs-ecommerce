import { useAuthStore } from '../store/auth';

export function TopBar() {
  const { user, logout } = useAuthStore();

  return (
    <header className="border-b border-line bg-panel sticky top-0 z-10 h-16 flex items-center px-6 justify-between">
      <div>
        <h1 className="font-display text-lg font-semibold tracking-tight">
          API Console<span className="text-indigo">.</span>
        </h1>
        <p className="text-[11px] text-slate-muted -mt-0.5">nestjs-ecommerce backend</p>
      </div>

      {user ? (
        <div className="flex items-center gap-3 text-sm">
          <span className="font-mono text-xs text-slate-muted">{user.email}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-indigo-soft text-indigo">
            {user.role}
          </span>
          <button onClick={logout} className="text-slate-muted hover:text-red transition-colors">
            Sign out
          </button>
        </div>
      ) : (
        <span className="text-sm text-slate-muted">Not signed in</span>
      )}
    </header>
  );
}
