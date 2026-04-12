import { useEffect, useState, type FormEvent } from 'react';
import { api, ApiError } from '../../api/client';
import type { LeagueId, NewsPost } from '../../types';

export function NewsManagerPage() {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [editing, setEditing] = useState<NewsPost | null>(null);
  const [creating, setCreating] = useState(false);

  async function reload() {
    const data = await api<NewsPost[]>('/news/admin/all');
    setPosts(data);
  }
  useEffect(() => {
    reload();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl tracking-wider">NEWS</h1>
        <button
          onClick={() => {
            setEditing(null);
            setCreating(true);
          }}
          className="rounded bg-[#E63000] px-4 py-2 font-display text-sm tracking-wider"
        >
          + NEW POST
        </button>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ul className="divide-y divide-[#2A2A2A] rounded border border-[#2A2A2A] bg-[#141414]">
          {posts.map((p) => (
            <li key={p.id}>
              <button
                onClick={() => {
                  setEditing(p);
                  setCreating(false);
                }}
                className={`block w-full px-4 py-3 text-left hover:bg-[#1C1C1C] ${
                  editing?.id === p.id ? 'bg-[#1C1C1C]' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-lg tracking-wide">{p.title}</span>
                  <span
                    className={`font-mono text-xs ${
                      p.is_published ? 'text-green-400' : 'text-[#666]'
                    }`}
                  >
                    {p.is_published ? 'LIVE' : 'DRAFT'}
                  </span>
                </div>
                <div className="text-xs text-[#666]">
                  {new Date(p.updated_at).toLocaleString()}
                </div>
              </button>
            </li>
          ))}
          {posts.length === 0 && <li className="p-4 text-[#666]">No posts yet.</li>}
        </ul>

        {(creating || editing) && (
          <NewsForm
            post={editing}
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

function NewsForm({
  post,
  onDone,
}: {
  post: NewsPost | null;
  onDone: () => void;
}) {
  const [title, setTitle] = useState(post?.title ?? '');
  const [body, setBody] = useState(post?.body ?? '');
  const [league, setLeague] = useState<LeagueId | ''>(post?.league_id ?? '');
  const [pub, setPub] = useState(post?.is_published ?? false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const payload = {
        title,
        body,
        league_id: league || null,
        is_published: pub,
      };
      if (post) {
        await api(`/news/${post.id}`, { method: 'PUT', body: payload });
      } else {
        await api('/news', { method: 'POST', body: payload });
      }
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!post || !confirm('Delete this post?')) return;
    setBusy(true);
    try {
      await api(`/news/${post.id}`, { method: 'DELETE' });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed');
      setBusy(false);
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
      <textarea
        placeholder="Body (Markdown)"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={20000}
        required
        rows={12}
        className={`${inputCls} font-mono text-sm`}
      />
      <div className="flex items-center gap-3">
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
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={pub}
            onChange={(e) => setPub(e.target.checked)}
          />
          Published
        </label>
      </div>
      {error && <div className="text-sm text-[#E63000]">{error}</div>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded bg-[#E63000] px-5 py-2 font-display tracking-wider disabled:opacity-40"
        >
          {post ? 'SAVE' : 'CREATE'}
        </button>
        {post && (
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
