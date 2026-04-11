import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { DraftBoard } from '../components/DraftBoard/DraftBoard';
import { ChampionGrid } from '../components/ChampionGrid/ChampionGrid';
import { ActionBar } from '../components/Controls/ActionBar';
import { ReadyGate } from '../components/Controls/ReadyGate';
import { SeriesControls } from '../components/Controls/SeriesControls';
import { DraftTimer } from '../components/Timer/DraftTimer';
import { SeriesHeader } from '../components/Series/SeriesHeader';
import { GameHistory } from '../components/Series/GameHistory';
import { FearlessPool } from '../components/Series/FearlessPool';
import { ConnectionStatus } from '../components/Layout/ConnectionStatus';
import { HoverPreview } from '../components/Overlay/HoverPreview';
import { BannedChampionToast, emitBanEvent } from '../components/Overlay/BannedChampionToast';
import { GameCompleteOverlay } from '../components/Overlay/GameCompleteOverlay';
import { SeriesWinnerOverlay } from '../components/Overlay/SeriesWinnerOverlay';
import { useChampions } from '../hooks/useChampions';
import { useDraftStore } from '../hooks/useDraft';
import { useSeriesStore } from '../hooks/useSeries';
import { useWebSocket } from '../hooks/useWebSocket';
import type { ServerMessage } from '../types/ws';
import type { Side } from '../types/draft';

