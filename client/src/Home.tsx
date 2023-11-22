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
        <Link to={'/question/filter/tag/'+t.name} key={i} className='tag fs-4'>{t.name}</Link>
    ))
    return(
        <div className='container home-container'>
            <header className='subheader card bg-white text-black'>
                <Link className='button bg-accent text-WHITE' to={'/question/create'}>Post new question</Link>
                <Link className='button bg-light-grey' to={'/question/filter/popular'}>Popular questions</Link>
                <Link className='button bg-light-grey' to={'/question/filter/recent'}>Recent questions</Link>
                <Link className='button bg-light-grey' to={'/question/filter/unanswered'}>Unanswered questions</Link>
                <Link className='button bg-light-grey' to={'/tags'}>All tags</Link>
            </header>
            {noOutlet && <>
                <div className='flex wide-100 row align-start gap-3'>
                    <Preview filter={'popular'} />
                    <Preview filter={'recent'} />
                    <Preview filter={'unanswered'} />
                </div>
                <div className='card bg-white wide-75'>
                    <p onClick={() => navigate('/tags')} className='fs-3'>Tags</p>
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
        <Link to={`question/${q.question_id}`} key={i} className='row space-between'>
            <p>{q.title}</p>
            <p>{q.views} views</p>
            <p>{q.answer_count} answers</p>
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
    const [tagSearch, setTagSearch] = useState('')


    
    useEffect(() => {
        fetchTags()
    }, []);

    const regexPattern = tagSearch
        .replace(/\s+/g, '\\s*')
        .split('')
        .join('\\s*');
    const filter = new RegExp(regexPattern, 'i');
    
    const tags = allTags.filter( t => filter.test(t.name)).sort((a,b) => b.count - a.count).map((t,i) => (
        <Link to={'/question/filter/tag/'+t.name} key={i} className='tag fs-3'>{t.name} <span className='fs-5'>{t.count}</span></Link>
    ))

    const fetchTags = async () => {
        const tags = await tagService.getAll()
        setAllTags(tags)
    }

    
    return(
        <div className='card bg-white wide-100'>
            <div className="row">
                <input className='input' aria-label='tag-input' value={tagSearch} onChange={(e) => setTagSearch(e.currentTarget.value)} type="text" />
            </div>
            <h3>All tags</h3>
            <div className='tags'>
                {tags}
            </div>

        </div>
    )
    
}


