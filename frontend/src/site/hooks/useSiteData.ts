import { useEffect, useState, useCallback } from 'react';
import { api } from '../api/client';
import type {
  Application,
  LeagueId,
  Match,
  NewsPost,
  Standing,
  Team,
  Vod,
} from '../types';

export function useSettings() {
  const [settings, setSettings] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api<Record<string, string | null>>('/settings', { auth: false })
      .then(setSettings)
      .finally(() => setLoading(false));
  }, []);
  return { settings, loading };
}

export function useStandings(league: LeagueId, season?: string) {
  const [data, setData] = useState<Standing[] | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const qs = new URLSearchParams({ league });
    if (season) qs.set('season', season);
    setLoading(true);
    api<Standing[]>(`/standings?${qs}`, { auth: false })
      .then(setData)
      .finally(() => setLoading(false));
  }, [league, season]);
  return { data, loading };
}

export function useMatches(league: LeagueId, season?: string) {
  const [data, setData] = useState<Match[] | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const qs = new URLSearchParams({ league });
    if (season) qs.set('season', season);
    setLoading(true);
    api<Match[]>(`/matches?${qs}`, { auth: false })
      .then(setData)
      .finally(() => setLoading(false));
  }, [league, season]);
  return { data, loading };
}

export function useNews(league?: LeagueId | null, limit = 20) {
  const [data, setData] = useState<NewsPost[] | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const qs = new URLSearchParams({ limit: String(limit) });
    if (league) qs.set('league', league);
    setLoading(true);
    api<NewsPost[]>(`/news?${qs}`, { auth: false })
      .then(setData)
      .finally(() => setLoading(false));
  }, [league, limit]);
  return { data, loading };
}

export function useVods(league?: LeagueId | null) {
  const [data, setData] = useState<Vod[] | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const qs = new URLSearchParams();
    if (league) qs.set('league', league);
    setLoading(true);
    api<Vod[]>(`/vods?${qs}`, { auth: false })
      .then(setData)
      .finally(() => setLoading(false));
  }, [league]);
  return { data, loading };
}

export function useTeams(league: LeagueId) {
  const [data, setData] = useState<Team[] | null>(null);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(() => {
    setLoading(true);
    api<Team[]>(`/teams?league=${league}`, { auth: false })
      .then(setData)
      .finally(() => setLoading(false));
  }, [league]);
  useEffect(() => {
    reload();
  }, [reload]);
  return { data, loading, reload };
}

export function useApplications(status?: 'pending' | 'approved' | 'denied') {
  const [data, setData] = useState<Application[] | null>(null);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(() => {
    setLoading(true);
    const qs = status ? `?status_filter=${status}` : '';
    api<Application[]>(`/admin/applications${qs}`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [status]);
  useEffect(() => {
    reload();
  }, [reload]);
  return { data, loading, reload };
}
