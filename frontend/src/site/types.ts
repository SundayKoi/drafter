export type LeagueId = 'cinder' | 'blaze' | 'scorch' | 'magma';
export type Role = 'top' | 'jungle' | 'mid' | 'bot' | 'support';
export type MatchStatus = 'scheduled' | 'completed' | 'cancelled';
export type VodPlatform = 'youtube' | 'twitch';

export interface Player {
  id: string;
  team_id: string;
  summoner_name: string;
  opgg_url: string;
  role: Role;
  is_captain: boolean;
  discord_handle?: string | null;
}

export interface Team {
  id: string;
  league_id: LeagueId;
  name: string;
  logo_url: string | null;
  bio: string | null;
  players: Player[];
}

export interface Standing {
  team_id: string;
  team_name: string;
  team_logo_url: string | null;
  league_id: LeagueId;
  season: string;
  wins: number;
  losses: number;
  point_diff: number;
  streak: number;
}

export interface Match {
  id: string;
  league_id: LeagueId;
  season: string;
  blue_team_id: string;
  red_team_id: string;
  blue_score: number | null;
  red_score: number | null;
  winner_id: string | null;
  scheduled_at: string;
  played_at: string | null;
  vod_url: string | null;
  status: MatchStatus;
}

export interface NewsPost {
  id: string;
  title: string;
  slug: string;
  body: string;
  league_id: LeagueId | null;
  author_id: string;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Vod {
  id: string;
  title: string;
  url: string;
  league_id: LeagueId | null;
  platform: VodPlatform;
  thumbnail_url: string | null;
  match_id: string | null;
  created_at: string;
}

export interface ApplicationPlayerInput {
  summoner_name: string;
  opgg_url: string;
  role: Role;
  is_captain: boolean;
}

export interface Application {
  id: string;
  league_id: LeagueId;
  team_name: string;
  logo_url: string | null;
  bio: string;
  contact_name: string;
  contact_email: string;
  contact_discord: string;
  status: 'pending' | 'approved' | 'denied';
  submitted_at: string;
  reviewed_at: string | null;
  review_note: string | null;
  players: Array<{
    id: string;
    summoner_name: string;
    opgg_url: string;
    role: Role;
    is_captain: boolean;
  }>;
}
