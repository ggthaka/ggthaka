'use client';

import { BlogStyles } from '@styles/section';
import { useMemo, useState } from 'react';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface Props {
  headings: Heading[];
  activeHeadingId: string;
  onHeadingClick?: (id: string) => void;
  withFind?: boolean;
}

export default function BlogTableOfContents({
  headings,
  activeHeadingId,
  onHeadingClick,
  withFind = false,
}: Props) {
  const [findQuery, setFindQuery] = useState('');

  const filteredHeadings = useMemo(() => {
    const query = findQuery.trim().toLowerCase();
    if (!query) return headings;
    return headings.filter((heading) =>
      heading.text.toLowerCase().includes(query),
    );
  }, [findQuery, headings]);

  if (!headings.length) return null;

  return (
    <aside className={BlogStyles.Toc}>
      <h3 className={BlogStyles.TocTitle}>Table of Contents</h3>

      {withFind && (
        <div className={BlogStyles.TocFindWrap}>
          <input
            value={findQuery}
            onChange={(event) => setFindQuery(event.target.value)}
            placeholder='Filter headings…'
            aria-label='Filter table of contents'
            className={BlogStyles.TocFindInput}
          />
          {findQuery.trim() && (
            <button
              type='button'
              className={BlogStyles.TocFindButton}
              onClick={() => setFindQuery('')}
              aria-label='Clear heading filter'
            >
              Clear
            </button>
          )}
        </div>
      )}

      <ul className={BlogStyles.TocList}>
        {filteredHeadings.map((heading) => (
          <li
            key={heading.id}
            className={BlogStyles.TocItem}
            data-level={heading.level}
          >
            <a
              href={`#${heading.id}`}
              className={[
                BlogStyles.TocLink,
                activeHeadingId === heading.id ? BlogStyles.TocLinkActive : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-current={
                activeHeadingId === heading.id ? 'location' : undefined
              }
              onClick={(event) => {
                if (!onHeadingClick) return;
                event.preventDefault();
                onHeadingClick(heading.id);
              }}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
