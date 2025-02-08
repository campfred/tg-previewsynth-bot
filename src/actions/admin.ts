import { CommandContext, Composer } from "grammy"
import { CustomContext } from "../types/types.ts"
import { ConfigurationManager } from "../managers/config.ts"
import { getExpeditorDebugString } from "../utils.ts"
import { StatsManager } from "../managers/stats.ts"
import { CacheManager } from "../managers/cache.ts"

export enum ADMIN_COMMANDS
{
	CONFIG_SAVE = "save",
	CONFIG_RELOAD = "reload",
	MAP_ENABLE = "enable",
	MAP_DISABLE = "disable",
	MAP_TOGGLE = "toggle",
	STATS = "stats",
	CACHE_CLEAR = "clear",
}

const CONFIG: ConfigurationManager = ConfigurationManager.Instance
const STATS: StatsManager = StatsManager.Instance
const CACHE: CacheManager = CacheManager.Instance

export const AdminActions = new Composer<CustomContext>()

/**
 * Toggles the web link map's availability.
 * @param ctx Context of the action
 * @param state Desired state of the web link map
 */
function toggleConverterAvailability (ctx: CommandContext<CustomContext>, state?: boolean): void
{
	if (ctx.config.isDeveloper)
	{
		console.debug(`Incoming /${ ADMIN_COMMANDS.MAP_TOGGLE } by ${ getExpeditorDebugString(ctx) } for « ${ ctx.match } »`)
		ctx.react("🤔")
		for (const map of CONFIG.SimpleConverters)
			for (const origin of map.origins)
				if (
					map.name.trim().toLowerCase() === ctx.match.trim().toLocaleLowerCase() ||
					origin.hostname.trim().toLocaleLowerCase() === ctx.match.trim().toLocaleLowerCase() ||
					map.destination.hostname.trim().toLocaleLowerCase() === ctx.match.trim().toLocaleLowerCase()
				)
				{
					ctx.react("🫡")
					map.enabled = state === undefined ? !map.enabled : state
					// const inlineKeyboard: InlineKeyboard = new InlineKeyboard().text(map.enabled ? "Disable ❌" : "Enable ✅", `${map.enabled ? COMMANDS.MAP_DISABLE : COMMANDS.MAP_ENABLE} ${map.destination.hostname}`);
					// ctx.reply(`${map.name} is now ${map.enabled ? "enabled! ✅" : "disabled! ❌"}`, { reply_parameters: { message_id: ctx.msgId }, reply_markup: inlineKeyboard });
					ctx.reply(`${ map.name } is now ${ map.enabled ? "enabled! ✅" : "disabled! ❌" }`, { reply_parameters: { message_id: ctx.msgId } })
				}
	}
}

AdminActions.chatType("private").command(ADMIN_COMMANDS.CONFIG_SAVE, async function (ctx)
{
	if (ctx.config.isDeveloper)
	{
		console.debug(`Incoming /${ ADMIN_COMMANDS.CONFIG_SAVE } by ${ getExpeditorDebugString(ctx) }`)
		ctx.react("⚡")
		try
		{
			await CONFIG.saveConfig()
			ctx.react("🎉")
			ctx.reply("Configuration is saved! 💛", { reply_parameters: { message_id: ctx.msgId } })
		} catch (error)
		{
			console.error(error)
			ctx.react("💔")
			ctx.reply(`Failed to save configuration! 😱\n\n<blockquote>Check your configuration file's permissions or if it is mounted in read-only mode. 💡</blockquote>\n\nI will however continue running tho. No worries! 💛\n\nHere's the configuration's content as of now if you wanna copy it. ✨\n\n<blockquote>${ CONFIG.getConfigurationJson() }</blockquote>`, { reply_parameters: { message_id: ctx.msgId }, parse_mode: "HTML" })
		}
	}
})

