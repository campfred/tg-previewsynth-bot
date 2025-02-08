import { CommandContext, Composer, HearsContext, InlineQueryResultBuilder } from "grammy"
import { ConfigurationManager } from "../managers/config.ts"
import { ConversionMethods, CustomContext, LinkConverter } from "../types/types.ts"
import { BotCommand } from "https://deno.land/x/grammy_types@v3.16.0/manage.ts"
import { findMatchingConverter, getExpeditorDebugString, getQueryDebugString } from "../utils.ts"
import { StatsManager } from "../managers/stats.ts"
import { ADMIN_COMMANDS } from "./admin.ts"

const CONFIG: ConfigurationManager = ConfigurationManager.Instance
const STATS: StatsManager = StatsManager.Instance

export enum MAIN_COMMANDS
{
	START = "start",
	PING = "ping",
	HELP = "help",
	LINK_CONVERT = "convert",
	LINK_EMBED = "embed",
}

export const MAIN_COMMANDS_LIST: BotCommand[] = [
	{ command: MAIN_COMMANDS.START, description: "Start the bot." },
	{ command: MAIN_COMMANDS.HELP, description: "Get a list of supported links." },
	{ command: MAIN_COMMANDS.LINK_CONVERT, description: "Convert a link." },
]

/**
 * Get all the origins' hostnames.
 * @returns A strings array containing all the supported hostnames for detection
 */
function getOriginRegExes (): RegExp[]
{
	// return config_manager.Simple_Converters.filter((map: SimpleLinkConverter): boolean => map.enabled) // Filter out maps that are not enabled
	const regExes: RegExp[] = CONFIG.AllConverters.filter((map: LinkConverter): boolean => map.enabled) // Filter out maps that are not enabled
		.flatMap((map: LinkConverter): RegExp[] => map.origins.map((origin): RegExp => new RegExp(`${ origin.protocol }\/\/.*${ origin.hostname.replaceAll(".", "\\.") }.*`, "gi"))) // Converter and flatten the hostnames
	console.debug("Regular expressions generated :", regExes)
	return regExes
}

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
	const converter: LinkConverter | null = findMatchingConverter(url, CONFIG.AllConverters)
	if (converter)
	{
		await ctx.react("🤔")
		console.debug("Found the following match : " + converter?.name)
		const linkConverted: URL | null = await converter.parseLink(new URL(ctx.match.toString()))
		if (linkConverted)
		{
			await ctx.react("👀")
			await ctx.reply(linkConverted.toString(), { reply_parameters: { message_id: ctx.msgId }, link_preview_options: { show_above_text: true } })
			STATS.countConversion(converter, method)
		}
		else
			ctx.reply(
				`Oof… 'Looks like I can't convert that link right now. I apologize for that. 😓\n<blockquote>Either try again or report that as <a href="${ CONFIG.About.code_repo }/issues">an isssue on GitHub</a> and my creator will take a look at it. 💡</blockquote>`,
				{
					parse_mode: "HTML",
					reply_parameters: { message_id: ctx.msgId },
					link_preview_options: { is_disabled: true },
				},
			)
		return
	} else if (ctx.chat.type === "private")
	{
		// Handle when link isn't known in map
		await ctx.react("🗿")
		await ctx.reply(
			`Sorry, I don't have an equivalent for that website. 😥\n<blockquote>If you happen to know one, feel free to submit a request through <a href="${ CONFIG.About.code_repo }/issues">an Issue on my code's repository</a>. 💛</blockquote>`,
			{
				parse_mode: "HTML",
				reply_parameters: { message_id: ctx.msgId },
				link_preview_options: { is_disabled: true },
			},
		)
	}
}

export const MainActions = new Composer<CustomContext>()

/**
 * Start command
 */
MainActions.chatType("private").command(MAIN_COMMANDS.START, function (ctx)
{
	console.debug(`Incoming /${ MAIN_COMMANDS.START } by ${ getExpeditorDebugString(ctx) }`)
	ctx.react("👀")
	let response: string = `Hi! I'm the ${ CONFIG.BotInfo.first_name }! 👋`
	response += "\nA simple bot that serves the purpose of automatically embedding links!"
	response += "\n"
	if (CONFIG.Features.link_recognition) response += "\nSend me a link I recognize and I'll respond with an embed-friendly + tracking-free version. ✨"
	if (CONFIG.BotInfo.can_join_groups) response += "\nAlso, if you add me to a group, I'll do the same with links I can convert. 👀"
	response += `\n<blockquote>If you need more help, use the /${ MAIN_COMMANDS.HELP } command.</blockquote>`
	response += "\n"
	response += `\nAnyway, I wish you a nice day! 🎶`
	ctx.reply(response, { reply_parameters: { message_id: ctx.msgId }, parse_mode: "HTML", link_preview_options: { is_disabled: true } })
	STATS.countCommand(MAIN_COMMANDS.START)
})

