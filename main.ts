import "@std/dotenv/load";
import { parse } from "@std/yaml";
import { Bot, CommandContext, Context, HearsContext, InlineQueryContext, InlineQueryResultBuilder } from "https://deno.land/x/grammy@v1.32.0/mod.ts";
import { Configuration, BotConfig, WebLinkMap } from "./types.ts";
import { findMatchingMap } from "./utils.ts";
import { Message } from "https://deno.land/x/grammy_types@v3.16.0/message.ts";

const PATH_CONFIG_FILE = Deno.env.get("PREVIEWSYNTH_CONFIG_FILE_PATH") || "config.yaml";

enum COMMANDS {
	START = "start",
	PING = "ping",
	HELP = "help",
	LINK_CONVERT = "convert",
	LINK_EMBED = "embed",
}

console.debug(`Reading configuration file at ${PATH_CONFIG_FILE} ...`);
const CONFIG: Configuration = parse(await Deno.readTextFile(PATH_CONFIG_FILE));
console.debug(`Reading links configuration...`);
console.debug(CONFIG);
const WEB_LINKS: WebLinkMap[] = CONFIG.links.map((link: { name: string; origins: string[]; destination: string; enabled?: boolean }) => {
	console.debug(`Creating ${WebLinkMap.name} config for ${link.name} ...`);
	return new WebLinkMap(
		link.name,
		link.origins.map((origin: string) => new URL(origin)),
		new URL(link.destination),
		link.enabled,
	);
});
console.info(`Loaded links configuration.`);
console.table(
	WEB_LINKS.map((webLink: WebLinkMap): { name: string; origins: string[]; destination: string; enabled: boolean } => {
		return {
			name: webLink.name,
			origins: webLink.origins.map((origin: URL): string => {
				return origin.origin;
			}),
			destination: webLink.destination.origin,
			enabled: webLink.enabled,
		};
	}),
);
const ABOUT = CONFIG.about;
console.info("Loaded about configuration.");
console.table(ABOUT);

type CustomContext = Context & { config: BotConfig };

/**
 * Get all the origins' hostnames.
 * @returns A strings array containing all the supported hostnames for detection
 */
function getOriginRegExes(): RegExp[] {
	return WEB_LINKS.filter((map: WebLinkMap): boolean => map.enabled) // Filter out maps that are not enabled
		.flatMap((map: WebLinkMap): RegExp[] => map.origins.map((origin): RegExp => new RegExp(`${origin.protocol}\/\/.*${origin.hostname.replaceAll(".", ".")}.*`, "gi"))); // Map and flatten the hostnames
}
function getExpeditorDebugString(ctx: CommandContext<CustomContext> | HearsContext<CustomContext> | InlineQueryContext<CustomContext>): string {
	return `${ctx.from?.first_name}${ctx.config.isDeveloper ? " [Developer]" : ""} (@${ctx.from?.username + " / "}${ctx.from?.id})`;
}
function getQueryDebugString(ctx: CommandContext<CustomContext> | HearsContext<CustomContext> | InlineQueryContext<CustomContext>): string | RegExpMatchArray {
	return ctx.match.length < 1 ? "(nothing)" : ctx.match;
}

/**
 * Process an incoming link conversion request.
 * @param ctx Command or Hears context.
 * @returns Completion promise.
 */
async function processConversionRequest(ctx: CommandContext<CustomContext> | HearsContext<CustomContext>): Promise<void> {
	// Handle mistakes where no link is given
	if (ctx.match.length < 1 && ctx.chat.type === "private") {
		await ctx.reply("Oop! No link was given with the command. 😅\nMaybe try again with a link following the command next time?\n<blockquote>Need help to use the command? Check « /help ».</blockquote>", {
			parse_mode: "HTML",
			reply_parameters: { message_id: ctx.msgId },
		});
		return;
	}

	// Check if link matches in map
	await ctx.react("🤔");
	const matchingMap: WebLinkMap | null = findMatchingMap(ctx.match, WEB_LINKS);
	if (matchingMap) {
		console.debug("Found the following match : " + matchingMap?.name);
		const linkConverted: URL = await matchingMap.parseLink(new URL(ctx.match));
		if (linkConverted.toString() === WebLinkMap.cleanLink(new URL(ctx.match)).toString() && ctx.chat.type === "private") ctx.reply(`Hmm... That link already looks fine to me. 🤔`, { reply_parameters: { message_id: ctx.msgId } });
		else {
			await ctx.react("👀");
			if (ctx.chat.type === "private") await ctx.reply(`Oh I know that! 👀\nIt's a link from ${matchingMap?.name}!\nLemme convert that for you real quick… ✨`, { reply_parameters: { message_id: ctx.msgId } });
			const linkConvertedMessage: Message = await ctx.reply(linkConverted.toString(), { reply_parameters: { message_id: ctx.msgId } });
			if (ctx.chat.type === "private")
				await ctx.reply("<i>There you go!</i> 😊\nHopefully @WebpageBot will create an embedded preview soon if it's not already there! ✨", {
					parse_mode: "HTML",
					reply_parameters: { message_id: linkConvertedMessage.message_id },
				});
		}
		return;
	} else if (ctx.chat.type === "private") {
		// Handle when link isn't known in map
		await ctx.react("🗿");
		await ctx.reply(
			`Sorry, I don't have an equivalent for that website. 😥\n<blockquote>If you happen to know one, feel free to submit a request through <a href="${ABOUT.code_repo}/issues">an Issue on my code's repository</a>. 💛</blockquote>`,
			{
				parse_mode: "HTML",
				reply_parameters: { message_id: ctx.msgId },
			},
		);
	}
}

