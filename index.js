import express from 'express'
import pg from 'pg'
import multer from 'multer'
import fs from 'fs'
import cors from 'cors'
import {
	registrValidation,
	loginValidation,
	postCreateValidation,
} from './validations/auth.js'
import { checkAuth, handleValidationErrors } from './utils/index.js'
import { UserController, PostController } from './controllers/index.js'
import dotenv from 'dotenv'
dotenv.config()

const client = new pg.Client(process.env.POSTGRES_URL)

client
	.connect()
	.then(() => console.log('Connected to PostgreSQL'))
	.catch(err => console.error('Connection error', err.stack))

const app = express()
const storage = multer.diskStorage({
	destination: (_, __, cb) => {
		if (!fs.existsSync('uploads')) [fs.mkdirSync('uploads')]
		cb(null, 'uploads')
	},
	filename: (_, file, cb) => {
		cb(null, file.originalname)
	},
})
const upload = multer({ storage })

app.use(express.json())
app.use(cors())
app.use('/uploads', express.static('uploads'))

app.post('/auth/login', loginValidation, handleValidationErrors, (req, res) => {
	UserController.login(req, res, client)
})

app.post('/posts/:id', checkAuth, (req, res) => {
	PostController.createComment(req, res, client)
})

app.post(
	'/auth/register',
	registrValidation,
	handleValidationErrors,
	(req, res) => {
		UserController.register(req, res, client)
	}
)
app.get('/auth/me', checkAuth, (req, res) => {
	UserController.getMe(req, res, client)
})
app.get('/posts/tags', (req, res) =>
	PostController.getLastTags(req, res, client)
)
app.get('/tags', (req, res) => PostController.getLastTags(req, res, client))

app.post('/upload', upload.single('image'), (req, res) => {
	res.json({
		url: `/uploads/${req.file.originalname}`,
	})
})

app.get('/posts', (req, res) => {
	PostController.getAll(req, res, client)
})
app.get('/posts/:id', (req, res) => {
	PostController.getOne(req, res, client)
})
app.get('/tags/:name', (req, res) => {
	PostController.getPostsByTag(req, res, client)
})

app.post(
	'/posts',
	checkAuth,
	postCreateValidation,
	handleValidationErrors,
	(req, res) => {
		PostController.create(req, res, client)
	}
)
app.delete('/posts/:id', checkAuth, (req, res) => {
	PostController.remove(req, res, client)
})
app.patch(
	'/posts/:id',
	checkAuth,
	postCreateValidation,
	handleValidationErrors,
	(req, res) => {
		PostController.update(req, res, client)
	}
)
app.listen(process.env.PORT || 44455, err => {
	if (err) {
		return console.log(err)
	}
})
