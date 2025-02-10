import "@std/dotenv/load"
import { sleep } from "https://deno.land/x/sleep@v1.3.0/mod.ts"
// import { AdminActions } from "./actions/admin.ts"
import { ConfigurationManager } from "./managers/config.ts"
// import { MAIN_COMMANDS_LIST, MainActions } from "./actions/main.ts"
import { BotManager } from "./managers/bot.ts"
import { AdminActions } from "./actions/admin.ts"
import { MainActions, MainCommandsDetails } from "./actions/main.ts"

const CONFIG: ConfigurationManager = ConfigurationManager.Instance
const BOT: BotManager = BotManager.Instance

Deno.addSignalListener("SIGINT", async (): Promise<void> => await BOT.notifyShutdownThenStop("SIGINT"))
if (Deno.build.os == "windows") Deno.addSignalListener("SIGBREAK", async (): Promise<void> => await BOT.notifyShutdownThenStop("SIGBREAK"))
if (Deno.build.os != "windows")
{
	Deno.addSignalListener("SIGQUIT", async (): Promise<void> => await BOT.notifyShutdownThenStop("SIGQUIT"))
	Deno.addSignalListener("SIGTERM", async (): Promise<void> => await BOT.notifyShutdownThenStop("SIGTERM"))
}


// try
// {
// 	await CONFIG.loadConfig()
// } catch (error)
// {
// 	console.error("Can't load configuration.", error)
// 	Deno.exitCode = 1
// 	Deno.exit()
// }
await CONFIG.loadConfig()

const waitTime: number = 3
console.debug(`Waiting ${ waitTime } seconds before starting the bot to prevent sessions conflicts…`)
for (let seconds = 1; seconds <= waitTime; seconds++)
{
	console.debug(`${ seconds }…`)
	await sleep(1)
}
await BOT.init()
BOT.loadActionsComposer(new AdminActions())
BOT.loadActionsComposer(new MainActions())
BOT.Itself.api.setMyCommands(MainCommandsDetails)
BOT.Itself.start()
console.info("Bot started! Have fun! 🚀")
