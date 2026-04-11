import { useState } from 'react';
import { BRAND } from '../constants/brand';
import type { CreateSeriesResponse, SeriesFormat } from '../types/series';

export function LandingPage() {
  const [name, setName] = useState('');
  const [format, setFormat] = useState<SeriesFormat>('bo3');
  const [fearless, setFearless] = useState(false);
  const [firstPick, setFirstPick] = useState<'blue' | 'red' | 'coin_flip'>('blue');
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [blueTeam, setBlueTeam] = useState('');
  const [redTeam, setRedTeam] = useState('');
  const [patch] = useState('');

  const [result, setResult] = useState<CreateSeriesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = name.trim().length > 0 && !loading;

  async function handleCreate() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/series/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          format,
          fearless,
          patch: patch || 'latest',
          timer_seconds: timerSeconds,
          game1_first_pick: firstPick,
          blue_team_name: blueTeam.trim() || null,
          red_team_name: redTeam.trim() || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail ?? `Error ${res.status}`);
      }

      const data: CreateSeriesResponse = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  // Show created links
  if (result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="flex flex-col items-center gap-6 max-w-lg w-full">
          <img src={BRAND.logoUrl} alt={BRAND.name} className="h-16 w-auto" />
          <h1 className="font-display text-4xl text-white uppercase">Series Created</h1>

          <div className="flex flex-col gap-4 w-full">
            <LinkRow label="Blue Captain" url={result.blue_url} color="text-blue-side" />
            <LinkRow label="Red Captain" url={result.red_url} color="text-red-side" />
            <LinkRow label="Spectator" url={result.spectator_url} color="text-muted" />
          </div>

          <p className="font-mono text-xs text-muted text-center">
            Share these links with each captain. They contain unique tokens and cannot be recovered.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 gap-12">
      {/* Hero */}
      <div className="flex flex-col items-center gap-4">
        <img src={BRAND.logoUrl} alt={BRAND.name} className="h-20 w-auto" />
        <h1 className="font-display text-7xl md:text-8xl text-white uppercase leading-none text-center">
          Draft.<br />Dominate.<br />Win.
        </h1>
        <p className="font-mono text-sm text-muted text-center max-w-md">
          Create a series, share the links, draft live.
        </p>
      </div>

      {/* Create form */}
      <div className="flex flex-col gap-4 w-full max-w-md bg-draft-surface border border-draft-border rounded-lg p-6">
        {/* Series name */}
        <div className="flex flex-col gap-1">
          <label className="font-display text-sm text-muted uppercase tracking-wider">Series Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ember vs Rivals"
            maxLength={200}
            className="bg-draft-bg border border-draft-border rounded px-3 py-2 text-sm font-mono text-white placeholder-muted focus:outline-none focus:border-primary"
          />
        </div>

        {/* Format */}
        <div className="flex flex-col gap-1">
          <label className="font-display text-sm text-muted uppercase tracking-wider">Format</label>
          <div className="flex gap-2">
            {(['bo1', 'bo3', 'bo5'] as const).map((f) => (
              <button
                key={f}
                onClick={() => {
                  setFormat(f);
                  if (f === 'bo1') setFearless(false);
                }}
                className={`flex-1 py-2 rounded font-display text-lg uppercase transition-colors ${
                  format === f
                    ? 'bg-primary text-black'
                    : 'bg-draft-bg border border-draft-border text-muted hover:text-white'
                }`}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Fearless toggle */}
        <div className="flex items-center justify-between">
          <label className="font-display text-sm text-muted uppercase tracking-wider">Fearless Draft</label>
          <button
            onClick={() => setFearless(!fearless)}
            disabled={format === 'bo1'}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              fearless ? 'bg-primary' : 'bg-draft-border'
            } ${format === 'bo1' ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                fearless ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* First pick */}
        <div className="flex flex-col gap-1">
          <label className="font-display text-sm text-muted uppercase tracking-wider">First Pick</label>
          <div className="flex gap-2">
            {([
              { key: 'blue', label: 'Blue', cls: 'text-blue-side' },
              { key: 'red', label: 'Red', cls: 'text-red-side' },
              { key: 'coin_flip', label: 'Coin Flip', cls: 'text-gold' },
            ] as const).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setFirstPick(opt.key)}
                className={`flex-1 py-2 rounded font-display text-sm uppercase transition-colors ${
                  firstPick === opt.key
                    ? 'bg-draft-bg border-2 border-primary ' + opt.cls
                    : 'bg-draft-bg border border-draft-border text-muted hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Timer */}
        <div className="flex flex-col gap-1">
          <label className="font-display text-sm text-muted uppercase tracking-wider">
            Timer: <span className="text-white">{timerSeconds}s</span>
          </label>
          <input
            type="range"
            min={10}
            max={120}
            step={5}
            value={timerSeconds}
            onChange={(e) => setTimerSeconds(Number(e.target.value))}
            className="accent-primary"
          />
        </div>

        {/* Team names (optional) */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="font-display text-xs text-blue-side uppercase">Blue Team</label>
            <input
              type="text"
              value={blueTeam}
              onChange={(e) => setBlueTeam(e.target.value)}
              placeholder="Optional"
              maxLength={100}
              className="bg-draft-bg border border-draft-border rounded px-2 py-1.5 text-xs font-mono text-white placeholder-muted focus:outline-none focus:border-blue-side"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-display text-xs text-red-side uppercase">Red Team</label>
            <input
              type="text"
              value={redTeam}
              onChange={(e) => setRedTeam(e.target.value)}
              placeholder="Optional"
              maxLength={100}
              className="bg-draft-bg border border-draft-border rounded px-2 py-1.5 text-xs font-mono text-white placeholder-muted focus:outline-none focus:border-red-side"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="font-mono text-sm text-red-side">{error}</p>
        )}

        {/* Submit */}
        <button
          disabled={!canSubmit}
          onClick={handleCreate}
          className={`py-3 rounded font-display text-xl uppercase tracking-wider transition-all ${
            canSubmit
              ? 'bg-primary text-black hover:brightness-110 active:scale-95'
              : 'bg-draft-border text-muted cursor-not-allowed'
          }`}
        >
          {loading ? 'Creating...' : 'Create Draft'}
        </button>
      </div>

      {/* How it works */}
      <div className="flex flex-col items-center gap-3 max-w-md">
        <h2 className="font-display text-lg text-muted uppercase tracking-widest">How It Works</h2>
        <ol className="font-mono text-sm text-muted space-y-1 list-decimal list-inside">
          <li>Create a series (Bo1 / Bo3 / Bo5)</li>
          <li>Share Blue and Red links with captains</li>
          <li>Draft live &mdash; changes sync in real time</li>
        </ol>
      </div>

      {/* Footer */}
      <footer className="font-mono text-xs text-muted pb-8">
        {BRAND.siteName} &middot; Not affiliated with Riot Games
      </footer>
    </div>
  );
}

function LinkRow({ label, url, color }: { label: string; url: string; color: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <span className={`font-display text-sm uppercase tracking-wider ${color}`}>{label}</span>
      <div className="flex gap-2">
        <input
          readOnly
          value={url}
          className="flex-1 bg-draft-bg border border-draft-border rounded px-2 py-1.5 text-xs font-mono text-white truncate"
        />
        <button
          onClick={handleCopy}
          className="px-3 py-1.5 rounded bg-draft-border text-xs font-mono text-white hover:bg-muted transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
