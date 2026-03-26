import { parse, stringify } from "@std/yaml"
import { UserFromGetMe } from "@grammy/types/manage"
import { AboutConfiguration, Configuration, FeaturesConfiguration, LinkConfiguration, LinkConverter, OdesliConfiguration } from "../types/types.ts"
import { SimpleLinkConverter } from "../converters/simple.ts"
import { OdesliMusicConverter } from "../converters/odesli.ts"
import { getLogger, Logger } from "@logtape/logtape"
import { LogCategories } from "./logging.ts"

const PATH_CONFIG_FILE: string = Deno.env.get("PREVIEWSYNTH_CONFIG_FILE_PATH") || Deno.env.get("previewsynth_config_file_path") || "config.yaml"
const LOGGER: Logger = getLogger(LogCategories.BOT)

/**
 * Manager that handles everything related to the configuration including loading and saving it.
 */
export class ConfigurationManager
{
	private static _Instance: ConfigurationManager
	private _SimpleConverters: SimpleLinkConverter[] = [];
	// private _APIConverters: APILinkConverter[] = [];
	private _OdesliConverter!: OdesliMusicConverter
	private _Features!: FeaturesConfiguration
	private _About!: AboutConfiguration
	private _BotInfo!: UserFromGetMe

	/**
	 * Get the instance of the config manager.
	 */
	static get Instance (): ConfigurationManager { return this._Instance || (this._Instance = new this()) }

	/**
	 * Sets the bot's informations from Telegram.
	 */
	set BotInfo (botInfo: UserFromGetMe) { this._BotInfo = botInfo }

	/**
	 * Returns the bot's informations that was previously obtained from Telegram.
	 */
	get BotInfo (): UserFromGetMe { return this._BotInfo }

	/**
	 * Returns the chat ID where the bot sends status updates.
	 */
	get StatusUpdatesChatID (): number { return this._About.status_updates ? this._About.status_updates.chat : this._About.owner }

	/**
	 * Returns the topic ID where the bot sends status updates.
	 */
	get StatusUpdatesTopicID (): number | undefined { return this._About.status_updates?.topic }

	/**
	 * Returns the message options to send status updates in the right topic.
	 */
	get StatusUpdatesMessagesOptions (): { message_thread_id?: number } { return this.StatusUpdatesTopicID ? { message_thread_id: this.StatusUpdatesTopicID } : {} }

	/**
	 * Returns the simple link converters currently handled.
	 */
	get SimpleConverters (): SimpleLinkConverter[] { return this._SimpleConverters }

	// /**
	//  * Returns the API-based converters currently handled.
	//  */
	// get APIConverters (): APILinkConverter[] { return this._APIConverters }

	/**
	 * Returns the Odesli converter currently handled.
	 */
	get OdesliConverter (): OdesliMusicConverter { return this._OdesliConverter }

	/**
	 * Returns all of the converters currently handled.
	 */
	get AllConverters (): LinkConverter[] { return [...this._SimpleConverters, this._OdesliConverter] }

	/**
	 * Returns the current configuration for features.
	 */
	get Features (): FeaturesConfiguration { return this._Features }

	/**
	 * Returns the current configuration about the bot's service.
	 */
	get About (): AboutConfiguration { return this._About }

	/**
	 * Processes link conversion configs into link converters.
	 * @param links Simple link conversion configurations to process
	 * @returns Link converters
	 */
	private parseSimpleConvertersInConfig (links: LinkConfiguration[]): SimpleLinkConverter[]
	{
		const logger: Logger = LOGGER.with({ action: "loading links configuration" })

		logger.debug("Loading links configuration…")

		const converters: SimpleLinkConverter[] = links.map(function (link: LinkConfiguration): SimpleLinkConverter
		{
			// Handle missing links that has zero origins set
			if (!("origins" in link) && !("origins_regex" in link)) throw new Error("No origin set in link config")

			const converter = new SimpleLinkConverter(
				link.name.trim(),
				"origins" in link ? link.origins.map((origin: string) => new URL(origin.trim())) : [],
				"origins_regex" in link ? link.origins_regex.map((originRegExpString: string) => new RegExp(originRegExpString.trim(), "i")) : [],
				"destinations" in link ? link.destinations.map((destination: string) => new URL(destination.trim())) : [],
				link.settings,
			)
			converter.setEnabled(link.enabled || true)

			return converter
		})

		logger.info(`${ converters.length } link converters`)
		return converters
	}

