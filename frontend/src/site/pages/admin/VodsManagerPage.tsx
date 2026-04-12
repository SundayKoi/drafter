import { useEffect, useState, type FormEvent } from 'react';
import { api, ApiError } from '../../api/client';
import type { LeagueId, Vod } from '../../types';

export function VodsManagerPage() {
  const [vods, setVods] = useState<Vod[]>([]);
  const [editing, setEditing] = useState<Vod | null>(null);
  const [creating, setCreating] = useState(false);

  async function reload() {
    const data = await api<Vod[]>('/vods', { auth: false });
    setVods(data);
  }
  useEffect(() => {
    reload();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl tracking-wider">VODS</h1>
        <button
          onClick={() => {
            setEditing(null);
            setCreating(true);
          }}
          className="rounded bg-[#E63000] px-4 py-2 font-display text-sm tracking-wider"
        >
          + NEW VOD
        </button>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ul className="divide-y divide-[#2A2A2A] rounded border border-[#2A2A2A] bg-[#141414]">
          {vods.map((v) => (
            <li key={v.id}>
              <button
                onClick={() => {
                  setEditing(v);
                  setCreating(false);
                }}
                className={`block w-full px-4 py-3 text-left hover:bg-[#1C1C1C] ${
                  editing?.id === v.id ? 'bg-[#1C1C1C]' : ''
                }`}
              >
                <div className="font-display text-lg tracking-wide">{v.title}</div>
                <div className="font-mono text-xs text-[#666]">
                  {v.platform.toUpperCase()} · {new Date(v.created_at).toLocaleDateString()}
                </div>
              </button>
            </li>
          ))}
          {vods.length === 0 && <li className="p-4 text-[#666]">No VODs.</li>}
        </ul>
        {(creating || editing) && (
          <VodForm
            vod={editing}
            onDone={() => {
              setCreating(false);
              setEditing(null);
              reload();
            }}
          />
        )}
      </div>
    </div>
  );
}

function VodForm({ vod, onDone }: { vod: Vod | null; onDone: () => void }) {
  const [title, setTitle] = useState(vod?.title ?? '');
  const [url, setUrl] = useState(vod?.url ?? '');
  const [league, setLeague] = useState<LeagueId | ''>(vod?.league_id ?? '');
  const [thumb, setThumb] = useState(vod?.thumbnail_url ?? '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body = {
        title,
        url,
        league_id: league || null,
        thumbnail_url: thumb || null,
      };
      if (vod) {
        await api(`/vods/${vod.id}`, { method: 'PUT', body });
      } else {
        await api('/vods', { method: 'POST', body });
      }
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!vod || !confirm('Delete this VOD?')) return;
    try {
      await api(`/vods/${vod.id}`, { method: 'DELETE' });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed');
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded border border-[#2A2A2A] bg-[#141414] p-5"
    >
      <input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={200}
        required
        className={inputCls}
      />
      <input
        placeholder="YouTube or Twitch URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        required
        className={inputCls}
      />
      <input
        placeholder="Thumbnail URL (optional)"
        value={thumb}
        onChange={(e) => setThumb(e.target.value)}
        className={inputCls}
      />
      <select
        value={league}
        onChange={(e) => setLeague(e.target.value as LeagueId | '')}
        className={inputCls}
      >
        <option value="">Org-wide</option>
        <option value="cinder">Cinder</option>
        <option value="blaze">Blaze</option>
        <option value="scorch">Scorch</option>
        <option value="magma">Magma</option>
      </select>
      {error && <div className="text-sm text-[#E63000]">{error}</div>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded bg-[#E63000] px-5 py-2 font-display tracking-wider disabled:opacity-40"
        >
          {vod ? 'SAVE' : 'CREATE'}
        </button>
        {vod && (
          <button
            type="button"
            onClick={remove}
            className="rounded border border-[#E63000] px-4 py-2 text-sm text-[#E63000]"
          >
            Delete
          </button>
        )}
      </div>
    </form>
  );
}

const inputCls =
  'w-full rounded border border-[#2A2A2A] bg-[#0D0D0D] px-3 py-2 focus:border-[#F5A800] focus:outline-none';
