import { CommandContext, Composer } from "x/grammy"
import { CustomContext, BotActions, LogLevels } from "../types/types.ts"
import { ConfigurationManager } from "../managers/config.ts"
import { getLoggerForCommand, logAction, logReactionError, logReplyError } from "../utils.ts"
import { StatsManager } from "../managers/stats.ts"
import { CacheManager } from "../managers/cache.ts"
import { Logger } from "@logtape/logtape"
import { COMMAND_LOG_STRING } from "../managers/logging.ts"

const CONFIG: ConfigurationManager = ConfigurationManager.Instance
const STATS: StatsManager = StatsManager.Instance
const CACHE: CacheManager = CacheManager.Instance

export enum AdminCommands
{
	MAP_ENABLE = "enable",
	MAP_DISABLE = "disable",
	MAP_TOGGLE = "toggle",
	STATS = "stats",
	CACHE_CLEAR = "clear",
	CONFIG_SAVE = "save",
	CONFIG_RELOAD = "reload",
}

export class AdminActions implements BotActions
{
	readonly Name: string = "Admin actions"
	readonly Composer: Composer<CustomContext> = new Composer<CustomContext>()

	constructor ()
	{
		this.addFeatureCommands()
		this.addDataCommands()
		this.addConfigCommands()
	}

	/**
	 * Toggles the web link map's availability.
	 * @param ctx Context of the action
	 * @param state Desired state of the web link map
	 */
	private toggleConverterAvailability (ctx: CommandContext<CustomContext>, state?: boolean): void
	{
		if (ctx.config.isDeveloper)
		{
			const loggerCommand: Logger = getLoggerForCommand(AdminCommands.MAP_TOGGLE, ctx)
			// console.debug(`Incoming /${ AdminCommands.MAP_TOGGLE } by ${ getExpeditorDebugString(ctx) } for « ${ ctx.match } »`)
			loggerCommand.debug(COMMAND_LOG_STRING)

			try
			{
				ctx.react("🤔")
			} catch (error)
			{
				// console.error("An error occurred while trying to react to a message.")
				// console.error(error)
				logReactionError(error, ctx)
			}
			for (const map of CONFIG.SimpleConverters)
				for (const origin of map.origins)
					for (const destination of map.destinations)
						if (
							map.name.trim().toLowerCase() === ctx.match.trim().toLocaleLowerCase() ||
							origin.hostname.trim().toLocaleLowerCase() === ctx.match.trim().toLocaleLowerCase() ||
							destination.hostname.trim().toLocaleLowerCase() === ctx.match.trim().toLocaleLowerCase()
						)
						{
							try
							{
								ctx.react("🫡")
							} catch (error)
							{
								// console.error("An error occurred while trying to react to a message.")
								// console.error(error)
								logReactionError(error, ctx)
							}
							map.enabled = state === undefined ? !map.enabled : state
							// const inlineKeyboard: InlineKeyboard = new InlineKeyboard().text(map.enabled ? "Disable ❌" : "Enable ✅", `${map.enabled ? COMMANDS.MAP_DISABLE : COMMANDS.MAP_ENABLE} ${map.destination.hostname}`);
							// ctx.reply(`${map.name} is now ${map.enabled ? "enabled! ✅" : "disabled! ❌"}`, { reply_parameters: { message_id: ctx.msgId }, reply_markup: inlineKeyboard });
							try
							{
								ctx.reply(`${ map.name } is now ${ map.enabled ? "enabled! ✅" : "disabled! ❌" }`, { reply_parameters: { message_id: ctx.msgId } })
							} catch (error)
							{
								// console.error("An error occurred while trying to reply to a message.")
								// console.error(error)
								logReplyError(error, ctx)
							}
						}
		}
	}

	/**
	 * Adds commands to the bot that controls features' availability.
	 */
	private addFeatureCommands (): void
	{
		this.Composer.chatType("private").command(AdminCommands.MAP_ENABLE, (ctx) => this.toggleConverterAvailability(ctx, true))
		this.Composer.chatType("private").command(AdminCommands.MAP_DISABLE, (ctx) => this.toggleConverterAvailability(ctx, false))
		this.Composer.chatType("private").command(AdminCommands.MAP_TOGGLE, (ctx) => this.toggleConverterAvailability(ctx))
	}

