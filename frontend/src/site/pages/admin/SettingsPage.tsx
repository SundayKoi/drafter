import { useEffect, useState, type FormEvent } from 'react';
import { api, ApiError } from '../../api/client';

const KEYS = [
  'twitch_channel',
  'twitter_url',
  'discord_invite',
  'youtube_channel',
  'instagram_url',
  'org_bio',
  'current_season',
  'applications_open',
  'rules_embed_url',
  'league_info_embed_url',
  'rules_content',
  'league_info_content',
] as const;

type Key = (typeof KEYS)[number];

const TEXTAREA_KEYS = new Set<string>(['org_bio', 'rules_content', 'league_info_content']);
const BOOL_KEYS = new Set<string>(['applications_open']);
const MAX_CONTENT = 50000;

export function SettingsPage() {
  const [values, setValues] = useState<Record<Key, string>>(
    Object.fromEntries(KEYS.map((k) => [k, ''])) as Record<Key, string>,
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api<Record<string, string | null>>('/settings', { auth: false }).then((data) => {
      setValues((v) => {
        const next = { ...v };
        KEYS.forEach((k) => (next[k] = data[k] ?? ''));
        return next;
      });
    });
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const payload: Record<string, string | boolean | null> = {};
      KEYS.forEach((k) => {
        const raw = values[k];
        if (BOOL_KEYS.has(k)) {
          payload[k] = raw === 'true';
        } else {
          payload[k] = raw || null;
        }
      });
      await api('/settings', { method: 'PUT', body: payload });
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-4">
      <h1 className="font-display text-4xl tracking-wider">SETTINGS</h1>

      {KEYS.map((k) => (
        <label key={k} className="block text-sm text-[#8A9099]">
          <div className="mb-1 flex items-center gap-2 font-mono uppercase">
            {k.replace(/_/g, ' ')}
            {k.endsWith('_content') && (
              <span className="rounded bg-[#1C1C1C] px-1.5 py-0.5 text-[10px] normal-case tracking-normal text-[#666]">
                Markdown
              </span>
            )}
          </div>
          {TEXTAREA_KEYS.has(k) ? (
            <textarea
              value={values[k]}
              onChange={(e) => setValues((v) => ({ ...v, [k]: e.target.value }))}
              rows={k.endsWith('_content') ? 20 : 6}
              maxLength={k.endsWith('_content') ? MAX_CONTENT : 5000}
              placeholder={
                k.endsWith('_content')
                  ? '# Section Title\n\n## 1. First Rule\n\nRule description here…'
                  : undefined
              }
              className={`${inputCls} font-mono text-sm`}
            />
          ) : BOOL_KEYS.has(k) ? (
            <select
              value={values[k] || 'true'}
              onChange={(e) => setValues((v) => ({ ...v, [k]: e.target.value }))}
              className={inputCls}
            >
              <option value="true">Open</option>
              <option value="false">Closed</option>
            </select>
          ) : (
            <input
              value={values[k]}
              onChange={(e) => setValues((v) => ({ ...v, [k]: e.target.value }))}
              maxLength={1000}
              placeholder={
                k.endsWith('_embed_url')
                  ? 'https://docs.google.com/document/d/.../pub?embedded=true (fallback if no content set)'
                  : undefined
              }
              className={inputCls}
            />
          )}
        </label>
      ))}

      {error && <div className="text-sm text-[#E63000]">{error}</div>}
      {saved && <div className="text-sm text-green-400">Saved.</div>}

      <button
        type="submit"
        disabled={saving}
        className="rounded bg-[#E63000] px-6 py-2 font-display tracking-wider disabled:opacity-40"
      >
        {saving ? 'SAVING…' : 'SAVE'}
      </button>
    </form>
  );
}

const inputCls =
  'w-full rounded border border-[#2A2A2A] bg-[#0D0D0D] px-3 py-2 text-white focus:border-[#F5A800] focus:outline-none';
