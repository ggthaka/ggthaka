'use client';

import { Section } from '@components/layout';
import { Loading, MarkdownPreview, Message } from '@components/shared';
import { BlogStyles } from '@styles/section';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import BlogReadingProgress from './BlogReadingProgress';
import BlogTableOfContents from './BlogTableOfContents';
import { getScrollContainer, type ScrollContainer } from './scrollContainer';

interface BlogItem {
  slug: string;
  image_url: string | null;
  title: string;
  excerpt: string;
  content: string;
  published_at: string;
  previous?: {
    slug: string;
    title: string;
  } | null;
  next?: {
    slug: string;
    title: string;
  } | null;
}

interface Props {
  slug: string;
}

interface Heading {
  id: string;
  text: string;
  level: number;
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const parseHeadings = (markdown: string): Heading[] => {
  const lines = markdown.split('\n');
  const seenIds = new Map<string, number>();

  return lines
    .map((line) => {
      const match = /^(#{2,3})\s+(.+)$/.exec(line.trim());
      if (!match) return null;
      const level = match[1].length;
      const text = match[2].trim();
      const baseId = slugify(text);
      const seen = seenIds.get(baseId) ?? 0;
      seenIds.set(baseId, seen + 1);
      const id = seen === 0 ? baseId : `${baseId}-${seen}`;

      return {
        id,
        text,
        level,
      };
    })
    .filter((heading): heading is Heading => heading !== null);
};

const countReadingMinutes = (markdown: string): number => {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/\$[^$]*\$/g, ' ')
    .replace(/[#>*_~\-\[\]()]/g, ' ')
    .trim();

  const words = plain.length ? plain.split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(words / 200));
};

const normalizeMarkdownMath = (markdown: string): string => {
  return markdown
    .replace(/\\\[((?:.|\n)*?)\\\]/g, (_, content: string) => `$$${content}$$`)
    .replace(/\\\(((?:.|\n)*?)\\\)/g, (_, content: string) => `$${content}$`);
};

export default function Blog({ slug }: Props) {
  const mainRef = useRef<HTMLDivElement | null>(null);
  const scrollTargetRef = useRef<ScrollContainer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [blog, setBlog] = useState<BlogItem | null>(null);
  const [copyLabel, setCopyLabel] = useState('Copy Markdown');
  const [shareLabel, setShareLabel] = useState('Copy URL');
  const [activeHeadingId, setActiveHeadingId] = useState<string>('');

  useEffect(() => {
    let mounted = true;

    const fetchBlog = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(
          `/api/public/data/system/blogs/${encodeURIComponent(slug)}/`,
        );
        const result = (await response.json()) as API.Success | API.Failure;

        if (!mounted) return;

        if (!result.ok) {
          setError(result.error.message || 'Failed to load blog.');
          setBlog(null);
        } else {
          setBlog(result.data as BlogItem);
        }
      } catch {
        if (mounted) {
          setError('Failed to load blog.');
          setBlog(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchBlog();

    return () => {
      mounted = false;
    };
  }, [slug]);

  const headings = useMemo(
    () =>
      blog?.content ? parseHeadings(normalizeMarkdownMath(blog.content)) : [],
    [blog?.content],
  );

  useEffect(() => {
    if (!headings.length) {
      setActiveHeadingId('');
      return;
    }

    const scrollTarget = mainRef.current
      ? getScrollContainer(mainRef.current)
      : window;
    scrollTargetRef.current = scrollTarget;

    const onScroll = () => {
      let currentId = headings[0].id;
      const thresholdTop =
        scrollTarget === window
          ? 120
          : (scrollTarget as HTMLElement).getBoundingClientRect().top + 120;

      for (const heading of headings) {
        const element = document.getElementById(heading.id);
        if (!element) continue;

        if (element.getBoundingClientRect().top <= thresholdTop) {
          currentId = heading.id;
        } else {
          break;
        }
      }

      setActiveHeadingId((prev) => (prev === currentId ? prev : currentId));
    };

    onScroll();
    if (scrollTarget === window) {
      window.addEventListener('scroll', onScroll, { passive: true });
      return () => window.removeEventListener('scroll', onScroll);
    }

    scrollTarget.addEventListener('scroll', onScroll, { passive: true });
    return () => scrollTarget.removeEventListener('scroll', onScroll);
  }, [headings]);

  const handleHeadingClick = (id: string) => {
    const element = document.getElementById(id);
    const scrollTarget = scrollTargetRef.current;
    if (!element || !scrollTarget) return;

    if (scrollTarget === window) {
      const targetTop =
        window.scrollY + element.getBoundingClientRect().top - 20;
      window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
      return;
    }

    const scrollElement = scrollTarget as HTMLElement;

    const targetTop =
      scrollElement.scrollTop +
      (element.getBoundingClientRect().top -
        scrollElement.getBoundingClientRect().top) -
      20;

    scrollElement.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
  };

  const normalizedContent = useMemo(
    () => (blog?.content ? normalizeMarkdownMath(blog.content) : ''),
    [blog?.content],
  );

  const readingMinutes = useMemo(
    () => (blog?.content ? countReadingMinutes(blog.content) : 1),
    [blog?.content],
  );

  const copyMarkdown = async () => {
    if (!blog?.content) return;
    await navigator.clipboard.writeText(blog.content);
    setCopyLabel('Copied!');
    window.setTimeout(() => setCopyLabel('Copy Markdown'), 1500);
  };

  const copyUrl = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setShareLabel('Copied!');
    window.setTimeout(() => setShareLabel('Copy URL'), 1500);
  };

  if (loading) {
    return (
      <Section
        id='blog'
        className={BlogStyles.Blog}
      >
        <Loading />
      </Section>
    );
  }

  if (error || !blog) {
    return (
      <Section
        id='blog'
        className={BlogStyles.Blog}
      >
        <Message>{error || 'Blog not found.'}</Message>
      </Section>
    );
  }

  return (
    <Section
      id='blog'
      className={BlogStyles.Blog}
    >
      <BlogReadingProgress
        className={BlogStyles.Progress}
        barClassName={BlogStyles.ProgressBar}
      />

      <div
        ref={mainRef}
        className={BlogStyles.BlogMain}
      >
        {blog.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={blog.image_url}
            alt={blog.title}
            className={BlogStyles.Image}
          />
        )}

        <header className={BlogStyles.Header}>
          <h1 className={BlogStyles.Title}>{blog.title}</h1>
          <p className={BlogStyles.Excerpt}>{blog.excerpt}</p>

          <div className={BlogStyles.Meta}>
            <span>
              Published: {new Date(blog.published_at).toLocaleString()}
            </span>
            <span>{readingMinutes} min read</span>
          </div>

          <div className={BlogStyles.Actions}>
            <button
              className={BlogStyles.ActionButton}
              onClick={copyMarkdown}
            >
              {copyLabel}
            </button>
            <button
              className={BlogStyles.ActionButton}
              onClick={copyUrl}
            >
              {shareLabel}
            </button>
          </div>
        </header>

        <MarkdownPreview
          markdown={normalizedContent}
          className={[BlogStyles.Content, 'markdown-body'].join(' ')}
          classNames={{
            inlineCode: BlogStyles.InlineCode,
            syntaxBlock: BlogStyles.SyntaxBlock,
            link: BlogStyles.MarkdownLink,
            imageLink: BlogStyles.MarkdownImageLink,
            image: BlogStyles.MarkdownImage,
          }}
        />

        <nav className={BlogStyles.BlogNavigation}>
          {blog.previous ? (
            <Link
              href={`/site/public/data/system/blogs/${blog.previous.slug}`}
              className={BlogStyles.BlogNavigationLink}
            >
              <span className={BlogStyles.BlogNavigationLabel}>Previous</span>
              <span className={BlogStyles.BlogNavigationTitle}>
                {blog.previous.title}
              </span>
            </Link>
          ) : (
            <div className={BlogStyles.BlogNavigationDisabled}>
              <span className={BlogStyles.BlogNavigationLabel}>Previous</span>
              <span className={BlogStyles.BlogNavigationTitle}>
                No previous blog
              </span>
            </div>
          )}

          {blog.next ? (
            <Link
              href={`/site/public/data/system/blogs/${blog.next.slug}`}
              className={BlogStyles.BlogNavigationLink}
            >
              <span className={BlogStyles.BlogNavigationLabel}>Next</span>
              <span className={BlogStyles.BlogNavigationTitle}>
                {blog.next.title}
              </span>
            </Link>
          ) : (
            <div className={BlogStyles.BlogNavigationDisabled}>
              <span className={BlogStyles.BlogNavigationLabel}>Next</span>
              <span className={BlogStyles.BlogNavigationTitle}>
                No next blog
              </span>
            </div>
          )}
        </nav>
      </div>

      <BlogTableOfContents
        headings={headings}
        activeHeadingId={activeHeadingId}
        onHeadingClick={handleHeadingClick}
        withFind
      />
    </Section>
  );
}
