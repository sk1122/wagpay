import fetch from 'cross-fetch'
type supported_currencies = 'ethereum' | 'solana' | 'usdceth' | 'usdcsol'

const BASE_URL = 'https://wagpay.club'

interface PaymentInterface {
	value: number
	transaction_hash?: string
	is_paid?: boolean
	pagesId?: number
	from_email: string
	currency: supported_currencies[]
	receiving_store?: string
}

class APIKeyInvalid {}
class StoreNotFound {}
class CantCreatePaymentIntent {}

export class WagPay {
	private api_key
	private user: any
	private can_run = false

	constructor(api_key: string) {
		this.api_key = api_key
	}

	async check_first(api_key: string) {
		// console.log(await this.isValidAPIKey(api_key))
		if(!(await this.isValidAPIKey(api_key))) {
			throw new APIKeyInvalid()
		}
		this.can_run = true
	}

	async isValidAPIKey(api_key: string) {
		const data = await fetch(`${BASE_URL}/api/user/apiKey/${api_key}`)
		const res = await data.json()
		// console.log(res, data.status, "Dsa")
		if(data.status === 400) return false
		
		this.user = res

		return true
	}

	async canRun() {
		if(!(await this.isValidAPIKey(this.api_key))) {
			throw new APIKeyInvalid()
		}
	}

	async getStore(store_slug: string) {
		await this.canRun()

		const data = await fetch(`${BASE_URL}/api/pages/get?slug=${store_slug}&username=${this.user.username}`)
		const store = await data.json()

		if(!store) throw new StoreNotFound()

		return store.id
	}

	async createPaymentIntent(payment_data: PaymentInterface) {
		await this.canRun()

		let { receiving_store, ...intent } = payment_data
		intent.pagesId = await this.getStore(receiving_store as string)
		intent.transaction_hash = ''

		// console.log(intent)

		const data = await fetch(`${BASE_URL}/api/paymentIntents`, {
			method: 'POST',
			body: JSON.stringify(intent),
			headers: {
				'Content-Type': 'application/json',
				'api-key': '123'
			}
		})

		const res = await data.json()
		console.log(res)
		if(!res || data.status !== 201) throw new CantCreatePaymentIntent()

		console.log(res.id, "idididididi")
		return res.id
	}

	async checkPayment(payment_id: string) {
		return new Promise((resolve, reject) => {
			this.canRun()
	
			let can_run = true
	
			setInterval(() => can_run = false, 1000000)
	
			setInterval(async () => {
				if(can_run) {
					const data = await fetch(`${BASE_URL}/api/paymentIntents?id=${payment_id}`, {
						method: 'GET',
						headers: {
							'api-key': this.api_key
						}
					})
		
					const res = await data.json()
		
					if(res[0].is_paid && res[0].transaction_hash) {
						// console.log('paid')
						resolve(true)
					} else {
						// console.log('not paid')
					}
				} else {
					resolve(false)
				}
			}, 2000)
		})
	}
}

(async () => {
	console.log('Initiating')
	const wag = new WagPay('123')
	console.log('Initiatied')
	
	console.log('Creating Payment')
	let pay: PaymentInterface = {
		value: 1,
		from_email: 'punekar.satyam@gmail.com',
		currency: ['solana'],
		receiving_store: 'dsa'
	}
	console.log('Created Payment')
	
	console.log('Creating Payment Intent')
	let id = await wag.createPaymentIntent(pay)
	let check = await wag.checkPayment(id)
	console.log('Created Payment Intent', check)
})()