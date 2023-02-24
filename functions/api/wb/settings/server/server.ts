import type { Env } from 'wildebeest/backend/src/types/env'
import type { ContextData } from 'wildebeest/backend/src/types/context'
import * as errors from 'wildebeest/backend/src/errors'
import { type Database, getDatabase } from 'wildebeest/backend/src/database'
import { ServerBrandingData } from 'wildebeest/frontend/src/routes/(admin)/settings/server-settings/branding'

export const onRequestGet: PagesFunction<Env, any, ContextData> = async ({ env, request }) => {
	return handleRequestPost(await getDatabase(env), request)
}

export async function handleRequestGet(db: Database) {
	const query = `SELECT * from server_settings`
	const result = await db.prepare(query).all<{ setting_name: string; setting_value: string }>()

	const data = (result.results ?? []).reduce(
		(settings, { setting_name, setting_value }) => ({
			...settings,
			[setting_name]: setting_value,
		}),
		{} as Object
	)

	if (!result.success) {
		return new Response('SQL error: ' + result.error, { status: 500 })
	}

	return new Response(JSON.stringify(data), { status: 200 })
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

	const data = await request.json<ServerBrandingData>()

	const settingsEntries = Object.entries(data)

	const query = `
		INSERT INTO server_settings (setting_name, setting_value)
		VALUES ${settingsEntries.map(() => `(?, ?)`).join(', ')}
		ON CONFLICT(setting_name) DO UPDATE SET setting_value=excluded.setting_value
	`
	const result = await db
		.prepare(query)
		.bind(...settingsEntries.flat())
		.run()

	if (!result.success) {
		return new Response('SQL error: ' + result.error, { status: 500 })
	}

	return new Response('', { status: 200 })
}
