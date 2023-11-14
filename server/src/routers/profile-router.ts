import express, {Response, NextFunction} from 'express'
import { profileService } from '../service'

export type Profile = {
    id:  number,
    user_id: number,
    profile_picture: Buffer | null,
    bio: string,
    level: number,
    points: number
}

const router = express.Router()

router.put('/:id', isAuthenticated, (req: any, res) => {
    const id = parseInt(req.params.id)
    profileService.updateProfile(id, req.body.bio, req.body.pfp, req.body.displayName)
    res.status(200).send()
}) 

router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const id = parseInt(req.params.id)
        
        const profile = await profileService.getProfile(id)
        const nonNegativePoints = Math.max(0, profile.points);
        profile.level = Math.floor(nonNegativePoints / 5) + 1;
        res.json(profile)
    } catch (error) {
        
    }
})

function isAuthenticated(req: any, res: Response, next: NextFunction) {
    if (req.isAuthenticated()) {
        return next();
    }
}


export default router