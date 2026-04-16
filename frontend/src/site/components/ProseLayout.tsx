import { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function extractToc(markdown: string): TocItem[] {
  const items: TocItem[] = [];
  const lines = markdown.split('\n');
  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)$/);
    if (match) {
      const level = match[1]!.length;
      const text = match[2]!.trim();
      items.push({ id: slugify(text), text, level });
    }
  }
  return items;
}

function HeadingRenderer(level: number) {
  return function Heading({ children }: { children?: React.ReactNode }) {
    const text = typeof children === 'string' ? children : String(children ?? '');
    const id = slugify(text);
    const Tag = `h${level}` as keyof JSX.IntrinsicElements;
    return (
      <Tag id={id} className="scroll-mt-32">
        {children}
      </Tag>
    );
  };
}

export function ProseLayout({
  title,
  markdown,
}: {
  title: string;
  markdown: string;
}) {
  const toc = useMemo(() => extractToc(markdown), [markdown]);
  const [activeId, setActiveId] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-120px 0px -70% 0px' },
    );
    const headings = contentRef.current?.querySelectorAll('h1, h2, h3');
    headings?.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [markdown]);

  return (
    <div className="relative min-h-screen w-full bg-[#0A0A0A] text-white">
      {/* Ember gradient glow at the top */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(230,48,0,0.22), rgba(245,168,0,0.08) 40%, transparent 70%)',
        }}
      />

      <div className="relative z-10">
        <Navbar />

        <main className="pb-40">
          <div className="py-6 sm:py-8">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="text-center">
                <h1 className="font-display text-5xl tracking-wider md:text-6xl">
                  {title.toUpperCase()}
                </h1>
              </div>

              <div className="relative mt-12 flex justify-center gap-8 sm:mt-16">
                {/* Sidebar TOC — desktop only */}
                <div className="hidden w-64 shrink-0 lg:block">
                  <div className="sticky top-[100px]">
                    <aside className="max-h-[calc(100vh-120px)] overflow-y-auto border-r border-[#2A2A2A] pr-4">
                      <nav className="py-4">
                        <h2 className="mb-4 px-2 font-display text-lg tracking-wider text-[#F5A800]">
                          TABLE OF CONTENTS
                        </h2>
                        <div className="space-y-0.5">
                          {toc.map((item) => (
                            <a
                              key={item.id}
                              href={`#${item.id}`}
                              className={`block truncate rounded px-2 py-1.5 text-sm transition-colors ${
                                item.level === 1
                                  ? 'font-semibold'
                                  : item.level === 2
                                  ? 'pl-4 text-[13px]'
                                  : 'pl-6 text-xs'
                              } ${
                                activeId === item.id
                                  ? 'bg-[#1C1C1C] text-[#F5A800]'
                                  : 'text-[#8A9099] hover:bg-[#1C1C1C] hover:text-white'
                              }`}
                            >
                              {item.text}
                            </a>
                          ))}
                        </div>
                      </nav>
                    </aside>
                  </div>
                </div>

                {/* Prose content */}
                <div ref={contentRef} className="mx-auto max-w-3xl">
                  <article
                    className="
                      prose prose-invert max-w-none
                      prose-headings:font-display prose-headings:tracking-wider prose-headings:text-white
                      prose-h1:mt-12 prose-h1:text-3xl prose-h1:border-b prose-h1:border-[#2A2A2A] prose-h1:pb-3
                      prose-h2:mt-8 prose-h2:text-xl prose-h2:text-[#F5A800]
                      prose-h3:mt-6 prose-h3:text-lg prose-h3:text-[#8A9099]
                      prose-p:text-[#C8C8C8] prose-p:leading-7
                      prose-li:text-[#C8C8C8]
                      prose-strong:text-white
                      prose-a:text-[#F5A800] prose-a:no-underline hover:prose-a:underline
                      prose-code:rounded prose-code:bg-[#1C1C1C] prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[#E63000] prose-code:before:content-none prose-code:after:content-none
                      prose-blockquote:border-[#E63000] prose-blockquote:text-[#8A9099]
                      prose-hr:border-[#2A2A2A]
                      prose-table:border-collapse prose-th:border prose-th:border-[#2A2A2A] prose-th:bg-[#141414] prose-th:px-4 prose-th:py-2
                      prose-td:border prose-td:border-[#2A2A2A] prose-td:px-4 prose-td:py-2
                    "
                  >
                    <ReactMarkdown
                      rehypePlugins={[rehypeSanitize]}
                      components={{
                        h1: HeadingRenderer(1),
                        h2: HeadingRenderer(2),
                        h3: HeadingRenderer(3),
                      }}
                    >
                      {markdown}
                    </ReactMarkdown>
                  </article>
                </div>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
