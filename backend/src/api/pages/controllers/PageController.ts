import { Request, Response } from "express";
import { Pages, Prisma, PrismaClient } from '@prisma/client'

function isNumeric(str: any) {
	if (typeof str != "string") return false // we only process strings!  
	// @ts-ignore
	return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
		   !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}
  

class PageController {
	prisma = new PrismaClient();

	get = async (req: Request, res: Response) => {
		const data = {} as any
		Object.keys(req.query).map(value => {if(isNumeric(req.query[value])) data[value] = Number(req.query[value])})
		
		let db_query = {
			userId: res.locals.user.id,
			...data
		}
		
		const pages = await this.prisma.pages.findMany({
			where: db_query
		})

		res.status(200).send(pages)
	}

	post = async (req: Request, res: Response) => {
		let pageData = req.body
		pageData.userId = res.locals.user.id
		
		try {
			const slug = await this.prisma.pages.findFirst({
				where: {
					userId: res.locals.user.id,
					slug: pageData.slug
				}
			})
			if(slug) {
				res.status(400).send({ error: 'Store already exists with that slug', status: 400 })
				return
			}
		} catch (e) {}

		var page
		try {
			page = await this.prisma.pages.create({
				data: pageData
			})
		} catch (e) {
			res.status(400).send({
				error: e,
				status: 400
			})
			return
		}

		res.status(201).send(page)
	}

	batch = async (req: Request, res: Response) => {
		const pageData: Prisma.Enumerable<Prisma.PagesCreateManyInput> = req.body

		var pages

		try {
			pages = await this.prisma.pages.createMany({
				data: pageData
			})
		} catch (e) {
			res.status(400).send({
				error: e,
				status: 400
			})
			return
		}

		res.status(201).send(pages)
	}

	update = async (req: Request, res: Response) => {
		const { id, ...pageData } = req.body

		if(Object.keys(pageData).includes('slug')) {
			try {
				const slug = await this.prisma.pages.findFirst({
					where: {
						userId: res.locals.user.id,
						slug: pageData.slug
					}
				})
				if(slug) {
					res.status(400).send({ error: 'Store already exists with that slug', status: 400 })
					return
				}
			} catch (e) {}
		}

		var page
		try {
			page = await this.prisma.pages.update({
				where: {
					id: id
				},
				data: pageData
			})
		} catch (e) {
			res.status(400).send({
				error: e,
				status: 400
			})
			return
		}

		res.status(200).send(page)
	}

	delete = async (req: Request, res: Response) => {
		const { id } = req.query
		var page

		try {
			page = await this.prisma.pages.delete({
				where: {
					id: Number(id)
				}
			})
		} catch (e) {
			res.status(400).send({
				error: e,
				status: 400
			})
			return
		}

		res.status(204).send(page)
	}
}

export default PageController