export function DraftPage() {
  const { seriesId } = useParams<{ seriesId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const { champions, championMap, patch } = useChampions();
  const [selectedChampion, setSelectedChampion] = useState<string | null>(null);
  const [gameReported, setGameReported] = useState(false);
  const roleFetched = useRef(false);

  const draft = useDraftStore((s) => s.draft);
  const setDraft = useDraftStore((s) => s.setDraft);
  const setRole = useDraftStore((s) => s.setRole);
  const setHover = useDraftStore((s) => s.setHover);
  const setTimer = useDraftStore((s) => s.setTimer);

  const series = useSeriesStore((s) => s.series);
  const setSeries = useSeriesStore((s) => s.setSeries);
  const gameComplete = useSeriesStore((s) => s.gameComplete);
  const seriesComplete = useSeriesStore((s) => s.seriesComplete);
  const setGameComplete = useSeriesStore((s) => s.setGameComplete);
  const setSeriesComplete = useSeriesStore((s) => s.setSeriesComplete);
  const clearOverlays = useSeriesStore((s) => s.clearOverlays);

  const role = useDraftStore((s) => s.role);

  const onMessage = useCallback((msg: ServerMessage) => {
    switch (msg.type) {
      case 'SYNC': {
        const prevDraft = useDraftStore.getState().draft;
        setDraft(msg.payload.draft);
        setSeries(msg.payload.series);

        // Detect ban events for toast
        if (prevDraft && msg.payload.draft.current_slot_index > prevDraft.current_slot_index) {
          const filledSlotIdx = msg.payload.draft.current_slot_index - 1;
          const filledSlot = msg.payload.draft.slots[filledSlotIdx];
          if (filledSlot?.action_type === 'ban' && filledSlot.champion_id) {
            emitBanEvent(filledSlot.champion_id, filledSlot.side);
          }
        }
        break;
      }
      case 'TIMER_TICK':
        setTimer(msg.payload.seconds_remaining);
        break;
      case 'HOVER_UPDATE':
        setHover(msg.payload.champion_id, msg.payload.side);
        break;
      case 'GAME_COMPLETE':
        setGameComplete(msg.payload.game_number, msg.payload.winner);
        setSeries(msg.payload.series);
        break;
      case 'SERIES_COMPLETE':
        setSeriesComplete(msg.payload.winner, msg.payload.blue_score, msg.payload.red_score);
        break;
      case 'NEXT_GAME_STARTING':
        setGameReported(false);
        clearOverlays();
        break;
      case 'SERIES_SYNC':
        setSeries(msg.payload);
        break;
      case 'ERROR':
        console.error('WS Error:', msg.payload.code, msg.payload.message);
        alert(`Server error: ${msg.payload.code} — ${msg.payload.message}`);
        break;
    }
  }, [setDraft, setSeries, setTimer, setHover, setGameComplete, setSeriesComplete, clearOverlays]);

  const { send, status } = useWebSocket({
    seriesId: seriesId ?? '',
    token: token ?? '',
    onMessage,
  });

  // Fetch role once when series loads
  useEffect(() => {
    if (!role && series && token && seriesId && !roleFetched.current) {
      roleFetched.current = true;
      fetch(`/api/series/${seriesId}?token=${encodeURIComponent(token)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.role) setRole(data.role);
        })
        .catch(() => {
          roleFetched.current = false;
        });
    }
  }, [role, series, token, seriesId, setRole]);

  if (!seriesId || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="font-mono text-muted">Invalid draft link.</span>
      </div>
    );
  }

  const timerSeconds = useDraftStore((s) => s.timerSeconds);
  const maxTimer = series?.timer_seconds ?? 30;
  const isRunning = draft != null && draft.phase !== 'WAITING' && draft.phase !== 'COMPLETE';
  const draftComplete = draft?.phase === 'COMPLETE';
  const isSpectator = role === 'spectator';

  function handleLockIn(championId: string) {
    send({ type: 'LOCK_IN', payload: { champion_id: championId } });
    setSelectedChampion(null);
  }

  function handleReady() {
    send({ type: 'READY' });
  }

  function handleHover(championId: string | null) {
    if (championId && role && role !== 'spectator') {
      send({ type: 'HOVER', payload: { champion_id: championId } });
    }
    setHover(championId, role === 'blue' || role === 'red' ? role : null);
  }

  function handleSelect(championId: string) {
    setSelectedChampion(championId);
  }

  function handleReportWinner(winner: Side) {
    send({ type: 'REPORT_WINNER', payload: { winner } });
    setGameReported(true);
  }

  function handleStartNextGame(firstPickSide: Side, swapSides: boolean) {
    send({
      type: 'START_NEXT_GAME',
      payload: {
        first_pick_override: firstPickSide,
        swap_sides: swapSides,
      },
    });
  }

  const centerContent = (
    <>
      <SeriesHeader />
      <DraftTimer
        serverSeconds={timerSeconds}
        maxSeconds={maxTimer}
        running={isRunning}
      />
      <ChampionGrid
        champions={champions}
        patch={patch}
        fearlessPool={series?.fearless_pool ?? []}
        onSelect={handleSelect}
        onHover={handleHover}
      />
      <ActionBar
        selectedChampionId={selectedChampion}
        onLockIn={handleLockIn}
      />
      <SeriesControls
        onReportWinner={handleReportWinner}
        onStartNextGame={handleStartNextGame}
        draftComplete={draftComplete ?? false}
        gameReported={gameReported}
        seriesOver={series?.status === 'complete'}
        isSpectator={isSpectator}
        blueTeamName={series?.blue_team_name ?? null}
        redTeamName={series?.red_team_name ?? null}
      />
      {series?.fearless && (
        <FearlessPool pool={series.fearless_pool} patch={patch} />
      )}
      {series && (
        <GameHistory games={series.games} patch={patch} />
      )}
    </>
  );

  return (
    <div className="relative min-h-screen bg-draft-bg py-6">
      <ConnectionStatus status={status} />
      <DraftBoard patch={patch} centerContent={centerContent} />
      <ReadyGate onReady={handleReady} />

      {/* Overlays */}
      <HoverPreview championMap={championMap} patch={patch} />
      <BannedChampionToast patch={patch} />

      {gameComplete && !seriesComplete && (
        <GameCompleteOverlay
          gameNumber={gameComplete.gameNumber}
          winner={gameComplete.winner}
          winnerTeamName={
            gameComplete.winner === 'blue'
              ? (series?.blue_team_name ?? 'Blue')
              : (series?.red_team_name ?? 'Red')
          }
          onDismiss={clearOverlays}
        />
      )}

      {seriesComplete && (
        <SeriesWinnerOverlay
          winner={seriesComplete.winner}
          blueScore={seriesComplete.blueScore}
          redScore={seriesComplete.redScore}
          blueTeamName={series?.blue_team_name ?? null}
          redTeamName={series?.red_team_name ?? null}
          onDismiss={clearOverlays}
        />
      )}
    </div>
  );
}
