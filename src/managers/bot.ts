import { Bot, GrammyError, HttpError, NextFunction } from "@grammy/grammy"
import { BotActions, CustomContext, EnvironmentVariables } from "../types/types.ts"
import { ConfigurationManager } from "./config.ts"
import { getLogger, Logger } from "@logtape/logtape"
import { LogCategories, setupLoggingWithTelegramMessages } from "./logging.ts"
import { generateStatsMessageContents } from "../actions/admin.ts"

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
			let errorMessage: string = `Error while {action} ${ ctx.update.update_id } :\n`
			const error = err.error

			if (error instanceof GrammyError) errorMessage += (`Grammy error in request : ${ error.description }`)
			else if (error instanceof HttpError) errorMessage += (`Web error with Telegram's API : ${ error }`)
			else errorMessage += (`Unknown error : ${ error }`)

			logger.error(errorMessage)
		})

		this._Bot.use(function (ctx: CustomContext, next: NextFunction)
		{
			ctx.config = {
				botDeveloper: CONFIG.About.owner,
				isDeveloper: ctx.from?.id === CONFIG.About.owner,
				codeRepoURL: new URL(CONFIG.About.code_repo),
				statusMessage: CONFIG.About.status_message || null
			}
			next()
		})

		try
		{
			await this._Bot.api.sendMessage(
				CONFIG.StatusUpdatesChatID,
				`<b>Bot online! 🎉</b>\n${ CONFIG.getConvertersListForMessage() }\n${ CONFIG.getFeaturesListForMessage() }${ CONFIG.About.status_message ? `\n\n<blockquote><b>ℹ️ Status message</b>\n${ CONFIG.About.status_message }</blockquote>` : "" }`,
				{ parse_mode: "HTML", ...CONFIG.StatusUpdatesMessagesOptions }
			)
		} catch (error)
		{
			logger.error(String(error))
			logger.error("Error while sending status update message. Make sure you added me there and that I am allowed to send messaged there. 🫠")
			this._Bot.stop()
			Deno.exit(1)
		}
		logger.info("Bot online! 👀")
		await setupLoggingWithTelegramMessages(this, CONFIG)
	}

	/**
	 * Load a composer into the bot.
	 * @param actionsComposer The composer to load.
	 */
	loadActionsComposer (actionsComposer: BotActions): void
	{
		const logger: Logger = LOGGER.with({ action: "loading composer", name: actionsComposer.Name })
		this._Bot.use(actionsComposer.Composer)
		logger.debug(`Loaded composer {name}! ✅`)
	}

	/**
	 * Stops the bot and sends a message to the status updates chat.
	 */
	notifyShutdownThenStop (reason: string): void
	{
		const logger = LOGGER.with({ action: "shutting down" })

		logger.info(`Bot shutting down! (${ reason })`)
		if (this._Bot.isInited()) this._Bot.api.sendMessage(
			CONFIG.StatusUpdatesChatID,
			"<b>Bot shutting down! Good night! 💤</b>" + generateStatsMessageContents(),
			{ parse_mode: "HTML", ...CONFIG.StatusUpdatesMessagesOptions }
		)
		if (this._Bot.isRunning()) this._Bot.stop()
	}

	async reload (): Promise<void>
	{
		await this._Bot.stop().then(() => this._Bot.start())
	}
}