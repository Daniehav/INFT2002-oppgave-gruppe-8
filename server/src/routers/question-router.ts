import express, {Response, NextFunction} from 'express'
import { questionService, authService } from '../service'
import { User } from './auth-router'

export type Question = {
    id:  number,
    title: string,
    body: string,
}

const router = express.Router()

router.post('/create', isAuthenticated, async (req, res) => {
    try {
        const userId = parseInt(req.body.user_id, 10);
        if (isNaN(userId)) {
            return res.status(400).send('Invalid user ID');
        }
        
        await authService.getUserById(userId);
        const question = await questionService.createQuestion(userId, req.body.title, req.body.question);
        res.status(201).json(question);
    } catch (error: unknown) {
        if (error instanceof Error && error.message === 'User not found') {
            return res.status(400).send('Invalid user ID');
        }
        res.status(500).send('Internal Server Error');
    }
});

router.get('/:questionId', isAuthenticated, (req, res) => {
    const questionId = parseInt(req.params.questionId);
    questionService.getQuestionById(questionId)
        .then(question => {
            if (question) {
                res.status(200).json(question);
            } else {
                res.status(404).send('Question not found');
            }
        })
        .catch(error => {
            console.error('Failed to fetch question:', error);
            res.status(500).send('Internal Server Error');
        });
});

router.get('/', isAuthenticated, (req, res) => {
    questionService.getAllQuestions()
        .then(questions => {
            res.status(200).json(questions);
        })
        .catch(error => {
            console.error('Failed to fetch questions:', error);
            res.status(500).send('Internal Server Error');
        });
});

function isAuthenticated(req: any, res: Response, next: NextFunction) {
    const user = req.user as User
    const id = parseInt(req.params.id)
    
    if (req.isAuthenticated() && user.id == id) {
        return next();
    }
}

export default router