// https://grammy.dev/guide/context#transformative-context-flavors
const BOT = new Bot<CustomContext>(Deno.env.get("TG_PREVIEW_BOT_TOKEN") || "");
// await BOT.api.sendMessage(CONFIG.about.owner, "Bot is booting up… ⏳");
BOT.use((ctx, next) => {
	ctx.config = {
		botDeveloper: CONFIG.about.owner,
		isDeveloper: ctx.from?.id === CONFIG.about.owner,
	};
	next();
});
BOT.api.setMyCommands([
	{ command: COMMANDS.START, description: "Start the bot." },
	{ command: COMMANDS.HELP, description: "Get a list of supported links." },
	{ command: COMMANDS.LINK_CONVERT, description: "Convert a link." },
]);

/**
 * Start command
 */
BOT.chatType("private").command(COMMANDS.START, function (ctx) {
	console.debug(`Incoming /${COMMANDS.START} by ${getExpeditorDebugString(ctx)}`);
	ctx.react("👀");
	let response: string = `Hi! I'm the ${BOT.botInfo.first_name}! 👋`;
	response += "\nA simple bot that serves the purpose of automatically embedding links!";
	response += "\n";
	if (CONFIG.features.link_recognition) response += "\nSend me a link I recognize and I'll respond with an embed-friendly + tracking-free version. ✨";
	if (BOT.botInfo.can_join_groups) response += "\nAlso, if you add me to a group, I'll do the same with links I can convert. 👀";
	response += `\n<blockquote>If you need more help, use the /${COMMANDS.HELP} command.</blockquote>`;
	response += "\n";
	response += `\nAnyway, I wish you a nice day! 🎶`;
	ctx.reply(response, { reply_parameters: { message_id: ctx.msgId }, parse_mode: "HTML" });
});

/**
 * Healthcheck ping command
 */
BOT.chatType(["private", "group", "supergroup"]).command(COMMANDS.PING, function (ctx) {
	console.debug(`Incoming /${COMMANDS.PING} by ${getExpeditorDebugString(ctx)}`);
	ctx.react("⚡");
	ctx.reply("Pong! 🏓", { reply_parameters: { message_id: ctx.msgId } });
});

/**
 * Get help instructions
 */
BOT.chatType("private").command(COMMANDS.HELP, function (ctx) {
	console.debug(`Incoming /${COMMANDS.HELP} by ${getExpeditorDebugString(ctx)}`);
	let response: string = "Oh, you'll see. I'm a simple Synth!";
	response += `\nEither send me a link I recognize or use the /${COMMANDS.LINK_CONVERT} command to convert it into an embed-friendly one. ✨`;
	response += `\nYou may also use me directly while typing a new message in another chat. Simply start by mentioning me (${BOT.botInfo.username}) followed by a space! 😉`;
	response += "\n";
	response += "\n<blockquote>The links I recognize at the moment are :";
	let firstLink: boolean = true;
	for (const webLink of WEB_LINKS) {
		if (webLink.enabled) {
			response += `${firstLink ? "" : "\n"}<b>${webLink.name}</b> : ${webLink.origins.map((origin: URL): string => origin.hostname)} → ${webLink.destination.hostname}`;
			firstLink = false;
		}
	}
	response += "</blockquote>";
	response += "\n";
	response += `\nOf course, if there's a translation you'd like me to learn, feel free to suggest it as an issue <a href="${ABOUT.code_repo}/issues/new">on GitHub</a>! 🌐`;
	ctx.reply(response, { reply_parameters: { message_id: ctx.msgId }, parse_mode: "HTML" });
});

/**
 * Convert link
 */
BOT.chatType("private").command([COMMANDS.LINK_CONVERT, COMMANDS.LINK_EMBED], async function (ctx) {
	console.debug(`Incoming /${COMMANDS.LINK_CONVERT} by ${getExpeditorDebugString(ctx)} : ${getQueryDebugString(ctx)}`);
	await processConversionRequest(ctx);
});
BOT.hears(getOriginRegExes(), async function (ctx) {
	console.debug(`Recognized link by ${getExpeditorDebugString(ctx)} : ${getQueryDebugString(ctx)}`);
	await processConversionRequest(ctx);
});
BOT.inlineQuery(getOriginRegExes(), async function (ctx) {
	console.debug(`Incoming inline conversion query by ${getExpeditorDebugString(ctx)} : ${getQueryDebugString(ctx)}`);
	const link: string = ctx.match.toString();
	const map: WebLinkMap | null = findMatchingMap(ctx.match.toString(), WEB_LINKS);
	if (map != null) {
		const response = (await map.parseLink(new URL(link))).toString();
		ctx.answerInlineQuery([InlineQueryResultBuilder.article(map.name, `Convert ${map.name} link ✨`).text(response)]);
	}
});

/**
 * Lifecycle handling
 */
Deno.addSignalListener("SIGINT", (): void => {
	console.info("Bot shutting down.");
	BOT.api.sendMessage(CONFIG.about.owner, "Bot shutting down! 💤");
	BOT.stop();
});
if (Deno.build.os == "windows") {
	Deno.addSignalListener("SIGBREAK", (): void => {
		console.info("Bot shutting down.");
		BOT.api.sendMessage(CONFIG.about.owner, "Bot shutting down! 💤");
		BOT.stop();
	});
}
if (Deno.build.os != "windows") {
	Deno.addSignalListener("SIGTERM", (): void => {
		console.info("Bot shutting down.");
		BOT.api.sendMessage(CONFIG.about.owner, "Bot shutting down! 💤");
		BOT.stop();
	});
}
console.info("Bot online!");
BOT.api.sendMessage(CONFIG.about.owner, "Bot online! 🎉");
BOT.start();