	/**
	 * Adds commands to the bot that controls data management.
	 */
	private addDataCommands (): void
	{

		this.Composer.chatType("private").command(AdminCommands.CACHE_CLEAR, (ctx) =>
		{
			if (ctx.config.isDeveloper)
			{
				const loggerCommand: Logger = getLoggerForCommand(AdminCommands.CACHE_CLEAR, ctx)
				// console.debug(`Incoming /${ AdminCommands.CACHE_CLEAR } by ${ getExpeditorDebugString(ctx) }`)
				loggerCommand.debug(COMMAND_LOG_STRING)

				try
				{
					ctx.react("🔥")
				} catch (error)
				{
					// console.error("An error occurred while trying to react to a message.")
					// console.error(error)
					logReactionError(error, ctx)
				}
				const cacheSize: number = CACHE.size
				CACHE.clear()
				try
				{
					ctx.reply(`Cache cleared! 🧹\nIt's now all nice and tidy in here!~\n<blockquote>${ cacheSize } links were cleared from the cache. 💡</blockquote>`, { reply_parameters: { message_id: ctx.msgId }, parse_mode: "HTML" })
				} catch (error)
				{
					// console.error("An error occurred while trying to reply to a message.")
					// console.error(error)
					logReplyError(error, ctx)
				}
			}
		})

		this.Composer.command(AdminCommands.STATS, (ctx) =>
		{

			if (ctx.config.isDeveloper)
			{
				const loggerCommand: Logger = getLoggerForCommand(AdminCommands.STATS, ctx)
				// console.debug(`Incoming /${ AdminCommands.STATS } by ${ getExpeditorDebugString(ctx) }`)
				loggerCommand.debug(COMMAND_LOG_STRING)

				try
				{
					ctx.react("🤓")
				} catch (error)
				{
					// console.error("An error occurred while trying to react to a message.")
					// console.error(error)
					logReactionError(error, ctx)
				}

				let message: string = `Here's the current stats since my last boot up${ Math.random() < 0.25 ? ", nerd! 🤓" : "! 👀" }`

				message += "\n\n<blockquote><b>⌨️ Command usage</b>"
				if (STATS.CommandsUsage.size === 0) message += "\nNo commands used yet."
				else for (const [command, count] of STATS.CommandsUsage) message += `\n/${ command } : ${ count }`
				message += "</blockquote>"

				message += "\n\n<blockquote><b>💬 Conversion methods</b>"
				if (STATS.ConversionMethodsUsage.size === 0) message += "\nNo conversion methods used yet."
				else for (const [method, count] of STATS.ConversionMethodsUsage) message += `\n${ method } : ${ count }`
				message += "</blockquote>"

				// message += "\n\n<blockquote><b>🛠️ Conversion types</b>"
				// if (STATS.ConversionTypeUsage.size === 0) message += "\nNo conversion types used yet."
				// else for (const [type, count] of STATS.ConversionTypeUsage) message += `\n${ type } : ${ count }`
				// message += "</blockquote>"

				message += "\n\n<blockquote><b>🔗 Links</b>"
				if (STATS.LinkConversionUsage.size === 0) message += "\nNo links converted yet."
				else for (const [link, count] of STATS.LinkConversionUsage) message += `\n${ link } : ${ count }`
				message += "</blockquote>"

				message += "\n\n<blockquote><b>🗃️ Cache</b>"
				message += `\n${ CACHE.size } links cached`
				message += `\n${ STATS.CacheHits } hits`
				message += `\n${ STATS.CacheMisses } misses`
				if (STATS.CacheHits > 0 || STATS.CacheMisses > 0) message += `\n${ Math.round(STATS.CacheHitRatio * 100) }% hit ratio`
				message += "</blockquote>"

				message += `\n\nBtw, I've been up for ${ STATS.UpTime.round({ largestUnit: "years", smallestUnit: "seconds" }).toLocaleString("en") }! 🚀`

				try
				{
					ctx.reply(message, { reply_parameters: { message_id: ctx.msgId }, parse_mode: "HTML" })
				} catch (error)
				{
					// console.error("An error occurred while trying to reply to a message.")
					// console.error(error)
					logReplyError(error, ctx)
				}
			}
		})
	}

