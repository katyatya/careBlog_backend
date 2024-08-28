export const create = async (req, res, client) => {
	try {
		const newPost = client.query(
			`INSERT INTO posts (title,text,image_url,tags,user_id) values ($1,$2,$3,$4,$5) RETURNING *`,
			[
				req.body.title,
				req.body.text,
				req.body.image_url,
				req.body.tags.split(' '),
				req.user_id,
			]
		)
		res.json({
			...(await newPost).rows[0],
		})
	} catch (err) {
		return res.status(500).json(err.message)
	}
}
export const getAll = async (req, res, client) => {
	try {
		const posts = await client.query(
			`SELECT 
        p.*,
        json_build_object(
            'user_id', u.user_id,
            'full_name', u.full_name,
            'email', u.email,
            'avatar_url', u.avatar_url,
            'create_timestamp', u.create_timestamp
        ) AS user
        FROM posts p
        JOIN users u ON p.user_id = u.user_id;
`
		)
		return res.json(posts.rows)
	} catch (err) {}
	return res.status(404).json({
		message: 'error',
	})
}
export const getLastTags = async (req, res, client) => {
	try {
		const tags = await client.query(
			`WITH tags_from_posts AS (
    SELECT DISTINCT unnest(tags) AS tag, p.views_count
    FROM posts p
    LIMIT 20
)
SELECT t.tag, SUM(t.views_count) AS total_views
FROM tags_from_posts t
GROUP BY t.tag
ORDER BY total_views DESC;

    `
		)
		const tagArray = tags.rows.map(row => row.tag)
		return res.json(tagArray)
	} catch (err) {
		return res.status(404).json(err)
	}
}
export const getOne = async (req, res, client) => {
	try {
		const result = await client.query(
			`UPDATE posts
			 SET views_count = views_count + 1
			 WHERE post_id = $1
			 RETURNING 
 			 *,
  (
    SELECT 
      json_build_object( 'full_name', u.full_name, 'avatar_url', u.avatar_url)
    FROM users u
    WHERE u.user_id = posts.user_id
  ) AS user,
  (
    SELECT ARRAY(
      SELECT json_build_object(
        'comment_text', c.comment_text,
        'user_id', c.user_id,
        'user_data' , (
          SELECT json_build_object('full_name', u.full_name, 'avatar_url', u.avatar_url)
          FROM users u
          WHERE u.user_id = c.user_id
        )
      )
      FROM comments c
      WHERE c.post_id = posts.post_id
    )
  ) AS comments;
      `,
			[req.params.id]
		)
		if (result.rows.length == 0) {
			res.status(404).json({
				message: 'Статья не найдена',
			})
		}
		res.json(result.rows[0])
	} catch (err) {
		console.warn(err)
		res.status(500).json({
			message: 'Не удалось просмотреть пост',
		})
	}
}
export const remove = async (req, res, client) => {
	try {
		const post = await client.query(
			` DELETE FROM posts
        WHERE post_id = $1 `,
			[req.params.id]
		)
		if (post.rowCount == 0) {
			res.status(404).json({
				message: 'Невозможно удалить, статья ненайдена',
			})
		}
		res.json({
			message: 'success',
		})
	} catch (err) {
		res.status(500).json({ message: 'Ошибка удаления' })
	}
}
export const update = async (req, res, client) => {
	try {
		const result = await client.query(
			`UPDATE posts SET 
        title = $1,
        text = $2,
        image_url = $3,
        tags = $4  
      WHERE post_id = $5 RETURNING *
      `,
			[
				req.body.title,
				req.body.text,
				req.body.image_url,
				req.body.tags.split(' '),
				req.params.id,
			]
		)
		if (result.rows.length == 0) {
			res.status(404).json({
				message: 'Статья не найдена',
			})
		}
		res.json(result.rows[0])
	} catch (err) {
		console.warn(err)
		res.status(500).json({
			message: 'Не удалось обновить пост',
		})
	}
}
export const createComment = async (req, res, client) => {
	try {
		const result = await client.query(
			`INSERT INTO comments (comment_text,post_id,user_id) values ($1,$2,$3) RETURNING *`,
			[req.body.comment_text, req.body.post_id, req.body.user_id]
		)
		res.json({
			...result.rows[0],
		})
	} catch (err) {
		res.status(505).json(err.message)
	}
}
export const getComments = async (req, res, client) => {
	try {
		const comments = client.query(
			`SELECT * FROM comments WHERE post_id = $1 `,
			[req.params.id]
		)
		res.json(comments.rows[0])
	} catch (err) {
		res.status(505).json('Ошибка загрузки комментариев')
	}
}
export const getPostsByTag = async (req, res, client) => {
	try {
		const posts = await client.query(
			`SELECT 
    posts.*,
    json_build_object(
        'full_name', u.full_name,
        'email', u.email,
        'avatar_url', u.avatar_url
    ) AS user
FROM posts
JOIN users u ON posts.user_id = u.user_id
WHERE  tags @> ARRAY[$1]`,
			[req.params.name]
		)
		res.json(posts.rows)
	} catch (err) {
		res.status(505).json(err.message)
	}
}
