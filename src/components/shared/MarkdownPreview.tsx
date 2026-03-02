'use client';

import type { ComponentPropsWithoutRef } from 'react';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import rehypeMathjax from 'rehype-mathjax/svg';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

interface MarkdownPreviewClassNames {
  inlineCode?: string;
  syntaxBlock?: string;
  link?: string;
  imageLink?: string;
  image?: string;
}

interface Props {
  markdown: string;
  className?: string;
  classNames?: MarkdownPreviewClassNames;
}

const normalizeMarkdownMath = (markdown: string): string => {
  return markdown
    .replace(/\\\[((?:.|\n)*?)\\\]/g, (_, content: string) => `$$${content}$$`)
    .replace(/\\\(((?:.|\n)*?)\\\)/g, (_, content: string) => `$${content}$`);
};

const resolveImageSrc = (src: string): string => {
  if (!src.trim()) return src;
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith('//')) return `https:${src}`;
  if (src.startsWith('/')) return src;
  return `/${src.replace(/^\.\//, '')}`;
};

const isMermaidLanguage = (language: string): boolean =>
  ['mermaid', 'flowchart', 'mmd'].includes(language.toLowerCase());

function MermaidBlock({
  source,
  className,
}: {
  source: string;
  className?: string;
}) {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const render = async () => {
      const value = source.trim();
      if (!value) {
        if (!active) return;
        setSvg('');
        setError('Mermaid block is empty.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await fetch('https://kroki.io/mermaid/svg', {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain',
          },
          body: value,
        });

        if (!response.ok) {
          throw new Error(`Failed to render Mermaid (${response.status}).`);
        }

        const nextSvg = await response.text();
        if (!active) return;
        setSvg(nextSvg);
      } catch (caught) {
        if (!active) return;
        setSvg('');
        setError(
          caught instanceof Error
            ? caught.message
            : 'Failed to render Mermaid diagram.',
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void render();

    return () => {
      active = false;
    };
  }, [source]);

  if (loading) {
    return <p>Rendering Mermaid diagram...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (!svg) {
    return null;
  }

  return (
    <div className={className}>
      <div dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  );
}

export default function MarkdownPreview({
  markdown,
  className,
  classNames,
}: Props) {
  return (
    <article className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeMathjax, rehypeSlug]}
        components={{
          code(props) {
            const { children, className: codeClassName, ...rest } = props;
            const match = /language-(\w+)/.exec(codeClassName || '');
            const language = match?.[1] || 'text';
            const code = String(children).replace(/\n$/, '');

            if (!match) {
              return (
                <code
                  className={classNames?.inlineCode}
                  {...rest}
                >
                  {children}
                </code>
              );
            }

            if (isMermaidLanguage(language)) {
              return (
                <MermaidBlock
                  source={code}
                  className={classNames?.syntaxBlock}
                />
              );
            }

            return (
              <SyntaxHighlighter
                className={classNames?.syntaxBlock}
                language={language}
                style={oneDark}
                customStyle={{
                  borderRadius: '12px',
                  padding: '16px',
                  margin: '16px 0',
                }}
                codeTagProps={{
                  style: {
                    color: '#abb2bf',
                  },
                }}
                PreTag='div'
              >
                {code}
              </SyntaxHighlighter>
            );
          },
          img(props: ComponentPropsWithoutRef<'img'>) {
            const src = typeof props.src === 'string' ? props.src : '';
            const resolvedSrc = resolveImageSrc(src);
            const alt = props.alt || 'Markdown image';

            return (
              <a
                href={resolvedSrc}
                target='_blank'
                rel='noopener noreferrer'
                className={classNames?.imageLink}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolvedSrc}
                  alt={alt}
                  className={classNames?.image}
                />
              </a>
            );
          },
          a(props: ComponentPropsWithoutRef<'a'>) {
            const href = props.href || '#';
            const isExternal = /^https?:\/\//i.test(href);

            return (
              <a
                href={href}
                className={classNames?.link}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
              >
                {props.children}
              </a>
            );
          },
        }}
      >
        {normalizeMarkdownMath(markdown)}
      </ReactMarkdown>
    </article>
  );
}
