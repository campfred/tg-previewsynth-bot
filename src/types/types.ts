import { Composer, Context } from "x/grammy"
import { SimpleLinkConverterSettings } from "../converters/simple.ts"

export enum EnvironmentVariables
{
	NODE_ENV = "NODE_ENV",
	BOT_TOKEN = "PREVIEWSYNTH_TG_BOT_TOKEN",
	BOT_TOKEN_OLD = "TG_PREVIEW_BOT_TOKEN",
	BOT_CONFIG_PATH = "PREVIEWSYNTH_CONFIG_FILE_PATH",
	BOT_LOG_LEVEL = "PREVIEWSYNTH_LOG_LEVEL"
}

export enum LogLevels
{
	TRACE = "trace",
	DEBUG = "debug",
	INFO = "info",
	WARNING = "warning",
	ERROR = "error",
	FATAL = "fatal"
}

export type LinkConfiguration = {
	name: string
	origins: string[]
	origins_regex: string[],
	destinations: string[],
	enabled?: boolean,
	settings?: SimpleLinkConverterSettings
}
export type APIConfiguration = {
	base_url?: string
	// base_url: string
	api_key?: string
	// response_path: string
	enabled?: boolean
}
export type APIsConfiguration = { [api: string]: APIConfiguration }
export type FeaturesConfiguration = { link_recognition: boolean, inline_queries: boolean, stats: boolean }
export type AboutConfiguration = { code_repo: string; owner: number; status_updates?: { chat: number; topic?: number } }

export type Configuration = {
	links: LinkConfiguration[]
	apis: APIsConfiguration
	features: FeaturesConfiguration
	about: AboutConfiguration
}

export enum APIs
{
	ODESLI = "odesli",
}

export interface BotConfig
{
	botDeveloper: number
	isDeveloper: boolean
	codeRepoURL: URL
}

export type CustomContext = Context & { config: BotConfig }

export enum ConversionTypes
{
	SIMPLE = "Simple",
	API = "API"
}

export enum ConversionMethods
{
	COMMAND = "Command",
	CONVO = "Conversational",
	INLINE = "Inline"
}

/**
 * Interface of a basic link converter.
 */
export interface LinkConverter
{
	readonly name: string
	readonly type: ConversionTypes
	readonly origins: URL[]
	readonly originRegExps: RegExp[]
	readonly destinations: URL[]
	readonly defaultDestination: URL
	readonly expand: boolean
	readonly preserveQueryParamKeys: string[]
	enabled: boolean

	disable (): void
	enable (): void
	isSourceSupported (link: URL): boolean
	isDestinationSupported (link: URL): boolean
	parseLink (link: URL): Promise<URL[]>
	parseLinkDefault (link: URL): Promise<URL>
	parseLinkViaDestination (link: URL, destination: URL): Promise<URL>
}

export interface BotActions
{
	readonly Name: string
	readonly Composer: Composer<CustomContext>
}
