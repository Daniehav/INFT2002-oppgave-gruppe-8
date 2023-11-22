import express, {Request, Response, NextFunction} from 'express'
import { commentService } from '../service'
import { UserPass } from './auth-router'

export type Parent = 'question' | 'answer'

interface Comment{
    comment_id: number;
    user_id: number;
    body: string;
    created_at: Date;
    updated_at: Date;
}

export interface QuestionComment extends Comment {
    question_id: number;
};
export interface AnswerComment extends Comment {
    answer_id: number;
};


const router = express.Router()

// Get comments for either an anaswer or a comment
router.get('/:parent/:parentId', isAuthenticated, async (req, res) => {
    try {
        const {parent} = req.params
        const parentId = parseInt(req.params.parentId)
        if(!isParent(parent) || !parentId) throw new Error('Invalid params')
        if(parent == 'question') {
            const answers = await commentService.getAllQuestion(parentId)
            res.status(200).json(answers)
        } else {
            const answers = await commentService.getAllAnswer(parentId)
            res.status(200).json(answers)
        }
    } catch (error) {
        console.log(error);
        res.status(500).send(error)
    }
})

// Create a comment for either a question or an answer
router.post('/:parent/:parentId', isAuthenticated, async (req, res) => {
    try {
        const user = req.user as UserPass
        const {parent} = req.params
        const parentId = parseInt(req.params.parentId)
        const {body} = req.body
        
        if(!user.id || !isParent(parent) || !parentId || !body) throw new Error('Missing data')
        if(parent == 'question') {
            const id = await commentService.createQuestion(parentId,body,user.id)
            res.status(200).json(id)
        } else {
            const id = await commentService.createAnswer(parentId,body,user.id)
            res.status(200).json(id)
        }
    } catch (error) {
        console.log(error);
        res.status(500).send(error)
    }
})

// Update a comment
router.put('/:parent/:commentId', [isAuthenticated, isAuthorized], async (req: Request, res: Response) => {
    try {
        const commentId = parseInt(req.params.commentId)
        const {parent} = req.params
        const {body} = req.body

        if(!commentId || !body || !isParent(parent)) return
        if(parent == 'question') {
            await commentService.editQuestion(commentId,body)
        } else {
            await commentService.editAnswer(commentId,body)
        }

        res.sendStatus(200)

    } catch (error) {
        console.log(error);
        res.status(500).send(error)
    }
})

// Delete a comment
router.delete('/:parent/:commentId', [isAuthenticated, isAuthorized], async (req: Request, res: Response) => {
    try {
        const commentId = parseInt(req.params.commentId)
        const {parent} = req.params

        if(!commentId || !isParent(parent)) throw new Error('Invalid params') 
        if(parent == 'question') {
            await commentService.deleteQuestion(commentId)
        } else {
            await commentService.deleteAnswer(commentId)
        }

        res.sendStatus(200)

    } catch (error) {
        console.log(error);
        res.status(500).send(error)
    }
})


function isParent(value: string): value is Parent {
    return (value === 'question' || value === 'answer');
}

async function isAuthorized(req: Request, res: Response, next: NextFunction) {
    const commentId = parseInt(req.params.commentId)
    const {parent} = req.params
    const comment = await new Promise<Comment>(async(resolve) => {
        if(parent == 'question') {
            const comment = await commentService.getQuestion(commentId)
            resolve(comment)
        } else {
            const comment = await commentService.getAnswer(commentId)
            resolve(comment)
        }
    })
    const user = req.user as UserPass
    console.log(comment);
    
    if (comment.user_id == user.id) {
        console.log('authorized');
        
        return next();
    } else {
        throw new Error('Not autorized')
    }
}

function isAuthenticated(req: Request, res: Response, next: NextFunction) {
    if (req.isAuthenticated()) {
        return next();
    }
}

export default router