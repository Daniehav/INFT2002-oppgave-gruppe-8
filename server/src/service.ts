import pool from './mysql-pool';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import { User } from './routers/auth-router';
import { Profile } from './routers/profile-router';


class AuthService {
    createUser(username: string, hashedPassword: Buffer, salt: Buffer) {
        return new Promise<User>((resolve, reject) => {
            pool.query('INSERT INTO users (username, hashed_password, salt) VALUES (?, ?, ?)', [ username, hashedPassword, salt], (err, result: ResultSetHeader) => {
                if (err) return reject(err);
                console.log(result.insertId);
                
                const user: User = {
                  id: result.insertId,
                  username,
                  hashed_password: hashedPassword,
                  salt
                };
                profileService.createProfile(user.id).then(() => resolve(user)).catch(() => reject())
            });
        })
    }

    getUser(username: string) {
        return new Promise<User>((resolve, reject) => {
            pool.query('SELECT * FROM users WHERE username = ?', [ username ], (err, res: RowDataPacket[]) => {
                if (err) { return reject(err); }
                if (!res) { return reject({err: null, user: false, info: { message: 'Incorrect username or password.' }}); }
                resolve(res[0] as User)
            })
        })
    }

}


class ProfileService {

    createProfile(userId: number) {
        return new Promise<void>((resolve, reject) => {
            pool.query('INSERT INTO user_profiles (user_id) VALUES (?)', [userId], (err) => {
                if (err) return reject(err);
                resolve()
            });
        })
    }

    updateProfile(userId: number, bio: string, pfp: string) {
        const args = pfp && pfp !== 'null'? [bio, pfp, userId] : [bio, userId]
        return new Promise<void>((resolve, reject) => {
            pool.query(`UPDATE user_profiles SET bio=?${pfp && pfp !== 'null'? ', profile_picture=?' : ''} WHERE user_id=?`, args, (err) => {
                console.log(err);
                if (err) return reject(err);
                resolve()
            });
        })
    }
    
    getProfile(userId: number) {
        return new Promise<Profile>((resolve, reject) => {
            pool.query('SELECT * FROM user_profiles WHERE user_id=?', [userId], (err, result: RowDataPacket[]) => {
                if (err) return reject(err);
                resolve(result[0] as Profile)
            });
        })

    }
}
export const authService = new AuthService();
export const profileService = new ProfileService();