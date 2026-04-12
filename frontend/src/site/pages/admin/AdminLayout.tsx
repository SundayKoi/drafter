import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SITE_BRAND } from '../../brand';

const navItems = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/applications', label: 'Applications' },
  { to: '/admin/standings', label: 'Standings' },
  { to: '/admin/scores', label: 'Scores' },
  { to: '/admin/news', label: 'News' },
  { to: '/admin/vods', label: 'VODs' },
  { to: '/admin/players', label: 'Players' },
  { to: '/admin/settings', label: 'Settings' },
];

export function AdminLayout() {
  const { staff, loading, logout } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0D0D0D] text-white">
        Loading…
      </div>
    );
  }
  if (!staff) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <div className="flex min-h-screen bg-[#0D0D0D] text-white">
      <aside className="flex w-60 shrink-0 flex-col border-r border-[#2A2A2A] bg-[#141414] px-4 py-6">
        <div className="flex items-center gap-2 px-2">
          <img src={SITE_BRAND.logoUrl} alt="" className="h-8 w-8" />
          <span className="font-display text-xl tracking-wider">ADMIN</span>
        </div>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded px-3 py-2 text-sm transition ${
                  isActive
                    ? 'bg-[#1C1C1C] text-[#F5A800]'
                    : 'text-white/80 hover:bg-[#1C1C1C]'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-4 border-t border-[#2A2A2A] pt-4">
          <div className="px-2 text-sm text-white">{staff.display_name}</div>
          <div className="px-2 font-mono text-xs uppercase text-[#666]">{staff.role}</div>
          <button
            onClick={logout}
            className="mt-3 w-full rounded border border-[#2A2A2A] py-1.5 text-sm hover:border-[#E63000] hover:text-[#E63000]"
          >
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto px-10 py-8">
        <Outlet />
      </main>
    </div>
  );
}
