'use client'
import { doRequest } from '@/app/admin/utils/request';
import Image from 'next/image';
import { useCallback, useContext, useState } from 'react';
import { UserContext } from './components/Common';
import { GenerateIcon } from './components/GeneratingIcon';

export default function InputPage() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
    const {openId} = useContext(UserContext)
  const handleChooseFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf'; // Accept PDF and Word files
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        setFileName(file.name);
        // Here you would typically upload the file to a server
        // For demonstration, we just set a dummy URL
        setFileUrl(URL.createObjectURL(file));
        const data = new FormData();
        data.append('file', file);
        setFormData(data);
      }
    };
    input.click();
  };
  const doUpload = useCallback(async (fileName:string,formData:FormData) => {
     const uploadRes = await doRequest('/api/admin/file_convert?type=pdf2doc_textin', {
          method: 'POST',
          body: formData,
          headers: {
            contentType: 'multipart/form-data', 
            "x-user-id": openId
          }
      })
    
    return {
      name: fileName,
      link: uploadRes.file
    }
  },[openId])
  const jumpBakToMini = useCallback((list:{name:string,link:string}[]) => {
     // @ts-ignore
      window.wx.miniProgram.navigateTo({
        url:"/pages/converResult/covert-result-page?list="+JSON.stringify(list)
      });
   },[])
  const handleUpload = useCallback(async () => {
    if(isGenerating) return;
    if (!formData) return;
    setIsGenerating(true);
    try{
      const result = await doUpload(fileName||"",formData)
      jumpBakToMini([result])
    } catch (error) { 
      console.error('上传失败:', error);
      alert('上传失败，请重试');
      alert((error as unknown as {message:string}).message);
    } finally {
      setIsGenerating(false);
      setFormData(null);
    }
  },[formData,isGenerating,fileName,doUpload,jumpBakToMini]);



  return (
    <div className="" style={{
      height: '90vh',
      overflow: 'hidden',
      width: '90%',
      margin: '0 auto',
      boxSizing:"content-box",
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div 
        onClick={handleChooseFile}
        className=""
        style={{
          borderRadius: '30px',
          width: '90%',
          margin:"50% auto",
          
          padding: '15px',
          textAlign: 'center',
          fontSize:"16px",
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <Image src='/images/ui/uploadicon.svg' alt='上传图标' width={50} height={50} />
        上传本地文件
      </div>

      {fileName && (
        <div className="flex flex-col items-center" style={{
          display: 'flex', flexDirection: 'column', 
          alignItems: 'center',
          marginTop: '20px',
        }}>
          <Image 
            src="/file.svg" 
            alt="PDF图标" 
            width={80} 
            height={80}
            className="mb-2"
          />
          <p className="text-center">{fileName}</p>
          <div
            onClick={handleUpload}
            className="mt-4 px-4 py-2 bg-green-500 text-white rounded-md"
            style={{
              marginTop: '20px',
              background: '#6ED8E6',
              borderRadius: '8px',
              padding: '10px 20px',
              color: 'white',
            }}
          >
            确认上传
            {
              isGenerating && <GenerateIcon generating={isGenerating}/>
            }
          </div>
        </div>
      )}
     
    </div>
  );
}
