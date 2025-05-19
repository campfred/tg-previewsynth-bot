import { CommandContext, Composer, HearsContext, InlineQueryContext, InlineQueryResultBuilder } from "x/grammy"
import { BotCommand } from "x/grammy_types/manage"
import { InlineQueryResultArticle } from "x/grammy_types/inline"
import { ConfigurationManager } from "../managers/config.ts"
import { BotActions, ConversionMethods, CustomContext, LinkConverter } from "../types/types.ts"
import { findMatchingConverter, getExpeditorDebugString, getQueryDebugString } from "../utils.ts"
import { StatsManager } from "../managers/stats.ts"
import { AdminCommands } from "./admin.ts"
import { BotManager } from "../managers/bot.ts"

const CONFIG: ConfigurationManager = ConfigurationManager.Instance
const STATS: StatsManager = StatsManager.Instance
const BOT: BotManager = BotManager.Instance

export enum MainCommands
{
	START = "start",
	PING = "ping",
	HELP = "help",
	LINK_CONVERT = "convert",
	LINK_EMBED = "embed",
}

export const MainCommandsDetails: BotCommand[] = [
	{ command: MainCommands.START, description: "Start the bot." },
	{ command: MainCommands.HELP, description: "Get a list of supported links." },
	{ command: MainCommands.LINK_CONVERT, description: "Convert a link." },
]

/**
 * Process an incoming link conversion request.
 * @param ctx Command or Hears context.
 * @returns Completion promise.
 */
async function processConversionRequest (ctx: CommandContext<CustomContext> | HearsContext<CustomContext>, method: ConversionMethods): Promise<void>
{
	// Handle mistakes where no link is given
	if (ctx.match.length < 1 && ctx.chat.type === "private")
	{
		await ctx.reply("Oop! No link was given with the command. 😅\nMaybe try again with a link following the command next time?\n<blockquote>Need help to use the command? Check « /help ».</blockquote>", {
			parse_mode: "HTML",
			reply_parameters: { message_id: ctx.msgId },
		})
		return
	}

	try
	{
		// Try casting it as a URL as a filter for bad requests.
		new URL(ctx.match.toString())
	} catch (error)
	{
		console.error(error)
		console.error(`Received link is invalid (${ ctx.match }), silently aborting processing it.`)
		return
	}

	// Check if link matches in map
	const url: URL = new URL(ctx.match.toString())
	const converter: LinkConverter | undefined = findMatchingConverter(url, CONFIG.AllConverters)
	if (converter)
	{
		await ctx.react("🤔")
		console.debug(`${ converter?.name } will be used to convert requested link.`)
		const linkConverted: URL = await converter.parseLinkDefault(new URL(ctx.match.toString()))
		await ctx.react("👀")
		await ctx.reply(linkConverted.toString(), { reply_parameters: { message_id: ctx.msgId }, link_preview_options: { show_above_text: true } })
		STATS.countConversion(converter, method)
		// else
		// 	ctx.reply(
		// 		`Oof… 'Looks like I can't convert that link right now. I apologize for that. 😓\n<blockquote>Either try again or report that as <a href="${ ctx.config.codeRepoURL }/issues">an isssue on GitHub</a> and my creator will take a look at it. 💡</blockquote>`,
		// 		{
		// 			parse_mode: "HTML",
		// 			reply_parameters: { message_id: ctx.msgId },
		// 			link_preview_options: { is_disabled: true },
		// 		},
		// 	)
		// return
	} else if (ctx.chat.type === "private")
	{
		// Handle when link isn't known in map
		await ctx.react("🗿")
		await ctx.reply(
			`Sorry, I don't have an equivalent for that website. 😥\n\n<blockquote>If you happen to know one, feel free to submit a request through <a href="${ ctx.config.codeRepoURL }/issues">an Issue on my code's repository</a>. 💛</blockquote>`,
			{
				parse_mode: "HTML",
				reply_parameters: { message_id: ctx.msgId },
				link_preview_options: { is_disabled: true },
			},
		)
	}
}

