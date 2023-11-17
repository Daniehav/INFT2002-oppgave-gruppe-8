import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import pool from '../src/mysql-pool';
import app from '../src/app';
import { authService, questionService, profileService, tagService, answerService, } from '../src/service';
import { User } from '../src/routers/auth-router';
import { Question } from '../src/routers/question-router';
import { Profile } from '../src/routers/profile-router';
import { Tag } from '../src/routers/tag-router'
import { Answer } from '../src/routers/answer-router';
import crypto from 'crypto';

axios.defaults.baseURL = 'http://localhost:3001/api/v1';

let webServer: any;
beforeAll((done) => {
  webServer = app.listen(3001, () => done());
});
interface TestQuestion extends Question {tags: number[]}
const testQuestions: TestQuestion[] = [
    {question_id:  1, user_id: 3, title: 'hvilken bokstav kommer etter a i alfabetet', body: 'jeg prøver å lære meg en viss sang, men har glemt teksten', views: 2, created_at: new Date(), updated_at: new Date(),tags:[2]},
    {question_id:  2, user_id: 2, title: 'hva er 2+2?', body: 'jeg har allerede prøvd å gjette meg fram til svaret, har noen en bedre løsning?', views: 1, created_at: new Date(), updated_at: new Date(),tags:[1]},
    {question_id:  3, user_id: 2, title: 'er fluesopp spiselig?', body: 'jeg gikk ut ifra at de var det ettersom de ser så fargerike ut, men jeg begynner å føle meg litt rar', views: 3, created_at: new Date(), updated_at: new Date(),tags:[3]},
    {question_id:  4, user_id: 1, title: 'regne ut antall epler', body: 'hvis jeg har tre epler, og jeg får to til, hvor mange epler har jeg da?', views: 0, created_at: new Date(), updated_at: new Date(),tags:[3]},
];
const testTags: Tag[] = [
    {tag_id: 1, tag: 'matte', count: 1, created_at: new Date, updated_at: new Date},
    {tag_id: 2, tag: 'alfabet', count: 0, created_at: new Date, updated_at: new Date},
    {tag_id: 3, tag: 'mat', count: 0, created_at: new Date, updated_at: new Date},
];
const testAnswers: Answer[] = [
    {answer_id: 1, question_id: 1, user_id: 1, answer: 'l', upvotes: 0, downvotes: 0, accepted: false},
    {answer_id: 2, question_id: 1, user_id: 2, answer: 'b', upvotes: 0, downvotes: 0, accepted: true},
    {answer_id: 3, question_id: 3, user_id: 1, answer: 'fluesopp er ikke spiselig, oppsøk legevakta øyeblikkelig', upvotes: 0, downvotes: 0, accepted: true},
    {answer_id: 4, question_id: 2, user_id: 3, answer: '22', upvotes: 0, downvotes: 0, accepted: false},
];

function hashPassword(salt: Buffer, password: string) {
    return new Promise<Buffer>((resolve, reject) => {
        crypto.pbkdf2(password, salt, 310000, 32, 'sha256', (err, hashedPassword) => {
            if(err) return reject(err);
            resolve(hashedPassword)
        })
    })
}
interface TestUser extends User {password: string}
const testUsers: TestUser[] = [
    {user_id: 1, email: '', username: '', password: 'password1', salt:  crypto.randomBytes(16), hashed_password: null},
    {user_id: 2, email: '', username: '', password: 'password2', salt:  crypto.randomBytes(16), hashed_password: null},
    {user_id: 3, email: '', username: '', password: 'password3', salt:  crypto.randomBytes(16), hashed_password: null},
];
const testProfiles: Profile[] = [
    {id: 1, user_id: 1, profile_picture: null, bio: '', level: 1, points: 0},
    {id: 2, user_id: 2, profile_picture: null, bio: '', level: 1, points: 0},
    {id: 3, user_id: 3, profile_picture: null, bio: '', level: 1, points: 0},
];


const truncateQuery = `
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE UserVotes;
TRUNCATE TABLE Favorites;
TRUNCATE TABLE QuestionComments;
TRUNCATE TABLE AnswerComments;
TRUNCATE TABLE QuestionTags;
TRUNCATE TABLE Answers;
TRUNCATE TABLE Questions;
TRUNCATE TABLE UserProfiles;
TRUNCATE TABLE Users;
TRUNCATE TABLE Tags;`

