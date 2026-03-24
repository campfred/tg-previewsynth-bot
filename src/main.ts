import "@std/dotenv/load"
import { sleep } from "@michael-spengler/sleep"
import { getLogger, Logger } from "@logtape/logtape"
import { ConfigurationManager } from "./managers/config.ts"
import { BotManager } from "./managers/bot.ts"
import { AdminActions } from "./actions/admin.ts"
import { MainActions, MainCommandsDetails } from "./actions/main.ts"
import { EnvironmentVariables } from "./types/types.ts"
import { LogCategories, setupLogging } from "./managers/logging.ts"

const CONFIG: ConfigurationManager = ConfigurationManager.Instance
const BOT: BotManager = BotManager.Instance

Deno.addSignalListener("SIGINT", async (): Promise<void> => await BOT.notifyShutdownThenStop("SIGINT"))
if (Deno.build.os == "windows") Deno.addSignalListener("SIGBREAK", async (): Promise<void> => await BOT.notifyShutdownThenStop("SIGBREAK"))
if (Deno.build.os != "windows")
{
	Deno.addSignalListener("SIGQUIT", async (): Promise<void> => await BOT.notifyShutdownThenStop("SIGQUIT"))
	Deno.addSignalListener("SIGTERM", async (): Promise<void> => await BOT.notifyShutdownThenStop("SIGTERM"))
}


// Initialize bot configuration
await setupLogging()
await CONFIG.loadConfig()
const LOGGER: Logger = getLogger(LogCategories.BOT)

// Delay bot start when in development mode to prevent session conflicts
if (Deno.env.get(EnvironmentVariables.NODE_ENV) === "development")
{
	const waitTime: number = 3
	LOGGER.debug(`Waiting ${ waitTime } seconds before starting the bot to prevent sessions conflicts…`)
	for (let seconds = waitTime; seconds > 0; seconds--)
	{
		LOGGER.debug(`${ seconds }…`)
		await sleep(1)
	}
}

await BOT.init()
BOT.loadActionsComposer(new AdminActions())
BOT.loadActionsComposer(new MainActions())
BOT.Itself.api.setMyCommands(MainCommandsDetails)
BOT.Itself.start()
LOGGER.info("Bot started! Have fun! 🚀")
