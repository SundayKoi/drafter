import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { SiteLayout } from '../components/SiteLayout';
import { api, ApiError } from '../api/client';
import type { NewsPost } from '../types';

export function NewsPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState<NewsPost | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    api<NewsPost>(`/news/slug/${encodeURIComponent(slug)}`, { auth: false })
      .then(setPost)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setNotFound(true);
      });
  }, [slug]);

  if (notFound) {
    return (
      <SiteLayout>
        <div className="py-16 text-center">
          <h1 className="font-display text-4xl tracking-wider">POST NOT FOUND</h1>
          <Link to="/" className="mt-4 inline-block text-[#F5A800]">
            ← Back to home
          </Link>
        </div>
      </SiteLayout>
    );
  }
  if (!post) {
    return (
      <SiteLayout>
        <div className="text-[#666]">Loading…</div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <article>
        <div className="font-mono text-xs text-[#666]">
          {post.published_at ? new Date(post.published_at).toLocaleDateString() : ''}
          {post.league_id && <span className="ml-3 uppercase">{post.league_id}</span>}
        </div>
        <h1 className="mt-2 font-display text-5xl tracking-wider">{post.title}</h1>
        <div className="prose prose-invert mt-8 max-w-none">
          <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{post.body}</ReactMarkdown>
        </div>
      </article>
    </SiteLayout>
  );
}