AdminActions.chatType("private").command(ADMIN_COMMANDS.CONFIG_RELOAD, async function (ctx)
{
	// TODO Actually redo the listened messages for links
	if (ctx.config.isDeveloper)
	{
		console.debug(`Incoming /${ ADMIN_COMMANDS.CONFIG_RELOAD } by ${ getExpeditorDebugString(ctx) }`)
		ctx.react("⚡")
		try
		{
			await CONFIG.loadConfig()
			ctx.react("🎉")
			ctx.reply("Configuration reloaded! 🚀", { reply_parameters: { message_id: ctx.msgId } })
		} catch (error)
		{
			console.error(error)
			ctx.react("💔")
			ctx.reply("Failed to load configuration! 😱\nMaybe the file is inaccessible?\n\n<blockquote>Check the configuration file's permissions or if it is not mounted. 💡</blockquote>\n\nI will continue running as is, but you may wanna fix this soon. 💛", { reply_parameters: { message_id: ctx.msgId }, parse_mode: "HTML" })
		}
	}
})

AdminActions.chatType("private").command(ADMIN_COMMANDS.MAP_ENABLE, (ctx) => toggleConverterAvailability(ctx, true))

AdminActions.chatType("private").command(ADMIN_COMMANDS.MAP_DISABLE, (ctx) => toggleConverterAvailability(ctx, false))

AdminActions.chatType("private").command(ADMIN_COMMANDS.MAP_TOGGLE, (ctx) => toggleConverterAvailability(ctx))

AdminActions.command(ADMIN_COMMANDS.STATS, (ctx) =>
{
	if (ctx.config.isDeveloper)
	{
		console.debug(`Incoming /${ ADMIN_COMMANDS.STATS } by ${ getExpeditorDebugString(ctx) }`)
		ctx.react("🤓")
		let message: string = `Here's the current stats since my last boot up${ Math.random() < 0.25 ? ", nerd! 🤓" : "! 👀" }\n`

		if (STATS.CommandsUsage.size > 0)
		{
			message += "\n<blockquote><b>Command usage</b>"
			for (const [command, count] of STATS.CommandsUsage) message += `\n/${ command } : ${ count }`
			message += "</blockquote>"
		}

		if (STATS.ConversionMethodsUsage.size > 0)
		{
			message += "\n<blockquote><b>Conversion methods</b>"
			for (const [method, count] of STATS.ConversionMethodsUsage) message += `\n${ method } : ${ count }`
			message += "</blockquote>"
		}

		// if (STATS.ConversionTypeUsage.size > 0)
		// {
		// 	message += "\n<blockquote><b>Conversion types</b>"
		// 	for (const [type, count] of STATS.ConversionTypeUsage) message += `\n${ type } : ${ count }`
		// 	message += "</blockquote>"
		// }

		if (STATS.LinkConversionUsage.size > 0)
		{
			message += "\n<blockquote><b>Links</b>"
			for (const [link, count] of STATS.LinkConversionUsage) message += `\n${ link } : ${ count }`
			message += "</blockquote>"
		}

		if (CACHE.size > 0)
		{
			message += "\n<blockquote><b>Cache</b>"
			message += `\n${ CACHE.size } links cached`
			message += `\n${ STATS.CacheHits } hits`
			message += `\n${ STATS.CacheMisses } misses`
			message += `\n${ Math.round(STATS.CacheHitRatio * 100) }% hit ratio`
			message += "</blockquote>"
		}

		message += `\nBtw, I've been up for ${ STATS.UpTime.round({ largestUnit: "auto", smallestUnit: "seconds" }).toLocaleString("en") }! 🚀`

		ctx.reply(message, { reply_parameters: { message_id: ctx.msgId }, parse_mode: "HTML" })
	}
})

AdminActions.chatType("private").command(ADMIN_COMMANDS.CACHE_CLEAR, (ctx) =>
{
	if (ctx.config.isDeveloper)
	{
		console.debug(`Incoming /${ ADMIN_COMMANDS.CACHE_CLEAR } by ${ getExpeditorDebugString(ctx) }`)
		ctx.react("🔥")
		const cacheSize: number = CACHE.size
		CACHE.clear()
		ctx.reply(`Cache cleared! 🧹\nIt's now all nice and tidy in here!~\n<blockquote>${ cacheSize } links were cleared from the cache. 💡</blockquote>`, { reply_parameters: { message_id: ctx.msgId }, parse_mode: "HTML" })
	}
})