/**
 * Healthcheck ping command
 */
MainActions.chatType(["private", "group", "supergroup"]).command(MAIN_COMMANDS.PING, function (ctx)
{
	console.debug(`Incoming /${ MAIN_COMMANDS.PING } by ${ getExpeditorDebugString(ctx) }`)
	ctx.react("⚡")
	ctx.reply("Pong! 🏓", { reply_parameters: { message_id: ctx.msgId } })
	STATS.countCommand(MAIN_COMMANDS.PING)
})

/**
 * Get help instructions
 */
MainActions.chatType("private").command(MAIN_COMMANDS.HELP, async function (ctx)
{
	console.debug(`Incoming /${ MAIN_COMMANDS.HELP } by ${ getExpeditorDebugString(ctx) }`)
	let response: string = "Oh, you'll see. I'm a simple Synth!"
	response += "\n"
	response += `\nEither send me a link I recognize or use the /${ MAIN_COMMANDS.LINK_CONVERT } command to convert it into an embed-friendly one. ✨`
	response += `\nIf you're in another chat where I am not present, simply start by mentioning me (@${ CONFIG.BotInfo.username }) followed by a space and you'll be using my service in-line style! 😉`
	response += "\n"
	response += "\n<blockquote><b>Links I recognize at the moment</b>"
	for (const converter of CONFIG.AllConverters) if (converter.enabled) response += `\n${ converter.name } : ${ converter.origins.map((origin: URL): string => origin.hostname) } → ${ converter.destination.hostname }`
	response += "</blockquote>"
	response += "\n"
	response += "\nBy the way, if a preview doesn't generate, check with @WebpageBot. It's the one handling link preview generation within the app. 💡"
	response += "\n"
	if (ctx.config.isDeveloper)
	{
		response += "\nAlso, since you are an admin, you have extra commands you can use. 😉"
		response += "\n<blockquote><b>Admin commands</b>"
		for (const [, text] of Object.entries(ADMIN_COMMANDS)) response += `\n/${ text }`
		response += "</blockquote>"
		response += "\n"
	}
	response += `\nOf course, if there's a translation you'd like me to learn, feel free to suggest it as an issue <a href="${ CONFIG.About.code_repo }/issues/new">on GitHub</a>! 🌐`
	await ctx.reply(response, { reply_parameters: { message_id: ctx.msgId }, parse_mode: "HTML", link_preview_options: { is_disabled: true } })
	STATS.countCommand(MAIN_COMMANDS.HELP)
})

/**
 * Convert link
 */
MainActions.command([MAIN_COMMANDS.LINK_CONVERT, MAIN_COMMANDS.LINK_EMBED], async function (ctx)
{
	console.debug(`Incoming /${ MAIN_COMMANDS.LINK_CONVERT } by ${ getExpeditorDebugString(ctx) } : ${ getQueryDebugString(ctx) }`)
	await processConversionRequest(ctx, ConversionMethods.COMMAND)
	STATS.countCommand(MAIN_COMMANDS.LINK_CONVERT)
})

/**
 * Detects and sends link replacements
 */
MainActions.hears(getOriginRegExes(), async function (ctx)
{
	console.debug(`Recognized link by ${ getExpeditorDebugString(ctx) } : ${ getQueryDebugString(ctx) }`)
	await processConversionRequest(ctx, ConversionMethods.CONVO)
})

MainActions.inlineQuery(getOriginRegExes(), async function (ctx)
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
		return
	}

	const url: URL = new URL(ctx.match.toString())
	const converter: LinkConverter | null = findMatchingConverter(url, CONFIG.AllConverters)
	if (converter)
	{
		const converted_link: URL | null = await converter.parseLink(new URL(link))
		if (converted_link)
		{
			const response: string = converted_link.toString()
			ctx.answerInlineQuery([InlineQueryResultBuilder.article(converter.name, `Convert ${ converter.name } link ✨`).text(response, { link_preview_options: { show_above_text: true } })])
			STATS.countConversion(converter, ConversionMethods.INLINE)
		}
	} else ctx.answerInlineQuery([])
})
