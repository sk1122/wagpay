import { Request, Response } from "express";
import { Pages, Prisma, PrismaClient } from '@prisma/client'

function isNumeric(str: any) {
	if (typeof str != "string") return false // we only process strings!  
	// @ts-ignore
	return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
		   !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}
  

class PaymentIntentController {
	prisma = new PrismaClient();

	get = async (req: Request, res: Response) => {
		const data = {} as any
		Object.keys(req.query).map(value => {if(isNumeric(req.query[value])) data[value] = Number(req.query[value])})
		
		const paymentIntent = await this.prisma.paymentIntent.findMany({
			where: {
				page: {
					userId: res.locals.user.id
				}
			}
		})
		
		res.status(200).send(paymentIntent)
	}

	post = async (req: Request, res: Response) => {
		let paymentIntentData = req.body

		var paymentIntent
		try {
			paymentIntent = await this.prisma.paymentIntent.create({
				data: paymentIntentData
			})
		} catch (e) {
			res.status(400).send({
				error: e,
				status: 400
			})
			return
		}

		res.status(201).send(paymentIntent)
	}

	batch = async (req: Request, res: Response) => {
		const paymentIntentData: Prisma.Enumerable<Prisma.PaymentIntentCreateManyInput> = req.body

		var paymentIntent

		try {
			paymentIntent = await this.prisma.paymentIntent.createMany({
				data: paymentIntentData
			})
		} catch (e) {
			res.status(400).send({
				error: e,
				status: 400
			})
			return
		}

		res.status(201).send(paymentIntent)
	}

	update = async (req: Request, res: Response) => {
		const { id, ...paymentIntentData } = req.body

		var paymentIntent
		try {
			paymentIntent = await this.prisma.paymentIntent.update({
				where: {
					id: id
				},
				data: paymentIntentData
			})
		} catch (e) {
			res.status(400).send({
				error: e,
				status: 400
			})
			return
		}

		res.status(200).send(paymentIntent)
	}

	delete = async (req: Request, res: Response) => {
		const { id } = req.query
		var paymentIntent

		try {
			paymentIntent = await this.prisma.paymentIntent.delete({
				where: {
					id: id as string
				}
			})
		} catch (e) {
			res.status(400).send({
				error: e,
				status: 400
			})
			return
		}

		res.status(204).send(paymentIntent)
	}
}

export default PaymentIntentController