	/**
	 * 
	 * @param odesliConfig 
	 * @returns 
	 */
	private parseOdesliConverterInConfig (odesliConfig: OdesliConfiguration): OdesliMusicConverter
	{
		const converter = new OdesliMusicConverter(odesliConfig)
		converter.setEnabled(odesliConfig.enabled || true)

		return converter
	}

	// /**
	//  * Processes api conversion configs into link converters.
	//  * @param apiConfigs API link conversion configurations to process
	//  * @returns API converters
	//  */
	// private parseAPIConvertersInConfig (apiConfigs: APIsConfiguration): APILinkConverter[]
	// {
	// 	const logger: Logger = LOGGER.with({ action: "loading apis configuration" })

	// 	const converters: APILinkConverter[] = []
	// 	logger.debug("Loading APIs configuration…")

	// 	if ("odesli" in apiConfigs)
	// 	{
	// 		logger.debug("Odesli")
	// 		const odesliConfig: APIConfiguration = apiConfigs["odesli"]

	// 		const converter = new OdesliMusicConverter(
	// 			"Music",
	// 			OdesliOrigins.map((origin): URL => new URL(origin.trim())),
	// 			[],
	// 			[new URL("https://song.link")],
	// 		)
	// 		converter.setEnabled(odesliConfig.enabled || true)

	// 		converters.push(converter)
	// 	}


	// 	logger.info(`${ converters.length } api converters`)
	// 	return converters
	// }

	/**
	 * Get all origin hostnames as regular expressions
	 * @returns An array containing all the supported hostnames for detection through regular expressions
	 */
	getAllLinksOriginsAsRegExps (): RegExp[]
	{
		LOGGER.debug("Generating regular expressions for supported origins…")
		const originsAsRegExps: RegExp[] = this.AllConverters.flatMap(
			(converter: LinkConverter): RegExp[] => converter.origins.map(
				(origin): RegExp =>
				{
					const escapedHost: string = origin.hostname.replaceAll(".", "\\.")
					const hostPattern: string = `(?:${ escapedHost }|(?:[a-z0-9-]+\\.)+${ escapedHost })`
					return new RegExp(`^${ origin.protocol }\/\/${ hostPattern }${ origin.pathname.replaceAll("/", "\\/") }`, "i")
				}
			)
		)
		return originsAsRegExps
	}

	/**
	 * Get all origin regular expressions
	 * @returns An array containing all the supported regular expressions for detection
	 */
	getAllLinksOriginRegExps (): RegExp[]
	{
		LOGGER.debug("Gathering all supported origin regular expressions…")
		const originRegExps: RegExp[] = this.AllConverters.flatMap((converter: LinkConverter): RegExp[] => converter.originRegExps)
		return originRegExps
	}

	/**
	 * Translates current link converters into link configurations.
	 * @returns Link configurations
	 */
	private saveSimpleConvertersInConfig (): LinkConfiguration[]
	{
		const linkConfigs: LinkConfiguration[] = []
		for (const converter of this._SimpleConverters)
		{
			const config_link: LinkConfiguration = {
				name: converter.name.trim(),
				origins: converter.origins.map((origin: URL): string => origin.toString()),
				origins_regex: converter.originRegExps.map((originRegExp: RegExp): string => originRegExp.source),
				destinations: converter.destinations.map((destination: URL): string => destination.toString()),
				enabled: converter.enabled,
			}
			linkConfigs.push(config_link)
		}

		// console.debug("Loaded links configuration!")
		LOGGER.debug("Loaded links configuration!")
		return linkConfigs
	}

	// /**
	//  * Translates current API converters into API configurations.
	//  * @returns API configurations
	//  */
	// private saveAPIConvertersInConfig (): APIsConfiguration
	// {
	// 	LOGGER.debug("Parsing api-based link converters into configuration…")
	// 	const apiConfigs: APIsConfiguration = {}

	// 	for (const api of this._APIConverters)
	// 	{
	// 		const config: APIConfiguration = {}
	// 		if (!api.enabled) config.enabled = api.enabled

	// 		apiConfigs[api.name.toLowerCase()] = config
	// 	}

	// 	LOGGER.debug("Loaded APIs configuration!")
	// 	return apiConfigs
	// }

	private saveOdesliConverterInConfig (): OdesliConfiguration
	{
		const config: OdesliConfiguration = {
			enabled: this._OdesliConverter.enabled,
		}
		if (this._OdesliConverter.country) config.country = this._OdesliConverter.country

		LOGGER.debug("Loaded Odesli API configuration!")
		return config
	}

