import * as React from 'react'
import { MemoryRouter, Router } from 'react-router-dom';
import { MemoryHistory, createMemoryHistory } from 'history';
import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import {AuthContext, ProfileContext, ThemeContext} from '../src/context/Context'
import { Profile, Question, Tag, Answer, QuestionComment, AnswerComment } from '../src/types';
import { answerService, commentService, favoriteService, questionService, tagService } from '../src/service';
import { CreateQuestion, QuestionDetails } from '../src/components/Questions';
import { AnswerDetails, Answers } from '../src/components/Answers';
import { Comments } from '../src/components/Comments';
import { Searchbar } from '../src/components/Searchbar';
import { Tags } from '../src/Home';

const testQuestions  = [
    {question_id:  1, user_id: 3, title: 'hvilken bokstav kommer etter a i alfabetet', body: 'jeg prøver å lære meg en viss sang, men har glemt teksten', views: 2, created_at: new Date(), updated_at: new Date(),tags:[2]},
    {question_id:  2, user_id: 2, title: 'hva er 2+2?', body: 'jeg har allerede prøvd å gjette meg fram til svaret, har noen en bedre løsning?', views: 1, created_at: new Date(), updated_at: new Date(),tags:[1]},
    {question_id:  3, user_id: 2, title: 'er fluesopp spiselig?', body: 'jeg gikk ut ifra at de var det ettersom de ser så fargerike ut, men jeg begynner å føle meg litt rar', views: 3, created_at: new Date(), updated_at: new Date(),tags:[3]},
    {question_id:  4, user_id: 1, title: 'regne ut antall epler', body: 'hvis jeg har tre epler, og jeg får to til, hvor mange epler har jeg da?', views: 0, created_at: new Date(), updated_at: new Date(),tags:[3]},
]

const testTags: Tag[] = [
    {tag_id: 1, name: 'matte', count: 1, created_at: new Date, updated_at: new Date},
    {tag_id: 2, name: 'alfabet', count: 0, created_at: new Date, updated_at: new Date},
    {tag_id: 3, name: 'mat', count: 0, created_at: new Date, updated_at: new Date},
];

const testAnswers: Answer[] = [
    {answer_id: 1, question_id: 1, user_id: 1, body: 'l er bokstaven som kommer etter a', upvotes: 5, downvotes: 3, accepted: false, created_at: new Date(), updated_at: new Date()},
    {answer_id: 2, question_id: 1, user_id: 2, body: 'tror b er neste bokstav', upvotes: 0, downvotes: 0, accepted: true, created_at: new Date(), updated_at: new Date()},
    {answer_id: 3, question_id: 3, user_id: 1, body: 'fluesopp er ikke spiselig, oppsøk legevakta øyeblikkelig', upvotes: 0, downvotes: 0, accepted: true, created_at: new Date(), updated_at: new Date()},
    {answer_id: 4, question_id: 2, user_id: 3, body: '22', upvotes: 0, downvotes: 0, accepted: false, created_at: new Date(), updated_at: new Date()},
];

const testQuestionComments: QuestionComment[] = [
    {comment_id: 1, question_id: 1, user_id: 1, body: 'a finnes ikke i alfabetet',  created_at: new Date(), updated_at: new Date()},
    {comment_id: 2, question_id: 1, user_id: 2, body: 'hjelp jeg har samme problem', created_at: new Date(), updated_at: new Date()},
    {comment_id: 3, question_id: 3, user_id: 1, body: 'vanligvis så står det på stammen om den er spiselig eller ikke', created_at: new Date(), updated_at: new Date()},
    {comment_id: 4, question_id: 2, user_id: 3, body: 'går ikke å regne fram, du må fortsette å gjette', created_at: new Date(), updated_at: new Date()},
];
const testAnswerComments: AnswerComment[] = [
    {comment_id: 1, answer_id: 1, user_id: 1, body: 'det er feil', created_at: new Date(), updated_at: new Date()},
    {comment_id: 2, answer_id: 1, user_id: 2, body: 'er du dum?', created_at: new Date(), updated_at: new Date()},
    {comment_id: 3, answer_id: 3, user_id: 1, body: 'oi det visste ikke jeg, takk', created_at: new Date(), updated_at: new Date()},
    {comment_id: 4, answer_id: 2, user_id: 3, body: 'tusen takk', created_at: new Date(), updated_at: new Date()},
];


jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useParams: jest.fn(),
}))

const defaultProfile: Profile = {
    display_name: "",
    id: 0,
    user_id: 0,
    profile_picture: null, // Replace with an actual default picture URL
    bio: "",
    level: 0,
    points: 0,
    username: "",
  };

const customRender = (children: React.ReactNode, profile: Profile, history: MemoryHistory) => {
    const setProfile = jest.fn()
    const isAuthenticated = true
    const setIsAuthenticated = jest.fn()
    const logOut = jest.fn()
    return render(
        <Router location={history.location} navigator={history}>
            <ProfileContext.Provider value={{profile, setProfile}}>
                <AuthContext.Provider value={{isAuthenticated, setIsAuthenticated, logOut}}>
                    {children}
                </AuthContext.Provider>
            </ProfileContext.Provider>
        </Router>
    )
}

// Mock implementations for QuestionService
jest.mock('../src/service', () => ({
    questionService: {
      get: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
      search: jest.fn(),
      getQuestionTags: jest.fn(),
      getQuestionsUser: jest.fn(),
      getPreview: jest.fn(),
      getFilter: jest.fn(),
      getTagFilter: jest.fn(),
      edit: jest.fn(),
      accept: jest.fn(),
    },
    favoriteService: {
        getFavorites: jest.fn(),
        getFavoriteIds: jest.fn(),
        setFavorite: jest.fn(),
    },
    answerService: {
        get: jest.fn(),
        getAll: jest.fn(),
        create: jest.fn(),
        edit: jest.fn(),
        delete: jest.fn(),
        vote: jest.fn(),
    },
    commentService: {
        get: jest.fn(),
        create: jest.fn(),
        edit: jest.fn(),
        delete: jest.fn(),
    },
    tagService: {
        getAll: jest.fn(),
        create: jest.fn(),
        getQuestionTags: jest.fn(),
        editQuestionTags: jest.fn(),
    },
    profileService: {
        get: jest.fn().mockImplementation(() => Promise.resolve(defaultProfile)),
        update: jest.fn(),
        getProfileByUsername: jest.fn(),
    }
    
  }));
  


const useParamsMock = jest.spyOn(require('react-router-dom'), 'useParams');

const getQuestionMock = jest.spyOn(questionService, 'get')
const deleteQuestionMock = jest.spyOn(questionService, 'delete')
const createQuestionMock = jest.spyOn(questionService, 'create')
const searchMock = jest.spyOn(questionService, 'search')
const getQuestionTagsMock = jest.spyOn(tagService, 'getQuestionTags')
const getAnswersMock = jest.spyOn(answerService, 'getAll')
const getCommentsMock = jest.spyOn(commentService, 'get')
const getFavoritesMock = jest.spyOn(favoriteService, 'getFavoriteIds')
const voteAnswerMock = jest.spyOn(answerService,'vote')
const acceptAnswerMock = jest.spyOn(questionService,'accept')
const getAllTagsMock = jest.spyOn(tagService, 'getAll')

getCommentsMock.mockImplementation(() => Promise.resolve([]))
getFavoritesMock.mockImplementation(() => Promise.resolve([]))
deleteQuestionMock.mockImplementation(() => Promise.resolve())
voteAnswerMock.mockImplementation(() => Promise.resolve())
acceptAnswerMock.mockImplementation(() => Promise.resolve())




