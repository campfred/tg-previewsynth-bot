import { parse, stringify } from "@std/yaml";
import { AboutConfiguration, Configuration, FeaturesConfiguration, LinkConfiguration, WebLinkMap } from "./types.ts";

export class ConfigurationManager {
	private static _instance: ConfigurationManager;
	private _mappings: WebLinkMap[] = [];
	private _features!: FeaturesConfiguration;
	private _about!: AboutConfiguration;

	private constructor() {
		// this.loadConfiguration();
	}

	static get Instance() {
		return this._instance || (this._instance = new this());
	}

	get Link_Mappings(): WebLinkMap[] {
		return this._mappings;
	}

	get Features() {
		return this._features;
	}

	get About() {
		return this._about;
	}

	private loadWebLinkMapsFromConfiguration(links: LinkConfiguration[]): WebLinkMap[] {
		console.debug("Reading links configuration…");
		console.debug(links);
		const mappings = links.map((link: LinkConfiguration) => {
			console.debug(`Creating ${WebLinkMap.name} config for ${link.name} …`);
			return new WebLinkMap(
				link.name.trim(),
				link.origins.map((origin: string) => new URL(origin.trim())),
				new URL(link.destination.trim()),
				link.enabled,
			);
		});
		console.info(`Loaded links configuration!`);
		return mappings;
	}

	private saveWebLinkMapsToConfiguration(): LinkConfiguration[] {
		console.debug("Parsing web link maps into configuration…");

		const link_configs: LinkConfiguration[] = [];

		for (const link_map of this._mappings) {
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

	async loadConfiguration() {
		console.debug(`Loading configuration from disk at ${PATH_CONFIG_FILE} …`);
		const config: Configuration = parse(await Deno.readTextFile(PATH_CONFIG_FILE));

		this._mappings = this.loadWebLinkMapsFromConfiguration(config.links);
		console.info("Loaded web link mappings configuration!");
		console.table(config.links);
		this._features = config.features;
		console.info("Loaded features configuration!");
		console.table(this._features);
		this._about = config.about;
		console.info("Loaded about configuration!");
		console.table(this._about);
	}

	async saveConfiguration() {
		const config: Configuration = { links: this.saveWebLinkMapsToConfiguration(), features: this.Features, about: this.About };
		console.debug("Generated configuration!");
		console.debug(config);

		console.debug("Writing configuration to disk…");
		await Deno.writeTextFile(PATH_CONFIG_FILE, stringify(config));
		console.info("Configuration saved!");
	}
}

const PATH_CONFIG_FILE = Deno.env.get("PREVIEWSYNTH_CONFIG_FILE_PATH") || "config.yaml";
