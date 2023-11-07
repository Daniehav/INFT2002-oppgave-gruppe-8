import express from 'express'
import { tagService } from '../service';

export type Tag = {
    tag_id: number;
    tag: string;
    count: number;
    created_at: Date;
    updated_at: Date;
}

const router = express.Router()


router.get('/', async (req, res) => {
    try {
        const tags = await tagService.getAll()
        res.status(200).json(tags)
    } catch (error) {
        console.error('Failed to fetch tags:', error);
        res.status(500).send('Internal Server Error');
    }
})
router.post('/', async (req, res) => {
    try {
        const {tag} = req.body
        const newTag = await tagService.create(tag)
        if(newTag) {
            res.status(200).json(newTag)
        } else{
            throw new Error('Failed to create tag')
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
})

router.get('/question/:questionId', async (req, res) => {
    try {
        const questionId = parseInt(req.params.questionId)
        const tags = await tagService.getQuestionTags(questionId)
        res.status(200).json(tags)
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
})

export default router