describe('Question components tests', () => {
    test('QuestionDetails renders question', async() => {
        useParamsMock.mockReturnValue({ id: 1 });
        const history = createMemoryHistory()
        getQuestionMock.mockImplementation(() => Promise.resolve(testQuestions[0]))
        const answers = testAnswers.filter(a => a.question_id == 1)
        getAnswersMock.mockImplementation(() => Promise.resolve(answers))


        const questionTags = testQuestions[0].tags.map(i => testTags[i-1])
        getQuestionTagsMock.mockImplementation(() => Promise.resolve(questionTags))
        const profile = {user_id: 1}
        
        const {asFragment, findByText } = customRender(<QuestionDetails />, profile as Profile, history)
        await findByText(testQuestions[0].title)
        await findByText(testQuestions[0].body)
        for (const tag of questionTags) {
            await findByText(tag.name)
        }
        expect(asFragment()).toMatchSnapshot()
        
    })
    
    test('Render only what question creator has permission to', async() => {
        useParamsMock.mockReturnValue({ id: 1 });
        const history = createMemoryHistory()
        const answers = testAnswers.filter(a => a.question_id == 1)
        getAnswersMock.mockImplementation(() => Promise.resolve(answers))


        const { findByText } = customRender(<QuestionDetails />, {user_id: 3} as Profile, history)
        await findByText('Edit')
        await findByText('Delete')
        expect(screen.queryByText('Post Answer')).not.toBeInTheDocument()
        expect(screen.queryByText('Post Comment')).not.toBeInTheDocument()
    })
    
    test('Delete question', async() => {
        useParamsMock.mockReturnValue({id:4})
        const history = createMemoryHistory()
        history.push('/question/4')

        const answers = testAnswers.filter(a => a.question_id == 4)
        getAnswersMock.mockImplementation(() => Promise.resolve(answers))


        getQuestionMock.mockImplementation(() => Promise.resolve(testQuestions[3]))
        const { findByText } = customRender(<QuestionDetails />, {user_id: 1} as Profile, history)
        const user = userEvent.setup()
        expect(history.location.pathname).toBe('/question/4')
        const deleteButton = await findByText('Delete')
        await user.click(deleteButton)
        expect(history.location.pathname).toBe('/')
    })
    
    test('Searching for questions and navigate to question', async () => {
        useParamsMock.mockReturnValue({ id: 1 });
        const history = createMemoryHistory()
        getQuestionMock.mockImplementation(() => Promise.resolve(testQuestions[0]))
        searchMock.mockImplementation(() => Promise.resolve([testQuestions[0], testQuestions[1]]))
        const {findByText} = customRender(<Searchbar />, {user_id: 1} as Profile, history)
        const user = userEvent.setup()
        const searchInput = screen.getByLabelText('search')
        await user.type(searchInput,'hv')
        const button = await findByText(testQuestions[0].title)
        await findByText(testQuestions[1].title)
        await user.click(button)
        expect(history.location.pathname).toBe('/question/1')
    })
    
    test('Searching for questions and navigate to results', async () => {
        useParamsMock.mockReturnValue({ id: 1 });
        const history = createMemoryHistory()
        getQuestionMock.mockImplementation(() => Promise.resolve(testQuestions[0]))
        const {findByText} = customRender(<Searchbar />, {user_id: 1} as Profile, history)
        const user = userEvent.setup()
        const searchInput = screen.getByLabelText('search')
        await user.type(searchInput,'hv')
        await findByText(testQuestions[0].title)
        await findByText(testQuestions[1].title)
        await user.keyboard('[Enter]')
        expect(history.location.pathname).toBe('/question/search/hv/results')
    })

    test('Create question', async() => {
        const history = createMemoryHistory()
        history.push('/question/create')
        getAllTagsMock.mockImplementation(() => Promise.resolve(testTags))
        createQuestionMock.mockImplementation(() => Promise.resolve('5'))
        const user = userEvent.setup()
        const {getByLabelText, findByText, getByText} = customRender(<CreateQuestion />, {user_id: 2} as Profile, history)
        const title = getByLabelText('title')
        await user.type(title,'Hva er 1+1')
        const body = getByLabelText('body')
        await user.type(body,'ikke noe mer å legge til')
        const tagInput = getByLabelText('tag-input')
        await user.type(tagInput,'mat')
        const matteOption = await findByText('matte')
        await user.click(matteOption)
        expect(title).toHaveValue('Hva er 1+1')
        expect(body).toHaveValue('ikke noe mer å legge til')
        await findByText('matte', {classname: 'tag-option'})
        await user.click(getByText('Post'))
        expect(history.location.pathname).toBe('/question/5')

    })
})