export class MainActions implements BotActions
{
	readonly Name: string = "Main actions"
	readonly Composer: Composer<CustomContext> = new Composer<CustomContext>()

	constructor ()
	{
		this.addCommands()
		if (CONFIG.Features.link_recognition) this.addProactiveFeatures()
		if (CONFIG.Features.inline_queries && BOT.Itself.botInfo.supports_inline_queries) this.addInlineFeatures()
	}

	private addCommands (): void
	{
		/**
		 * Start command
		 */
		this.Composer.chatType("private").command(MainCommands.START, function (ctx)
		{
			console.debug(`Incoming /${ MainCommands.START } by ${ getExpeditorDebugString(ctx) }`)
			ctx.react("👀")
			let response: string = `Hi! I'm <b>${ BOT.Itself.botInfo.first_name }</b>! 👋`
			response += "\nA simple bot that serves the purpose of automatically embedding links!"
			if (CONFIG.Features.link_recognition)
			{
				response += "\n"
				response += "\nSend me a link I recognize here and I'll respond with an embed-friendly + tracking-free version. ✨"
				if (BOT.Itself.botInfo.can_join_groups && BOT.Itself.botInfo.can_read_all_group_messages) response += "\nI'll also do the same in groups and channels you add me in."
			}
			response += "\n"
			response += `\n<blockquote><b>💡 Wanna know which links I'll recognize?</b>`
			response += `\nUse the / ${ MainCommands.HELP } command!</blockquote>`
			response += "\n"
			response += `\nAnyway, I wish you a nice day! 🎶`
			ctx.reply(response, { reply_parameters: { message_id: ctx.msgId }, parse_mode: "HTML", link_preview_options: { is_disabled: true } })
			STATS.countCommand(MainCommands.START)
		})

		/**
		 * Healthcheck ping command
		 */
		this.Composer.chatType(["private", "group", "supergroup"]).command(MainCommands.PING, function (ctx)
		{
			console.debug(`Incoming /${ MainCommands.PING } by ${ getExpeditorDebugString(ctx) }`)
			ctx.react("⚡")
			ctx.reply("Pong! 🏓", { reply_parameters: { message_id: ctx.msgId } })
			STATS.countCommand(MainCommands.PING)
		})

		/**
		 * Get help instructions
		 */
		this.Composer.chatType("private").command(MainCommands.HELP, async function (ctx)
		{
			console.debug(`Incoming /${ MainCommands.HELP } by ${ getExpeditorDebugString(ctx) }`)
			let response: string = "Oh! You see, I'm a simple Synth!"
			if (CONFIG.Features.link_recognition)
			{
				response += "\n"
				response += "\nSend a link I recognize here and I'll respond with an embed-friendly one. ✨"
				if (BOT.Itself.botInfo.can_join_groups) response += "\nI'll also do the same thing in groups and channels you add me in."
			}
			if (CONFIG.Features.inline_queries) response += `\nIf you're in another chat where I am not present, begin your message with my username (@${ BOT.Itself.botInfo.username }) followed by a space and I'll be available in-line style! 😉`
			response += "\n"
			response += "\n<blockquote><b>💡 If a preview doesn't generate after a few seconds</b>"
			response += "\nIt is possible that @WebpageBot takes a long time to generate the web preview of a link you just sent."
			response += "\nForward your converted link to it so that it can try again.</blockquote>"
			response += "\n"
			response += "\n<blockquote><b>ℹ️ Links I recognize at the moment</b>"
			for (const converter of CONFIG.AllConverters) if (converter.enabled) response += `\n${ converter.name } : ${ converter.origins.map((origin: URL): string => origin.hostname) } → ${ converter.destinations.map((destination: URL): string => destination.hostname) }`
			response += "</blockquote>"
			if (ctx.config.isDeveloper)
			{
				response += "\n"
				response += "\nAlso, since you are an admin, you have extra commands you can use. 🔥"
				response += "\n<blockquote><b>🛠️ Admin commands</b>"
				for (const [, text] of Object.entries(AdminCommands)) response += `\n/${ text }`
				response += "</blockquote>"
			}
			response += "\n"
			response += "\n<blockquote><b>❓ Missing a translation you'd like me to learn?</b>"
			response += `\nFeel free to suggest it as an issue <a href = "${ ctx.config.codeRepoURL }/issues/new">on GitHub</a>!</blockquote>`
			await ctx.reply(response, { reply_parameters: { message_id: ctx.msgId }, parse_mode: "HTML", link_preview_options: { is_disabled: true } })
			STATS.countCommand(MainCommands.HELP)
		})

		/**
		 * Convert link
		 */
		this.Composer.command([MainCommands.LINK_CONVERT, MainCommands.LINK_EMBED], async function (ctx)
		{
			console.debug(`Incoming /${ MainCommands.LINK_CONVERT } by ${ getExpeditorDebugString(ctx) } : ${ getQueryDebugString(ctx) }`)
			await processConversionRequest(ctx, ConversionMethods.COMMAND)
		})
	}

