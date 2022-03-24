import { supabase } from "./supabase"
import { RealtimeClient } from '@supabase/realtime-js'

type supported_currencies = 'ETH' | 'SOL' | 'USDC (Ethereum)' | 'USDC (Solana)'

interface PaymentInterface {
	value: number
	from_email?: string
	currency: supported_currencies[]
	receiving_store: string
	payment_id?: string
	store_id?: number
}

class APIKeyInvalid {}
class StoreNotFound {}
class CantCreatePaymentIntent {}

class WagPay {
	private api_key
	private user
	private can_run = false

	constructor(api_key: string) {
		if(!this.isValidAPIKey(api_key)) {
			throw new APIKeyInvalid()
		}
		this.can_run = true
	}

	async isValidAPIKey(api_key: string) {
		const { data, error } = await supabase.from('User').select('*').eq('api_key', api_key).maybeSingle()

		if(!data || error) {
			return false
		}

		this.user = data
		
		return true
	}

	async canRun() {
		if(!this.can_run) {
			throw new APIKeyInvalid()
		}
	}

	async getStore(store_slug: string) {
		this.canRun()

		const { data, error } = await supabase.from('pages').select('*').eq('slug', store_slug)

		if(!data || error) {
			throw new StoreNotFound()
		}

		return data[0]
	}

	async createPaymentIntent(payment_data: PaymentInterface) {
		this.canRun()

		const store = await this.getStore(payment_data.receiving_store)
		let r = (Math.random() + Math.floor(new Date().getTime() / 1000) + 1).toString(36).substring(7);
		payment_data.payment_id = r
		payment_data.store_id = store.id

		let { receiving_store, ...payment } = payment_data

		const { data, error } = await supabase.from('payment_intents').insert([payment])

		if(!data || error) {
			console.log(error, "ERROR")
			throw new CantCreatePaymentIntent()
		}

		return data[0].payment_id
	}

	async checkPayment(payment_id: string) {
		setInterval(async () => {
			const { data, error } = await supabase.from('payment_intents').select('*').eq('payment_id', payment_id)

			if(!data || error) {
				console.log(error, "ERROR")
				throw new CantCreatePaymentIntent()
			}

			if(data[0].is_paid && data[0].transaction_hash) {
				console.log('Paid')
			} else {
				console.log('Not Paid')
			}
		}, 5000)
	}
}

// (async () => {
// 	console.log('Initiating')
// 	const wag = new WagPay('123')
// 	console.log('Initiatied')
	
// 	console.log('Creating Payment')
// 	let pay: PaymentInterface = {
// 		value: 20,
// 		from_email: 'punekar.satyam@gmail.com',
// 		currency: ['SOL'],
// 		receiving_store: 'strings'
// 	}
// 	console.log('Created Payment')
	
// 	console.log('Creating Payment Intent')
// 	let id = await wag.createPaymentIntent(pay)
// 	wag.checkPayment(id)
// 	console.log('Created Payment Intent')
// })()

export default WagPay