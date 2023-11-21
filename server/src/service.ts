import pool from './mysql-pool';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import { User } from './routers/auth-router';
import { Question } from './routers/question-router';
import { Profile } from './routers/profile-router';
import { Answer, Vote, Favorite } from './routers/answer-router';
import { Tag } from './routers/tag-router'
import { QuestionComment, AnswerComment } from './routers/comment-router';


// All database calls related to authentification
class AuthService {
    createUser(username: string, email: string, hashedPassword: Buffer, salt: Buffer) {
        return new Promise<User>((resolve, reject) => {
            pool.query('INSERT INTO Users (username, email, hashed_password, salt) VALUES (?, ?, ?, ?)', [ username, email, hashedPassword, salt], (err, result: ResultSetHeader) => {
                if (err) return reject(err);
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

// All database calla related to questions
class QuestionService {
    createQuestion(userId: number, title: string, body: string, tags: number[]) {
        return new Promise<number>((resolve, reject) => {
            const query = 'INSERT INTO Questions (user_id, title, body) VALUES (?, ?, ?)';
            pool.query(query, [userId, title, body], (err, res: ResultSetHeader) => {
                if (err) {
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

    search(query: string){
        query = '%'+query+'%';
        return new Promise<Question[]>((resolve, reject) => {
            pool.query("SELECT * FROM Questions WHERE (title) LIKE (?)", [query], (err, results: RowDataPacket[]) => {
                if (err) return reject(err);
                
                resolve(results as Question[])
            });
        });
    }

    getFilteredQuestions(filter: string, preview: boolean, tag?: string): Promise<Question[]> {
        let query: string = ''

        switch (filter) {
            case 'popular':
                query = 'SELECT Questions.*, COUNT(Answers.question_id) AS answer_count FROM Questions INNER JOIN Answers ON Questions.question_id = Answers.question_id GROUP BY Questions.question_id ORDER BY answer_count DESC'
                break;
            case 'recent':
                query = 'SELECT Questions.*, COUNT(Answers.question_id) AS answer_count FROM Questions LEFT JOIN Answers ON Questions.question_id = Answers.question_id GROUP BY Questions.question_id ORDER BY created_at DESC'
                break;
            case 'unanswered':
                query = 'SELECT Questions.*, COUNT(Answers.question_id) AS answer_count FROM Questions LEFT JOIN Answers ON Questions.question_id = Answers.question_id WHERE Answers.question_id IS NULL GROUP BY Questions.question_id'
                break;
            case 'tag':
                query = 'SELECT Questions.* FROM Questions INNER JOIN QuestionTags ON Questions.question_id = QuestionTags.question_id INNER JOIN Tags ON QuestionTags.tag_id = Tags.tag_id WHERE Tags.name =?'
        }

        if(preview) {
            query += ' LIMIT 8'
        }
        

        return new Promise((resolve, reject) => {
            pool.query(query, tag? [tag] : [], (err, res: RowDataPacket[]) => {
                if(err) return reject(err)
                resolve(res as Question[])
            })
        })
    }

    acceptAnswer(answerId: number, userId: number) {
        return new Promise<void>((resolve, reject) => {
            pool.query('UPDATE Answers SET accepted= NOT accepted WHERE answer_id=?',[answerId], async (err, res: ResultSetHeader) => {
                if(err) return reject(err)
                const isAccepted = await questionService.getIsAccepted(answerId) 
                await profileService.increasePoints(userId, isAccepted? 5 : -5)
                resolve()
            })
        })
    }

    getIsAccepted(answerId: number) {
        return new Promise<boolean>((resolve, reject) => {
            pool.query('SELECT accepted FROM Answers WHERE answer_id=?',[answerId], (err, res: RowDataPacket[]) => {
                if(err) return reject(err)
                
                resolve(res[0].accepted as boolean)
            })
        })
    }
}

// All database calls related to user profiles
class ProfileService {

    createProfile(userId: number, username: string) {
        return new Promise<void>((resolve, reject) => {
            pool.query('INSERT INTO UserProfiles (user_id, display_name) VALUES (?, ?)', [userId, username], (err) => {
                if (err) return reject(err);
                resolve()
            });
        })
    }

    updateProfile(userId: number, bio: string, pfp: string, displayName: string) {
        const args = pfp && pfp !== 'null'? [bio, pfp, displayName, userId] : [bio, displayName, userId]
        return new Promise<void>((resolve, reject) => {
            pool.query(`UPDATE UserProfiles SET bio=?${pfp && pfp !== 'null'? ', profile_picture=?' : ''},display_name=? WHERE user_id=?`, args, (err) => {
                if (err) return reject(err);
                resolve()
            });
        })
    }
    
    getProfile(userId: number) {
        return new Promise<Profile>((resolve, reject) => {
            pool.query('SELECT Users.username, UserProfiles.* FROM UserProfiles JOIN Users ON Users.user_id = UserProfiles.user_id WHERE UserProfiles.user_id=?', [userId], (err, result: RowDataPacket[]) => {
                if (err) return reject(err);
                resolve(result[0] as Profile)
            });
        })
    }
    getProfileByUsername(username: string) {
        return new Promise<Profile>((resolve, reject) => {
            pool.query('SELECT Users.username, UserProfiles.* FROM UserProfiles JOIN Users ON Users.user_id = UserProfiles.user_id WHERE Users.username =?', [username], (err, result: RowDataPacket[]) => {
                if (err) return reject(err);
                resolve(result[0] as Profile)
            });
        })
    }

    increasePoints(userId: number, amount: number) {
        return new Promise<void>((resolve, reject) => {
            pool.query('UPDATE UserProfiles SET points=points+? WHERE user_id=?',[amount,userId], (err, res) => {
                if(err) return reject(err)
                resolve()
            })
        })
    }
}

// All database calls related to answers
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
            pool.query('SELECT Answers.*, COUNT(CASE WHEN uv.vote_type = "upvote" THEN 1 END) AS upvotes, COUNT(CASE WHEN uv.vote_type = "downvote" THEN 1 END) AS downvotes FROM Answers LEFT JOIN UserVotes uv ON Answers.answer_id = uv.answer_id WHERE Answers.question_id = ? GROUP BY Answers.answer_id;', [questionId], (err, results: RowDataPacket[]) => {
                if (err) {
                    console.error("Failed to get answers", err);
                    return reject(err);
                }

                console.log(results);
                
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
                    return reject(new Error('No answer found'));
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
                resolve(res[0].count)
            } )
        }) 
    }
    getVote(answerId: number, userId: number): Promise<Vote> {
        return new Promise((resolve, reject) => {
            pool.query('SELECT * FROM UserVotes WHERE user_id=? AND answer_id=?',[userId, answerId], (err, res: RowDataPacket[]) => {
                if(err) return reject(err)
                resolve(res[0] as Vote)
            })
        })
    }
    setVote(answerId: number, userId: number, vote: 'upvote' | 'downvote'): Promise<number> {
        return new Promise((resolve, reject) => {
            pool.query('INSERT INTO UserVotes (vote_type, answer_id, user_id) VALUES (?, ?, ?)',[vote, answerId, userId], (err, res: ResultSetHeader) => {
                if(err) return reject(err)
                if(vote == 'upvote') {
                    profileService.increasePoints(userId, vote == 'upvote'? 1 : -1)
                }
                resolve(res.insertId)
            })
        })
    }
    updateVote(answerId: number, userId: number, vote: 'upvote' | 'downvote'): Promise<void> {
        return new Promise((resolve, reject) => {
            pool.query('UPDATE UserVotes (vote) VALUES (?) WHERE answer_id=? AND user_id=?',[vote, answerId, userId], (err, res: ResultSetHeader) => {
                if(err) return reject(err)
                profileService.increasePoints(userId, vote == 'upvote'? 1 : -1)
                resolve()
        })
    })
}
    deleteVote(answerId: number, userId: number): Promise<void> {
        return new Promise((resolve, reject) => {
            pool.query('DELETE FROM UserVotes WHERE answer_id=? AND user_id=?',[answerId, userId], (err, res: ResultSetHeader) => {
                if(err) return reject(err)
                resolve()
        })
    })
}
    getFavorite(answerId: number, userId: number): Promise<Favorite> {
        return new Promise((resolve, reject) => {
            pool.query('SELECT * FROM Favorites WHERE user_id=? AND answer_id=?',[userId, answerId], (err, res: RowDataPacket[]) => {
                if(err) return reject(err)
                resolve(res[0] as Favorite)
            })
        })
    }
    setFavorite(answerId: number, userId: number): Promise<number> {
        return new Promise((resolve, reject) => {
            pool.query('INSERT INTO Favorites (answer_id, user_id) VALUES (?, ?)',[answerId, userId], (err, res: ResultSetHeader) => {
                if(err) return reject(err)
                resolve(res.insertId)
            })
        })
    }

    deleteFavorite(answerId: number, userId: number): Promise<void> {
        return new Promise((resolve, reject) => {
            pool.query('DELETE FROM Favorites WHERE answer_id=? AND user_id=?',[answerId, userId], (err, res: ResultSetHeader) => {
                if(err) return reject(err)
                resolve()
            })
        })
    }

}

// All database calls related to tags
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
            pool.query('DELETE FROM QuestionTags WHERE question_id = ? AND tag_id = ?', [questionId, tagId], (err, res: ResultSetHeader) => {
                if(err) return reject(err)
                resolve()
            })
        })
    }
}

// ALl database calls related to favorites
class FavoriteService{
    setFavorite(answerId: number, userId: number) {
        return new Promise<void>((resolve, reject) => {
            pool.query('INSERT INTO Favorites (answer_id, user_id) VALUES (?, ?)',[answerId, userId], (err, res) => {
                if(err) return reject(err)
                resolve()
            })
        })
    }
    deleteFavorite(answerId: number, userId: number) {
        return new Promise<void>((resolve, reject) => {
            pool.query('DELETE FROM Favorites WHERE answer_id=? AND user_id=?',[answerId, userId], (err, res) => {
                if(err) return reject(err)
                resolve()
            })
        })
    }

    getFavorite(answerId: number, userId: number) {
        return new Promise<boolean>((resolve, reject) => {
            pool.query('SELECT favorite_id FROM Favorites WHERE answer_id = ? AND user_id = ?',[answerId, userId], (err, res: RowDataPacket[]) => {
                if(err) return reject(err)
                if(res.length == 0) {
                    resolve(false)
                } else {
                    resolve(true)
                }
                
            })  
        })
    }

    getFavorites(userId: number){
        return new Promise<Answer[]> ((resolve, reject) => {
            pool.query('SELECT Answers.*, Questions.title AS question_title FROM Answers JOIN Favorites ON Answers.answer_id = Favorites.answer_id JOIN Questions ON Answers.question_id = Questions.question_id WHERE Favorites.user_id = ?',[userId], (err, res) => {
                if(err) return reject(err)
                resolve(res as Answer[])
            })  
        })
    }

    getFavoriteIds(userId: number) {
        return new Promise<number[]>((resolve, reject) => {
            pool.query('SELECT answer_id FROM Favorites WHERE user_id = ?',[userId], (err, res: RowDataPacket[]) => {
                if(err) return reject(err)
                const ids = res.map(v => v.answer_id)
                resolve(ids)
            })  
        }) 
    }
}

// All database calls related to comments
class CommentService {
    getQuestion(commentId: number) {
        return new Promise<QuestionComment>((resolve, reject) => {
            pool.query('SELECT * FROM QuestionComments WHERE comment_id=?',[commentId], (err, res: RowDataPacket[]) => {
                if(err) return reject(err)
                resolve(res[0] as QuestionComment)
            })
        })
    }
    getAnswer(commentId: number) {
        return new Promise<AnswerComment>((resolve, reject) => {
            pool.query('SELECT * FROM AnswerComments WHERE comment_id=?',[commentId], (err, res: RowDataPacket[]) => {
                if(err) return reject(err)
                resolve(res[0] as AnswerComment)
            })
        })
    }

    getAllQuestion(parentId: number) {
        return new Promise<QuestionComment[]>((resolve, reject) => {
            pool.query('SELECT * FROM QuestionComments WHERE question_id = ?',[parentId], (err, res: RowDataPacket[]) => {
                if(err) return reject(err)
                resolve(res as QuestionComment[])
            })
        })
    }
    getAllAnswer(answerId: number) {
        return new Promise<AnswerComment[]>((resolve, reject) => {
            pool.query('SELECT * FROM AnswerComments WHERE answer_id = ?',[answerId], (err, res: RowDataPacket[]) => {
                if(err) return reject(err)
                resolve(res as AnswerComment[])
            })
        })
    }

    editQuestion(commentId: number, body: string) {
        return new Promise<void>((resolve, reject) => {
            pool.query('UPDATE QuestionComments SET body=? WHERE comment_id=?',[body, commentId], (err, res: ResultSetHeader) => {
                if(err) return reject(err)
                resolve()
            })
        })
    }
    editAnswer(commentId: number, body: string) {
        return new Promise<void>((resolve, reject) => {
            pool.query('UPDATE AnswerComments SET body=? WHERE comment_id=?',[body, commentId], (err, res: RowDataPacket[]) => {
                if(err) return reject(err)
                resolve()
            })
        })
    }

    createQuestion(questionId: number, body: string, userId: number) {
        return new Promise<number>((resolve, reject) => {
            pool.query('INSERT INTO QuestionComments (body, question_id, user_id) VALUES (?, ?, ?)',[body, questionId, userId], (err, res: ResultSetHeader) => {
                if(err) return reject(err)
                resolve(res.insertId)
            })
        })
    }
    createAnswer(answerId: number, body: string, userId: number) {
        return new Promise<number>((resolve, reject) => {
            pool.query('INSERT INTO AnswerComments (body, answer_id, user_id) VALUES (?, ?, ?)',[body, answerId, userId], (err, res: ResultSetHeader) => {
                if(err) return reject(err)
                resolve(res.insertId)
            })
        })
    }

    deleteQuestion(commentId: number){
        return new Promise<void>((resolve, reject) => {
            pool.query('DELETE FROM QuestionComments WHERE comment_id=?',[commentId], (err, res) => {
                if(err) return reject(err)
                resolve()
            })
        })
    }
    deleteAnswer(commentId: number){
        return new Promise<void>((resolve, reject) => {
            pool.query('DELETE FROM AnswerComments WHERE comment_id=?',[commentId], (err, res) => {
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
export const favoriteService = new FavoriteService()
export const commentService = new CommentService()

