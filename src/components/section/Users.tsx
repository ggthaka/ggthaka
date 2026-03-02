'use client';

import { Section } from '@components/layout';
import { Screen } from '@components/page';
import { DeleteUser, EditUser } from '@components/section';
import { DataTable } from '@components/shared';
import { UsersStyles } from '@styles/section';

interface Users {
  [key: string]: unknown;
  id: string;
  email: string;
  hash: string;
  role: string;
  password_reset_otp: string;
  password_reset_expiry: string;
  password_reset_attempts: number;
  first_name: string;
  last_name: string;
  year_of_birth: number;
  sex: string;
  country: string;
  disabled: string;
  verified: string;
  created: string;
  updated: string;
}

const columns = [
  { key: 'id', label: 'ID', sortable: true, filterable: true },
  { key: 'email', label: 'Email', sortable: true, filterable: true },
  {
    key: 'hash',
    label: 'Hash',
    sortable: true,
    filterable: true,
    hidden: true,
  },
  { key: 'role', label: 'Role', sortable: true, filterable: true },
  {
    key: 'password_reset_otp',
    label: 'Password Reset OTP',
    sortable: true,
    filterable: true,
    hidden: true,
  },
  {
    key: 'password_reset_expiry',
    label: 'Password Reset Expiry',
    sortable: true,
    filterable: true,
    hidden: true,
  },
  {
    key: 'password_reset_attempts',
    label: 'Password Reset Attempts',
    sortable: true,
    filterable: true,
    hidden: true,
  },
  { key: 'first_name', label: 'First Name', sortable: true, filterable: true },
  { key: 'last_name', label: 'Last Name', sortable: true, filterable: true },
  {
    key: 'year_of_birth',
    label: 'Year Of Birth',
    sortable: true,
    filterable: true,
  },
  { key: 'sex', label: 'Sex', sortable: true, filterable: true },
  { key: 'country', label: 'Country', sortable: true, filterable: true },
  {
    key: 'disabled',
    label: 'Disabled',
    sortable: true,
    filterable: true,
  },
  {
    key: 'verified',
    label: 'Verified',
    sortable: true,
    filterable: true,
  },
  {
    key: 'created',
    label: 'Created',
    sortable: true,
    filterable: true,
    render: (value: unknown) => {
      const v = typeof value === 'string' ? value : undefined;
      return v ? <>{new Date(v).toLocaleString()}</> : null;
    },
  },
  {
    key: 'updated',
    label: 'Updated',
    sortable: true,
    filterable: true,
    render: (value: unknown) => {
      const v = typeof value === 'string' ? value : undefined;
      return v ? <>{new Date(v).toLocaleString()}</> : null;
    },
  },
  {
    key: 'edit',
    label: 'Edit',
    render: (_value: unknown, row: Users) => (
      <Screen icon='edit'>
        <EditUser
          id={row.id}
          email={row.email}
          hash={row.hash}
          role={row.role}
          passwordResetOtp={row.password_reset_otp}
          passwordResetExpiry={row.password_reset_expiry}
          passwordResetAttempts={row.password_reset_attempts}
          firstName={row.first_name}
          lastName={row.last_name}
          yearOfBirth={row.year_of_birth}
          sex={row.sex}
          country={row.country}
          disabled={row.disabled}
          verified={row.verified}
          created={row.created}
          updated={row.updated}
        />
      </Screen>
    ),
  },
  {
    key: 'delete',
    label: 'Delete',
    render: (_value: unknown, row: Users) => (
      <Screen icon='delete'>
        <DeleteUser
          id={row.id}
          email={row.email}
          hash={row.hash}
          role={row.role}
          passwordResetOtp={row.password_reset_otp}
          passwordResetExpiry={row.password_reset_expiry}
          passwordResetAttempts={row.password_reset_attempts}
          firstName={row.first_name}
          lastName={row.last_name}
          yearOfBirth={row.year_of_birth}
          sex={row.sex}
          country={row.country}
          disabled={row.disabled}
          verified={row.verified}
          created={row.created}
          updated={row.updated}
        />
      </Screen>
    ),
  },
];

export default function UsersByAdministrator() {
  return (
    <Section
      id='users'
      className={UsersStyles.Users}
    >
      <DataTable<Users>
        endpoint='/api/private/authorization/root/data/system/users/'
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
