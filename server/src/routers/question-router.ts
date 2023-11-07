import express, {Response, NextFunction} from 'express'
import { questionService, authService } from '../service'

export type Question = {
    question_id: number;
    user_id: number;
    title: string;
    body: string;
    views: number;
    created_at: Date;
    updated_at: Date;
    answer_count?: number;
};

const router = express.Router()


router.post('/', isAuthenticated, async (req : any, res) => {
    try {
        const user = await authService.getUser(req.session.passport.user.username);
        const questionId = await questionService.createQuestion(user.user_id, req.body.title, req.body.body, req.body.tags);
        res.status(201).send(questionId.toString());
    } catch (error: unknown) {
        if (error instanceof Error && error.message === 'User not found') {
            return res.status(400).send('Invalid user ID');
        }
        res.status(500).send('Internal Server Error');
    }
});

router.get('/:questionId', isAuthenticated, async (req : any, res) => {
    try {
        const questionId = parseInt(req.params.questionId);
        const question = await questionService.getQuestionById(questionId)
        if (question) {
            res.status(200).json(question);
        } else {
            res.status(404).send('Question not found');
        }
        
    } catch (error) {
        // console.error('Failed to fetch question:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.put('/:questionId', isAuthenticated, async (req : any, res : Response) => {
    try {
        const userId = (await authService.getUser(req.session.passport.user.username)).user_id;
        const questionId = parseInt(req.params.questionId, 10);
        
        const fetchedQuestion = await questionService.getQuestionById(questionId);

        if (!fetchedQuestion) {
            return res.status(404).send('Question not found');
        }

        const question = await questionService.updateQuestion(questionId, userId, req.body.title, req.body.body);
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
        const questions = await questionService.getAllQuestions();
        res.status(200).json(questions);
    } catch (error) {
        console.error('Failed to fetch questions:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/profile/:userId', async (req,res) => {
    try {
        const questionId = parseInt(req.params.userId);
        
        const questions = await questionService.getQuestionByUser(questionId)
        if (questions) {
            res.status(200).json(questions);
        } else {
            res.status(404).send('Question not found');
        }
        
    } catch (error) {
        console.error('Failed to fetch question:', error);
        res.status(500).send('Internal Server Error');
    }
})

router.delete('/:questionId', isAuthenticated, async (req: any, res) => {
    try {
        const questionId = parseInt(req.params.questionId, 10);
        
        if (isNaN(questionId)) {
            return res.status(400).send('Invalid question ID');
        }
        const question = await questionService.getQuestionById(questionId); // check if question exist
        const userId = (await authService.getUser(req.session.passport.user.username)).user_id;
        await questionService.deleteQuestion(question.question_id, userId);
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

router.get('/preview/:filter', async(req, res) => {
    try {
        const {filter} = req.params
        const questions = await questionService.getFilteredQuestions(filter, true)
        res.status(200).json(questions)
    } catch (error) {
        console.error('Failed to fetch question:', error);
        res.status(500).send('Internal Server Error');
    }
})

router.get('/filter/:filter', async (req, res) => {
    try {
        const {filter} = req.params
        const questions = await questionService.getFilteredQuestions(filter, false);
        res.status(200).json(questions)
        
    } catch (error) {
        console.error('Failed to fetch question:', error);
        res.status(500).send('Internal Server Error');
    }
})
router.get('/filter/tag/:tag', async (req, res) => {
    try {
        const {tag} = req.params
        const questions = await questionService.getFilteredQuestions(tag, false);
        res.status(200).json(questions)
        
    } catch (error) {
        console.error('Failed to fetch question:', error);
        res.status(500).send('Internal Server Error');
    }
})

function isAuthenticated(req: any, res: Response, next: NextFunction) {
    if (req.isAuthenticated()) {
        return next();
      }
}

export default router