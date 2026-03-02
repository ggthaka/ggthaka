'use client';

import { Section } from '@components/layout';
import { Screen } from '@components/page';
import { DeleteSession, EditSession } from '@components/section';
import { DataTable } from '@components/shared';
import { SessionsStyles } from '@styles/section';

interface Sessions {
  [key: string]: unknown;
  id: string;
  user_id: string;
  ip: string;
  browser: string;
  cpu: string;
  device: string;
  engine: string;
  os: string;
  created: string;
  updated: string;
  expired: string;
}

const renderTimestamp = (value: unknown) => {
  const v = typeof value === 'string' ? value : undefined;
  return v ? <>{new Date(v).toLocaleString()}</> : null;
};

const columns = [
  { key: 'id', label: 'ID', sortable: true, filterable: true },
  { key: 'user_id', label: 'User ID', sortable: true, filterable: true },
  { key: 'ip', label: 'IP', sortable: true, filterable: true },
  {
    key: 'browser',
    label: 'Browser',
    sortable: true,
    filterable: true,
    truncate: 120,
  },
  {
    key: 'cpu',
    label: 'CPU',
    sortable: true,
    filterable: true,
    truncate: 120,
  },
  {
    key: 'device',
    label: 'Device',
    sortable: true,
    filterable: true,
    truncate: 120,
  },
  {
    key: 'engine',
    label: 'Engine',
    sortable: true,
    filterable: true,
    truncate: 120,
  },
  {
    key: 'os',
    label: 'OS',
    sortable: true,
    filterable: true,
    truncate: 120,
  },
  {
    key: 'created',
    label: 'Created',
    sortable: true,
    filterable: true,
    render: renderTimestamp,
  },
  {
    key: 'updated',
    label: 'Updated',
    sortable: true,
    filterable: true,
    render: renderTimestamp,
  },
  {
    key: 'expired',
    label: 'Expired',
    sortable: true,
    filterable: true,
    render: renderTimestamp,
  },
  {
    key: 'edit',
    label: 'Edit',
    render: (_value: unknown, row: Sessions) => (
      <Screen icon='edit'>
        <EditSession
          id={row.id}
          userId={row.user_id}
          ip={row.ip}
          browser={row.browser}
          cpu={row.cpu}
          device={row.device}
          engine={row.engine}
          os={row.os}
          created={row.created}
          updated={row.updated}
          expired={row.expired}
        />
      </Screen>
    ),
  },
  {
    key: 'delete',
    label: 'Delete',
    render: (_value: unknown, row: Sessions) => (
      <Screen icon='delete'>
        <DeleteSession
          id={row.id}
          userId={row.user_id}
          ip={row.ip}
          browser={row.browser}
          cpu={row.cpu}
          device={row.device}
          engine={row.engine}
          os={row.os}
          created={row.created}
          updated={row.updated}
          expired={row.expired}
        />
      </Screen>
    ),
  },
];

export default function SessionsByAdministrator() {
  return (
    <Section
      id='sessions'
      className={SessionsStyles.Sessions}
    >
      <DataTable<Sessions>
        endpoint='/api/private/authorization/root/data/system/sessions/'
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
