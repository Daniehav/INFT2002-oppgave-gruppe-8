import express, {Response, NextFunction} from 'express'
import { questionService, authService } from '../service'

export type Question = {
    id:  number,
    userId: number,
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

router.put('/:questionId', isAuthenticated, async (req, res) => {
    try {
        const userId = parseInt(req.body.user_id, 10);
        const questionId = parseInt(req.params.questionId, 10);

        if (isNaN(userId)) {
            return res.status(400).send('Invalid user ID');
        }
        
        const fetchedQuestion = await questionService.getQuestionById(questionId);

        if (!fetchedQuestion) {
            return res.status(404).send('Question not found');
        }

        const question = await questionService.updateQuestion(questionId, userId, req.body.title, req.body.question);
        res.status(200).json(question); 
    } catch (error: unknown) {
        if (error instanceof Error && error.message === 'User not found') {
            return res.status(400).send('Invalid user ID');
        }
        res.status(500).send('Internal Server Error');
    }
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

router.delete('/:questionId', isAuthenticated, async (req, res) => {
    try {
        const questionId = parseInt(req.params.questionId, 10);

        if (isNaN(questionId)) {
            return res.status(400).send('Invalid question ID');
        }
        const question = await questionService.getQuestionById(questionId); // check if question exist
        await questionService.deleteQuestion(question.id, 1);
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

router.get('/search/:query', (req, res) => {
    const query = req.params.query;

    questionService.search(query).then((questions: Question[]) => res.send(questions)).catch((err) => res.status(500).send(err))
})

function isAuthenticated(req: any, res: Response, next: NextFunction) {
    if (req.isAuthenticated()) {
        return next();
      }
}

export default router