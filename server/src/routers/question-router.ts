import express, {Response, NextFunction} from 'express'
import { questionService, authService } from '../service'
import { User } from './auth-router'

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

router.post('/', isAuthenticated, async (req, res) => {
    try {
        const questionId = await questionService.createQuestion(req.body.userId, req.body.title, req.body.body, req.body.tags);
        res.status(201).send(questionId.toString());
    } catch (error: unknown) {
        if (error instanceof Error && error.message === 'User not found') {
            return res.status(400).send('Invalid user ID');
        }
        res.status(500).send('Internal Server Error');
    }
});

router.get('/:questionId', isAuthenticated, async (req, res) => {
    try {
        const questionId = parseInt(req.params.questionId);
        const question = await questionService.getQuestionById(questionId)
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

router.get('/profile/:userId', async (req,res) => {
    try {
        console.log('a');
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

router.delete('/:questionId', isAuthenticated, async (req, res) => {
    try {
        const questionId = parseInt(req.params.questionId, 10);
        
        if (isNaN(questionId)) {
            return res.status(400).send('Invalid question ID');
        }
        const question = await questionService.getQuestionById(questionId); // check if question exist
        await questionService.deleteQuestion(question.question_id, 1);
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