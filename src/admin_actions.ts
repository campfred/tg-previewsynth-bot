import { CommandContext, Composer } from "grammy";
import { CustomContext } from "./types/types.ts";
import { ConfigurationManager } from "../src/config.ts";
import { getExpeditorDebugString } from "../src/utils.ts";

enum COMMANDS {
	CONFIG_SAVE = "save",
	CONFIG_RELOAD = "reload",
	MAP_ENABLE = "enable",
	MAP_DISABLE = "disable",
	MAP_TOGGLE = "toggle",
}

const config_manager: ConfigurationManager = ConfigurationManager.Instance;

export const admin_actions = new Composer<CustomContext>();

/**
 * Toggles the web link map's availability.
 * @param ctx Context of the action
 * @param state Desired state of the web link map
 */
function toggleMapAvailability(ctx: CommandContext<CustomContext>, state?: boolean): void {
	console.debug(`Incoming /${COMMANDS.MAP_TOGGLE} by ${getExpeditorDebugString(ctx)} for « ${ctx.match} »`);
	if (ctx.config.isDeveloper) {
		ctx.react("🤔");
		for (const map of config_manager.Simple_Converters)
			for (const origin of map.origins)
				if (
					map.name.trim().toLowerCase() === ctx.match.trim().toLocaleLowerCase() ||
					origin.hostname.trim().toLocaleLowerCase() === ctx.match.trim().toLocaleLowerCase() ||
					map.destination.hostname.trim().toLocaleLowerCase() === ctx.match.trim().toLocaleLowerCase()
				) {
					ctx.react("🫡");
					map.enabled = state === undefined ? !map.enabled : state;
					// const inlineKeyboard: InlineKeyboard = new InlineKeyboard().text(map.enabled ? "Disable ❌" : "Enable ✅", `${map.enabled ? COMMANDS.MAP_DISABLE : COMMANDS.MAP_ENABLE} ${map.destination.hostname}`);
					// ctx.reply(`${map.name} is now ${map.enabled ? "enabled! ✅" : "disabled! ❌"}`, { reply_parameters: { message_id: ctx.msgId }, reply_markup: inlineKeyboard });
					ctx.reply(`${map.name} is now ${map.enabled ? "enabled! ✅" : "disabled! ❌"}`, { reply_parameters: { message_id: ctx.msgId } });
				}
	}
}

admin_actions.chatType("private").command(COMMANDS.CONFIG_SAVE, async function (ctx) {
	console.debug(`Incoming /${COMMANDS.CONFIG_SAVE} by ${getExpeditorDebugString(ctx)}`);
	ctx.react("🤔");
	await config_manager.saveConfiguration();
	ctx.react("🫡");
	ctx.reply("Configuration is saved! 💛", { reply_parameters: { message_id: ctx.msgId } });
});
admin_actions.chatType("private").command(COMMANDS.CONFIG_RELOAD, async function (ctx) {
	console.debug(`Incoming /${COMMANDS.CONFIG_RELOAD} by ${getExpeditorDebugString(ctx)}`);
	ctx.react("🤔");
	await config_manager.loadConfiguration();
	ctx.react("🫡");
	ctx.reply("Configuration reloaded! 🚀", { reply_parameters: { message_id: ctx.msgId } });
});
admin_actions.chatType("private").command(COMMANDS.MAP_ENABLE, (ctx) => toggleMapAvailability(ctx, true));
admin_actions.chatType("private").command(COMMANDS.MAP_DISABLE, (ctx) => toggleMapAvailability(ctx, false));
admin_actions.chatType("private").command(COMMANDS.MAP_TOGGLE, (ctx) => toggleMapAvailability(ctx));
// for (const map of config_manager.WebLinkMappings) {
// 	admin_actions.callbackQuery(`${COMMANDS.MAP_ENABLE} ${map.destination.hostname}`, (ctx) => toggleMapAvailability(ctx, true));
// 	admin_actions.callbackQuery(`${COMMANDS.MAP_DISABLE} ${map.destination.hostname}`, (ctx) => toggleMapAvailability(ctx, false));
// }