beforeEach((done) => {
    try {
        
        pool.query(truncateQuery, async (error) => {
            if (error) return done(error);
            
            const createTags = async () => {
                for (const tag of testTags) {
                    await tagService.create(tag.tag);
                }
            };
            await createTags()
            const createUsers = async () => {
                for (const user of testUsers) {
                    await axios.post('/auth/signup',{username: user.username, password: user.password, email: user.email})
                }
            }
            await createUsers()
            const createQuestions = async () => {
                for (const question of testQuestions) {
                    await questionService.createQuestion(question.user_id, question.title, question.body, question.tags);
                }
            };
            await createQuestions()
            const createAnswers = async () => {
                for (const answer of testAnswers) {
                    await answerService.createAnswer(answer.user_id, answer.question_id, answer.answer);
                }
            };
            await createAnswers()
            pool.query('SET FOREIGN_KEY_CHECKS = 1;',(err) => {
                if(err) return done(err)
                done()
            });   
        });
    } catch (error) {
        console.log(error);
    }
});


afterAll((done) => {
    if (!webServer) return done(new Error());
    webServer.close(() => pool.end(() => done()));
});

function mapQuestionToTitle(questions: Question[]) {
    return questions.map((q: Question) => q.title) 
}

describe('Fetch questions (GET)', () => {
    
    //tester ikke hele objekter, fordi datoen vil ikke være like (datoene i databasen blir satt senere enn i test objektene)
    test('Fetch question by question_id (200 OK)', (done) => {
        axios.get('/questions/2').then((res) => {
            expect(res.status).toEqual(200);
            expect(res.data.title).toEqual(testQuestions[1].title);
            done();
        });
    });
    test('Fetch questions through search (200 OK)', (done) => {
        axios.get('/questions/search/hv').then((res) => {
            const questions = mapQuestionToTitle(res.data)           
            expect(res.status).toEqual(200);
            expect(questions).toEqual([testQuestions[0].title, testQuestions[1].title]);
            done();
        });
    });
    test('Fetch a preview of filtered questions (200 OK)', (done) => {
        axios.get('/questions/preview/unanswered').then((res) => {
            const questions = mapQuestionToTitle(res.data)           
            expect(res.status).toEqual(200);
            expect(questions).toEqual([testQuestions[3].title]);
            done();
        });
    });
    test('Fetch filtered questions (200 OK)', (done) => {
        axios.get('/questions/filter/popular').then((res) => {
            const questions = mapQuestionToTitle(res.data)   
            expect(res.status).toEqual(200);
            expect(questions).toEqual([testQuestions[0].title, testQuestions[1].title, testQuestions[2].title]);
            done();
        });
    });
    test('Fetch questions by tag (200 OK)', (done) => {
        axios.get('/questions/filter/tag/mat').then((res) => {
            const questions = mapQuestionToTitle(res.data)   
            expect(res.status).toEqual(200);
            expect(questions).toEqual([testQuestions[2].title, testQuestions[3].title]);
            done();
        });
    });
    // feiltester
    test('Fetch question by question_id (404 not found)', (done) => {
        axios.get('/questions/5').then((res) => {
            done()
        }).catch(err => {
            expect(err.response.status).toEqual(404);
            expect(err.response.data).toEqual('Question not found');
            done();
        }) 
    });
    // test('Fetch a preview of filtered questions (500 Internal Server Error)', (done) => {
    //     axios.get('/questions/preview/unanswered').then((res) => {
    //         expect(res.status).toEqual(500);
    //         expect(res.data).toEqual('Internal Server Error');
    //         done();
    //     });
    // });
    // test('Fetch filtered questions (500 Internal Server Error)', (done) => {
    //     axios.get('/questions/filter/popular').then((res) => {
    //         expect(res.status).toEqual(500);
    //         expect(res.data).toEqual('Internal Server Error');
    //         done();
    //     });
    // });
    // test('Fetch questions by tag (500 Internal Server Error)', (done) => {
    //     axios.get("/questions/filter/tag/mat").then((res) => {
    //         expect(res.status).toEqual(500);
    //         expect(res.data).toEqual('Internal Server Error');
    //         done();
    //     });
    // });
});