	/**
	 * Adds proactive features to the bot that runs without any command triggers.
	 */
	private addProactiveFeatures (): void
	{
		if (!BOT.Itself.botInfo.can_join_groups) console.warn("Bot cannot join groups! Bot will be available only in private chats until allowed.")
		else if (!BOT.Itself.botInfo.can_read_all_group_messages) console.warn("Bot cannot read group messages! Bot will not be able to convert links in groups until allowed.")

		/**
		 * Detects and sends link replacements
		 */
		this.Composer.hears([...CONFIG.getAllLinksOriginsAsRegExps(), ...CONFIG.getAllLinksOriginRegExps()], async function (ctx: HearsContext<CustomContext>): Promise<void>
		{
			console.debug(`Recognized link by ${ getExpeditorDebugString(ctx) } : ${ getQueryDebugString(ctx) }`)
			await processConversionRequest(ctx, ConversionMethods.CONVO)
		})
	}

	private addInlineFeatures (): void
	{
		if (!BOT.Itself.botInfo.supports_inline_queries) console.warn("Bot does not support inline queries! Inline features will not be available until enabled.")

		/**
		 * Detects and suggests link replacements
		 */
		this.Composer.inlineQuery([...CONFIG.getAllLinksOriginsAsRegExps(), ...CONFIG.getAllLinksOriginRegExps()], async function (ctx: InlineQueryContext<CustomContext>): Promise<void>
		{
			console.debug(`Incoming inline conversion query by ${ getExpeditorDebugString(ctx) } : ${ getQueryDebugString(ctx) }`)
			const link: string = ctx.match.toString()

			try
			{
				// Try casting it as a URL as a filter for bad requests.
				new URL(ctx.match.toString())
			} catch (error)
			{
				console.error(error)
				console.error(`Received link is invalid (${ ctx.match }), silently aborting processing it.`)
				ctx.answerInlineQuery([])
			}

			const url: URL = new URL(ctx.match.toString())
			const Converter: LinkConverter | undefined = findMatchingConverter(url, CONFIG.AllConverters)
			if (Converter)
			{
				const queryResults: InlineQueryResultArticle[] = []
				const convertedLinks: URL[] = await Converter.parseLink(new URL(link))
				for (const convertedLink of convertedLinks)
				{
					queryResults.push(InlineQueryResultBuilder.article(convertedLink.hostname, `Convert ${ Converter.name } link with ${ convertedLink.hostname } 🔀`).text(convertedLink.toString(), { link_preview_options: { show_above_text: true } }))
					// queryResults.push(InlineQueryResultBuilder.article(convertedLink.hostname, `Convert ${ Converter.name } link silently with ${ convertedLink.hostname } 🔀🔕`).text(convertedLink.toString(), { link_preview_options: { show_above_text: true }, disable_notification: true }))
				}

				await ctx.answerInlineQuery(queryResults)
				STATS.countConversion(Converter, ConversionMethods.INLINE)
			} else ctx.answerInlineQuery([])
		})

		// Handle when no link is given
		this.Composer.on("inline_query", (ctx) => ctx.answerInlineQuery([]))
	}
}
