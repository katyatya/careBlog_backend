import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

export const register = async (req, res, client) => {
	try {
		const password = req.body.password
		const salt = await bcrypt.genSalt(10)
		const password_hash = await bcrypt.hash(password, salt)

		const newPerson = await client.query(
			`INSERT INTO users (password_hash,email,full_name,avatar_url) values ($1,$2,$3,$4) RETURNING *`,
			[password_hash, req.body.email, req.body.full_name, req.body.avatar_url]
		)

		const token = jwt.sign(
			{
				user_id: newPerson.rows[0].user_id,
				avatar_url: newPerson.rows[0].avatar_url,
			},
			'secret123'
		)

		res.json({
			...(await newPerson).rows[0],
			token,
		})
	} catch (err) {
		console.warn(err)
		res.status(500).json({
			message: 'Не удалось зарегистрироваться',
		})
	}
}

export const login = async (req, res, client) => {
	try {
		const result = await client.query(`SELECT * FROM users where email = $1`, [
			req.body.email,
		])

		if (result.rows.length === 0) {
			return res.status(404).json({
				message: 'Пользователь не найден',
			})
		}

		const user = result.rows[0]
		const isValidPass = await bcrypt.compare(
			req.body.password,
			user.password_hash
		)

		if (!isValidPass) {
			return res.status(400).json({
				message: 'Неверный логин или пароль',
			})
		}

		const token = jwt.sign(
			{
				user_id: user.user_id,
			},
			'secret123'
		)
		const { password_hash, ...userData } = user
		res.json({
			...userData,
			token,
		})
	} catch (err) {
		console.log(err)
		res.status(500).json({
			message: 'Не удалось авторизоваться',
		})
	}
}

export const getMe = async (req, res, client) => {
	try {
		const result = await client.query(
			`SELECT * FROM users where user_id = $1`,
			[req.user_id]
		)

		if (result.rows.length === 0) {
			return res.status(404).json({
				message: 'Пользователь не найден',
			})
		}
		const user = result.rows[0]
		const { password_hash, ...userData } = user
		return res.json({
			...userData,
		})
	} catch (err) {
		return res.status(500).json({ message: 'Ошибка сервера' })
	}
}
