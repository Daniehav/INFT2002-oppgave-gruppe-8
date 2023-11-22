import express, {Request,Response, NextFunction} from 'express'
import { profileService } from '../service'
import { UserPass } from './auth-router'
import { isAuthenticated } from '../routerMiddlewares'

export type Profile = {
    id:  number,
    user_id: number,
    profile_picture: Buffer | null,
    bio: string,
    level: number,
    points: number
}

const router = express.Router()

router.put('/:id', isAuthenticated, (req: Request, res: Response) => {
    const user = req.user as UserPass
    profileService.updateProfile(user.id, req.body.bio, req.body.pfp, req.body.displayName)
    res.status(200).send()
}) 

router.get('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id)
        
        const profile = await profileService.getProfile(id)
        const nonNegativePoints = Math.max(0, profile.points);
        profile.level = Math.floor(nonNegativePoints / 5) + 1;
        res.json(profile)
    } catch (error) {
        console.log(error);
        
        res.sendStatus(404)
    }
})

router.get('/u/:username', async (req, res) => {
    try {
        const username = req.params.username
        
        const profile = await profileService.getProfileByUsername(username)
        const nonNegativePoints = Math.max(0, profile.points);
        profile.level = Math.floor(nonNegativePoints / 5) + 1;
        res.json(profile)
    } catch (error) {
        console.log(error);
        res.sendStatus(404)
    }
})


export default router