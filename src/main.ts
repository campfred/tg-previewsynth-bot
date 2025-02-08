import "@std/dotenv/load"
import { Bot, GrammyError, HttpError, NextFunction } from "grammy"
import { sleep } from "https://deno.land/x/sleep@v1.3.0/mod.ts"
import { CustomContext } from "./types/types.ts"
import { AdminActions } from "./actions/admin.ts"
import { ConfigurationManager } from "./managers/config.ts"
import { MAIN_COMMANDS_LIST, MainActions } from "./actions/main.ts"

const CONFIG: ConfigurationManager = ConfigurationManager.Instance
try
{
	await CONFIG.loadConfig()
} catch (error)
{
	console.error("Can't load configuration.", error)
	Deno.exitCode = 1
	Deno.exit()
}

const waitTime: number = 10
console.debug(`Waiting ${ waitTime } seconds before starting the bot to prevent sessions conflicts…`)
for (let seconds = 1; seconds <= waitTime; seconds++)
{
	console.debug(`${ seconds }…`)
	await sleep(1)
}

// https://grammy.dev/guide/context#transformative-context-flavors
const BOT = new Bot<CustomContext>(Deno.env.get("PREVIEWSYNTH_TG_BOT_TOKEN") || Deno.env.get("previewsynth_tg_bot_token") || Deno.env.get("TG_PREVIEW_BOT_TOKEN") || Deno.env.get("tg_preview_bot_token") || "")
BOT.use(function (ctx: CustomContext, next: NextFunction)
{
	ctx.config = {
		botDeveloper: CONFIG.About.owner,
		isDeveloper: ctx.from?.id === CONFIG.About.owner,
	}
	next()
})
BOT.use(AdminActions)
BOT.use(MainActions)
BOT.api.setMyCommands(MAIN_COMMANDS_LIST)
await BOT.init()
CONFIG.BotInfo = BOT.botInfo

/**
 * Lifecycle handling
 */
function getUpdatesChatID (): number
{
	return CONFIG.About.status_updates ? CONFIG.About.status_updates.chat : CONFIG.About.owner
}
function stopBot (): void
{
	console.info("Bot shutting down.")
	BOT.api.sendMessage(getUpdatesChatID(), "Bot shutting down! 💤", CONFIG.About.status_updates?.topic ? { message_thread_id: CONFIG.About.status_updates.topic } : {})
	BOT.stop()
}

BOT.catch((err): void =>
{
	const ctx = err.ctx
	let errorMessage: string = `Error while handling update ${ ctx.update.update_id } :`
	const e = err.error
	if (e instanceof GrammyError)
	{
		errorMessage += "Error in request : " + e.description
	} else if (e instanceof HttpError)
	{
		errorMessage += "Could not contact Telegram : " + e
	} else
	{
		errorMessage += "Unknown error : " + e
	}
	console.error(errorMessage)
	BOT.api.sendMessage(getUpdatesChatID(), errorMessage, CONFIG.About.status_updates?.topic ? { message_thread_id: CONFIG.About.status_updates.topic } : {})
})
Deno.addSignalListener("SIGINT", (): void => stopBot())
if (Deno.build.os == "windows") Deno.addSignalListener("SIGBREAK", (): void => stopBot())
if (Deno.build.os != "windows")
{
	Deno.addSignalListener("SIGQUIT", (): void => stopBot())
	Deno.addSignalListener("SIGTERM", (): void => stopBot())
}

console.info("Bot online!")
const extraMessageOptions = CONFIG.About.status_updates?.topic ? { message_thread_id: CONFIG.About.status_updates.topic } : {}
BOT.api.sendMessage(getUpdatesChatID(), "Bot online! 🎉" + CONFIG.getConvertersListForMessage(), { parse_mode: "HTML", ...extraMessageOptions })
BOT.start()
