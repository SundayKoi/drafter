import { Link } from 'react-router-dom';
import { useApplications } from '../../hooks/useSiteData';
import { useAuth } from '../../context/AuthContext';

export function DashboardPage() {
  const { staff } = useAuth();
  const { data: pending } = useApplications('pending');

  return (
    <div>
      <h1 className="font-display text-4xl tracking-wider">DASHBOARD</h1>
      <p className="mt-2 text-[#8A9099]">Welcome back, {staff?.display_name}.</p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Link
          to="/admin/applications"
          className="rounded border border-[#2A2A2A] bg-[#141414] p-6 transition hover:border-white/40"
        >
          <div className="font-mono text-xs uppercase text-[#8A9099]">Pending applications</div>
          <div className="mt-2 font-display text-5xl text-[#F5A800]">
            {pending?.length ?? '—'}
          </div>
        </Link>
        <Link
          to="/admin/standings"
          className="rounded border border-[#2A2A2A] bg-[#141414] p-6 transition hover:border-white/40"
        >
          <div className="font-mono text-xs uppercase text-[#8A9099]">Standings</div>
          <div className="mt-2 font-display text-2xl">Edit or import</div>
        </Link>
        <Link
          to="/admin/scores"
          className="rounded border border-[#2A2A2A] bg-[#141414] p-6 transition hover:border-white/40"
        >
          <div className="font-mono text-xs uppercase text-[#8A9099]">Scores</div>
          <div className="mt-2 font-display text-2xl">Post a match</div>
        </Link>
      </div>
    </div>
  );
}
