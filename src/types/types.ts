import { Composer, Context } from "grammy"
import { SimpleLinkConverterSettings } from "../converters/simple.ts"

export type LinkConfiguration = {
	name: string
	origins: string[]
	origins_regex: string[],
	destination: string,
	enabled?: boolean,
	settings?: SimpleLinkConverterSettings
}
export type APIConfiguration = {
	base_url?: string
	api_key?: string
	enabled?: boolean
	// TODO Implement a more flexible wayt to add unsupported APIs like having a JSON path to retrieve the resulting URL
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
	readonly destination: URL
	readonly expand: boolean
	readonly preserveSearchParams: string[]
	enabled: boolean

	disable (): void
	enable (): void
	isSupported (link: URL): boolean
	parseLink (link: URL): Promise<URL>
}

export interface BotActions
{
	readonly Name: string
	readonly Composer: Composer<CustomContext>
}
