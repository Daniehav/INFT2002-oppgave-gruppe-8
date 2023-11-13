import React, {useEffect, useState, useContext} from 'react';
import { questionService, tagService} from './service'
import { Question, Tag } from './types';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';


export default function Home() {
    
    const location = useLocation()
    const navigate = useNavigate()
    const noOutlet = location.pathname == '/'
    const [allTags, setAllTags] = useState<Tag[]>([])
    
    useEffect(() => {
        const fetch = async () => {
            const allTags = await tagService.getAll();
            setAllTags(allTags);
        }
        fetch()
    }, []);
    
    const tags = allTags.slice(0,10).sort((a,b) => b.count - a.count).map((t,i) => (
        <button key={i} className='tag fs-5'>{t.name}</button>
    ))
    return(
        <div className='container home-container'>
            {noOutlet && <>
                <header className='subheader card bg-white text-black'>
                    <Link className='button bg-light-grey' to={'/question/create'}>Post new question</Link>
                </header>
                <div className='flex wide-100 row align-start'>
                    <Preview filter={'popular'} />
                    <Preview filter={'recent'} />
                    <Preview filter={'unanswered'} />
                </div>
                <div className='card bg-white'>
                    <p onClick={() => navigate('/question/tags')} className='fs-3'>Tags</p>
                    <div className="tags">
                        {tags}
                    </div>
                </div>
            </>}
            <Outlet />                
        </div>
    )
    
}


function Preview({filter}:{filter: 'popular' | 'recent' | 'unanswered'}) {

    const [preview, setPreview] = useState<Question[]>([])
    const navigate = useNavigate()

    useEffect(() => {
        const fetchData = async() => {
            const preview = await questionService.getPreview(filter);
            console.log(preview);
            
            setPreview(preview);
          }
          fetchData();

    }, []);

    const category = `${filter[0].toUpperCase()}${filter.slice(1)} questions`

    const previewElements = preview.map((q, i) => (
        <Link to={`question/${q.question_id}`} key={i} className='row'>
            <p>{q.title}</p>
            <p>Views: {q.views}</p>
        </Link>
    ))

    return (
        <div className='card bg-white wide-100'>
            <p onClick={() => navigate('/question/filter/'+filter)} className='fs-3'>{category}</p>
            <div className="flex-vert border-bottom">
                {previewElements}
            </div>
        </div>
    )
}



export function Tags() {
    const [allTags, setAllTags] = useState<Tag[]>([])
    const [newTag, setNewTag] = useState('')


    
    useEffect(() => {
        fetchTags()
    }, []);
    
    const tags = allTags.sort((a,b) => b.count - a.count).map((t,i) => (
        <Link to={'/questions/filter/tag/'+t.name} key={i} className='tag fs-4'>{t.name} <span className='fs-5'>{t.count}</span></Link>
    ))

    const createTag = async () => {
        if(!newTag) return
        const tagId = await tagService.create(newTag)
        setNewTag('')
        fetchTags()
        
    }

    const fetchTags = async () => {
        const tags = await tagService.getAll()
        setAllTags(tags)
    }
    return(
        <div className='card bg-white card--wide'>
            <div className="row">
                <input className='input' value={newTag} onChange={(e) => setNewTag(e.currentTarget.value)} type="text" />
                <button className='button bg-accent text-white' onClick={createTag}>Create tag</button>
            </div>
            <h3>All tags</h3>
            <div className='tags'>
                {tags}
            </div>

        </div>
    )
    
}


