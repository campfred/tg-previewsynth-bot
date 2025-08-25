import { CallbackQueryContext, CommandContext, GrammyError, HearsContext, InlineQueryContext } from "x/grammy"
import { CustomContext, LinkConverter, LogLevels } from "./types/types.ts"
import { getLogger, Logger, LogLevel } from "@logtape/logtape"
import { LogCategories } from "./managers/logging.ts"

const LOGGER: Logger = getLogger(LogCategories.BOT)

export function findMatchingConverter (url: URL, converters: LinkConverter[]): LinkConverter | undefined
{
	LOGGER.debug(`Searching a matching converter…`)

	for (const converter of converters)
		if (converter.isSourceSupported(url))
		{
			LOGGER.debug(`\t➥ Found ${ converter.name }!`)
			return converter
		}
	LOGGER.debug(`\t➥ Didn't find a matching link converter. :(`)

	return undefined
}

export function getExpeditorDebugString (ctx: CommandContext<CustomContext> | HearsContext<CustomContext> | InlineQueryContext<CustomContext> | CallbackQueryContext<CustomContext>): string
{
	return `${ ctx.from?.first_name }${ ctx.config.isDeveloper ? " [Developer]" : "" } (@${ ctx.from?.username + " / " }${ ctx.from?.id })`
}

export function getChatDebugString (ctx: CommandContext<CustomContext> | HearsContext<CustomContext> | InlineQueryContext<CustomContext> | CallbackQueryContext<CustomContext>): string
{
	return `${ ctx.chat?.title ? ctx.chat?.title : "private chat" }${ ctx.chat?.is_forum ? " [Forum]" : "" } (${ ctx.chat?.username ? `@${ ctx.chat?.username } / ` : "" }${ ctx.chat?.id })`
}

export function getQueryDebugString (ctx: CommandContext<CustomContext> | HearsContext<CustomContext> | InlineQueryContext<CustomContext> | CallbackQueryContext<CustomContext>): string | RegExpMatchArray
{
	return ctx.match.length < 1 ? "(nothing)" : ctx.match
}

export function logAction (level: LogLevel, action: string, message: string, ctx: CommandContext<CustomContext> | HearsContext<CustomContext> | InlineQueryContext<CustomContext> | CallbackQueryContext<CustomContext>): void
{
	const logger: Logger = LOGGER.getChild(LogCategories.ACTIONS).with({ action: action, user: getExpeditorDebugString(ctx), chat: getChatDebugString(ctx), message: message })
	const title: string = "An event occurred while { action } from { user } in { chat }."

	switch (level)
	{
		case "trace":
			logger.trace(title)
			logger.trace(message)
			break

		case "debug":
			logger.debug(title)
			logger.debug(message)
			break

		case "info":
			logger.info(title)
			logger.info(message)
			break

		case "warning":
			logger.warning(title)
			logger.warning(message)
			break

		case "error":
			logger.error(title)
			logger.error(message)
			break

		case "fatal":
			logger.fatal(title)
			logger.fatal(message)
			break

		default:
			break
	}


	// console.error(`An error occurred while ${ eventDescription } from ${ getExpeditorDebugString(ctx) } in ${ getChatDebugString(ctx) }.`)
	// console.error(error)
	// if (alertDevs) BotManager.Itself.api.sendMessage(
	// 	botConfig.StatusUpdatesChatID,
	// 	`An error occurred while ${ eventDescription }. 🫠\n\n<blockquote>\n${ String(error) }\n</blockquote>\n\nPlease check the logs for more details. 📜`,
	// 	{ parse_mode: "HTML", ...botConfig.StatusUpdatesMessagesOptions }
	// )
}

/**
 * Helper to get a logger for a command with context info
 * @param command The command name
 * @param ctx The command context
 */
export function getLoggerForCommand (command: string, ctx: CommandContext<CustomContext> | HearsContext<CustomContext> | InlineQueryContext<CustomContext> | CallbackQueryContext<CustomContext>): Logger
{
	return LOGGER.with({ command: command, user: getExpeditorDebugString(ctx), chat: getChatDebugString(ctx), arg: ctx.match.toString() })
}

/**
 * Logs an error that occurred while trying to react to a message.
 * @param error The error that occurred
 * @param ctx Context of the action
 */
export function logReactionError (error: unknown, ctx: CommandContext<CustomContext> | HearsContext<CustomContext> | InlineQueryContext<CustomContext> | CallbackQueryContext<CustomContext>): void
{
	logAction(LogLevels.ERROR, "trying to react to a message", String(error), ctx)
	LOGGER.debug("Silently abandonning reacting but continuing processing…")
	// console.error("An error occurred while trying to react to a message.")
	// console.error(error)
}

/**
 * Logs an error that occurred while trying to reply to a message.
 * @param error The error that occurred
 * @param ctx Context of the action
 */
export function logReplyError (error: unknown, ctx: CommandContext<CustomContext> | HearsContext<CustomContext> | InlineQueryContext<CustomContext> | CallbackQueryContext<CustomContext>): void
{
	logAction(LogLevels.ERROR, "trying to reply to a message", String(error), ctx)
	// console.error("An error occurred while trying to reply to a message.")
	// console.error(error)

	if (error instanceof GrammyError)
		if (error.description.includes("not enough rights to send text messages to the chat"))
		{
			ctx.leaveChat()
			LOGGER.warn("'Left a chat because I couldn't respond to messages people were sending me.")
		}
}