describe('Create questions (POST)', () => {
    test('Create question (201 OK)', (done) => {
        axios.post('/questions', {user_id: 1, title: 'testspørsmål', body: 'kan jeg få et svar?', tags: [1]}, {headers: {id: 1}}).then((res) => {
            expect(res.status).toEqual(201);
            expect(res.data).toEqual(5);
            done()
        });
        
    });
    test('Create question (400 Invalid Requset)', (done) => {
        axios.post('/questions', {user_id: 9, title: 'testspørsmål', body: 'kan jeg få et svar?', tags: [1]}, {headers: {id: 9}}).catch((err) => {
            expect(err.response.status).toEqual(400);
            done();
        });
    });
    test.skip('Create question (500 Internal Server Error)', (done) => {
        axios.post('/', {user_id: 9, body: 'et tittel obligatorisk?', tags: [1]}).then((res) => {
            expect(res.status).toEqual(500);
            expect(res.data).toEqual('Internal Server Error');
            done();
        });
    });
});
describe('Delete questions (DELETE)', () => {
    test('Delete question (200 OK)', (done) => {
        axios.delete('/questions/4').then((res) => {
            expect(res.status).toEqual(204);
            done();
        })
    });
    test('Delete question (404 Not Found)', (done) => {
        axios.delete('/questions/7').catch((err) => {
            expect(err.response.status).toEqual(404);
            expect(err.response.data).toEqual('Question not found');
            done();
        });
    });
});
describe('Update questions (PUT)', () => {
    test('Edit question (200 OK)', (done) => {
        axios.put('/questions/1', {question_id: 1, user_id: 3, title: 'hvilken bokstav kommer etter a i alfabetet?', body: 'jeg prøver å lære meg en viss sang, men har glemt teksten'}, {headers: {id: 3}}).then((res) => {
            expect(res.status).toEqual(200);
            done();
        });
    });
    test('Edit question (404 Question not found)', (done) => {
        axios.put('/questions/7', {question_id: 7, user_id: 3, title: 'hvilken bokstav kommer etter a i alfabetet?', body: 'jeg prøver å lære meg en viss sang, men har glemt teksten'}, {headers: {id: 3}}).catch((res) => {
            expect(res.response.status).toEqual(404);
            done();
        });
    });
        
    test.skip('Edit question (500 Internal Server Error)', (done) => {
        axios.put('/questions/1', {question_id: 1, user_id: 3, title: 'hvilken bokstav kommer etter a i alfabetet?', body: 'jeg prøver å lære meg en viss sang, men har glemt teksten'}).then((res) => {
            expect(res.status).toEqual(500);
            expect(res.data).toEqual('Internal Server Error');
            done();
        });
    });
});
describe('Fetch answers (GET)', () => {
    test.skip('Fetch all answers by question_id (200 OK)', (done) => {
        axios.get('/answers/question/1').then((res) => {
            expect(res.status).toEqual(200);
            expect(res.data).toEqual([testAnswers[0], testAnswers[1]]);
            done();
        });
    });
    test.skip('Fetch answer by answer_id (200 OK)', (done) => {
        axios.get('/answers/2').then((res) => {
            expect(res.status).toEqual(200);
            expect(res.data).toEqual(testAnswers[1]);
            done();
        });
    });
    test.skip('Fetch all answers by question_id (500 Internal Server Error)', (done) => {
        axios.get('/answers/question/a').then((res) => {
            expect(res.status).toEqual(500);
            expect(res.data).toEqual('Internal Server Error');
            done();
        });
    });
    test.skip('Fetch answer by answer_id (404 Answer Not Found)', (done) => {
        axios.get('/answers/9').then((res) => {
            expect(res.status).toEqual(404);
            expect(res.data).toEqual('Answer Not Found');
            done();
        });
    });
    test.skip('Fetch answer by answer_id (500 Internal Server Error)', (done) => {
        axios.get('/answers/a').then((res) => {
            expect(res.status).toEqual(500);
            expect(res.data).toEqual('Internal Server Error');
            done();
        });
    });
});
describe('Create answer (POST)', () => {
    test.skip('Create answer (201 OK)', (done) => {
        axios.post('/', {questionId: 1, answer: 'jeg er usikker'}).then((res) => {
            expect(res.status).toEqual(201);
            expect(res.data).toEqual({userId: 1, questionId: 1, answer: 'jeg er usikker'});
            done();
        });
    });
    test.skip('Create answer (400 Invalid user ID)', (done) => {
        axios.post('/', {userId: 1, questionId: 1, answer: 'jeg er usikker'}).then((res) => {
            expect(res.status).toEqual(400);
            expect(res.data).toEqual('Invalid user ID');
            done();
        });
    });
    test.skip('Create answer (500 Internal Server Error)', (done) => {
        axios.post('/', {answer: 'jeg er usikker'}).then((res) => {
            expect(res.status).toEqual(500);
            expect(res.data).toEqual('Internal Server Error');
            done();
        });
    });
});
describe('Delete answer (DELETE)', () => {

});
describe('Edit answer (PUT)', () => {

});
describe('Fetch tags (GET)', () => {

});
describe('Create tag (POST)', () => {

});
describe('Create and authorize user (GET, POST)', () => {

});
describe('Fetch user (GET)', () => {

});
describe('Update user (PUT)', () => {

});