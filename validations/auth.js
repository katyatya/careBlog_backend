import { body } from 'express-validator'

export const registrValidation = [
	body('email', 'Неверный формат почты').isEmail(),
	body('password', 'Пароль должен содержать минимум 5 символов').isLength({
		min: 5,
	}),
	// body('full_name', 'Укажите имя').isLength({ min: 2 }).isString(),
	body('avatar_url', 'Неверная ссылка на аватарку').optional().isString(),
]
export const loginValidation = [
	body('email', 'Неверный формат почты').isEmail(),
	body('password', 'Пароль должен содержать минимум 5 символов').isLength({
		min: 5,
	}),
]
export const postCreateValidation = [
	body('title', 'Введите заголовок статьи').isLength({ min: 1 }).isString(),
	body('text', 'Введите текст статьи').isString(),
	body('tags', 'Неверный формат тэгов').optional().isString(),
	body('imageUrl', 'Неверная ссылка на изображение').optional().isString(),
]
