'use client';

import { Section } from '@components/layout';
import { Screen } from '@components/page';
import { DeleteBlog, EditBlog } from '@components/section';
import { DataTable } from '@components/shared';
import { BlogsStyles } from '@styles/section';

interface Blogs {
  [key: string]: unknown;
  id: string;
  user_id: string;
  slug: string;
  image_url: string | null;
  title: string;
  excerpt: string;
  content: string;
  published: boolean;
  published_at: string;
  created: string;
  updated: string;
}

const renderTimestamp = (value: unknown) => {
  const v = typeof value === 'string' ? value : undefined;
  return v ? <>{new Date(v).toLocaleString()}</> : null;
};

const renderBoolean = (value: unknown) => {
  return value ? 'Yes' : 'No';
};

const columns = [
  { key: 'id', label: 'ID', sortable: true, filterable: true, hidden: true },
  {
    key: 'user_id',
    label: 'User ID',
    sortable: true,
    filterable: true,
    hidden: true,
  },
  {
    key: 'slug',
    label: 'Slug',
    sortable: true,
    filterable: true,
    truncate: 40,
  },
  {
    key: 'image_url',
    label: 'Image URL',
    sortable: true,
    filterable: true,
    hidden: true,
  },
  {
    key: 'title',
    label: 'Title',
    sortable: true,
    filterable: true,
    truncate: 40,
  },
  {
    key: 'excerpt',
    label: 'Excerpt',
    sortable: true,
    filterable: true,
    hidden: true,
  },
  {
    key: 'content',
    label: 'Content',
    sortable: true,
    filterable: true,
    hidden: true,
  },
  {
    key: 'published',
    label: 'Published',
    sortable: true,
    filterable: true,
    render: renderBoolean,
  },
  {
    key: 'published_at',
    label: 'Published At',
    sortable: true,
    filterable: true,
    render: renderTimestamp,
    hidden: true,
  },
  {
    key: 'created',
    label: 'Created',
    sortable: true,
    filterable: true,
    render: renderTimestamp,
    hidden: true,
  },
  {
    key: 'updated',
    label: 'Updated',
    sortable: true,
    filterable: true,
    render: renderTimestamp,
    hidden: true,
  },
  {
    key: 'edit',
    label: 'Edit',
    render: (_value: unknown, row: Blogs) => (
      <Screen icon='edit'>
        <EditBlog
          id={row.id}
          userId={row.user_id}
          slug={row.slug}
          title={row.title}
          imageUrl={row.image_url}
          excerpt={row.excerpt}
          content={row.content}
          published={row.published}
          publishedAt={row.published_at}
          created={row.created}
          updated={row.updated}
        />
      </Screen>
    ),
  },
  {
    key: 'delete',
    label: 'Delete',
    render: (_value: unknown, row: Blogs) => (
      <Screen icon='delete'>
        <DeleteBlog
          id={row.id}
          userId={row.user_id}
          slug={row.slug}
          title={row.title}
          imageUrl={row.image_url}
          excerpt={row.excerpt}
          content={row.content}
          published={row.published}
          publishedAt={row.published_at}
          created={row.created}
          updated={row.updated}
        />
      </Screen>
    ),
  },
];

export default function BlogsByAdministrator() {
  return (
    <Section
      id='blogs'
      className={BlogsStyles.Blogs}
    >
      <DataTable<Blogs>
        endpoint='/api/private/authorization/root/data/system/blogs/'
        columns={columns}
        rowIdKey='id'
        features={{
          search: true,
          pagination: true,
          sorting: true,
          customLimit: true,
          export: { json: true, csv: true, selected: true },
          columnVisibility: true,
          columnResize: true,
          columnReorder: true,
          columnPinning: true,
        }}
      />
    </Section>
  );
}
