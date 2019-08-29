import nock from "nock";
import { dummySeeds, dummyPeersWalletApi, dummyPeersPublicApi } from "./mocks/peers";
import { PeerDiscovery } from "../src/discovery";

beforeEach(() => {
	nock.cleanAll();
});

describe("PeerDiscovery", () => {
	describe("new instance", () => {
		it("should fetch peers from a seed", async () => {
			nock("http://127.0.0.1")
				.get("/api/v2/peers")
				.reply(200, {
					data: dummyPeersWalletApi,
				});

			const peerDiscovery: PeerDiscovery = await PeerDiscovery.new({
				networkOrHost: "http://127.0.0.1/api/v2/peers",
			});

			expect(peerDiscovery.getSeeds()).toEqual(dummyPeersWalletApi.map(peer => ({
				ip: peer.ip,
				port: 4140,
			})));
		});

		it("should fetch peers from a seed and fallback to public api port", async () => {
			nock("http://127.0.0.1")
				.get("/api/v2/peers")
				.reply(200, {
					data: dummyPeersPublicApi,
				});

			const peerDiscovery: PeerDiscovery = await PeerDiscovery.new({
				networkOrHost: "http://127.0.0.1/api/v2/peers",
			});

			expect(peerDiscovery.getSeeds()).toEqual(dummyPeersPublicApi.map(peer => ({
				ip: peer.ip, port: 4103,
			})));
		});

		it("should fetch peers from github", async () => {
			nock("https://raw.githubusercontent.com/ArkEcosystem/peers/master")
				.get("/mainnet.json")
				.reply(200, dummySeeds);

			const peerDiscovery: PeerDiscovery = await PeerDiscovery.new({ networkOrHost: "mainnet" });

			expect(peerDiscovery.getSeeds()).toEqual(dummySeeds);
		});

		it("should fail if could not fetch from github", async () => {
			nock("https://raw.githubusercontent.com/ArkEcosystem/peers/master")
				.get("/failnet.json")
				.reply(404);

			await expect(PeerDiscovery.new({
				networkOrHost: "failnet",
			})).rejects.toThrowError(new Error("Failed to discovery any peers."));
		});
	});

	describe("findPeers", () => {
		let peerDiscovery: PeerDiscovery
		beforeEach(async () => {
			nock("http://127.0.0.1")
				.get("/api/v2/peers")
				.reply(200, {
					data: dummyPeersWalletApi,
				});

			peerDiscovery = await PeerDiscovery.new({ networkOrHost: "http://127.0.0.1/api/v2/peers" });
		});

		it("should find peers", async () => {
			nock(/.+/)
				.get("/api/v2/peers")
				.reply(200, {
					data: dummyPeersWalletApi
				});

			expect(await peerDiscovery.findPeers()).toEqual(dummyPeersWalletApi);
		});

		it("should retry", async () => {
			nock(/.+/)
				.get("/api/v2/peers")
				.twice()
				.reply(500)
				.get("/api/v2/peers")
				.reply(200, {
					data: dummyPeersWalletApi
				});

			const peers = await peerDiscovery.findPeers({
				retry: { retries: 3 },
			});

			expect(peers).toEqual(dummyPeersWalletApi);
		});

		it("should timeout", async () => {
			nock(/.+/)
				.get("/api/v2/peers")
				.delay(2000)
				.reply(200, {
					data: dummyPeersWalletApi
				});

			await expect(peerDiscovery.findPeers({
				timeout: 1000,
			})).rejects.toThrowError(new Error("Timeout awaiting 'request' for 1000ms"));
		});

		it("should filter by version", async () => {
			nock(/.+/)
				.get("/api/v2/peers")
				.twice()
				.reply(200, {
					data: dummyPeersWalletApi
				});

			let peers = await peerDiscovery.withVersion('2.6.0').findPeers();
			await expect(peers).toEqual([dummyPeersWalletApi[1]]);

			peers = await peerDiscovery.withVersion('>=2.5.0').findPeers();
			await expect(peers).toEqual(dummyPeersWalletApi);
		});

		it("should filter by latency", async () => {
			nock(/.+/)
				.get("/api/v2/peers")
				.twice()
				.reply(200, {
					data: dummyPeersWalletApi
				});

			let peers = await peerDiscovery.withLatency(150).findPeers();
			await expect(peers).toEqual([dummyPeersWalletApi[1]]);

			peers = await peerDiscovery.withLatency(250).findPeers();
			await expect(peers).toEqual(dummyPeersWalletApi);
		});

		it("should sort by latency asc", async () => {
			nock(/.+/)
				.get("/api/v2/peers")
				.reply(200, {
					data: dummyPeersWalletApi
				});

			const peers = await peerDiscovery.sortBy('latency', 'asc').findPeers();
			await expect(peers).toEqual([dummyPeersWalletApi[1], dummyPeersWalletApi[0]]);
		});

		it("should sort by version desc", async () => {
			nock(/.+/)
				.get("/api/v2/peers")
				.reply(200, {
					data: dummyPeersWalletApi
				});

			const peers = await peerDiscovery.sortBy('version', 'desc').findPeers();
			await expect(peers).toEqual([dummyPeersWalletApi[1], dummyPeersWalletApi[0]]);
		});
	});

	describe("findPeersWithPlugin", () => {
		let peerDiscovery: PeerDiscovery
		beforeEach(async () => {
			nock("http://127.0.0.1")
				.get("/api/v2/peers")
				.reply(200, {
					data: dummyPeersWalletApi,
				});

			peerDiscovery = await PeerDiscovery.new({ networkOrHost: "http://127.0.0.1/api/v2/peers" });
		});

		it("should find peers without the wallet api plugin", async () => {
			nock(/.+/)
				.get("/api/v2/peers")
				.reply(200, {
					data: dummyPeersPublicApi
				});

			expect(await peerDiscovery.findPeersWithPlugin('core-wallet-api')).toEqual([]);
		});

		it("should find peers with the wallet api plugin", async () => {
			nock(/.+/)
				.get("/api/v2/peers")
				.reply(200, {
					data: dummyPeersWalletApi
				});

			const validPeers = dummyPeersWalletApi.map((peer) => ({ ip: peer.ip, port: 4140 }));
			expect(await peerDiscovery.findPeersWithPlugin('core-wallet-api')).toEqual(validPeers);
		});
	});
});
