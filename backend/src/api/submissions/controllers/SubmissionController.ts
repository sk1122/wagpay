import { Request, Response } from "express";
import { Pages, Prisma, PrismaClient } from '@prisma/client'

function isNumeric(str: any) {
	if (typeof str != "string") return false // we only process strings!  
	// @ts-ignore
	return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
		   !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}
  

class SubmissionController {
	prisma = new PrismaClient();

	get = async (req: Request, res: Response) => {
		const data = {} as any
		Object.keys(req.query).map(value => {if(isNumeric(req.query[value])) data[value] = Number(req.query[value])})
		
		const page_ids = await this.prisma.pages.findMany({
			select: {
				submissions: true
			},
			where: {
				userId: res.locals.user.id
			}
		})
		
		const submissions = page_ids.map(value => value.submissions).flat()

		res.status(200).send(submissions)
	}

	post = async (req: Request, res: Response) => {
		let submissionData = req.body

		var submission
		try {
			submission = await this.prisma.submission.create({
				data: submissionData
			})
		} catch (e) {
			res.status(400).send({
				error: e,
				status: 400
			})
			return
		}

		res.status(201).send(submission)
	}

	batch = async (req: Request, res: Response) => {
		const pageData: Prisma.Enumerable<Prisma.SubmissionCreateManyInput> = req.body

		var submissions

		try {
			submissions = await this.prisma.submission.createMany({
				data: pageData
			})
		} catch (e) {
			res.status(400).send({
				error: e,
				status: 400
			})
			return
		}

		res.status(201).send(submissions)
	}

	update = async (req: Request, res: Response) => {
		const { id, ...submissionData } = req.body

		var submission
		try {
			submission = await this.prisma.submission.update({
				where: {
					id: id
				},
				data: submissionData
			})
		} catch (e) {
			res.status(400).send({
				error: e,
				status: 400
			})
			return
		}

		res.status(200).send(submission)
	}

	delete = async (req: Request, res: Response) => {
		const { id } = req.query
		var submission

		try {
			submission = await this.prisma.submission.delete({
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

		res.status(204).send(submission)
	}
}

export default SubmissionController