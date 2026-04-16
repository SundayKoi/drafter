import { EmbedPage } from './EmbedPage';

export function LeagueInfoPage() {
  return (
    <EmbedPage
      title="League Info"
      settingKey="league_info_embed_url"
      contentKey="league_info_content"
      emptyText="League info hasn't been published yet."
    />
  );
}
