import { useMemo, useState, type FormEvent } from 'react';
import { api, ApiError } from '../../api/client';
import { useTeams } from '../../hooks/useSiteData';
import { validateOpggUrl } from '../../utils/opgg';
import type { Player, Role, Team } from '../../types';

export function PlayersManagerPage() {
  const { data: teams, loading, reload } = useTeams();
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  const team = useMemo(
    () => teams?.find((t) => t.id === selectedTeam) ?? null,
    [teams, selectedTeam],
  );

  return (
    <div>
      <h1 className="font-display text-4xl tracking-wider">PLAYERS</h1>
      {loading && <div className="mt-4 text-[#666]">Loading…</div>}

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <ul className="divide-y divide-[#2A2A2A] rounded border border-[#2A2A2A] bg-[#141414]">
          {teams?.map((t) => (
            <li key={t.id}>
              <button
                onClick={() => setSelectedTeam(t.id)}
                className={`block w-full px-3 py-2 text-left hover:bg-[#1C1C1C] ${
                  selectedTeam === t.id ? 'bg-[#1C1C1C]' : ''
                }`}
              >
                <div className="font-display tracking-wide">{t.name}</div>
                <div className="font-mono text-xs text-[#666]">
                  {t.players.length} players
                </div>
              </button>
            </li>
          ))}
          {teams?.length === 0 && <li className="p-4 text-[#666]">No teams.</li>}
        </ul>

        <div className="lg:col-span-2">
          {team ? <TeamRoster team={team} onChange={reload} /> : (
            <div className="flex h-40 items-center justify-center rounded border border-dashed border-[#2A2A2A] text-[#666]">
              Select a team to manage its roster
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TeamRoster({ team, onChange }: { team: Team; onChange: () => void }) {
  const [adding, setAdding] = useState(false);
  return (
    <div className="rounded border border-[#2A2A2A] bg-[#141414] p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl tracking-wider">{team.name}</h2>
        <button
          onClick={() => setAdding(true)}
          className="rounded border border-white/30 px-3 py-1 text-sm"
        >
          + Add player
        </button>
      </div>

      <table className="mt-4 w-full text-sm">
        <thead className="font-display text-xs uppercase tracking-wider text-[#8A9099]">
          <tr>
            <th className="py-2 text-left">Role</th>
            <th className="py-2 text-left">Summoner</th>
            <th className="py-2 text-left">op.gg</th>
            <th className="py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {team.players.map((p) => (
            <PlayerRow key={p.id} player={p} onChange={onChange} />
          ))}
        </tbody>
      </table>

      {adding && (
        <PlayerForm
          teamId={team.id}
          onDone={() => {
            setAdding(false);
            onChange();
          }}
        />
      )}
    </div>
  );
}

function PlayerRow({ player, onChange }: { player: Player; onChange: () => void }) {
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <tr>
        <td colSpan={4}>
          <PlayerForm
            teamId={player.team_id}
            player={player}
            onDone={() => {
              setEditing(false);
              onChange();
            }}
          />
        </td>
      </tr>
    );
  }
  return (
    <tr className="border-t border-[#2A2A2A]">
      <td className="py-2 uppercase">{player.role}</td>
      <td className="py-2">
        {player.summoner_name}
        {player.is_captain && <span className="ml-2 text-[#F5A800]">[C]</span>}
      </td>
      <td className="py-2">
        <a href={player.opgg_url} target="_blank" rel="noreferrer" className="text-xs text-[#F5A800]">
          op.gg →
        </a>
      </td>
      <td className="py-2 text-right">
        <button onClick={() => setEditing(true)} className="text-xs text-[#8A9099] hover:text-white">
          Edit
        </button>
        <button
          onClick={async () => {
            if (!confirm('Delete player?')) return;
            await api(`/players/${player.id}`, { method: 'DELETE' });
            onChange();
          }}
          className="ml-3 text-xs text-[#E63000]"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}

function PlayerForm({
  teamId,
  player,
  onDone,
}: {
  teamId: string;
  player?: Player;
  onDone: () => void;
}) {
  const [summoner, setSummoner] = useState(player?.summoner_name ?? '');
  const [opgg, setOpgg] = useState(player?.opgg_url ?? '');
  const [role, setRole] = useState<Role>(player?.role ?? 'top');
  const [captain, setCaptain] = useState(player?.is_captain ?? false);
  const [discord, setDiscord] = useState(player?.discord_handle ?? '');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validateOpggUrl(opgg)) {
      setError('Invalid op.gg URL');
      return;
    }
    try {
      const body = {
        summoner_name: summoner,
        opgg_url: opgg,
        role,
        is_captain: captain,
        discord_handle: discord || null,
      };
      if (player) {
        await api(`/players/${player.id}`, { method: 'PUT', body });
      } else {
        await api(`/players/team/${teamId}`, { method: 'POST', body });
      }
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-3 grid grid-cols-12 gap-2 rounded border border-[#2A2A2A] bg-[#0D0D0D] p-3"
    >
      <input
        placeholder="Summoner"
        value={summoner}
        onChange={(e) => setSummoner(e.target.value)}
        maxLength={50}
        required
        className={`col-span-3 ${inputCls}`}
      />
      <input
        placeholder="https://op.gg/summoners/..."
        value={opgg}
        onChange={(e) => setOpgg(e.target.value)}
        maxLength={500}
        required
        className={`col-span-4 ${inputCls}`}
      />
      <select
        value={role}
        onChange={(e) => setRole(e.target.value as Role)}
        className={`col-span-2 ${inputCls}`}
      >
        <option value="top">Top</option>
        <option value="jungle">Jungle</option>
        <option value="mid">Mid</option>
        <option value="bot">Bot</option>
        <option value="support">Support</option>
      </select>
      <input
        placeholder="Discord"
        value={discord}
        onChange={(e) => setDiscord(e.target.value)}
        maxLength={100}
        className={`col-span-2 ${inputCls}`}
      />
      <label className="col-span-1 flex items-center justify-center text-xs">
        <input
          type="checkbox"
          checked={captain}
          onChange={(e) => setCaptain(e.target.checked)}
          className="mr-1"
        />
        C
      </label>
      {error && <div className="col-span-12 text-sm text-[#E63000]">{error}</div>}
      <div className="col-span-12 flex gap-2">
        <button
          type="submit"
          className="rounded bg-[#E63000] px-4 py-1 font-display text-sm tracking-wider"
        >
          {player ? 'Save' : 'Create'}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded border border-white/30 px-4 py-1 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

const inputCls =
  'w-full rounded border border-[#2A2A2A] bg-[#0D0D0D] px-2 py-1 text-sm focus:border-[#F5A800] focus:outline-none';