	/**
	 * Generates a JSON string with the current configuration.
	 * @returns Generated JSON string of the configuration
	 */
	getConfigurationJson (): string
	{
		return stringify({
			links: this.saveSimpleConvertersInConfig(),
			// apis: this.saveAPIConvertersInConfig(),
			odesli: this.saveOdesliConverterInConfig(),
			features: this.Features,
			about: this.About
		})
	}

	/**
	 * Prints the list of all the converters in the console.
	 */
	printConvertersListInConsole (): void
	{
		LOGGER.debug("Links I recognize at the moment :")
		for (const converter of this.AllConverters) LOGGER.debug(` -  ${ converter.name } : ${ converter.origins.map((origin: URL): string => origin.hostname) } → ${ converter.destinations.map((destination: URL): string => destination.hostname) }${ converter.enabled ? "" : " (disabled)" }`)
	}

	/**
	 * Prints the list of all the features in the console.
	 */
	printFeaturesListInConsole (): void
	{
		LOGGER.debug(`Features I enabled at the moment :\n -  Link recognition: ${ this.Features.link_recognition }\n -  Inline queries: ${ this.Features.inline_queries }\n -  Stats: ${ this.Features.stats }`)
	}

	/**
	 * Generates a string with the list of all the converters formatted to use in a message.
	 * @returns String to use in a message
	 */
	getConvertersListForMessage (): string
	{
		let message: string = "\n<blockquote><b>🔗 Links I recognize at the moment</b>"
		for (const converter of this.AllConverters) if (converter.enabled) message += `\n${ converter.name } : ${ converter.origins.map((origin: URL): string => origin.hostname) } → ${ converter.destinations.map((destination: URL): string => destination.hostname) }`
		message += "</blockquote>"
		return message
	}

	/**
	 * Generates a string with the list of all the features formatted to use in a message.
	 * @returns String to use in a message
	 */
	getFeaturesListForMessage (): string
	{
		let message: string = "\n<blockquote><b>🛠️ Features I enabled at the moment</b>"
		message += `\nLink recognition: ${ this.Features.link_recognition }`
		message += `\nInline queries: ${ this.Features.inline_queries }`
		message += `\nStats: ${ this.Features.stats }`
		message += "</blockquote>"
		return message
	}

	/**
	 * Load configuration from file and processes it.
	 */
	async loadConfig (): Promise<void>
	{
		const logger: Logger = LOGGER.with({ action: "loading configuration", file: PATH_CONFIG_FILE })

		logger.debug(`Loading configuration from file { file } on disk…`)
		try
		{
			const config: Configuration = parse(await Deno.readTextFile(PATH_CONFIG_FILE)) as Configuration

			this._SimpleConverters = this.parseSimpleConvertersInConfig(config.links)
			logger.info("Loaded simple link convertions configuration!")

			this._OdesliConverter = this.parseOdesliConverterInConfig(config.odesli)
			logger.info("Loaded Odesli API convertions configuration!")

			this._Features = config.features
			logger.info("Loaded features configuration!")

			this._About = config.about
			logger.info("Loaded about configuration!")

			this.printConvertersListInConsole()
		} catch (error)
		{
			logger.error("Error while {action}")
			logger.error(String(error))
			logger.error("Could not load configuration file.\nDoes it exist? Maybe a permissions issue? Maybe it wasn't mounted properly?")
			throw new Error("Can't read config")
		}
	}

	/**
	 * Translate and save configuration to file.
	 */
	async saveConfig (): Promise<void>
	{
		const logger: Logger = LOGGER.with({ action: "saving configuration" })

		const config: Configuration = {
			links: this.saveSimpleConvertersInConfig(),
			// apis: this.saveAPIConvertersInConfig(),
			odesli: this.saveOdesliConverterInConfig(),
			features: this.Features,
			about: this.About
		}
		logger.debug("Generated configuration!")
		logger.debug(config)

		logger.debug("Writing configuration to disk…")
		try
		{
			await Deno.writeTextFile(PATH_CONFIG_FILE, this.getConfigurationJson())
			logger.info("Configuration saved!")
		} catch (error)
		{
			logger.error("Error while {action}")
			logger.error(String(error))
			logger.error("Could not save configuration data.\nCould there be a permissions issue?")
			throw new Error("Can't write config")
		}
	}
}
