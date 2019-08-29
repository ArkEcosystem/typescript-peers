import nock from "nock";
import { PeerDiscovery } from "../src/discovery";
import { IPeer } from "../src/interfaces";

const dummySeeds: IPeer[] = [
	{
		ip: "1.1.1.1",
		port: 4001,
	},
	{
		ip: "2.2.2.2",
		port: 4001,
	},
];

describe("PeerDiscovery", () => {
	it("should fetch peers from a seed", async () => {
		nock("http://127.0.0.1")
			.get("/api/v2/peers")
			.reply(200, {
				data: dummySeeds,
			});

		const peerDiscovery: PeerDiscovery = await PeerDiscovery.new("http://127.0.0.1/api/v2/peers");

		expect(peerDiscovery.getSeeds()).toEqual(dummySeeds);
	});

	it("should fetch peers from github", async () => {
		nock("https://raw.githubusercontent.com/ArkEcosystem/peers/master")
			.get("/mainnet.json")
			.reply(200, dummySeeds);

		const peerDiscovery: PeerDiscovery = await PeerDiscovery.new("mainnet");

		expect(peerDiscovery.getSeeds()).toEqual(dummySeeds);
	});

	it("should fail if could not fetch from github", async () => {
		nock("https://raw.githubusercontent.com/ArkEcosystem/peers/master")
			.get("/failnet.json")
			.reply(404);

		await expect(PeerDiscovery.new("failnet")).rejects.toThrowError(new Error("Failed to discovery any peers."));
	});
});
