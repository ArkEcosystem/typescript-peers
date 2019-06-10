import got from "got";
import isUrl from "is-url-superb";
import orderBy from "lodash.orderby";
import semver from "semver";
import { IPeer, IPeerResponse } from "./interfaces";

export class PeerDiscovery {
	private version: string | undefined;
	private latency: number | undefined;
	private orderBy: string[] = ["latency", "desc"];

	private constructor(private readonly seeds: IPeer[]) {}

	public static async new(networkOrHost: string): Promise<PeerDiscovery> {
		const seeds: IPeer[] = [];

		if (isUrl(networkOrHost)) {
			const { body } = await got.get(networkOrHost);

			for (const seed of JSON.parse(body).data) {
				seeds.push({ ip: seed.ip, port: 4003 });
			}
		} else {
			const { body } = await got.get(
				`https://raw.githubusercontent.com/ArkEcosystem/peers/master/${networkOrHost}.json`,
			);

			for (const seed of JSON.parse(body)) {
				seeds.push({ ip: seed.ip, port: 4003 });
			}
		}

		if (!seeds.length) {
			throw new Error("No seeds found");
		}

		return new PeerDiscovery(seeds);
	}

	public withVersion(version: string): PeerDiscovery {
		this.version = version;

		return this;
	}

	public withLatency(latency: number): PeerDiscovery {
		this.latency = latency;

		return this;
	}

	public sortBy(key: string, direction = "desc"): PeerDiscovery {
		this.orderBy = [key, direction];

		return this;
	}

	public async findPeers(opts: any = {}): Promise<IPeerResponse[]> {
		if (!opts.retry) {
			opts.retry = { retries: 0 };
		}

		if (!opts.timeout) {
			opts.timeout = 1500;
		}

		const seed: IPeer = this.seeds[Math.floor(Math.random() * this.seeds.length)];

		const { body } = await got.get(`http://${seed.ip}:${seed.port}/api/peers`, {
			...opts,
			...{
				headers: {
					Accept: "application/vnd.core-api.v2+json",
					"Content-Type": "application/json",
				},
				timeout: 3000,
			},
		});

		let peers: IPeerResponse[] = JSON.parse(body).data;

		if (this.version) {
			peers = peers.filter((peer: IPeerResponse) => semver.satisfies(peer.version, this.version));
		}

		if (this.latency) {
			peers = peers.filter((peer: IPeerResponse) => peer.latency <= this.latency);
		}

		return orderBy(peers, [this.orderBy[0]], [this.orderBy[1] as any]);
	}

	public async findPeersWithPlugin(name: string, opts: Record<string, any> = {}): Promise<IPeer[]> {
		const peers: IPeer[] = [];

		for (const peer of await this.findPeers(opts)) {
			const pluginName: string | undefined = Object.keys(peer.ports).find(
				(key: string) => key.split("/")[1] === name,
			);

			if (pluginName) {
				const port: number = peer.ports[pluginName];

				if (port >= 1 && port <= 65535) {
					peers.push({ ip: peer.ip, port });
				}
			}
		}

		return peers;
	}
}
