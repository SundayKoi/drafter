import { EmbedPage } from './EmbedPage';

export function RulesPage() {
  return (
    <EmbedPage
      title="Rules"
      settingKey="rules_embed_url"
      contentKey="rules_content"
      emptyText="League rules haven't been published yet."
    />
  );
}
