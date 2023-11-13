import React, {useContext} from "react";
import defaultPfp from '../assets/default-pfp.png'
import { ProfileContext } from "../context/Context";

type props = {
    size: 's' | 'm' | 'l'
    pfp: string | null,
    level: number
}


function Pfp({size, pfp, level}: props) {
    
    
    const fsMap = {
        's': 5,
        'm': 4,
        'l': 3,
    };
    const fs = fsMap[size]
    return ( 
        <div className="pfp-level">
            <img className={`pfp pfp-${size}`} src={pfp? pfp : defaultPfp} alt="" />
            <p className={`level fs-${fs}`}>{level}</p>
        </div>
     );
}

export default Pfp;