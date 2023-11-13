import React, {createRef} from 'react'
import {ImageCompressor} from 'image-compressor'

function UploadImage({uploadImage, show}: {show: boolean,uploadImage: React.Dispatch<React.SetStateAction<string | null>>}) {

    const fileInputRef = createRef<HTMLInputElement>()

    const selectImage =( e: React.ChangeEvent<HTMLInputElement>) => {
        if(!e.target.files) return
        const reader = new FileReader()
        reader.readAsDataURL(e.target.files[0])
        reader.onload = (event) => {

            const imageCompressor = new ImageCompressor;
    
            const compressorSettings = {
                toWidth : 200,
                toHeight : 200,
                mimeType : 'image/png',
                mode : 'strict',
                quality : 0.6,
                threshold : 127,
                speed : 'low'
            };
    
            imageCompressor.run(reader.result, compressorSettings, (compressedImageData: any) => {
                console.log(compressedImageData);
                
                uploadImage(compressedImageData);

            });

        }
    }
    
    
    return ( 
        <div className={`${!show? 'vis-hide' : ''}`}> 
            <input
                type="file"
                accept='image/*'
                name="image"
                onChange={selectImage}
                ref={fileInputRef}
            />
            <button className='button bg-accent'  onClick={() => fileInputRef.current?.click()}>Upload Image</button>
        </div> 
    );
}

export default UploadImage;