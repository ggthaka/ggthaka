import { accessPostgreSQL } from '@library/utilities';

interface Props {
	by: { id?: string; email?: string };
}

export default async function deleteUser({
	by,
}: Props): Promise<API.Success | API.Failure> {
	const postgres = accessPostgreSQL();

	if (!postgres.ok) {
		return {
			ok: false,
			error: {
				message: postgres.error.message,
				origin: postgres.error.origin,
				method: postgres.error.method,
				raw: {
					name: postgres.error.raw?.name,
					message: postgres.error.raw?.message,
				},
			},
		};
	}

	const client = await postgres.data.pool.connect();

	try {
		await client.query('BEGIN');

		let identifierField = '';
		let identifierValue: string | undefined;

		if (by.id) {
			identifierField = 'id';
			identifierValue = by.id;
		} else if (by.email) {
			identifierField = 'email';
			identifierValue = by.email;
		} else {
			await client.query('ROLLBACK');
			return {
				ok: false,
				error: {
					message: 'No identifier provided (email or id required).',
					origin: 'handlers',
					method: 'deleteUser',
				},
			};
		}

		const query = `
			DELETE FROM users
			WHERE ${identifierField} = $1
			RETURNING *;
		`;

		const result = await client.query(query, [identifierValue]);

		await client.query('COMMIT');

		if (result.rows.length === 0) {
			return {
				ok: false,
				error: {
					message: 'User not found.',
					origin: 'handlers',
					method: 'deleteUser',
				},
			};
		}

		return {
			ok: true,
			data: { user: result.rows[0] },
		};
	} catch (e: unknown) {
		if (client) {
			await client.query('ROLLBACK');
		}

		const error = e as Error;

		return {
			ok: false,
			error: {
				message: 'Failed to delete user.',
				origin: 'handlers',
				method: 'deleteUser',
				raw: {
					name: error.name,
					message: error.message,
				},
			},
		};
	} finally {
		client.release();
	}
}
