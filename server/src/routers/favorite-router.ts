import express, {Response, NextFunction} from 'express'
import { favoriteService } from '../service'
import { UserPass } from './auth-router'


const router = express.Router()

router.get('/', isAuthenticated, async (req, res) => {
    try {
        const user = req.user as UserPass
        if(!user) return
        const answers = await favoriteService.getFavorites(user.id)
        res.status(200).json(answers)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.get('/ids', isAuthenticated, async (req, res) => {
    try {
        const user = req.user as UserPass
        if(!user) return
        const answers = await favoriteService.getFavoriteIds(user.id)
        res.status(200).json(answers)
    } catch (error) {
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

function isAuthenticated(req: any, res: Response, next: NextFunction) {
    if (req.isAuthenticated()) {
        return next();
    }
}

export default router