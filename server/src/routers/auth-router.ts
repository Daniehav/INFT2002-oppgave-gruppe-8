import express, {Request, Response, NextFunction} from 'express'
import passport from 'passport'
import LocalStrategy from 'passport-local'
import crypto from 'crypto'
import { authService } from '../service'

const router = express.Router()


export type User = {
    user_id: number,
    email: string,
    username: string,
    hashed_password: Buffer | null,
    salt: Buffer
}

//må ha egen class for dette siden passport mapper user_id til id når passport user lages
export type UserPass = {
  id: number;
  username: string;
}

type LocalStrategyCallback = (err: Error | null, user?: User | false, info?: {message: string}) => void

function isAuthenticated(req: any, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
}

passport.use(new LocalStrategy(function verify(username: string, password: string, done: LocalStrategyCallback) {
    authService.getUser(username).then((user: User) => {
        crypto.pbkdf2(password, user.salt, 310000, 32, 'sha256', (err, hashedPassword) => {
            if (err) { return done(err); }
            if (!crypto.timingSafeEqual(user.hashed_password!, hashedPassword)) {
                return done(null, false, { message: 'Incorrect username or password.' });
            }
            return done(null, user);
        })
    }).catch(error => {
        return done(error)
    })
}));

router.post('/signup', (req: Request, res, next) => {
    var salt = crypto.randomBytes(16);
    crypto.pbkdf2(req.body.password, salt, 310000, 32, 'sha256', (err, hashedPassword) => {
      if (err) return next(err);
      authService
        .createUser(req.body.username, req.body.email, hashedPassword, salt)
            .then((user: User) => {
                req.login(user, (err: Error) => {
                    if (err) { return next(err); }
                    res.send(user.user_id.toString());
                  });
            }).catch((error: Error) => {
                res.send(error)
            })
      
    });
   
    });

router.post('/signin', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login'
}));


router.get('/authenticated', isAuthenticated ,(req, res) => {
    const user = req.user as any
    if(!user) return res.sendStatus(404)
    res.json(user.id)
})

router.post('/logout', isAuthenticated, (req, res, next) => {
    //@ts-ignore
    req.logout((err) => {
      if (err) { return next(err); }
      res.send()
    });
  });

passport.serializeUser((user: User, cb: (err: null | Error, user: UserPass) => void) => {
    process.nextTick(() => {
      cb(null, {id: user.user_id, username: user.username });
    });
  });
  
passport.deserializeUser((user: User, cb: (err: null | Error, user: User) => void) => {
  process.nextTick(() => {
    return cb(null, user);
  });
});


export default router