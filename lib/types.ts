export type AnimeResult = {
  id: number; title: string; nativeTitle: string; cover: string;
  episodes: number | null; year: number | null; score: number | null;
  format: string | null; status: string | null; duration: number | null; genres: string[];
};
export type Entry = {
  id: string; anilist_id: number; title: string; cover_url: string | null;
  episodes_total: number | null; duration_min: number | null; genres: string[];
  status: string; score: number | null; episodes_watched: number;
};
export const STATUSES = ['Viendo', 'Completado', 'Pendiente', 'En pausa', 'Abandonado'];
export const STATUS_LABEL: Record<string, string> = { Viendo: 'Viendo', Completado: 'Ya visto', Pendiente: 'Quiero ver', 'En pausa': 'En pausa', Abandonado: 'Abandonado' };
export const ENTRY_COLUMNS = 'id, anilist_id, title, cover_url, episodes_total, duration_min, genres, status, score, episodes_watched';
