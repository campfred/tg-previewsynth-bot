import { Context } from "grammy"
import { SimpleLinkConverterSettings } from "../converters/simple.ts"

export type LinkConfiguration = { name: string; origins: string[]; destination: string, enabled?: boolean, settings?: SimpleLinkConverterSettings }
export type APIConfiguration = {
	name: string
	enabled: boolean
	api_key?: string
	base_url?: string
}
export type FeaturesConfiguration = { link_recognition: boolean, stats: boolean }
export type AboutConfiguration = { code_repo: string; owner: number; status_updates?: { chat: number; topic?: number } }

export type Configuration = {
	links: LinkConfiguration[]
	apis: APIConfiguration[]
	features: FeaturesConfiguration
	about: AboutConfiguration
}

export enum APIs
{
	ODESLI = "Odesli",
}

export interface BotConfig
{
	botDeveloper: number
	isDeveloper: boolean
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
	readonly destination: URL
	readonly expand: boolean
	readonly preserveSearchParams: string[]
	enabled: boolean

	disable (): void
	enable (): void
	isSupported (link: URL): boolean
	expandLink (link: URL): Promise<URL>
	cleanLink (link: URL): URL
	convertLink (link: URL): URL | Promise<URL | null> | null
	parseLink (link: URL): Promise<URL | null>
}
