import { Bot, GrammyError, HttpError, NextFunction } from "x/grammy"
import { BotActions, CustomContext } from "../types/types.ts"
import { ConfigurationManager } from "./config.ts"

const CONFIG: ConfigurationManager = ConfigurationManager.Instance

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
		console.debug("Initializing bot…")
		this._Bot = new Bot<CustomContext>( // https://grammy.dev/guide/context#transformative-context-flavors
			Deno.env.get("PREVIEWSYNTH_TG_BOT_TOKEN")
			|| Deno.env.get("previewsynth_tg_bot_token")
			|| Deno.env.get("TG_PREVIEW_BOT_TOKEN")
			|| Deno.env.get("tg_preview_bot_token")
			|| ""
		)

		await this._Bot.init()

		this._Bot.catch((err): void =>
		{
			const ctx = err.ctx
			let errorMessage: string = `Error while handling update ${ ctx.update.update_id } :\n`
			const error = err.error

			if (error instanceof GrammyError) errorMessage += (`Grammy error in request : ${ error.description }`)
			else if (error instanceof HttpError) errorMessage += (`Web error with Telegram's API : ${ error }`)
			else errorMessage += (`Unknown error : ${ error }`)

			console.error(errorMessage)
			this._Bot.api.sendMessage(CONFIG.StatusUpdatesChatID, errorMessage, CONFIG.About.status_updates?.topic ? { message_thread_id: CONFIG.About.status_updates.topic } : {})
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

		await this._Bot.api.sendMessage(
			CONFIG.StatusUpdatesChatID,
			`<b>Bot online! 🎉</b>\n${ CONFIG.getConvertersListForMessage() }\n${ CONFIG.getFeaturesListForMessage() }`,
			{ parse_mode: "HTML", ...CONFIG.StatusUpdatesMessagesOptions }
		)
		console.info("Bot online!")
	}

	/**
	 * Load a composer into the bot.
	 * @param actionsComposer The composer to load.
	 */
	loadActionsComposer (actionsComposer: BotActions): void
	{
		this._Bot.use(actionsComposer.Composer)
		console.debug(`Loaded composer ${ actionsComposer.Name }!`)
	}

	/**
	 * Stops the bot and sends a message to the status updates chat.
	 */
	notifyShutdownThenStop (reason: string): void
	{
		console.info(`Bot shutting down! (${ reason })`)
		if (this._Bot.isInited()) this._Bot.api.sendMessage(CONFIG.StatusUpdatesChatID, "Bot shutting down! 💤", CONFIG.About.status_updates?.topic ? { message_thread_id: CONFIG.About.status_updates.topic } : {})
		if (this._Bot.isRunning()) this._Bot.stop()
	}

	async reload (): Promise<void>
	{
		await this._Bot.stop().then(() => this._Bot.start())
	}
}