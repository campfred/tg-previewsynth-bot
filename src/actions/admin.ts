import { CommandContext, Composer } from "@grammy/grammy"
import { CustomContext, BotActions, LogLevels } from "../types/types.ts"
import { ConfigurationManager } from "../managers/config.ts"
import { getLoggerForCommand, isTargetedCommand, logAction, logReactionError, logReplyError } from "../utils.ts"
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

/**
 * Generates the message contents for the stats command.
 * @returns Message string to insert into an outgoing response to a user.
 */
export function generateStatsMessageContents (): string
{
	let message: string = ""
	message += "\n\n<blockquote><b>⌨️ Command usage</b>"
	if (STATS.CommandsUsage.size === 0) message += "\nNo command used yet."
	else for (const [command, count] of STATS.CommandsUsage) message += `\n/${ command } : ${ count }`
	message += "</blockquote>"

	message += "\n\n<blockquote><b>💬 Conversion methods</b>"
	if (STATS.ConversionMethodsUsage.size === 0) message += "\nNo conversion method used yet."
	else for (const [method, count] of STATS.ConversionMethodsUsage) message += `\n${ method } : ${ count }`
	message += "</blockquote>"

	message += "\n\n<blockquote><b>🔗 Links</b>"
	if (STATS.LinkConversionUsage.size === 0) message += "\nNo link converted yet."
	else for (const [link, count] of STATS.LinkConversionUsage) message += `\n${ link } : ${ count }`
	message += "</blockquote>"

	message += "\n\n<blockquote><b>🗃️ Cache</b>"
	message += `\n${ CACHE.size } link${ CACHE.size !== 1 ? "s" : "" } cached`
	message += `\n${ STATS.CacheHits } hit${ STATS.CacheHits !== 1 ? "s" : "" }`
	message += `\n${ STATS.CacheMisses } miss${ STATS.CacheMisses !== 1 ? "es" : "" }`
	if (STATS.CacheHits > 0 || STATS.CacheMisses > 0) message += `\n${ Math.round(STATS.CacheHitRatio * 100) }% hit ratio`
	message += "</blockquote>"

	message += `\n\nBtw, I've been up for ${ STATS.UpTime.round({ largestUnit: "days", smallestUnit: "seconds" }).toLocaleString("en") }! 🚀`

	return message
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
	private async toggleConverterAvailability (ctx: CommandContext<CustomContext>, state?: boolean): Promise<void>
	{
		if (ctx.config.isDeveloper)
		{
			let reactionsAllowed: boolean = true
			const loggerCommand: Logger = getLoggerForCommand(AdminCommands.MAP_TOGGLE, ctx)
			loggerCommand.debug(COMMAND_LOG_STRING)

			try
			{
				await ctx.react("🤔")
			} catch (error)
			{
				logReactionError(error, ctx)
				reactionsAllowed = false
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
							if (reactionsAllowed)
							{
								try
								{
									await ctx.react("🫡")
								} catch (error)
								{
									logReactionError(error, ctx)
									reactionsAllowed = false
								}
							}
							map.enabled = state === undefined ? !map.enabled : state
							try
							{
								await ctx.reply(`${ map.name } is now ${ map.enabled ? "enabled! ✅" : "disabled! ❌" }`, { reply_parameters: { message_id: ctx.msgId } })
							} catch (error)
							{
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
		this.Composer.chatType("private").command(AdminCommands.MAP_ENABLE, (ctx: CommandContext<CustomContext>) => this.toggleConverterAvailability(ctx, true))
		this.Composer.chatType("private").command(AdminCommands.MAP_DISABLE, (ctx: CommandContext<CustomContext>) => this.toggleConverterAvailability(ctx, false))
		this.Composer.chatType("private").command(AdminCommands.MAP_TOGGLE, (ctx: CommandContext<CustomContext>) => this.toggleConverterAvailability(ctx))
	}

	/**
	 * Adds commands to the bot that controls data management.
	 */
	private addDataCommands (): void
	{

		this.Composer.chatType("private").command(AdminCommands.CACHE_CLEAR, async function (ctx: CommandContext<CustomContext>)
		{
			if (ctx.config.isDeveloper)
			{
				const loggerCommand: Logger = getLoggerForCommand(AdminCommands.CACHE_CLEAR, ctx)
				loggerCommand.debug(COMMAND_LOG_STRING)

				try
				{
					await ctx.react("🔥")
				} catch (error)
				{
					logReactionError(error, ctx)
				}
				const cacheSize: number = CACHE.size
				CACHE.clear()
				try
				{
					await ctx.reply(`Cache cleared! 🧹\nIt's now all nice and tidy in here!~\n<blockquote>${ cacheSize } links were cleared from the cache. 💡</blockquote>`, { reply_parameters: { message_id: ctx.msgId }, parse_mode: "HTML" })
				} catch (error)
				{
					logReplyError(error, ctx)
				}
			}
		})

		this.Composer.command(AdminCommands.STATS, async function (ctx: CommandContext<CustomContext>)
		{
			if (!isTargetedCommand(ctx, AdminCommands.STATS)) return
			if (ctx.config.isDeveloper)
			{
				const loggerCommand: Logger = getLoggerForCommand(AdminCommands.STATS, ctx)
				loggerCommand.debug(COMMAND_LOG_STRING)

				try
				{
					await ctx.react("🤓")
				} catch (error)
				{
					logReactionError(error, ctx)
				}

				let message: string = `Here's the current stats since my last boot up${ Math.random() < 0.25 ? ", nerd! 🤓" : "! 👀" }`

				message += generateStatsMessageContents()

				try
				{
					await ctx.reply(message, { reply_parameters: { message_id: ctx.msgId }, parse_mode: "HTML" })
				} catch (error)
				{
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
		this.Composer.chatType("private").command(AdminCommands.CONFIG_SAVE, async function (ctx: CommandContext<CustomContext>)
		{
			if (ctx.config.isDeveloper)
			{
				let reactionsAllowed: boolean = true
				const loggerCommand: Logger = getLoggerForCommand(AdminCommands.CONFIG_SAVE, ctx)
				loggerCommand.debug(COMMAND_LOG_STRING)

				try
				{
					await ctx.react("⚡")
				} catch (error)
				{
					logReactionError(error, ctx)
					reactionsAllowed = false
				}
				try
				{
					await CONFIG.saveConfig()
					if (reactionsAllowed)
					{
						try
						{
							await ctx.react("🎉")
						} catch (error)
						{
							logReactionError(error, ctx)
							reactionsAllowed = false
						}
					}
					try
					{
						await ctx.reply("Configuration is saved! 💛", { reply_parameters: { message_id: ctx.msgId } })
					} catch (error)
					{
						logReplyError(error, ctx)
					}
				} catch (error)
				{
					logAction(LogLevels.ERROR, "trying to save the configuration", String(error), ctx)
					if (reactionsAllowed)
					{
						try
						{
							await ctx.react("💔")
						} catch (error)
						{
							logReactionError(error, ctx)
							reactionsAllowed = false
						}
					}
					try
					{
						await ctx.reply(`Failed to save configuration! 😱\n\n<blockquote>Check your configuration file's permissions or if it is mounted in read-only mode. 💡</blockquote>\n\nI will however continue running tho. No worries! 💛\n\nHere's the configuration's content as of now if you wanna copy it. ✨\n\n<blockquote>${ CONFIG.getConfigurationJson() }</blockquote>`, { reply_parameters: { message_id: ctx.msgId }, parse_mode: "HTML" })
					} catch (error)
					{
						logReplyError(error, ctx)
					}
				}
			}
		})

		this.Composer.chatType("private").command(AdminCommands.CONFIG_RELOAD, async function (ctx: CommandContext<CustomContext>)
		{
			if (ctx.config.isDeveloper)
			{
				let reactionsAllowed: boolean = true
				const loggerCommand: Logger = getLoggerForCommand(AdminCommands.CONFIG_RELOAD, ctx)
				loggerCommand.debug(COMMAND_LOG_STRING)

				try
				{
					await ctx.react("⚡")
				} catch (error)
				{
					logReactionError(error, ctx)
					reactionsAllowed = false
				}
				try
				{
					await CONFIG.loadConfig()
					if (reactionsAllowed)
					{
						try
						{
							await ctx.react("🎉")
						} catch (error)
						{
							logReactionError(error, ctx)
							reactionsAllowed = false
						}
					}
					try
					{
						await ctx.reply("Configuration reloaded! 🚀", { reply_parameters: { message_id: ctx.msgId } })
					} catch (error)
					{
						logReplyError(error, ctx)
					}
				} catch (error)
				{
					logAction(LogLevels.ERROR, "trying to load the configuration", String(error), ctx)
					if (reactionsAllowed)
					{
						try
						{
							await ctx.react("💔")
						} catch (error)
						{
							logReactionError(error, ctx)
							reactionsAllowed = false
						}
					}
					try
					{
						await ctx.reply("Failed to load configuration! 😱\nMaybe the file is inaccessible?\n\n<blockquote>Check the configuration file's permissions or if it is not mounted. 💡</blockquote>\n\nI will continue running as is, but you may wanna fix this soon. 💛", { reply_parameters: { message_id: ctx.msgId }, parse_mode: "HTML" })
					} catch (error)
					{
						logReplyError(error, ctx)
					}
				}
			}
		})
	}
}
