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

router.post('/edit/:questionId', async (req, res) => {
    try {
        const questionId = parseInt(req.params.questionId)
        const {addedTags, removedTags} = req.body
        const added = [...new Set(addedTags)] as number[]
        const removed = [...new Set(removedTags)] as number[]
        const add = new Promise<void>(async (resolve) => {
            for (const t of added) {
              await tagService.createQuestionTags(questionId, t);
            }
            resolve();
        });
          
        const remove = new Promise<void>(async (resolve) => {
            for (const t of removed) {
              await tagService.deleteQuestionTags(questionId, t);
            }
            resolve();
        });
        await Promise.all([add, remove])
        res.sendStatus(200)
        
    } catch (error) {
        
    }
})

export default router
