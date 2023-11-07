import pool from './mysql-pool';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import { User } from './routers/auth-router';
import { Question } from './routers/question-router';
import { Profile } from './routers/profile-router';
import { Answer } from './routers/answer-router';
import { Tag } from './routers/tag-router'

class AuthService {
    createUser(username: string, email: string, hashedPassword: Buffer, salt: Buffer) {
        return new Promise<User>((resolve, reject) => {
            pool.query('INSERT INTO Users (username, email, hashed_password, salt) VALUES (?, ?, ?, ?)', [ username, email, hashedPassword, salt], (err, result: ResultSetHeader) => {
                console.log(err);
                
                if (err) return reject(err);
                console.log(result.insertId);
                
                const user: User = {
                  user_id: result.insertId,
                  email,
                  username,
                  hashed_password: hashedPassword,
                  salt
                };
                profileService.createProfile(user.user_id, username).then(() => resolve(user)).catch(() => reject())
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
    createQuestion(userId: number, title: string, body: string, tags: number[]) {
        return new Promise<number>((resolve, reject) => {
            const query = 'INSERT INTO Questions (user_id, title, body) VALUES (?, ?, ?)';
            pool.query(query, [userId, title, body], (err, res: ResultSetHeader) => {
                if (err) {
                    console.log(err)
                    return reject(err);
                }
                if (res.affectedRows === 0) {
                    return reject(new Error('Question could not be added'));
                }
                if(tags.length != 0){
                    tags.forEach(t => {
                    tagService.createQuestionTags(res.insertId,t) 
                })}
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
                'SELECT * FROM Questions WHERE question_id = ?', [questionId], (err, results: RowDataPacket[]) => {
                    if (err) {
                        return reject(err);
                    }
                    const question = results[0] as Question
                    if (!question) {
                        return reject(new Error('No question found'));
                    }
                    question.views += 1
                    pool.query('UPDATE Questions SET views = views + 1 WHERE question_id=?',[questionId])
                    resolve(question as Question);
                }
            );
        });
    }
    getQuestionByUser(userId: number): Promise<Question[]> {
        return new Promise((resolve, reject) => {
            pool.query(
                'SELECT * FROM Questions WHERE user_id = ?', [userId], async (err, res: RowDataPacket[]) => {
                    console.log(err);
                    if (err) {
                        return reject(err);
                    }
                    const questions = res as Question[]
                    const newQuestions = await Promise.all(questions.map(async (q: Question) => {
                        const answer_count = await answerService.getAnswerCount(q.question_id)
                        return {...q, answer_count} as Question
                    }))
                    
                    resolve(newQuestions);
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
}

class ProfileService {

    createProfile(userId: number, username: string) {
        return new Promise<void>((resolve, reject) => {
            pool.query('INSERT INTO UserProfiles (user_id, display_name) VALUES (?, ?)', [userId, username], (err) => {
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


class AnswerService {
    createAnswer(userId: number, questionId: number, body: string) {
        return new Promise<number>((resolve, reject) => {
            const query = 'INSERT INTO Answers (user_id, question_id, body) VALUES (?, ?, ?)';
            pool.query(query, [userId, questionId, body], (err, res: ResultSetHeader) => {
                if (err) {
                    console.error("Failed to create answer", err);
                    return reject(err);
                }
                if (res.affectedRows === 0) {
                    return reject(new Error('Answer could not be added'));
                }
                resolve(res.insertId);
            });
        });
    }

    getAnswerById(answerId: number): Promise<Answer> {
        return new Promise((resolve, reject) => {
            pool.query(
                'SELECT * FROM Answers WHERE answer_id = ? LIMIT 1', [answerId], (err, results) => {
                    if (err) {
                        console.error("Failed to get answer", err);
                        return reject(err);
                    }
                    const question = Array.isArray(results) ? results[0] : results;
                    if (!question) {
                        return reject(new Error('No answer found'));
                    }
                    resolve(question as Answer);
                }
            );
        });
    }

    getAllAnswersByQuestion(questionId: number): Promise<Answer[]> {
        return new Promise((resolve, reject) => {
            pool.query('SELECT * FROM Answers WHERE question_id = ?', [questionId], (err, results: RowDataPacket[]) => {
                if (err) {
                    console.error("Failed to get answers", err);
                    return reject(err);
                }

                if (Array.isArray(results) && results.length > 0 && Array.isArray(results[0])) {
                    return reject(new Error('Unexpected result format'));
                }
                resolve(results as Answer[]);
            });
        });
    }

    getAllAnswers(): Promise<Answer[]> {
        return new Promise((resolve, reject) => {
            pool.query('SELECT * FROM Answers', (err, results: RowDataPacket[]) => {
                if (err) {
                    return reject(err);
                }

                if (Array.isArray(results) && results.length > 0 && Array.isArray(results[0])) {
                    return reject(new Error('Unexpected result format'));
                }
                resolve(results as Answer[]);
            });
        });
    }

    updateAnswer(answerId: number, userId: number, answer: string) {
        return new Promise<void>((resolve, reject) => {
            const checkOwnershipQuery = 'SELECT * FROM Answers WHERE answer_id = ? AND user_id = ?';

            pool.query(checkOwnershipQuery, [answerId, userId], (err, res: RowDataPacket[]) => {
                if (err) {
                    console.error("Failed to get answer", err);
                    return reject(err);
                }

                if (res.length === 0) {
                    return reject(new Error('No answer found with this ID for the user'));
                }
    
                const updateQuery = 'UPDATE Answers SET body = ? WHERE answer_id = ? AND user_id = ?';
                pool.query(updateQuery, [answer, answerId, userId], (updateErr, updateRes: ResultSetHeader) => {
                    if (updateErr) {
                        console.error("Failed to update answer", err);
                        return reject(updateErr);
                    }
                    if (updateRes.affectedRows === 0) {
                        return reject(new Error('Answer could not be updated'));
                    }
                    resolve();
                });
            });
        });
    }

    deleteAnswer(answerId: number, userId: number): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const query = 'DELETE FROM Answers WHERE answer_id = ? AND user_id = ?';

            pool.query(query, [answerId, userId], (err, res: ResultSetHeader) => {
                if (err) {
                    return reject(err);
                }
                
                if (res.affectedRows === 0) {
                    return reject(new Error('No answer found with the given ID for this user, or you do not have the permission to delete it.'));
                }
                resolve(true);
            });
        });
    }

    getAnswerCount(questionId: number): Promise<number> {
        return new Promise((resolve, reject) => {
            pool.query('SELECT COUNT(*) AS count FROM Answers WHERE question_id=?', [questionId], (err, res: RowDataPacket[]) =>{
                if(err) return reject(err)
                console.log(res[0].count);
                
                resolve(res[0].count)
            } )
        }) 
    }
}

class TagService {
    getAll(){
        return new Promise<Tag[]>((resolve, reject) => {
            const query = 'SELECT Tags.*, COUNT(QuestionTags.tag_id) AS count FROM Tags LEFT JOIN QuestionTags ON Tags.tag_id = QuestionTags.tag_id GROUP BY Tags.tag_id'
            pool.query(query,(err, result: RowDataPacket[]) => {
                if(err) return reject(err)
                resolve(result as Tag[])
            })
        })
    }
    
    get(id: number) {
        return new Promise<Tag>((resolve, reject) => {
            pool.query('SELECT * FROM Tags WHERE tag_id=?',[id],(err, result: RowDataPacket[]) => {
                if(err) return reject(err)
                resolve(result[0] as Tag)
            })
        })
    }

    create(text: string) {
        console.log(text);
        
        return new Promise<Tag>((resolve, reject) => {
            pool.query('INSERT INTO Tags (name) VALUES (?)',[text],async  (err, result: ResultSetHeader) => {
                if(err) return reject(err)
                const newTag = await this.get(result.insertId)
                resolve(newTag)
            })
        })
    }
    getQuestionTags(questionId: number) {
        return new Promise<Tag[]>((resolve, reject) => {
            pool.query('SELECT * FROM Tags INNER JOIN QuestionTags ON Tags.tag_id = QuestionTags.tag_id WHERE QuestionTags.question_id=?', [questionId], (err, result: RowDataPacket[]) => {
                if(err) return reject(err)
                resolve(result as Tag[])
            })
        })
    }
    createQuestionTags(questionId: number, tagId: number) {
        return new Promise<number>((resolve, reject) => {
            pool.query('INSERT INTO QuestionTags (question_id, tag_id) VALUES (?, ?)', [questionId, tagId], (err, res: ResultSetHeader) => {
                if (err) return reject(err);
                resolve(res.insertId)
            })
        })
    }

    deleteQuestionTags(questionId: number, tagId: number) {
        return new Promise<void>((resolve, reject) => {
            pool.query('DELETE FROM QuestionsTags WHERE question_id = ? AND tag_id = ?', [questionId, tagId], (err, res: ResultSetHeader) => {
                if(err) return reject(err)
                resolve()
            })
        })
    }
}

export const answerService = new AnswerService()
export const authService = new AuthService();
export const profileService = new ProfileService();
export const questionService = new QuestionService();
export const tagService = new TagService();

