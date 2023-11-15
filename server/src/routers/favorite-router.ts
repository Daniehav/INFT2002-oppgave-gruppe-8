import express, {Response, NextFunction, Request} from 'express'
import { favoriteService } from '../service'
import { UserPass } from './auth-router'


const router = express.Router()

router.get('/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId)
        const answers = await favoriteService.getFavorites(userId)
        res.status(200).json(answers)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const user = req.user as UserPass
        console.log(user);
        if(!user) throw new Error("Not authenticated");
        
        
        const answers = await favoriteService.getFavoriteIds(user.id)
        res.status(200).json(answers)
    } catch (error) {
        console.log(error);
        
        res.status(500).send(error)
    }
})
router.post('/:answerId', isAuthenticated, async (req, res) => {
    try {
        const user = req.user as UserPass
        const answerId = parseInt(req.params.answerId as string)
        if(!user || !answerId) return
        const isFavorited = await favoriteService.getFavorite(answerId, user.id)
        if(isFavorited) {
            await favoriteService.deleteFavorite(answerId,user.id)

        } else{
            await favoriteService.setFavorite(answerId,user.id)
        }
        res.status(200)
    } catch (error) {
        res.status(500).send(error)
    }
})

function isAuthenticated(req: Request, res: Response, next: NextFunction) {
    if (req.isAuthenticated()) {
        return next();
    }
}

export default router