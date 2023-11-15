import React, {createRef, useContext} from 'react'
import {ImageCompressor} from 'image-compressor'
import { ProfileContext } from '../context/Context'

function UploadImage({uploadImage}: {uploadImage: React.Dispatch<React.SetStateAction<string | null>>}) {

    const fileInputRef = createRef<HTMLInputElement>()

    const {profile, setProfile} = useContext(ProfileContext)

    const selectImage =( e: React.ChangeEvent<HTMLInputElement>) => {
        if(!e.target.files) return
        const reader = new FileReader()
        reader.readAsDataURL(e.target.files[0])
        reader.onload = (event) => {

            const imageCompressor = new ImageCompressor;
    
            const compressorSettings = {
                toWidth : 100,
                toHeight : 100,
                mimeType : 'image/png',
                quality: 0.1,
            };
    
            imageCompressor.run(reader.result, compressorSettings, (compressedImageData: any) => {
                console.log(compressedImageData);
                
                uploadImage(compressedImageData);
                setProfile(prev => {
                    return {
                        ...prev,
                        profile_picture: compressedImageData
                    }
                })

            });

        }
    }
    
    
    return ( 
        <div> 
            <input
                type="file"
                accept='image/*'
                name="image"
                onChange={selectImage}
                ref={fileInputRef}
            />
            <button className='button bg-accent text-WHITE'  onClick={() => fileInputRef.current?.click()}>Upload Image</button>
        </div> 
    );
}

export default UploadImage;