import { useState } from 'react';
import { api, ApiError } from '../../api/client';
import { useApplications } from '../../hooks/useSiteData';
import type { Application } from '../../types';

type StatusFilter = 'pending' | 'approved' | 'denied';

export function ApplicationsPage() {
  const [status, setStatus] = useState<StatusFilter>('pending');
  const { data, loading, reload } = useApplications(status);
  const [selected, setSelected] = useState<Application | null>(null);

  return (
    <div className="flex h-full gap-6">
      <div className="w-1/2">
        <h1 className="font-display text-4xl tracking-wider">APPLICATIONS</h1>
        <div className="mt-4 flex gap-2">
          {(['pending', 'approved', 'denied'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded px-3 py-1 text-sm uppercase ${
                status === s ? 'bg-[#F5A800] text-black' : 'bg-[#1C1C1C] text-white/70'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="mt-4 divide-y divide-[#2A2A2A] rounded border border-[#2A2A2A] bg-[#141414]">
          {loading && <div className="p-4 text-[#666]">Loading…</div>}
          {data?.length === 0 && (
            <div className="p-4 text-[#666]">No applications.</div>
          )}
          {data?.map((app) => (
            <button
              key={app.id}
              onClick={() => setSelected(app)}
              className={`block w-full px-4 py-3 text-left hover:bg-[#1C1C1C] ${
                selected?.id === app.id ? 'bg-[#1C1C1C]' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="font-display text-lg tracking-wide">{app.team_name}</div>
                <div className="font-mono text-xs uppercase text-[#8A9099]">
                  {app.league_id}
                </div>
              </div>
              <div className="mt-1 text-xs text-[#666]">
                {new Date(app.submitted_at).toLocaleString()} · {app.players.length} players
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="w-1/2">
        {selected ? (
          <ApplicationDetail
            application={selected}
            onDone={() => {
              setSelected(null);
              reload();
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center rounded border border-dashed border-[#2A2A2A] text-[#666]">
            Select an application to review
          </div>
        )}
      </div>
    </div>
  );
}

function ApplicationDetail({
  application,
  onDone,
}: {
  application: Application;
  onDone: () => void;
}) {
  const [note, setNote] = useState(application.review_note ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function review(action: 'approve' | 'deny') {
    setBusy(true);
    setError(null);
    try {
      await api(`/admin/applications/${application.id}`, {
        method: 'PATCH',
        body: { action, note: note || null },
      });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  const pending = application.status === 'pending';

  return (
    <div className="rounded border border-[#2A2A2A] bg-[#141414] p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl tracking-wider">{application.team_name}</h2>
        <span
          className={`rounded px-2 py-0.5 font-mono text-xs uppercase ${
            application.status === 'pending'
              ? 'bg-yellow-900 text-yellow-200'
              : application.status === 'approved'
              ? 'bg-green-900 text-green-200'
              : 'bg-red-900 text-red-200'
          }`}
        >
          {application.status}
        </span>
      </div>
      {application.logo_url && (
        <img src={application.logo_url} alt="" className="mt-3 h-16 w-16 rounded" />
      )}
      <p className="mt-3 text-sm text-[#C0C0C0]">{application.bio}</p>

      <div className="mt-4 grid grid-cols-2 gap-2 font-mono text-sm">
        <div>
          <div className="text-[#666]">Contact</div>
          <div>{application.contact_name}</div>
        </div>
        <div>
          <div className="text-[#666]">League</div>
          <div className="uppercase">{application.league_id}</div>
        </div>
        <div>
          <div className="text-[#666]">Email</div>
          <div>{application.contact_email}</div>
        </div>
        <div>
          <div className="text-[#666]">Discord</div>
          <div>{application.contact_discord}</div>
        </div>
      </div>

      <h3 className="mt-5 font-display text-lg tracking-wider text-[#F5A800]">ROSTER</h3>
      <ul className="mt-2 space-y-1 font-mono text-sm">
        {application.players.map((p) => (
          <li key={p.id} className="flex items-center justify-between border-b border-[#2A2A2A] py-1">
            <span>
              <span className="uppercase text-[#8A9099]">{p.role}</span>{' '}
              <span className="text-white">{p.summoner_name}</span>
              {p.is_captain && <span className="ml-2 text-[#F5A800]">[C]</span>}
            </span>
            <a
              href={p.opgg_url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[#F5A800]"
            >
              op.gg →
            </a>
          </li>
        ))}
      </ul>

      <label className="mt-5 block text-sm text-[#8A9099]">
        Staff note
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          rows={3}
          disabled={!pending}
          className="mt-1 w-full rounded border border-[#2A2A2A] bg-[#0D0D0D] px-3 py-2 disabled:opacity-60"
        />
      </label>

      {error && <div className="mt-2 text-sm text-[#E63000]">{error}</div>}

      {pending && (
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => review('approve')}
            disabled={busy}
            className="flex-1 rounded bg-green-700 py-2 font-display tracking-wider hover:bg-green-600 disabled:opacity-50"
          >
            APPROVE
          </button>
          <button
            onClick={() => review('deny')}
            disabled={busy}
            className="flex-1 rounded bg-red-700 py-2 font-display tracking-wider hover:bg-red-600 disabled:opacity-50"
          >
            DENY
          </button>
        </div>
      )}
    </div>
  );
}
