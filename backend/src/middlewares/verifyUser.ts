import type { NextFunction, Request, Response } from 'express'
import { supabase } from "../client";
import jwt, { JwtPayload } from 'jsonwebtoken'
import { ResponseType } from '../types/ErrorType';

const verifyUser = async (req: Request, res: Response, next: NextFunction) => {
	var decoded: JwtPayload | string = ''
	try {
		const JWT_SECRET = '1733729e-3910-4637-88c1-6fad57d04f26'
		const access_token = req.headers['bearer-token'] as string
		decoded = jwt.verify(access_token, JWT_SECRET);
	} catch (e) {
		let error: ResponseType = {
			error: e,
			status: 401
		}

		res.status(401).send(error)
	}

	res.locals.user = decoded.sub

	next()
}

export default verifyUser