import express, {Response, NextFunction} from 'express'
import { profileService } from '../service'
import { User } from './auth-router'

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

router.get('/:id', (req, res) => {
    const id = parseInt(req.params.id)
    profileService.getProfile(id).then((data) => {
        res.json(data)
    })
})

function isAuthenticated(req: any, res: Response, next: NextFunction) {
    const user = req.user as User
    const id = parseInt(req.params.id)
    
    if (req.isAuthenticated() && user.user_id == id) {
        return next();
    }
}


export default router