describe('Answer components tests', () => {
    test('AnswerDetails renders correctly', async () => {
        useParamsMock.mockReturnValue({ id: 1 });
        const history = createMemoryHistory()

        const { findByText } = customRender(<AnswerDetails question={testQuestions[0]} answer={testAnswers[0]} vote={jest.fn()} accept={jest.fn()} favoriteAnswer={jest.fn()} isFavorite={false} removeAnswer={jest.fn()} />, {user_id: 1} as Profile, history)
        await findByText(testAnswers[0].body)
        await findByText(testAnswers[0].upvotes - testAnswers[0].downvotes, {selector: '.vote-count'})
    })
    
    test('Answers count is correct', async () => {
        useParamsMock.mockReturnValue({id: 1})
        const history = createMemoryHistory()
        const answers = testAnswers.filter(a => a.question_id == 1)
        getAnswersMock.mockImplementation(() => Promise.resolve(answers))

        const { findByText } = customRender(<Answers question={testQuestions[0]} setShowCreateComment={jest.fn()} />, {user_id: 1} as Profile, history)
        await findByText('2 answers')
        await findByText(answers[0].body)
    })
    
    test('Upvoting answer increments score', async() => {
        useParamsMock.mockReturnValue({id: 1})
        const history = createMemoryHistory()
        const answers = testAnswers.filter(a => a.question_id == 1)
        getAnswersMock.mockImplementation(() => Promise.resolve(answers))

        const user = userEvent.setup()

        const { findByText } = customRender(<Answers question={testQuestions[0]} setShowCreateComment={jest.fn()} />, {user_id: 2} as Profile, history)
        const score = testAnswers[0].upvotes - testAnswers[0].downvotes
        await findByText(answers[0].body)
        const upvoteButton = screen.getAllByAltText('upvote')[0]
        await user.click(upvoteButton)
        await findByText(score + 1, {selector: '.vote-count'})
    })

    test('Downvoting answer decrements score', async() => {
        useParamsMock.mockReturnValue({id: 1})
        const history = createMemoryHistory()
        const answers = testAnswers.filter(a => a.question_id == 1)
        getAnswersMock.mockImplementation(() => Promise.resolve(answers))

        const user = userEvent.setup()

        const { findByText } = customRender(<Answers question={testQuestions[0]} setShowCreateComment={jest.fn()} />, {user_id: 2} as Profile, history)
        const score = testAnswers[0].upvotes - testAnswers[0].downvotes
        await findByText(answers[0].body)
        const upvoteButton = screen.getAllByAltText('downvote')[0]
        await user.click(upvoteButton)
        await findByText(score - 1, {selector: '.vote-count'})
    })
    test('Accepting answer marks it as accepted', async() => {
        useParamsMock.mockReturnValue({id: 1})
        const history = createMemoryHistory()
        const answers = testAnswers.filter(a => a.question_id == 1)
        getAnswersMock.mockImplementation(() => Promise.resolve(answers))

        const user = userEvent.setup()

        const { findByText } = customRender(<Answers question={testQuestions[0]} setShowCreateComment={jest.fn()} />, {user_id: 3} as Profile, history)
        await findByText(answers[0].body)
        const acceptButton = screen.getAllByAltText('not-accepted')[0]
        await user.click(acceptButton)
        expect(acceptButton).toHaveAttribute('alt','accepted')
    })
    test('Favoriting answer marks it as favorited', async() => {
        useParamsMock.mockReturnValue({id: 1})
        const history = createMemoryHistory()
        const answers = testAnswers.filter(a => a.question_id == 1)
        getAnswersMock.mockImplementation(() => Promise.resolve(answers))
        getFavoritesMock.mockImplementation(() => Promise.resolve([]))
        acceptAnswerMock.mockImplementation(() => Promise.resolve())
        getCommentsMock.mockImplementation(() => Promise.resolve([]))

        const user = userEvent.setup()

        const { findByText } = customRender(<Answers question={testQuestions[0]} setShowCreateComment={jest.fn()} />, {user_id: 2} as Profile, history)
        await findByText(answers[0].body)
        const favoriteButton = screen.getAllByAltText('not-favorited')[0]
        await user.click(favoriteButton)
        expect(favoriteButton).toHaveAttribute('alt','favorited')
    })
    
    test('Sort by score (desc and asc)', async () => {
        useParamsMock.mockReturnValue({id: 1})
        const history = createMemoryHistory()
        const answers = testAnswers.filter(a => a.question_id == 1)
        getAnswersMock.mockImplementation(() => Promise.resolve(answers))
        const user = userEvent.setup()
    
        const { findByText, findByAltText, findAllByText } = customRender(<Answers question={testQuestions[0]} setShowCreateComment={jest.fn()} />, {user_id: 2} as Profile, history)
        const sort = await findByText('Sort by score')
        user.click(sort)
        const answerScoresDesc = await findAllByText(/^\d+$/,{selector:'.vote-count', exact: false})
        const firstDesc = parseInt(answerScoresDesc[0].textContent)        
        const secondDesc = parseInt(answerScoresDesc[1].textContent)        
        expect(secondDesc).toBeLessThan(firstDesc)
        const desc = await findByAltText('desc')
        await user.click(desc)
        const answerScoresAsc = await findAllByText(/^\d+$/,{selector:'.vote-count', exact: false})
        const firstAsc = parseInt(answerScoresAsc[0].textContent)        
        const secondAsc = parseInt(answerScoresAsc[1].textContent)        
        expect(desc).toHaveAttribute('alt','asc')
        expect(firstAsc).toBeLessThan(secondAsc)

        

    })
    
})

