import { IPeer } from "../../src/interfaces";

export const dummySeeds: IPeer[] = [
	{
		ip: "1.1.1.1",
		port: 4001,
	},
	{
		ip: "2.2.2.2",
		port: 4001,
	},
];

export const dummyPeersWalletApi: IPeer[] = [
	{
		ip: "1.1.1.1",
		port: 4001,
		ports: {
			"@arkecosystem/core-wallet-api": 4140,
			"@arkecosystem/core-api": 4103,
		},
		version: "2.5.0",
		latency: 200,
	},
	{
		ip: "2.2.2.2",
		port: 4001,
		ports: {
			"@arkecosystem/core-wallet-api": 4140,
			"@arkecosystem/core-api": 4103,
		},
		version: "2.6.0",
		latency: 100,
	},
];

export const dummyPeersPublicApi: IPeer[] = [
	{
		ip: "1.1.1.1",
		port: 4001,
		ports: {
			"@arkecosystem/core-wallet-api": -1,
			"@arkecosystem/core-api": 4103,
		},
		version: "2.5.0",
		latency: 200,
	},
	{
		ip: "2.2.2.2",
		port: 4001,
		ports: {
			"@arkecosystem/core-api": 4103,
		},
		version: "2.6.0",
		latency: 100,
	},
];
