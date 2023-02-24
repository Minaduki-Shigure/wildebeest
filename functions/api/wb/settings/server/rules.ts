import type { Env } from 'wildebeest/backend/src/types/env'
import type { ContextData } from 'wildebeest/backend/src/types/context'
import * as errors from 'wildebeest/backend/src/errors'
import { type Database, getDatabase } from 'wildebeest/backend/src/database'

export const onRequestGet: PagesFunction<Env, any, ContextData> = async ({ env, request }) => {
	return handleRequestPost(getDatabase(env), request)
}

export async function handleRequestGet(db: Database) {
	const query = `SELECT * from server_rules;`
	const result = await db.prepare(query).all<{ id: string; text: string }>()

	if (!result.success) {
		return new Response('SQL error: ' + result.error, { status: 500 })
	}

	return new Response(JSON.stringify(result.results ?? []), { status: 200 })
}

export const onRequestPost: PagesFunction<Env, any, ContextData> = async ({ env, request }) => {
	return handleRequestPost(getDatabase(env), request)
}

export async function handleRequestPost(db: Database, request: Request) {
	// TODO: validate the request! only the instance admin should be able to edit this
	const authenticated = true
	if (!authenticated) {
		return errors.notAuthorized('Lacking authorization rights to edit server settings')
	}

	const rule = await request.json<{ id: string; text: string }>()

	const query = `
		INSERT INTO server_rules (id, text)
		VALUES (?, ?)
		ON CONFLICT(id) DO UPDATE SET text=excluded.text;
	`

	const result = await db
		.prepare(query)
		.bind(rule.id || null, rule.text)
		.run()

	if (!result.success) {
		return new Response('SQL error: ' + result.error, { status: 500 })
	}

	return new Response('', { status: 200 })
}

export async function handleRequestDelete(db: Database, request: Request) {
	// TODO: validate the request! only the instance admin should be able to edit this
	const authenticated = true
	if (!authenticated) {
		return errors.notAuthorized('Lacking authorization rights to edit server settings')
	}

	const rule = await request.json<{ id: string }>()

	const query = 'DELETE FROM server_rules WHERE id=?'

	const result = await db.prepare(query).bind(rule.id).run()

	if (!result.success) {
		return new Response('SQL error: ' + result.error, { status: 500 })
	}

	return new Response('', { status: 200 })
}
