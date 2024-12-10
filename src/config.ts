import { parse, stringify } from "@std/yaml";
import { AboutConfiguration, APIConfiguration, APIs, Configuration, FeaturesConfiguration, LinkConfiguration, LinkConverter } from "./types/types.ts";
import { SimpleLinkConverter } from "./converters/simple.ts";
import { APIbasedLinkConverter, OdesliMusicConverter } from "./converters/music.ts";
import { OdesliOrigins } from "./types/odesli.ts";

export class ConfigurationManager {
	private static _instance: ConfigurationManager;
	private _links: LinkConverter[] = [];
	private _apis: APIbasedLinkConverter[] = [];
	private _features!: FeaturesConfiguration;
	private _about!: AboutConfiguration;

	private constructor() {
		// this.loadConfiguration();
	}

	static get Instance(): ConfigurationManager {
		return this._instance || (this._instance = new this());
	}

	get Simple_Converters(): SimpleLinkConverter[] {
		return this._links;
	}

	get API_Converters(): APIbasedLinkConverter[] {
		return this._apis;
	}

	get All_Converters(): LinkConverter[] {
		return [...this._links, ...this._apis];
	}

	get Features(): FeaturesConfiguration {
		return this._features;
	}

	get About(): AboutConfiguration {
		return this._about;
	}

	private parse_simple_converters_from_config(links: LinkConfiguration[]): SimpleLinkConverter[] {
		console.debug("Reading links configuration…");
		console.debug(links);

		const converters: SimpleLinkConverter[] = links.map(function (link: LinkConfiguration) {
			console.debug(`Creating ${SimpleLinkConverter.name} config for ${link.name} …`);
			return new SimpleLinkConverter(
				link.name.trim(),
				link.origins.map((origin: string) => new URL(origin.trim())),
				new URL(link.destination.trim()),
				link.enabled,
			);
		});

		console.info(`Parsed links configuration!`);
		return converters;
	}

	private parse_api_based_converters_from_config(api_configs: APIConfiguration[]): APIbasedLinkConverter[] {
		console.debug("Reading APIs configuration…");

		const converters: APIbasedLinkConverter[] = [];
		for (const api_config of api_configs)
			for (const [_key, _value] of Object.entries(APIs)) {
				if (api_config.name.trim().toLowerCase() === _value.trim().toLowerCase())
					converters.push(
						new OdesliMusicConverter(
							"Music",
							OdesliOrigins.map((origin) => {
								console.debug(`Adding Odesli support for ${origin}`);
								return new URL(origin);
							}),
							new URL("https://song.link"),
							api_config.enabled,
						),
					);
			}

		console.info("Parsed APIs configuration!");
		return converters;
	}

	private save_simple_converters_to_config(): LinkConfiguration[] {
		console.debug("Parsing simple link converters into configuration…");

		const link_configs: LinkConfiguration[] = [];
		for (const link_map of this._links) {
			const config_link: LinkConfiguration = {
				name: link_map.name.trim(),
				origins: link_map.origins.map((origin) => origin.toString().trim()),
				destination: link_map.destination.toString().trim(),
				enabled: link_map.enabled,
			};
			link_configs.push(config_link);
		}

		console.debug("Web link maps parsed into configuration!");
		return link_configs;
	}

	private save_api_based_converters_to_config(): APIConfiguration[] {
		console.debug("Parsing api-based link converters into configuration…");

		const api_configs: APIConfiguration[] = [];
		for (const api_map of this._apis) {
			const config: APIConfiguration = { name: api_map.name, enabled: api_map.enabled };
			if (api_map.api_key !== undefined) config.api_key = api_map.api_key;
			if (api_map.base_url !== undefined) config.base_url = api_map.base_url.toString();
			api_configs.push(config);
		}

		console.debug("Web link maps parsed into configuration!");
		return api_configs;
	}

	async loadConfiguration() {
		console.debug(`Loading configuration from disk at ${PATH_CONFIG_FILE} …`);
		const config: Configuration = parse(await Deno.readTextFile(PATH_CONFIG_FILE));

		this._links = this.parse_simple_converters_from_config(config.links);
		console.info("Loaded simple link convertions configuration!");
		console.table(config.links);
		console.table(this._links);

		this._apis = this.parse_api_based_converters_from_config(config.apis);
		console.info("Loaded api-based link convertions configuration!");
		console.table(config.apis);
		console.table(this._apis);

		this._features = config.features;
		console.info("Loaded features configuration!");
		console.table(this._features);

		this._about = config.about;
		console.info("Loaded about configuration!");
		console.table(this._about);
	}

	async saveConfiguration() {
		const config: Configuration = { links: this.save_simple_converters_to_config(), apis: this.save_api_based_converters_to_config(), features: this.Features, about: this.About };
		console.debug("Generated configuration!");
		console.debug(config);

		console.debug("Writing configuration to disk…");
		await Deno.writeTextFile(PATH_CONFIG_FILE, stringify(config));
		console.info("Configuration saved!");
	}
}

const PATH_CONFIG_FILE = Deno.env.get("PREVIEWSYNTH_CONFIG_FILE_PATH") || "config.yaml";
