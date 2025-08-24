'use client'
import { doRequest } from '@/app/admin/utils/request';
import Image from 'next/image';
import { useCallback, useState } from 'react';
import { GenerateIcon } from './components/GeneratingIcon';

export default function InputPage() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
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

  const handleUpload = useCallback(async () => {
    if(isGenerating) return;
    if (!formData) return;
    setIsGenerating(true);
    try{
       const uploadRes = await doRequest('/api/admin/file_convert?type=pdf2doc_textin', {
          method: 'POST',
          body: formData,
          headers: {
            "x-user-id": new URL(window.location.href).searchParams.get('userId') || ""
          }
      })
      console.log(uploadRes)
      // @ts-ignore
      window.wx.miniProgram.postMessage({
        data: {
          type: 'file_upload',
          fileUrl: uploadRes.data
        }})
      // @ts-ignore
      window.wx.miniProgram.navigateBack()
      /*window.wx.miniProgram.navigateTo({
        url:"/pages/convert/convert?type=filelist"
      });*/

    } catch (error) { 
      console.error('上传失败:', error);
    } finally {
      setIsGenerating(false);
      setFormData(null);
    }
  },[formData,isGenerating]);

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
          backgroundColor: '#f0f0f0',
          padding: '15px',
          textAlign: 'center',
          fontSize:"16px"
        }}
      >
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
              background: 'hsla(120, 3%, 55%, 1.00)',
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
