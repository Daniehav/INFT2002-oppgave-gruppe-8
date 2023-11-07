import pool from './mysql-pool';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import { User } from './routers/auth-router';
import { Question } from './routers/question-router';
import { Profile } from './routers/profile-router';


class AuthService {
    createUser(username: string, email: string, hashedPassword: Buffer, salt: Buffer) {
        return new Promise<User>((resolve, reject) => {
            pool.query('INSERT INTO Users (username, email, hashed_password, salt) VALUES (?, ?, ?, ?)', [ username, email, hashedPassword, salt], (err, result: ResultSetHeader) => {
                console.log(err);
                
                if (err) return reject(err);
                console.log(result.insertId);
                
                const user: User = {
                  id: result.insertId,
                  email,
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
            pool.query('SELECT * FROM Users WHERE username = ?', [ username ], (err, res: RowDataPacket[]) => {
                if (err) { return reject(err); }
                if (!res) { return reject({err: null, user: false, info: { message: 'Incorrect username or password.' }}); }
                resolve(res[0] as User)
            })
        })
    }

    getUserById(userId: number) {
        return new Promise<User>((resolve, reject) => {
            pool.query('SELECT * FROM Users WHERE user_id = ?', [userId], (err, res: RowDataPacket[]) => {
                if (err) {
                    return reject(err);
                }
                if (res.length === 0) {
                    return reject(new Error('User not found'));
                }
                resolve(res[0] as User);
            });
        });
    }
}


class QuestionService {
    createQuestion(userId: number, title: string, body: string) {
        return new Promise<number>((resolve, reject) => {
            const query = 'INSERT INTO Questions (user_id, title, body) VALUES (?, ?, ?)';
            pool.query(query, [userId, title, body], (err, res: ResultSetHeader) => {
                if (err) {
                    return reject(err);
                }
                if (res.affectedRows === 0) {
                    return reject(new Error('Question could not be added'));
                }
                resolve(res.insertId);
            });
        });
    }

    updateQuestion(questionId: number, userId: number, title: string, body: string) {
        return new Promise<void>((resolve, reject) => {
            const checkOwnershipQuery = 'SELECT * FROM Questions WHERE question_id = ? AND user_id = ?';
            pool.query(checkOwnershipQuery, [questionId, userId], (err, res: RowDataPacket[]) => {
                if (err) {
                    return reject(err);
                }
                if (res.length === 0) {
                    return reject(new Error('No question found with this ID for the user'));
                }
    
                const updateQuery = 'UPDATE Questions SET title = ?, body = ? WHERE question_id = ? AND user_id = ?';
                pool.query(updateQuery, [title, body, questionId, userId], (updateErr, updateRes: ResultSetHeader) => {
                    if (updateErr) {
                        return reject(updateErr);
                    }
                    if (updateRes.affectedRows === 0) {
                        return reject(new Error('Question could not be updated'));
                    }
                    resolve();
                });
            });
        });
    }
    
    deleteQuestion(questionId: number, userId: number): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const query = 'DELETE FROM Questions WHERE question_id = ? AND user_id = ?';

            pool.query(query, [questionId, userId], (err, res: ResultSetHeader) => {
                if (err) {
                    return reject(err);
                }
                
                if (res.affectedRows === 0) {
                    return reject(new Error('No question found with the given ID for this user, or you do not have the permission to delete it.'));
                }
                resolve(true);
            });
        });
    }

    getQuestionById(questionId: number): Promise<Question> {
        return new Promise((resolve, reject) => {
            pool.query(
                'SELECT * FROM Questions WHERE question_id = ? LIMIT 1', [questionId], (err, results) => {
                    if (err) {
                        return reject(err);
                    }
                    const question = Array.isArray(results) ? results[0] : results;
                    if (!question) {
                        return reject(new Error('No question found'));
                    }
                    resolve(question as Question);
                }
            );
        });
    }

    getAllQuestions(): Promise<Question[]> {
        return new Promise((resolve, reject) => {
            pool.query('SELECT * FROM Questions', (err, results: RowDataPacket[]) => {
                if (err) {
                    return reject(err);
                }

                if (Array.isArray(results) && results.length > 0 && Array.isArray(results[0])) {
                    return reject(new Error('Unexpected result format'));
                }
                resolve(results as Question[]);
            });
        });
    }

    search(query: string){
        query = '%'+query+'%';
        return new Promise<Question[]>((resolve, reject) => {
            pool.query("SELECT * FROM Questions WHERE (title) LIKE (?)", [query], (err, results: RowDataPacket[]) => {
                if (err) return reject(err);
                resolve(results as Question[])
            });
        })
    }
}

class ProfileService {

    createProfile(userId: number) {
        return new Promise<void>((resolve, reject) => {
            pool.query('INSERT INTO UserProfiles (user_id) VALUES (?)', [userId], (err) => {
                if (err) return reject(err);
                resolve()
            });
        })
    }

    updateProfile(userId: number, bio: string, pfp: string) {
        const args = pfp && pfp !== 'null'? [bio, pfp, userId] : [bio, userId]
        return new Promise<void>((resolve, reject) => {
            pool.query(`UPDATE UserProfiles SET bio=?${pfp && pfp !== 'null'? ', profile_picture=?' : ''} WHERE user_id=?`, args, (err) => {
                console.log(err);
                if (err) return reject(err);
                resolve()
            });
        })
    }
    
    getProfile(userId: number) {
        return new Promise<Profile>((resolve, reject) => {
            pool.query('SELECT * FROM UserProfiles WHERE user_id=?', [userId], (err, result: RowDataPacket[]) => {
                if (err) return reject(err);
                resolve(result[0] as Profile)
            });
        })

    }
}
export const authService = new AuthService();
export const profileService = new ProfileService();
export const questionService = new QuestionService();
