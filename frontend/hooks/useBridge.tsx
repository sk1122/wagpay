import { Hyphen, RESPONSE_CODES, SIGNATURE_TYPES } from "@biconomy/hyphen";
import { ethers } from "ethers";
import { useEffect, useState } from "react";

const abi = [{"inputs":[{"internalType":"address","name":"_logic","type":"address"},{"internalType":"address","name":"admin_","type":"address"},{"internalType":"bytes","name":"_data","type":"bytes"}],"stateMutability":"payable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"previousAdmin","type":"address"},{"indexed":false,"internalType":"address","name":"newAdmin","type":"address"}],"name":"AdminChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"beacon","type":"address"}],"name":"BeaconUpgraded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"implementation","type":"address"}],"name":"Upgraded","type":"event"},{"stateMutability":"payable","type":"fallback"},{"inputs":[],"name":"admin","outputs":[{"internalType":"address","name":"admin_","type":"address"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newAdmin","type":"address"}],"name":"changeAdmin","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"implementation","outputs":[{"internalType":"address","name":"implementation_","type":"address"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newImplementation","type":"address"}],"name":"upgradeTo","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newImplementation","type":"address"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"upgradeToAndCall","outputs":[],"stateMutability":"payable","type":"function"},{"stateMutability":"payable","type":"receive"}]

const useBridge = () => {
	const [hyphen, setHyphen] = useState<Hyphen>()
	
	const init = (provider: any) => {
		let _hyphen = new Hyphen(provider, {
			debug: true,
			environment: "test",
			onFundsTransfered: (data) => {
				console.log(data)
			}
		})

		setHyphen(_hyphen)
	}

	useEffect(() => {
		if(hyphen) {
			hyphen.init()
		}
	}, [hyphen])

	const transfer = async () => {
		if(hyphen) {
			let preTransferStatus = await hyphen.depositManager.preDepositStatus({
				tokenAddress: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
				amount: 1,
				fromChainId: 80001,
				toChainId: 5,	
				userAddress: "0x4e7f624C9f2dbc3bcf97D03E765142Dd46fe1C46"
			});

			if(preTransferStatus.code == RESPONSE_CODES.OK) {
				await hyphen.depositManager.deposit({
					amount: "7000000000000000",
					fromChainId: "80001",
					toChainId: "5",
					sender: "0x4e7f624C9f2dbc3bcf97D03E765142Dd46fe1C46",
					receiver: "0x4e7f624C9f2dbc3bcf97D03E765142Dd46fe1C46",
					useBiconomy: false,
					tokenAddress: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
					depositContractAddress: "0xE61d38cC9B3eF1d223b177090f3FD02b0B3412e7",
					tag: "satyam"
				})
			}
		}
	}

	return [init, transfer] as any
}

export default useBridge