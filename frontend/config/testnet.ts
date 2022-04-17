import { Config } from "../types/config.type"

const ethereum: Config = {
	name: 'ethereum',
	symbol: 'Ξ',
	chainId: 4
}

const usdceth: Config = {
	name: 'usdceth',
	symbol: 'USDC',
	chainId: 4,
	tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
}

const solana: Config = {
	name: 'solana',
	symbol: 'SOL',
	chainId: 'devnet'
}

const usdcsol: Config = {
	name: 'usdcsol',
	symbol: 'USDC',
	chainId: 'devnet',
	tokenAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
}

const matic: Config = {
	name: 'matic',
	symbol: 'MATIC',
	chainId: 80001
}

const usdcmatic: Config = {
	name: 'usdcmatic',
	symbol: 'USDC',
	chainId: 80001,
	tokenAddress: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
}

const BACKEND_URL = 'https://wagpay.club'

export default {
	ethereum: {
		ethereum,
		usdceth
	},
	solana: {
		solana,
		usdcsol
	},
	matic: {
		matic,
		usdcmatic
	},
	BACKEND_URL
}