'use client';

import { Section } from '@components/layout';
import { CardTable } from '@components/shared';
import { PublicBlogsStyles } from '@styles/section';
import Link from 'next/link';

interface Blog {
  [key: string]: unknown;
  slug: string;
  image_url: string | null;
  title: string;
  excerpt: string;
  published_at: string;
}

const renderTimestamp = (value: unknown) => {
  const v = typeof value === 'string' ? value : undefined;
  return v ? <>{new Date(v).toLocaleString()}</> : null;
};

const columns = [
  {
    key: 'slug',
    label: 'Slug',
    sortable: true,
    filterable: true,
    truncate: 40,
    hidden: true,
  },
  {
    key: 'image_url',
    label: 'Image URL',
    sortable: true,
    filterable: true,
  },
  {
    key: 'title',
    label: 'Title',
    sortable: true,
    filterable: true,
    truncate: 80,
  },
  {
    key: 'excerpt',
    label: 'Excerpt',
    sortable: true,
    filterable: true,
    truncate: 180,
  },
  {
    key: 'published_at',
    label: 'Published At',
    sortable: true,
    filterable: true,
    render: renderTimestamp,
  },
  {
    key: 'read',
    label: 'Read',
    render: (_value: unknown, row: Blog) => (
      <Link
        href={`/site/public/data/system/blogs/${row.slug}`}
        className={PublicBlogsStyles.ReadButton}
      >
        Read
      </Link>
    ),
  },
];

export default function PublicBlogs() {
  return (
    <Section
      id='public-blogs'
      className={PublicBlogsStyles.PublicBlogs}
    >
      <CardTable<Blog>
        endpoint='/api/public/data/system/blogs/'
        columns={columns}
        rowIdKey='slug'
        features={{
          search: true,
          pagination: true,
          sorting: true,
          customLimit: true,
          export: { json: false, csv: false, selected: false },
          columnVisibility: true,
          columnResize: true,
          columnReorder: false,
          columnPinning: false,
        }}
      />
    </Section>
  );
}
