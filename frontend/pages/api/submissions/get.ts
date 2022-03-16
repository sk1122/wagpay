// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../../supabase'
import verifyUser from '../middlewares/verifyUser'
import { Product } from '../product'
import createProducts from '../utils/createProducts'
import connect_product_to_pages from '../utils/connect_product_to_pages'

async function create(req: NextApiRequest, res: NextApiResponse<any | string>) {
	let jwt = await verifyUser(req, res)
	let { user, error } = await supabase.auth.api.getUser(req.headers['bearer-token'] as string)
	
	if(req.method === 'GET') {
		console.log(user)
		const { data, error } = await supabase
			.from('submission')
			// .select('product_id!inner(*),submission_id!inner(*),page_id!inner(*)')
			.select(`
				*,
				page_id (
					title,
					slug,
					user (
						email
					)
				)
			`)
			.eq('page_id.user.email', user?.email)
		
		if(!data || error || data?.length === 0) {
			res.status(400).send('Page was not created ' + JSON.stringify(error))
			return
		}

		res.status(201).send(data)
	}
}

export default create