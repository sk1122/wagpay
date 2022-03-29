import { useEffect, useState } from "react"
import { supabase } from "../supabase"
import { Transactions } from "../types/Transaction"

const useTransactions = () => {
	const [transactions, setTransactions] = useState<Transactions>({ cursor: 0, data: [] } as Transactions)

	async function getTransactions() {
		const data = await fetch('http://localhost:2000/api/submissions/', {
			headers: {
				'bearer-token': supabase.auth.session()?.access_token as string,
			},
		})
		const res = await data.json()
		setTransactions(res)
	}

	async function createTransaction(
		email: string,
		fields: any,
		eth: string,
		sol: string,
		currency: string,
		txHash: string,
		page_id: number,
		selectedProducts: any,
		total_prices: number
	) {
		const transaction = {
		  email: email,
		  fields: fields,
		  eth_address: eth,
		  sol_address: sol,
		  pagesId: page_id,
		  currency: currency,
		  products: {connect: selectedProducts.map((value: any) => {return {id: value.id}})},
		  transaction_hash: txHash,
		  total_prices: total_prices
		}

		console.log(transaction, "R")
	
		const data = await fetch('http://localhost:2000/api/submissions/', {
		  method: 'POST',
		  body: JSON.stringify(transaction),
		  headers: {
			  'Content-Type': 'application/json'
		  }
		})
		let res = await data.json()

		return res.id
	  }

	// useEffect(() => getTransactions() as any, [])

	return [transactions, getTransactions, createTransaction] as any
}

export default useTransactions