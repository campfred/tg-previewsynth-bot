import { CallbackQueryContext, CommandContext, HearsContext, InlineQueryContext } from "https://deno.land/x/grammy@v1.32.0/context.ts"
import { CustomContext, LinkConverter } from "./types/types.ts"

export function findMatchingConverter (url: URL, converters: LinkConverter[]): LinkConverter | null
{
	console.debug(`Searching a converter for ${ url.origin } …`)

	for (const simple_converter of converters)
		if (simple_converter.isSupported(url))
		{
			console.debug(`\t➥ Found ${ simple_converter.name }!`)
			return simple_converter
		}
	console.debug(`Didn't find a matching link converter. :(`)

	return null
}

export function getExpeditorDebugString (ctx: CommandContext<CustomContext> | HearsContext<CustomContext> | InlineQueryContext<CustomContext> | CallbackQueryContext<CustomContext>): string
{
	return `${ ctx.from?.first_name }${ ctx.config.isDeveloper ? " [Developer]" : "" } (@${ ctx.from?.username + " / " }${ ctx.from?.id })`
}

export function getQueryDebugString (ctx: CommandContext<CustomContext> | HearsContext<CustomContext> | InlineQueryContext<CustomContext>): string | RegExpMatchArray
{
	return ctx.match.length < 1 ? "(nothing)" : ctx.match
}
