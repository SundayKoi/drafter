import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function DashboardPage() {
  const { staff } = useAuth();

  return (
    <div>
      <h1 className="font-display text-4xl tracking-wider">DASHBOARD</h1>
      <p className="mt-2 text-[#8A9099]">Welcome back, {staff?.display_name}.</p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Link
          to="/admin/news"
          className="rounded border border-[#2A2A2A] bg-[#141414] p-6 transition hover:border-white/40"
        >
          <div className="font-mono text-xs uppercase text-[#8A9099]">News</div>
          <div className="mt-2 font-display text-2xl">Post updates</div>
        </Link>
        <Link
          to="/admin/players"
          className="rounded border border-[#2A2A2A] bg-[#141414] p-6 transition hover:border-white/40"
        >
          <div className="font-mono text-xs uppercase text-[#8A9099]">Players</div>
          <div className="mt-2 font-display text-2xl">Manage rosters</div>
        </Link>
        <Link
          to="/admin/settings"
          className="rounded border border-[#2A2A2A] bg-[#141414] p-6 transition hover:border-white/40"
        >
          <div className="font-mono text-xs uppercase text-[#8A9099]">Settings</div>
          <div className="mt-2 font-display text-2xl">Embeds, socials</div>
        </Link>
      </div>
    </div>
  );
}
