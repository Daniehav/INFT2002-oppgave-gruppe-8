import express, {Response, NextFunction} from 'express'
import { answerService, authService } from '../service'

export type Answer = {
    answer_id:  number,
    question_id: number,
    user_id: number,
    answer: string,
    upvotes: string,
    downvotes: string,
    accepted: boolean
}

const router = express.Router()

router.post('/create', isAuthenticated, async (req : any, res) => {
    try {
        const user = await authService.getUser(req.session.passport.user.username);
        const question = await answerService.createAnswer(user.user_id, req.body.question_id ,req.body.answer);
        res.status(201).json(question);
    } catch (error: unknown) {
        if (error instanceof Error && error.message === 'User not found') {
            return res.status(400).send('Invalid user ID');
        }
        res.status(500).send('Internal Server Error');
    }
});

router.get('/:answerId', isAuthenticated, async (req: any, res: Response) => {
    try {
        const answerId = parseInt(req.params.answerId);
        const question = await answerService.getAnswerById(answerId);
        if (question) {
            res.status(200).json(question);
        } else {
            res.status(404).send('Question not found');
        }
    } catch (error) {
        console.error('Failed to fetch question:', error);
        res.status(500).send('Internal Server Error');
    }
});

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

router.put('/:answerId', isAuthenticated, async (req : any, res : Response) => {
    try {

        const userId = (await authService.getUser(req.session.passport.user.username)).user_id;
        const answerId = parseInt(req.params.answerId, 10);
        
        const fetchedQuestion = await answerService.getAnswerById(answerId);
        console.log("hej")
        if (!fetchedQuestion) {
            return res.status(404).send('Answer not found');
        }

        const question = await answerService.updateAnswer(answerId, userId, req.body.answer);
        res.status(200).json(question); 
    } catch (error: unknown) {
        if (error instanceof Error && error.message === 'User not found') {
            return res.status(400).send('Invalid user ID');
        }
        res.status(500).send('Internal Server Error');
    }
});

router.get('/', isAuthenticated, async (req: any, res: Response) => {
    try {
        const questions = await answerService.getAllAnswers();
        res.status(200).json(questions);
    } catch (error) {
        console.error('Failed to fetch questions:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.delete('/:answerId', isAuthenticated, async (req: any, res) => {
    try {
        const answerId = parseInt(req.params.answerId, 10);

        if (isNaN(answerId)) {
            return res.status(400).send('Invalid question ID');
        }
        const answer = await answerService.getAnswerById(answerId); // check if answer exist
        const userId = (await authService.getUser(req.session.passport.user.username)).user_id;
        await answerService.deleteAnswer(answer.answer_id, userId);
        res.status(204).send();
    } catch (error: unknown) {
        if (error instanceof Error && error.message === 'No question found') {
            res.status(404).send("Question not found");
        }
        else if (error instanceof Error) {
            res.status(500).send('Internal Server Error');
        }
    }
});

function isAuthenticated(req: any, res: Response, next: NextFunction) {
    if (req.isAuthenticated()) {
        return next();
      }
}

export default router