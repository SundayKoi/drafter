import { SiteLayout } from '../components/SiteLayout';

export function PlaceholderPage({ title, blurb }: { title: string; blurb: string }) {
  return (
    <SiteLayout>
      <div className="py-20 text-center">
        <h1 className="font-display text-6xl tracking-wider">{title.toUpperCase()}</h1>
        <p className="mt-4 text-[#8A9099]">{blurb}</p>
        <p className="mt-8 font-mono text-xs uppercase tracking-widest text-[#666]">
          Coming soon
        </p>
      </div>
    </SiteLayout>
  );
}
