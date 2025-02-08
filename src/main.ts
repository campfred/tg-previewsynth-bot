import "@std/dotenv/load"
import { Bot, GrammyError, HttpError, NextFunction } from "grammy"
import { CustomContext } from "./types/types.ts"
import { AdminActions } from "./actions/admins.ts"
import { ConfigurationManager } from "./managers/config.ts"
import { MAIN_COMMANDS_LIST, MainActions } from "./actions/main.ts"

const config_manager: ConfigurationManager = ConfigurationManager.Instance
try
{
	await config_manager.loadConfig()
} catch (error)
{
	console.error("Can't load configuration.", error)
	Deno.exitCode = 1
	Deno.exit()
}

// https://grammy.dev/guide/context#transformative-context-flavors
const BOT = new Bot<CustomContext>(Deno.env.get("PREVIEWSYNTH_TG_BOT_TOKEN") || Deno.env.get("previewsynth_tg_bot_token") || Deno.env.get("TG_PREVIEW_BOT_TOKEN") || Deno.env.get("tg_preview_bot_token") || "")
BOT.use(function (ctx: CustomContext, next: NextFunction)
{
	ctx.config = {
		botDeveloper: config_manager.About.owner,
		isDeveloper: ctx.from?.id === config_manager.About.owner,
	}
	next()
})
BOT.use(AdminActions)
BOT.use(MainActions)
BOT.api.setMyCommands(MAIN_COMMANDS_LIST)
config_manager.BotInfo = BOT.botInfo

/**
 * Lifecycle handling
 */
function getUpdatesChatID (): number
{
	return config_manager.About.status_updates ? config_manager.About.status_updates.chat : config_manager.About.owner
}
function stopBot (): void
{
	console.info("Bot shutting down.")
	BOT.api.sendMessage(getUpdatesChatID(), "Bot shutting down! 💤", config_manager.About.status_updates?.topic ? { message_thread_id: config_manager.About.status_updates.topic } : {})
	BOT.stop()
}

BOT.catch((err): void =>
{
	const ctx = err.ctx
	let error_message: string = `Error while handling update ${ ctx.update.update_id } :`
	const e = err.error
	if (e instanceof GrammyError)
	{
		error_message += "Error in request : " + e.description
	} else if (e instanceof HttpError)
	{
		error_message += "Could not contact Telegram : " + e
	} else
	{
		error_message += "Unknown error : " + e
	}
	console.error(error_message)
	BOT.api.sendMessage(getUpdatesChatID(), error_message, config_manager.About.status_updates?.topic ? { message_thread_id: config_manager.About.status_updates.topic } : {})
})
Deno.addSignalListener("SIGINT", (): void => stopBot())
if (Deno.build.os == "windows") Deno.addSignalListener("SIGBREAK", (): void => stopBot())
if (Deno.build.os != "windows")
{
	Deno.addSignalListener("SIGQUIT", (): void => stopBot())
	Deno.addSignalListener("SIGTERM", (): void => stopBot())
}

console.info("Bot online!")
BOT.api.sendMessage(getUpdatesChatID(), "Bot online! 🎉", config_manager.About.status_updates?.topic ? { message_thread_id: config_manager.About.status_updates.topic } : {})
BOT.start()
