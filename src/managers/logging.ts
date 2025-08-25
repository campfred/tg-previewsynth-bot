import { ansiColorFormatter, Config, configure, getConsoleSink, LogRecord, reset } from "@logtape/logtape"
import { EnvironmentVariables, LogLevels } from "../types/types.ts"
import { BotManager } from "./bot.ts"
import { ConfigurationManager } from "./config.ts"

export const COMMAND_LOG_STRING: string = "Incoming { command } by { user } in { chat } with argument { arg }"

export enum LogCategories
{
	BOT = "bot",
	MAIN = "main",
	ADMIN = "admin",
	ACTIONS = "actions",
	LINKS = "links",
	APIS = "apis",
	CACHE = "cache"
}

const MINIMUM_LOG_LEVEL: string = Deno.env.get("NODE_ENV") === "development" ? LogLevels.DEBUG : (Deno.env.get(EnvironmentVariables.BOT_LOG_LEVEL)?.toUpperCase() ?? Deno.env.get(EnvironmentVariables.BOT_LOG_LEVEL.toLowerCase()) ?? "info")

// Initialize logging configuration
const logRecordLevelIsHighEnough = (record: LogRecord, minimumLevel: string): boolean =>
{
	return Object.keys(LogLevels).indexOf(record.level) >= Object.keys(LogLevels).indexOf(minimumLevel)
}

const InitialConfig: Config<string, string> = {
	reset: true,
	sinks: { console: getConsoleSink({ formatter: ansiColorFormatter }) },
	filters: {
		minimumLevel (record: LogRecord): boolean
		{
			return logRecordLevelIsHighEnough(record, Deno.env.get("NODE_ENV") === "development" ? "debug" : MINIMUM_LOG_LEVEL)
		},
		containsUserData (record: LogRecord): boolean
		{
			return record.message.some(part => typeof part === "string" && part.includes("from"))
		}
	},
	loggers: [
		{ category: ["logtape", "meta"], lowestLevel: "warning", sinks: ["console"] },
		{ category: LogCategories.BOT, lowestLevel: LogLevels.DEBUG, sinks: ["console"], filters: ["minimumLevel"] },
	]
}



export async function setupLogging (): Promise<void>
{
	await reset()
	await configure(InitialConfig)
}

export async function setupLoggingWithTelegramMessages (bot: BotManager, config: ConfigurationManager): Promise<void>
{
	await reset()
	await configure({
		...InitialConfig,
		sinks: {
			...InitialConfig.sinks,
			telegram (record: LogRecord)
			{
				if (bot.Itself.isInited()) bot.Itself.api.sendMessage(
					config.StatusUpdatesChatID,
					`Oh no! Something happened! 🫠\n\n<blockquote>\n${ record.message }\n</blockquote>\n\nPlease check the logs for more details. 📜`,
					{ parse_mode: "HTML", ...config.StatusUpdatesMessagesOptions }
				)
			}
		},
		loggers: [
			...InitialConfig.loggers,
			{ category: [LogCategories.BOT, LogCategories.CACHE], lowestLevel: LogLevels.DEBUG, sinks: ["console"], filters: ["minimumLevel"] },
			{ category: [LogCategories.BOT, LogCategories.ADMIN], lowestLevel: LogLevels.WARNING, sinks: ["telegram"] },
			{ category: [LogCategories.BOT, LogCategories.LINKS], lowestLevel: LogLevels.WARNING, sinks: ["telegram"] },
			{ category: [LogCategories.BOT, LogCategories.APIS], lowestLevel: LogLevels.WARNING, sinks: ["telegram"] },
			{ category: [LogCategories.BOT, LogCategories.ACTIONS], lowestLevel: LogLevels.WARNING, sinks: ["telegram"] },
		]
	})
}