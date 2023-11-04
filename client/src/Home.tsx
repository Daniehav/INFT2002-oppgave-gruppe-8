import React, {useEffect, useState, useContext} from 'react';
import { questionService } from './service'
import { useNavigate } from 'react-router-dom';

export default function Home() {
    const [searchQuery, setSearchQuery] = useState('')
    function handleSearchText(e: any){
	    setSearchQuery(e.target.value)
    }
    function handleSubmit(){
        const navigate = useNavigate();

	    navigate('/question/search/'+searchQuery+'/results');
    }

    return(
        <div>
            <input type='text' onChange={handleSearchText} />
            <button onClick={handleSubmit}>submit</button>
        </div>
    )
    
}


