import { Bot, CallbackQueryContext, CommandContext, HearsContext, InlineQueryContext } from "x/grammy"
import { CustomContext, LinkConverter } from "./types/types.ts"
import { ConfigurationManager } from "./managers/config.ts"
import { BotManager } from "./managers/bot.ts"

export function findMatchingConverter (url: URL, converters: LinkConverter[]): LinkConverter | undefined
{
	console.debug(`Searching a matching converter…`)

	for (const converter of converters)
		if (converter.isSourceSupported(url))
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

export function logErrorMessage (eventDescription: string, error: unknown, ctx: CommandContext<CustomContext> | HearsContext<CustomContext> | InlineQueryContext<CustomContext> | CallbackQueryContext<CustomContext>, botConfig: ConfigurationManager, BotManager: BotManager): void
{
	console.error(`An error occurred while ${ eventDescription } from ${ getExpeditorDebugString(ctx) }.`)
	console.error(error)
	BotManager.Itself.api.sendMessage(
		botConfig.StatusUpdatesChatID,
		`An error occurred while ${ eventDescription } from ${ getExpeditorDebugString(ctx) }. 🫠\n\n<blockquote>\n${ String(error) }\n</blockquote>\n\nPlease check the logs for more details. 📜`,
		{ parse_mode: "HTML", ...botConfig.StatusUpdatesMessagesOptions })
}
