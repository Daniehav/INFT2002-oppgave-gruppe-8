import express, {Request, Response, NextFunction} from 'express'
import { answerService, authService } from '../service'
import { UserPass } from './auth-router'
import { isAuthenticated } from '../routerMiddlewares'

export type Answer = {
    answer_id: number;
    question_id: number;
    user_id: number;
    body: string;
    upvotes: number;
    downvotes: number;
    accepted: boolean;
    created_at: Date;
    updated_at: Date;
    question_title?: string;
}

export type Vote = {
    vote_id: number;
    answer_id: number;
    user_id: number;
    vote_type: 'upvote' | 'downvote';
}

export type Favorite = {
    favorite_id: number;
    answer_id: number;
    user_id: number;
}

const router = express.Router()

// Create a answer
router.post('/', isAuthenticated, async (req: Request, res) => {
    try {
        const user = req.user as UserPass
        const question = await answerService.createAnswer(user.id, req.body.questionId ,req.body.body);
        res.status(201).json(question);
    } catch (error: unknown) {
        if (error instanceof Error ) {
            return res.sendStatus(400)
        }
        res.status(500).send('Internal Server Error');
    }
});


// Get a specific answer
router.get('/:answerId', isAuthenticated, async (req: Request, res: Response) => {
    try {
        const answerId = parseInt(req.params.answerId);
        const answer = await answerService.getAnswerById(answerId);
        if (answer) {
            res.status(200).json(answer);
        } else {
            res.status(404).send('Answer not found');
        }
    } catch (error) {
        console.error('Failed to fetch question:', error);
        res.status(500).send('Internal Server Error');
    }
});


// Get all answers for a question
router.get('/question/:questionId', isAuthenticated, async (req: Request, res: Response) => {
    try {
        const questionId = parseInt(req.params.questionId);
        const questions = await answerService.getAllAnswersByQuestion(questionId);
        res.status(200).json(questions);
    } catch (error) {
        console.error('Failed to fetch answers:', error);
        res.status(500).send('Internal Server Error');
    }
});


// Update an answer
router.put('/:answerId', [isAuthenticated, isAuthorized], async (req : Request, res : Response) => {
    try {
        const user = req.user as UserPass
        const answerId = parseInt(req.params.answerId);
        const {body} = req.body
        
        const answer = await answerService.updateAnswer(answerId, user.id, body);
        res.status(200).json(answer); 
    } catch (error: unknown) {
        if (error instanceof Error && error.message === 'User not found') {
            return res.status(400).send('Invalid user ID');
        }
        if(error instanceof Error && error.message === 'No answer found') {
            return res.status(404).send('Answer not found');
        }
        res.status(500).send('Internal Server Error');
    }
});

// Delete an answer
router.delete('/:answerId', [isAuthenticated, isAuthorized], async (req: Request, res: Response) => {

    try {
        const answerId = parseInt(req.params.answerId, 10);
        const user = req.user as UserPass

        await answerService.deleteAnswer(answerId, user.id);
        res.status(204).send();
    } catch (error: unknown) {
        if (error instanceof Error && error.message === 'No answer found') {
            res.status(404).send(error.message);
        }
        else if (error instanceof Error) {
            res.status(500).send('Internal Server Error');
        }
    }
});

router.post('/:answerId/vote', isAuthenticated, async(req, res) => {
    try {
        
        const answerId = parseInt(req.params.answerId)
        console.log('vote',answerId, );
        const vote = req.body.vote as 'upvote' | 'downvote'
        const user = req.user as UserPass
        //sjekke om brukeren har allered stemt på dette svare
        const answerVote = await answerService.getVote(answerId, user.id)
        if(!answerVote) {
            const id = await answerService.setVote(answerId, user.id, vote)
            res.status(200).json(id)
        } else {
            if(answerVote.vote_type == vote) {
                await answerService.deleteVote(answerId, user.id)
                res.sendStatus(200)
            } else if(answerVote.vote_type != vote){
                await answerService.updateVote(answerId, user.id, vote)
                res.sendStatus(200)
            }   
        }
        
    } catch (error) {
        console.log(error);
        
        res.status(500).send(error)
    }

})
router.post(':answerId/favorite',isAuthenticated, async(req, res) => {
    const answerId = parseInt(req.params.answerId)
    const user = req.user as UserPass
    const favorite = await answerService.getFavorite(answerId, user.id)
    if(favorite) {
        await answerService.deleteAnswer(answerId, user.id)
        res.sendStatus(200)
    } else {
        const id = await answerService.setFavorite(answerId, user.id)
        res.status(200).json(id)
    }
})


async function isAuthorized(req: Request, res: Response, next: NextFunction) {
    try {
        
        const answerId = parseInt(req.params.answerId)
        const answer = await answerService.getAnswerById(answerId)
        
        if(!answer) throw new Error('No answer found')
        const user = req.user as UserPass
        
        if (answer.user_id == user.id) {
            return next();
        } else {
            throw new Error('Not Authorized')
        }
    } catch (error) {
        if (error instanceof Error && error.message === 'No answer found') {
            res.status(404).send(error.message);
        }
        else if (error instanceof Error && error.message === 'Not Authorized') {
            res.status(401).send(error.message)
        }
        else if (error instanceof Error) {
            res.status(500).send('Internal Server Error');
        }
    }
}





export default router