	/**
	 * Adds the configuration management commands to the bot.
	 */
	private addConfigCommands (): void
	{
		this.Composer.chatType("private").command(AdminCommands.CONFIG_SAVE, async function (ctx)
		{
			if (ctx.config.isDeveloper)
			{
				const loggerCommand: Logger = getLoggerForCommand(AdminCommands.CONFIG_SAVE, ctx)
				// console.debug(`Incoming /${ AdminCommands.CONFIG_SAVE } by ${ getExpeditorDebugString(ctx) }`)
				loggerCommand.debug(COMMAND_LOG_STRING)

				try
				{
					ctx.react("⚡")
				} catch (error)
				{
					// console.error("An error occurred while trying to react to a message.")
					// console.error(error)
					logReactionError(error, ctx)
				}
				try
				{
					await CONFIG.saveConfig()
					try
					{
						ctx.react("🎉")
					} catch (error)
					{
						// console.error("An error occurred while trying to react to a message.")
						// console.error(error)
						logReactionError(error, ctx)
					}
					try
					{
						ctx.reply("Configuration is saved! 💛", { reply_parameters: { message_id: ctx.msgId } })
					} catch (error)
					{
						// console.error("An error occurred while trying to reply to a message.")
						// console.error(error)
						logReplyError(error, ctx)
					}
				} catch (error)
				{
					// console.error("An error occurred while trying to save the configuration.")
					// console.error(error)
					logAction(LogLevels.ERROR, "trying to save the configuration", String(error), ctx)
					try
					{
						ctx.react("💔")
					} catch (error)
					{
						// console.error("An error occurred while trying to react to a message.")
						// console.error(error)
						logReactionError(error, ctx)
					}
					try
					{
						ctx.reply(`Failed to save configuration! 😱\n\n<blockquote>Check your configuration file's permissions or if it is mounted in read-only mode. 💡</blockquote>\n\nI will however continue running tho. No worries! 💛\n\nHere's the configuration's content as of now if you wanna copy it. ✨\n\n<blockquote>${ CONFIG.getConfigurationJson() }</blockquote>`, { reply_parameters: { message_id: ctx.msgId }, parse_mode: "HTML" })
					} catch (error)
					{
						// console.error("An error occurred while trying to reply to a message.")
						// console.error(error)
						logReplyError(error, ctx)
					}
				}
			}
		})

		this.Composer.chatType("private").command(AdminCommands.CONFIG_RELOAD, async function (ctx)
		{
			if (ctx.config.isDeveloper)
			{
				const loggerCommand: Logger = getLoggerForCommand(AdminCommands.CONFIG_RELOAD, ctx)
				// console.debug(`Incoming /${ AdminCommands.CONFIG_RELOAD } by ${ getExpeditorDebugString(ctx) }`)
				loggerCommand.debug(COMMAND_LOG_STRING)

				try
				{
					ctx.react("⚡")
				} catch (error)
				{
					// console.error("An error occurred while trying to react to a message.")
					// console.error(error)
					logReactionError(error, ctx)
				}
				try
				{
					await CONFIG.loadConfig()
					try
					{
						ctx.react("🎉")
					} catch (error)
					{
						// console.error("An error occurred while trying to react to a message.")
						// console.error(error)
						logReactionError(error, ctx)
					}
					try
					{
						ctx.reply("Configuration reloaded! 🚀", { reply_parameters: { message_id: ctx.msgId } })
					} catch (error)
					{
						// console.error("An error occurred while trying to reply to a message.")
						// console.error(error)
						logReplyError(error, ctx)
					}
				} catch (error)
				{
					// console.error("An error occurred while trying to load the configuration.")
					// console.error(error)
					logAction(LogLevels.ERROR, "trying to load the configuration", String(error), ctx)
					try
					{
						ctx.react("💔")
					} catch (error)
					{
						// console.error("An error occurred while trying to react to a message.")
						// console.error(error)
						logReactionError(error, ctx)
					}
					try
					{
						ctx.reply("Failed to load configuration! 😱\nMaybe the file is inaccessible?\n\n<blockquote>Check the configuration file's permissions or if it is not mounted. 💡</blockquote>\n\nI will continue running as is, but you may wanna fix this soon. 💛", { reply_parameters: { message_id: ctx.msgId }, parse_mode: "HTML" })
					} catch (error)
					{
						// console.error("An error occurred while trying to reply to a message.")
						// console.error(error)
						logReplyError(error, ctx)
					}
				}
			}
		})
	}
}
