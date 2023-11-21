import express, {Request,Response, NextFunction} from 'express'
import { questionService, authService, answerService } from '../service'
import { UserPass } from './auth-router';
import { isAuthenticated } from '../routerMiddlewares';

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

// Check if user is authenticated
router.post('/',isAuthenticated, async (req: Request, res) => {
    try {
        const user = req.user as UserPass
        const userId = user.id
        
        const questionId = await questionService.createQuestion(userId, req.body.title, req.body.body, req.body.tags);
        
        res.status(201).send(questionId.toString());
    } catch (error) {
        console.log(error);
        
        res.status(400).send('Internal Request');
    }
});

// Get a question
router.get('/:questionId', async (req: Request, res) => {
    try {
        const questionId = parseInt(req.params.questionId);
        const question = await questionService.getQuestionById(questionId)
        
        if (question) {
            res.status(200).json(question);
        }
        
    } catch (error) {
        res.status(404).send('Question not found');
    }
});

// Update a question
router.put('/:questionId', isAuthenticated, async (req : any, res : Response) => {
    try {
        const userId = req.user.id
        const questionId = parseInt(req.params.questionId);
        
        const fetchedQuestion = await questionService.getQuestionById(questionId);

        if(userId != fetchedQuestion.user_id) return;

        await questionService.updateQuestion(questionId, userId, req.body.title, req.body.body);
        res.sendStatus(200); 
    } catch (error: unknown) {
        return res.sendStatus(404);
    }
});

// Get all questions
router.get('/', isAuthenticated, async (req: any, res: Response) => {
    try {
        const questions = await questionService.getAllQuestions();
        res.status(200).json(questions);
    } catch (error) {
        console.error('Failed to fetch questions:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Get all questions created by a specific user
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

// Delete a specific question
router.delete('/:questionId', isAuthenticated, async (req: any, res) => {
    try {
        const questionId = parseInt(req.params.questionId);
        
        if (isNaN(questionId)) {
            return res.status(400).send('Invalid question ID');
        }
        const question = await questionService.getQuestionById(questionId); // check if question exist
        const userId = req.user.id
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

// Search for a specific question
router.get('/search/:query', (req, res) => {
    const query = req.params.query;

    questionService.search(query).then((questions: Question[]) => res.send(questions)).catch((err) => res.status(500).send(err))
});

// Get a some questions based upon a filter
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
        const questions = await questionService.getFilteredQuestions('tag', false, tag);
        res.status(200).json(questions)
        
    } catch (error) {
        console.error('Failed to fetch question:', error);
        res.status(500).send('Internal Server Error');
    }
})

router.put('/:questionId/accept/:answerId', async (req, res) => {
    try {
        const answerId = parseInt(req.params.answerId)
        const questionId = parseInt(req.params.questionId)
        const answerUser = req.body.userId
        const user = req.user as UserPass
        if(!user) return
        const userId = user.id
        const question = await questionService.getQuestionById(questionId)
        if(question.user_id != userId) return res.sendStatus(401)
        
        await questionService.acceptAnswer(answerId, answerUser)
        res.status(200)
        
    } catch (error) {
        console.error('Failed to fetch question:', error);
        res.status(500).send('Internal Server Error');
    }

})


export default router