describe('Comment components tests', () => {
    test('Renders question comments correctly', async () => {
        useParamsMock.mockReturnValue({ id: 1 });
        const history = createMemoryHistory()
        const comments = testQuestionComments.filter(c => c.question_id == 1)
        getCommentsMock.mockImplementation(() => Promise.resolve(comments))
        const {findByText} = await customRender(<Comments comments={comments} parent='question' removeComment={jest.fn()} editComment={jest.fn()} />, {user_id: 1} as Profile, history)
        await findByText(testQuestionComments[0].body)
        await findByText(testQuestionComments[1].body)
    })
    test('Renders answer comments correctly', async () => {
        useParamsMock.mockReturnValue({ id: 1 });
        const history = createMemoryHistory()
        const comments = testAnswerComments.filter(c => c.answer_id == 1)
        getCommentsMock.mockImplementation(() => Promise.resolve(comments))
        const {findByText} = await customRender(<Comments comments={comments} parent='answer' removeComment={jest.fn()} editComment={jest.fn()} />, {user_id: 1} as Profile, history)
        await findByText(testAnswerComments[0].body)
        await findByText(testAnswerComments[1].body)
    })
})

describe('Other tests', () => {
    test('Filtering tags on name', async() => {
        getAllTagsMock.mockImplementation(() => Promise.resolve(testTags))
        const user = userEvent.setup()
        const {findByText} = customRender(<Tags />, {user_id: 1} as Profile, createMemoryHistory())
        await findByText('alfabet')
        const input = screen.getByLabelText('tag-input')
        await user.type(input, 'ma')
        await findByText(testTags[0].name)
        await findByText(testTags[2].name)
        expect(screen.queryByText('alfabet')).not.toBeInTheDocument()
    })
})
