import jwt from 'jsonwebtoken'

export default (req, res, next) => {
	const token = (req.headers.authorization || '').replace(/Bearer\s?/, '')
	if (token) {
		try {
			const decoded = jwt.decode(token, 'secret123')
			req.user_id = decoded.user_id
			next()
		} catch (err) {
			return res.status(404).json({
				message: 'Ошибка доступа',
			})
		}
	} else {
		return res.status(403).json({
			message: 'Нет доступа',
		})
	}
}
