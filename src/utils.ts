import { CallbackQueryContext, CommandContext, HearsContext, InlineQueryContext } from "https://deno.land/x/grammy@v1.32.0/context.ts"
import { CustomContext, LinkConverter } from "./types/types.ts"

export function findMatchingConverter (url: URL, converters: LinkConverter[]): LinkConverter | undefined
{
	console.debug(`Searching a matching converter…`)

	for (const converter of converters)
		if (converter.isSupported(url))
		{
			console.debug(`\t➥ Found ${ converter.name }!`)
			return converter
		}
	console.debug(`\t➥ Didn't find a matching link converter. :(`)

	return undefined
}

export function getExpeditorDebugString (ctx: CommandContext<CustomContext> | HearsContext<CustomContext> | InlineQueryContext<CustomContext> | CallbackQueryContext<CustomContext>): string
{
	return `${ ctx.from?.first_name }${ ctx.config.isDeveloper ? " [Developer]" : "" } (@${ ctx.from?.username + " / " }${ ctx.from?.id })`
}

export function getQueryDebugString (ctx: CommandContext<CustomContext> | HearsContext<CustomContext> | InlineQueryContext<CustomContext>): string | RegExpMatchArray
{
	return ctx.match.length < 1 ? "(nothing)" : ctx.match
}
