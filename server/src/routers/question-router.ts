import express from 'express'
import { questionService } from '../service'

export type Question = {
    id: number,
    user_id: number,
    title: string,
    body: string,
    views: string,
    created_at: string,
    updated_at: string
}

const router = express.Router()

router.get('/search/:query', (req, res) => {
    const query = req.params.query;

    questionService.search(query).then((questions: Question[]) => res.send(questions)).catch((err) => res.status(500).send(err))
})

export default router