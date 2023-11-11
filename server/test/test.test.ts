import axios from 'axios';
import pool from '../src/mysql-pool';
import app from '../src/app';
import { authService, questionService, profileService } from '../src/service';
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

const testQuestions: Question[] = [
    {question_id:  1, user_id: 3, title: 'hvilken bokstav kommer etter a i alfabetet', body: 'jeg prøver å lære meg en viss sang, men har glemt teksten', views: 2, created_at: new Date, updated_at: new Date},
    {question_id:  2, user_id: 2, title: 'hva er 2+2?', body: 'jeg har allerede prøvd å gjette meg fram til svaret, har noen en bedre løsning?', views: 1, created_at: new Date, updated_at: new Date},
    {question_id:  3, user_id: 2, title: 'er fluesopp spiselig?', body: 'jeg gikk ut ifra at de var det ettersom de ser så fargerike ut, men jeg begynner å føle meg litt rar', views: 3, created_at: new Date, updated_at: new Date},
    {question_id:  4, user_id: 1, title: 'regne ut antall epler', body: 'hvis jeg har to epler, og jeg får to til, hvor mange epler har jeg da?', views: 0, created_at: new Date, updated_at: new Date},
];
const testTags: Tag[] = [
    {tag_id: 1, tag: 'matte', count: 1, created_at: new Date, updated_at: new Date},
    {tag_id: 2, tag: 'alfabet', count: 0, created_at: new Date, updated_at: new Date},
    {tag_id: 3, tag: 'mat', count: 0, created_at: new Date, updated_at: new Date},
];
const testAnswers: Answer[] = [
    {answer_id: 1, question_id: 1, user_id: 1, answer: 'l', upvotes: '', downvotes: '', accepted: false},
    {answer_id: 2, question_id: 1, user_id: 2, answer: 'b', upvotes: '', downvotes: '', accepted: true},
    {answer_id: 3, question_id: 3, user_id: 1, answer: 'fluesopp er ikke spiselig, oppsøk legevakta øyeblikkelig', upvotes: '', downvotes: '', accepted: true},
    {answer_id: 4, question_id: 2, user_id: 3, answer: '22', upvotes: '', downvotes: '', accepted: false},
];
const userSalt = [
    {salt: crypto.randomBytes(16)},
    {salt: crypto.randomBytes(16)},
    {salt: crypto.randomBytes(16)},
];
// må håndtere feil bedre (slette elementet som ga problem?)
function hashPassword(index: number, password: string) {
    crypto.pbkdf2(password, userSalt[index].salt, 310000, 32, 'sha256', (err, hashedPassword) => {if(err) return err;return hashedPassword})
}
/*
const testUsers: User[] = [
    {user_id: 1, email: '', username: '', hashed_password: hashPassword(0, 'passord1'), salt: userSalt[0].salt},
    {user_id: 2, email: '', username: '', hashed_password: hashPassword(1, 'passord2'), salt: userSalt[1].salt},
    {user_id: 3, email: '', username: '', hashed_password: hashPassword(2, 'passord3'), salt: userSalt[2].salt},
];
const testProfiles: Profile[] = [
    {id: 1, user_id: 1, profile_picture: '', bio: '', level: 1, points: 0},
    {id: 2, user_id: 2, profile_picture: '', bio: '', level: 1, points: 0},
    {id: 3, user_id: 3, profile_picture: '', bio: '', level: 1, points: 0},
];
*/
// testComments, testQuestionTags, testFavorites, testUserVotes må legges til og defineres




// det er fortsatt en rekke problemer med å trunkere tabellene
beforeEach((done) => {
    pool.query('ALTER TABLE Answers DROP CONSTRAINT question_id', (error) => {
      if (error) return done(error);
      pool.query('TRUNCATE TABLE Questions', (error) => {
        if (error) return done(error);
        pool.query('ALTER TABLE Answers FOREIGN KEY (question_id) REFERENCES Questions(question_id) ON DELETE CASCADE', (error) => {
          if (error) return done(error);

          questionService
            .createQuestion(testQuestions[0].user_id, testQuestions[0].title, testQuestions[0].body, [2])
            .then(() => questionService.createQuestion(testQuestions[1].user_id, testQuestions[1].title, testQuestions[1].body, [1]))
            .then(() => questionService.createQuestion(testQuestions[2].user_id, testQuestions[2].title, testQuestions[2].body, [3]))
            .then(() => questionService.createQuestion(testQuestions[3].user_id, testQuestions[3].title, testQuestions[3].body, [1,3]))
            .then(() => done());
        });
      });
    });
  });

afterAll((done) => {
    if (!webServer) return done(new Error());
    webServer.close(() => pool.end(() => done()));
});

