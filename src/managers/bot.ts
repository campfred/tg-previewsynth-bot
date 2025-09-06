import { Bot, GrammyError, HttpError, NextFunction } from "x/grammy"
import { BotActions, CustomContext, EnvironmentVariables } from "../types/types.ts"
import { ConfigurationManager } from "./config.ts"
import { getLogger, Logger } from "@logtape/logtape"
import { LogCategories, setupLoggingWithTelegramMessages } from "./logging.ts"

const CONFIG: ConfigurationManager = ConfigurationManager.Instance
const LOGGER: Logger = getLogger(LogCategories.BOT)

export class BotManager
{
	private static _Instance: BotManager
	private _Bot!: Bot<CustomContext>

	/**
	 * Get the instance of the bot manager.
	 */
	static get Instance (): BotManager { return this._Instance || (this._Instance = new this()) }

	/**
	 * Get the bot itself.
	 */
	public get Itself (): Bot<CustomContext> { return this._Bot }

	/**
	 * Initialize the bot.
	 */
	public async init (): Promise<void>
	{
		const logger: Logger = LOGGER.with({ action: "initializing" })

		// console.debug("Initializing bot…")
		logger.debug("Initializing bot… 🏃")
		this._Bot = new Bot<CustomContext>( // https://grammy.dev/guide/context#transformative-context-flavors
			Deno.env.get(EnvironmentVariables.BOT_TOKEN.toUpperCase())
			|| Deno.env.get(EnvironmentVariables.BOT_TOKEN.toLowerCase())
			|| Deno.env.get(EnvironmentVariables.BOT_TOKEN_OLD.toUpperCase())
			|| Deno.env.get(EnvironmentVariables.BOT_TOKEN_OLD.toLowerCase())
			|| ""
		)

		await this._Bot.init()

		this._Bot.catch((err): void =>
		{
			const ctx = err.ctx
			const logger: Logger = LOGGER.with({ action: "handling an update" })
			let errorMessage: string = `Error while {action} ${ ctx.update.update_id } :\n`
			const error = err.error

			if (error instanceof GrammyError) errorMessage += (`Grammy error in request : ${ error.description }`)
			else if (error instanceof HttpError) errorMessage += (`Web error with Telegram's API : ${ error }`)
			else errorMessage += (`Unknown error : ${ error }`)

			// console.error(errorMessage)
			logger.error(errorMessage)
			// this._Bot.api.sendMessage(CONFIG.StatusUpdatesChatID, errorMessage, CONFIG.About.status_updates?.topic ? { message_thread_id: CONFIG.About.status_updates.topic } : {})
		})

		this._Bot.use(function (ctx: CustomContext, next: NextFunction)
		{
			ctx.config = {
				botDeveloper: CONFIG.About.owner,
				isDeveloper: ctx.from?.id === CONFIG.About.owner,
				codeRepoURL: new URL(CONFIG.About.code_repo)
			}
			next()
		})

		try
		{
			await this._Bot.api.sendMessage(
				CONFIG.StatusUpdatesChatID,
				`<b>Bot online! 🎉</b>\n${ CONFIG.getConvertersListForMessage() }\n${ CONFIG.getFeaturesListForMessage() }`,
				{ parse_mode: "HTML", ...CONFIG.StatusUpdatesMessagesOptions }
			)
		} catch (error)
		{
			logger.error(String(error))
			logger.error("Error while sending status update message. Make sure you added me there and that I am allowed to send messaged there. 🫠")
			this._Bot.stop()
			Deno.exit(1)
		}
		// console.info("Bot online!")
		logger.info("Bot online! 👀")
		await setupLoggingWithTelegramMessages(this, CONFIG)

		// this._Bot.api.setMyDefaultAdministratorRights({ rights: { can_post_messages: true }, for_channels: true })
	}

	/**
	 * Load a composer into the bot.
	 * @param actionsComposer The composer to load.
	 */
	loadActionsComposer (actionsComposer: BotActions): void
	{
		const logger: Logger = LOGGER.with({ action: "loading composer", name: actionsComposer.Name })
		this._Bot.use(actionsComposer.Composer)
		// console.debug(`Loaded composer ${ actionsComposer.Name }!`)
		logger.debug(`Loaded composer {name}! ✅`)
	}

	/**
	 * Stops the bot and sends a message to the status updates chat.
	 */
	notifyShutdownThenStop (reason: string): void
	{
		const logger = LOGGER.with({ action: "shutting down" })

		// console.info(`Bot shutting down! (${ reason })`)
		logger.info(`Bot shutting down! (${ reason })`)
		if (this._Bot.isInited()) this._Bot.api.sendMessage(CONFIG.StatusUpdatesChatID, "Bot shutting down!\nGood night! 💤", CONFIG.About.status_updates?.topic ? { message_thread_id: CONFIG.About.status_updates.topic } : {})
		if (this._Bot.isRunning()) this._Bot.stop()
	}

	async reload (): Promise<void>
	{
		await this._Bot.stop().then(() => this._Bot.start())
	}
}