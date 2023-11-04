import React, {useEffect, useState, useContext} from 'react';
import { questionService, tagService} from './service'
import { Question, Tag } from './types';
import { Link, Outlet, useLocation } from 'react-router-dom';


export default function Home() {

    const location = useLocation()
    const noOutlet = location.pathname == '/'

    return(
        <div className='container home-container'>
            {noOutlet && <>
                <header className='subheader bg-light-grey text-black'>
                </header>
            </>}
            <div>
                <Outlet />                
            </div>
            <Sidebar/>
        </div>
    )
    
}



function Sidebar() {

    const [recentPreview, setRecentPreview] = useState<Question[]>([])
    const [popularPreview, setPopularPreview] = useState<Question[]>([])
    const [unansweredPreview, setUnansweredPreview] = useState<Question[]>([])
    const [allTags, setAllTags] = useState<Tag[]>([])
    
    
    useEffect(() => {
        questionService.recentPreview().then((questions: Question[]) => setRecentPreview(questions));
        questionService.popularPreview().then((questions: Question[]) =>  setPopularPreview(questions));
        questionService.unansweredPreview().then((questions: Question[]) => setUnansweredPreview(questions));
        tagService.getAll().then((tags: Tag[]) => setAllTags(tags));
    }, []);

    const recent = recentPreview.map((q, i) => (
        <Link to={`q/${q.question_id}`} key={i}>{q.title}</Link>
    ))
    const popular = popularPreview.map((q, i) => (
        <Link to={`q/${q.question_id}`} key={i}>{q.title}</Link>
    ))
    const unanswered = unansweredPreview.map((q, i) => (
        <Link to={`q/${q.question_id}`} key={i}>{q.title}</Link>
    ))

    const tags = allTags.splice(0,10).map((t,i) => (
        <button className='tag'>{t}</button>
    ))

    return (
        <div className='sidebar'>
            <div className='sidebar-section'>
                <p>Recent questions</p>
                {recent}
            </div>
            <div className='sidebar-section'>
                <p>Popular questions</p>
                {popular}
            </div>
            <div className='sidebar-section'>
                <p>Unanswered questions</p>
                {unanswered}
            </div>
            <div className='sidebar-section'>
                {tags}
                <Link to={'/tags'}>All tags</Link>
            </div>
        </div>
    )
}

export function Tags() {
    tagService.getAll().then((tags) => setAllTags(tags));
    const [allTags, setAllTags] = useState<Tag[]>([])

    const [newTag, setNewTag] = useState('')

    const tags = allTags.splice(0,10).map((t,i) => (
        <button className='tag'>{t}</button>
    ))

    return(
        <div>
            <h3>All tags</h3>
            <input value={newTag} onChange={e => setNewTag(e.currentTarget.value)} type="text" />
            <button onClick={() => tagService.post(newTag)}>Create tag</button>
            {tags}

        </div>
    )
    
}