describe('Fetch questions (GET)', () => {
    test('Fetch all questions (200 OK)', (done) => {
        axios.get('/questions/').then((res) => {
            expect(res.status).toEqual(200);
            expect(res.data).toEqual(testQuestions);
            done();
        });
    });
    test.skip('Fetch question by question_id (200 OK)', (done) => {
        axios.get('/questions/2').then((res) => {
            expect(res.status).toEqual(200);
            expect(res.data).toEqual(testQuestions[1]);
            done();
        });
    });
    /*
    test.skip('Fetch questions through search (200 OK)', (done) => {
        axios.get('/questions/search/er').then((res) => {
            expect(res.status).toEqual(200);
            expect(res.data).toEqual([testQuestions[1], testQuestions[2]]);
            done();
        });
    });
    */
    test.skip('Fetch a preview of filtered questions (200 OK)', (done) => {
        axios.get('/questions/preview/unanswered').then((res) => {
            expect(res.status).toEqual(200);
            expect(res.data).toEqual([testQuestions[3]]);
            done();
        });
    });
    test.skip('Fetch filtered questions (200 OK)', (done) => {
        axios.get('/questions/filter/popular').then((res) => {
            expect(res.status).toEqual(200);
            expect(res.data).toEqual([testQuestions[2], testQuestions[0], testQuestions[1], testQuestions[3]]);
            done();
        });
    });
    test.skip('Fetch questions by tag (200 OK)', (done) => {
        axios.get('/questions/filter/tag/mat').then((res) => {
            expect(res.status).toEqual(200);
            expect(res.data).toEqual([testQuestions[2], testQuestions[3]]);
            done();
        });
    });
    // feiltester
    test.skip('Fetch all questions (500 internal server error)', (done) => {
        axios.get('/questions/').then((res) => {
            expect(res.status).toEqual(500);
            expect(res.data).toEqual(testQuestions);
            done();
        });
    });
    test.skip('Fetch question by question_id (404 not found)', (done) => {
        axios.get('/questions/5').then((res) => {
            expect(res.status).toEqual(404);
            expect(res.data).toEqual('Question not found');
            done();
        });
    });
    /*
    test.skip('Fetch questions through search (200 OK)', (done) => {
        axios.get('/questions/search/er').then((res) => {
            expect(res.status).toEqual(200);
            expect(res.data).toEqual([testQuestions[1], testQuestions[2]]);
            done();
        });
    });
    */
    test.skip('Fetch a preview of filtered questions (500 Internal Server Error)', (done) => {
        axios.get('/questions/preview/unnswered').then((res) => {
            expect(res.status).toEqual(500);
            expect(res.data).toEqual('Internal Server Error');
            done();
        });
    });
    test.skip('Fetch filtered questions (500 Internal Server Error)', (done) => {
        axios.get('/questions/filter/ppular').then((res) => {
            expect(res.status).toEqual(500);
            expect(res.data).toEqual('Internal Server Error');
            done();
        });
    });
    test.skip('Fetch questions by tag (500 Internal Server Error)', (done) => {
        axios.get("/questions/filter/tag/ma").then((res) => {
            expect(res.status).toEqual(500);
            expect(res.data).toEqual('Internal Server Error');
            done();
        });
    });
});
describe('Create questions (POST)', () => {
    test.skip('Create question (200 OK)', (done) => {
        axios.post('/', {user_id: 1, title: 'testspørsmål', body: 'kan jeg få et svar?', tags: [1]}).then((res) => {
            expect(res.status).toEqual(201);
            expect(res.data).toEqual('5');
            done();
        });
    });
    test.skip('Create question (400 Not Found)', (done) => {
        axios.post('/', {user_id: 9, title: 'testspørsmål', body: 'kan jeg få et svar?', tags: [1]}).then((res) => {
            expect(res.status).toEqual(400);
            expect(res.data).toEqual('Invalid user ID');
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
    test.skip('Delete question (200 OK)', (done) => {
        axios.delete('/questions/5').then((res) => {
            expect(res.status).toEqual(204);
            done();
        })
    });
    test.skip('Delete question (404 Not Found)', (done) => {
        axios.delete('/questions/7').then((res) => {
            expect(res.status).toEqual(404);
            expect(res.data).toEqual('Question not found');
            done();
        });
    });
});
describe('Update questions (PUT)', () => {
    test.skip('Edit question (200 OK)', (done) => {
        axios.put('/questions/1', {question_id: 1, user_id: 3, title: 'hvilken bokstav kommer etter a i alfabetet?', body: 'jeg prøver å lære meg en viss sang, men har glemt teksten'}).then((res) => {
            expect(res.status).toEqual(200);
            expect(res.data).toEqual({question_id: 1, user_id: 3, title: 'hvilken bokstav kommer etter a i alfabetet?', body: 'jeg prøver å lære meg en viss sang, men har glemt teksten'});
            done();
        });
    });
    test.skip('Edit question (404 Question not found)', (done) => {
        axios.put('/questions/7', {question_id: 7, user_id: 3, title: 'hvilken bokstav kommer etter a i alfabetet?', body: 'jeg prøver å lære meg en viss sang, men har glemt teksten'}).then((res) => {
            expect(res.status).toEqual(404);
            expect(res.data).toEqual('Question not found');
            done();
        });
    });
    test.skip('Edit question (400 Invalid User ID)', (done) => {
        axios.put('/questions/1', {question_id: 1, user_id: 8, title: 'hvilken bokstav kommer etter a i alfabetet?', body: 'jeg prøver å lære meg en viss sang, men har glemt teksten'}).then((res) => {
            expect(res.status).toEqual(400);
            expect(res.data).toEqual('Invalid User ID');
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

});
describe('Create answer (POST)', () => {

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