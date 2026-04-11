export interface ChampionImage {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ChampionInfo {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
}

export interface ChampionData {
  id: string;
  key: string;
  name: string;
  title: string;
  image: ChampionImage;
  info: ChampionInfo;
  tags: string[];
}

export interface ChampionMap {
  [championId: string]: ChampionData;
}

export interface DataDragonResponse {
  patch: string;
  data: {
    type: string;
    format: string;
    version: string;
    data: ChampionMap;
  };
}
