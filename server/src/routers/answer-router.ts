import express, {Response, NextFunction} from 'express'
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

// Create a question
router.post('/', isAuthenticated, async (req : any, res) => {
    try {
        const user = req.user
        const question = await answerService.createAnswer(user.id, req.body.questionId ,req.body.answer);
        res.status(201).json(question);
    } catch (error: unknown) {
        if (error instanceof Error && error.message === 'User not found') {
            return res.status(400).send('Invalid user ID');
        }
        res.status(500).send('Internal Server Error');
    }
});

// Get a specific answer
router.get('/:answerId', isAuthenticated, async (req: any, res: Response) => {
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
router.get('/question/:questionId', isAuthenticated, async (req: any, res: Response) => {
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
router.put('/:answerId', isAuthenticated, async (req : any, res : Response) => {
    try {
        const userId = req.user.id
        const answerId = parseInt(req.params.answerId);
        const {body} = req.body
        
        const fetchedAnswer = await answerService.getAnswerById(answerId);
        if (!fetchedAnswer) {
            return res.status(404).send('Answer not found');
        }

        const answer = await answerService.updateAnswer(answerId, userId, body);
        res.status(200).json(answer); 
    } catch (error: unknown) {
        if (error instanceof Error && error.message === 'User not found') {
            return res.status(400).send('Invalid user ID');
        }
        res.status(500).send('Internal Server Error');
    }
});

// Delete an answer
router.delete('/:answerId', isAuthenticated, async (req: any, res) => {
    try {
        const answerId = parseInt(req.params.answerId, 10);

        if (isNaN(answerId)) {
            return res.status(400).send('Invalid answer ID');
        }
        const answer = await answerService.getAnswerById(answerId); // check if answer exist
        const userId = (await authService.getUser(req.session.passport.user.username)).user_id;
        await answerService.deleteAnswer(answer.answer_id, userId);
        res.status(204).send();
    } catch (error: unknown) {
        if (error instanceof Error && error.message === 'No answer found') {
            res.status(404).send("Answer not found");
        }
        else if (error instanceof Error) {
            res.status(500).send('Internal Server Error');
        }
    }
});

router.post('/:answerId/vote', async(req, res) => {
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
        res.status(500).send(error)
    }

})
router.post(':answerId/favorite', async(req, res) => {
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





export default router