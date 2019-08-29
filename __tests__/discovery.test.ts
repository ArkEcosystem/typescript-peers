import nock from "nock";
import { PeerDiscovery } from "../src/discovery";

describe("PeerDiscovery", () => {
	it("should fetch peers from github", async () => {
		nock("https://raw.githubusercontent.com/ArkEcosystem/peers/master")
			.get("mainnet.json")
			.reply(200, {
				data: [
					{
						"ip": "1.1.1.1",
						"port": 4001,
					},
					{
						"ip": "2.2.2.2",
						"port": 4001,
					}
				]
			});

		const peerDiscovery = await PeerDiscovery.new("mainnet");
		console.log(peerDiscovery);

		// expect(peerDiscovery)
	});

	it("should fail if could not fetch from github", async () => {
		nock("https://raw.githubusercontent.com/ArkEcosystem/peers/master")
			.get("failnet.json")
			.reply(404);

		await PeerDiscovery.new("failnet");
	});
});
