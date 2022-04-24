import { ethers } from 'ethers'
import { useEffect, useState } from 'react'

const Socket = () => {
	const [provider, setProvider] = useState<any>()
	const [signer, setSigner] = useState<any>()
	const [json, setJson] = useState<any>()

	const connectETH = async () => {
		const providerE = new ethers.providers.Web3Provider(window.ethereum as InjectedProviders, "any");
		await providerE.send("eth_requestAccounts", []);
		const signerE = await providerE.getSigner();
		console.log(await signerE.getAddress())
		setProvider(providerE)
		setSigner(signerE)
	}

	useEffect(() => {
		connectETH()
	}, [])

	const connectSocket = async (recipient: string, fromAsset: string, fromChainId: string, toAsset: string, toChainId: string, amount: string, output: string, fromAddress: string, routePath: string) => {
		const response = await fetch(`https://backend.movr.network/v1/approval/build-tx?chainID=137&owner=${fromAddress}&allowanceTarget=0xE5BFAB544ecA83849c53464F85B7164375Bdaac1&tokenAddress=${fromAsset}&amount=1000000000000000000`, {});

		const json = await response.json();

		const tx = await signer.sendTransaction({
			to: json.result.to,
			data: json.result.data,
			chainId: 137
		});

		const response1 = await fetch(`https://backend.movr.network/v1/send/build-tx?recipient=${recipient}&fromAsset=${fromAsset}&fromChainId=${fromChainId}&toAsset=${toAsset}&toChainId=${toChainId}&amount=${amount}&output=${output}&fromAddress=${fromAddress}&routePath=${routePath}`, {});

		const json1 = await response1.json();	

		setJson(json1)
	}

	const executeSocket = async () => {
		const tx = await signer.sendTransaction({
			to: json.result.tx.to,
			data: json.result.tx.data,
		});
	
		// Initiates transaction on user's frontend which user has to sign
		const receipt = await tx.wait();
	
		console.log(receipt);
		
	}

	return (
		<div>
			<button onClick={() => connectSocket("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", 
			"0x2791bca1f2de4661ed88a30c99a7a9449aa84174", 
			"137", "0xddafbb505ad214d7b80b1f830fccc89b60fb7a83", 
			"100", "100000000000000000000", 
			"99752473", "0x4e7f624C9f2dbc3bcf97D03E765142Dd46fe1C46", 
			"6-1")}>
				Connect Socket
			</button>
			<button onClick={() => executeSocket()}>
				Execute Socket
			</button>
		</div>
	)
}

export default Socket