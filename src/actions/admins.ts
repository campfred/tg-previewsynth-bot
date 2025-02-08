import { CommandContext, Composer } from "grammy"
import { CustomContext } from "../types/types.ts"
import { ConfigurationManager } from "../managers/config.ts"
import { getExpeditorDebugString } from "../utils.ts"

enum COMMANDS
{
	CONFIG_SAVE = "save",
	CONFIG_RELOAD = "reload",
	MAP_ENABLE = "enable",
	MAP_DISABLE = "disable",
	MAP_TOGGLE = "toggle",
}

const config_manager: ConfigurationManager = ConfigurationManager.Instance

export const admin_actions = new Composer<CustomContext>()

/**
 * Toggles the web link map's availability.
 * @param ctx Context of the action
 * @param state Desired state of the web link map
 */
function toggleConverterAvailability (ctx: CommandContext<CustomContext>, state?: boolean): void
{
	console.debug(`Incoming /${ COMMANDS.MAP_TOGGLE } by ${ getExpeditorDebugString(ctx) } for « ${ ctx.match } »`)
	if (ctx.config.isDeveloper)
	{
		ctx.react("🤔")
		for (const map of config_manager.SimpleConverters)
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

admin_actions.chatType("private").command(COMMANDS.CONFIG_SAVE, async function (ctx)
{
	console.debug(`Incoming /${ COMMANDS.CONFIG_SAVE } by ${ getExpeditorDebugString(ctx) }`)
	ctx.react("🤔")
	try
	{
		await config_manager.saveConfig()
		ctx.react("🫡")
		ctx.reply("Configuration is saved! 💛", { reply_parameters: { message_id: ctx.msgId } })
	} catch (error)
	{
		console.error(error)
		ctx.react("💔")
		ctx.reply(`Failed to save configuration! 😱\n\n<blockquote>Check your configuration file's permissions or if it is mounted in read-only mode. 💡</blockquote>\n\nI will however continue running tho. No worries! 💛\n\nHere's the configuration's content as of now if you wanna copy it. ✨\n\n<blockquote>${ config_manager.getConfigurationJson() }</blockquote>`, { reply_parameters: { message_id: ctx.msgId }, parse_mode: "HTML" })
	}
})

admin_actions.chatType("private").command(COMMANDS.CONFIG_RELOAD, async function (ctx)
{
	// TODO Actually redo the listened messages for links
	console.debug(`Incoming /${ COMMANDS.CONFIG_RELOAD } by ${ getExpeditorDebugString(ctx) }`)
	ctx.react("🤔")
	try
	{
		await config_manager.loadConfig()
		ctx.react("🫡")
		ctx.reply("Configuration reloaded! 🚀", { reply_parameters: { message_id: ctx.msgId } })
	} catch (error)
	{
		console.error(error)
		ctx.react("💔")
		ctx.reply("Failed to load configuration! 😱\nMaybe the file is inaccessible?\n\n<blockquote>Check the configuration file's permissions or if it is not mounted. 💡</blockquote>\n\nI will continue running as is, but you may wanna fix this soon. 💛", { reply_parameters: { message_id: ctx.msgId }, parse_mode: "HTML" })
	}
})

admin_actions.chatType("private").command(COMMANDS.MAP_ENABLE, (ctx) => toggleConverterAvailability(ctx, true))

admin_actions.chatType("private").command(COMMANDS.MAP_DISABLE, (ctx) => toggleConverterAvailability(ctx, false))

admin_actions.chatType("private").command(COMMANDS.MAP_TOGGLE, (ctx) => toggleConverterAvailability(ctx))

// for (const map of config_manager.LinkConverterpings) {
// 	admin_actions.callbackQuery(`${COMMANDS.MAP_ENABLE} ${map.destination.hostname}`, (ctx) => toggleConverterAvailability(ctx, true));
// 	admin_actions.callbackQuery(`${COMMANDS.MAP_DISABLE} ${map.destination.hostname}`, (ctx) => toggleConverterAvailability(ctx, false));
// }
