import { Request, Response, NextFunction } from "express";

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
    
    if(process.env.NODE_ENV == 'test'){
        const id = req.headers.id 
        if(id) {
            req.user = {id: id}
            return next()
        }
        req.user = {id: 1}
        return next()
    }
    if (req.isAuthenticated()) {
        return next();
      }
}