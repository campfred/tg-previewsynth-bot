import { CommandContext, Composer } from "grammy"
import { CustomContext } from "../types/types.ts"
import { ConfigurationManager } from "../managers/config.ts"
import { getExpeditorDebugString } from "../utils.ts"
import { StatsManager } from "../managers/stats.ts"

enum COMMANDS
{
	CONFIG_SAVE = "save",
	CONFIG_RELOAD = "reload",
	MAP_ENABLE = "enable",
	MAP_DISABLE = "disable",
	MAP_TOGGLE = "toggle",
	STATS = "stats",
}

const CONFIG: ConfigurationManager = ConfigurationManager.Instance
const STATS: StatsManager = StatsManager.Instance

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
		console.debug(`Incoming /${ COMMANDS.MAP_TOGGLE } by ${ getExpeditorDebugString(ctx) } for « ${ ctx.match } »`)
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

AdminActions.chatType("private").command(COMMANDS.CONFIG_SAVE, async function (ctx)
{
	if (ctx.config.isDeveloper)
	{
		console.debug(`Incoming /${ COMMANDS.CONFIG_SAVE } by ${ getExpeditorDebugString(ctx) }`)
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

AdminActions.chatType("private").command(COMMANDS.CONFIG_RELOAD, async function (ctx)
{
	// TODO Actually redo the listened messages for links
	if (ctx.config.isDeveloper)
	{
		console.debug(`Incoming /${ COMMANDS.CONFIG_RELOAD } by ${ getExpeditorDebugString(ctx) }`)
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

AdminActions.chatType("private").command(COMMANDS.MAP_ENABLE, (ctx) => toggleConverterAvailability(ctx, true))

AdminActions.chatType("private").command(COMMANDS.MAP_DISABLE, (ctx) => toggleConverterAvailability(ctx, false))

AdminActions.chatType("private").command(COMMANDS.MAP_TOGGLE, (ctx) => toggleConverterAvailability(ctx))

// for (const map of CONFIG.LinkConverterpings) {
// 	admin_actions.callbackQuery(`${COMMANDS.MAP_ENABLE} ${map.destination.hostname}`, (ctx) => toggleConverterAvailability(ctx, true));
// 	admin_actions.callbackQuery(`${COMMANDS.MAP_DISABLE} ${map.destination.hostname}`, (ctx) => toggleConverterAvailability(ctx, false));
// }

AdminActions.command(COMMANDS.STATS, (ctx) =>
{
	if (ctx.config.isDeveloper)
	{
		console.debug(`Incoming /${ COMMANDS.STATS } by ${ getExpeditorDebugString(ctx) }`)
		ctx.react("🤓")
		let message: string = `Here's the current stats since my last boot up${ Math.random() < 0.25 ? ", nerd! 🤓" : "! 👀" }\n\n`

		message += "<b>Command usage</b\n"
		Object.entries(STATS.CommandsUsage).map(([command, count]: [string, number]): string => message += `/${ command } : ${ count }\n`)

		message += "<b>Conversion methods</b>\n"
		Object.entries(STATS.ConversionMethodsUsage).map(([method, count]: [string, number]): string => message += `${ method } : ${ count }\n`)

		// message += "<b>Conversion types</b>\n"
		// deno-lint-ignore no-irregular-whitespace
		// Object.entries(STATS.ConversionTypeUsage).map(([type, count]: [string, number]): string => message += `${ type } : ${ count }\n`)

		message += "<b>Links</b>\n"
		Object.entries(STATS.LinkConversionUsage).map(([link, count]: [string, number]): string => message += `${ link } : ${ count }\n`)

		message += "\n"

		message += `I've been up for ${ STATS.UpTime.toLocaleString("en") } btw! 🚀`

		ctx.reply(message, { reply_parameters: { message_id: ctx.msgId }, parse_mode: "HTML" })
	}
})
