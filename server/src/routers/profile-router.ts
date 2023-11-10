import express, {Response, NextFunction} from 'express'
import { profileService } from '../service'
import { User, UserPass } from './auth-router'

export type Profile = {
    id:  number,
    user_id: number,
    profile_picture: Buffer,
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
        console.log('asd',req.params.id);
        const id = parseInt(req.params.id)
        
        const profile = await profileService.getProfile(id)
        res.json(profile)
    } catch (error) {
        
    }
})

function isAuthenticated(req: any, res: Response, next: NextFunction) {
    const id = parseInt(req.params.id)
    
    if (req.isAuthenticated()) {
        return next();
    }
}


export default router