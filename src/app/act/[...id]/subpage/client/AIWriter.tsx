'use client'

import { Theme } from '@/components/Theme'
import { CopyOutlined, EditFilled, HistoryOutlined, TrademarkCircleOutlined } from '@ant-design/icons'
import { Button, Modal } from 'antd'
import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { UserContext } from './components/Common'
import { GenerateIcon } from './components/GeneratingIcon'
import { TopButton } from './components/TopButton'
import { getDependence } from './helper/dependence'
/**
 * 记叙文、说明文、议论文、抒情文、描写文、应用文、游记、日记、读后感、观后感
 */
const translations = {
  zh: {
    title: 'AI作文生成',
    topic: '作文主题',
    topicPlaceholder: '请输入作文主题',
    extra: "写作要求",
    extraPlaceholder: '补充说明”',
    type: '作文类型',
    typePlaceholder: '请选择作文类型',
    wordCount: '作文字数',
    wordCountPlaceholder: '请选择作文字数',
    generate: '生成作文',
    generating: '生成中...',
    generated:"生成作文完成，点击重新生成",
    result: '生成结果',
    narrative: '记叙文',
    expository: '说明文',
    argumentative: '议论文',
    lyrical: '抒情文',
    descriptive: '描写文',
    practical: '应用文',
    travel: '游记',
    diary: '日记',
    bookReview: '读后感',
    movieReview: '观后感',
    copy:"复制结果",
    copy_done:"复制成功",
    re_submit:"重新生成",
    'lan': '语言',
    required: (field: string) => `请输入${field}`
  }
}

type EssayType = 'narrative' | 'expository' | 'argumentative' | 'lyrical' | 'descriptive' | 'practical' | 'travel' | 'diary' | 'bookReview' | 'movieReview'
type FormData = {
  topic: string
  type: EssayType
  wordCount: number
  language: "zh" | "en",
  extra: string
}

const wordCountOptions = [
  { value: 300, label: "300字" },
  { value: 500, label: "300-500字" },
  { value: 800, label: "500-800字" },
  { value: 1000, label: "800-1000字" }
]

export default function AIWriter() {
  const [language, setLanguage] = useState<'zh' | 'en'>('zh')
  const [result, setResult] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [history, setHistory] = useState<{form:never, data: string}[]>([])
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const {openId} = useContext(UserContext)
  const dep = getDependence()
  useEffect(() => {
    const savedHistory = localStorage.getItem('aiWriterHistory')
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory))
    }
  }, [])
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>()
  const t = translations['zh']
  const onSubmit = async (data: FormData) => {
   
    if(isGenerating){
      return;
    }
    setIsGenerating(true)
    try {
      // 模拟API调用
      const form = {
          type: data.type,
          theme: data.topic,
          count: data.wordCount,
          language: language
      }
      const result = await fetch("/api/aiact/aiwriter",{
        method:"post",
        body: JSON.stringify(form),
        headers: {
          "x-user-id": openId
        }
      })
      const response = await result.json();
      if(response.status === 200) {
        setResult(response.data)
        const newHistory = [{form, data: response.data}, ...history].slice(0, 10)
        setHistory(newHistory as never)
        localStorage.setItem('aiWriterHistory', JSON.stringify(newHistory))
        setTimeout(()=>{
          resWrap.current?.scrollIntoView({behavior:"smooth"})
        },100)
      }
    } finally {
      setIsGenerating(false)
    }
  }
  const copyResult = useCallback(() => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    alert(t.copy_done)
  }, [result,t]);
  const resWrap = useRef<HTMLDivElement>(null)
  const mainWrap = useRef<HTMLDivElement>(null)
  const clickTop = useCallback(()=>{
    mainWrap.current?.scrollIntoView({behavior: 'smooth'})
  },[])
  const submitBtnRef = useRef<HTMLButtonElement>(null)
  return (
    <div className="ai-writer-container" ref={mainWrap}>
      <style>
        {
          `
          option {
            text-align: right;
            padding-right: 10px;
          }
          `
        }
      </style>
      <div style={{ width: "100%", display: 'flex', justifyContent:'end', marginBottom: '10px' }}>
              <div onClick={() => setIsHistoryModalOpen(true)} style={{
                background:"white !important",
                cursor: 'pointer',
                float:"right"
              }}>
                历史记录 <HistoryOutlined/>
              </div>
      </div>
      <div className="form-section" style={{ width: "100%",position:"relative"}}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label>{t.topic}</label>
            <textarea
              maxLength={30}
              style={{
                width:"100%",
                color:"gray",
                outline:"none",
              }}
              disabled={isGenerating}
              {...register('topic', { required: t.required(t.topic) })}
              placeholder={t.topicPlaceholder +" 比如：" + dep.theme}
            />
            {errors.topic && <span className="error">{errors.topic.message}</span>}
          </div>

          <div className="form-group">
            <label>{t.extra}</label>
            <textarea
              maxLength={500}
              style={{
                width:"100%",
                color:"gray",
                height:"120px",
                outline:"none",
              }}
              disabled={isGenerating}
              {...register('extra')}
              placeholder={t.extraPlaceholder + " 比如"+ dep.extra}
            />
            {errors.topic && <span className="error">{errors.topic.message}</span>}
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center' , justifyContent: 'space-between'}}>
            <div style={{display: "flex", alignItems:'center', height:"100%",fontWeight:"bold"}}>{t.type}</div>
            <select
              disabled={isGenerating}
              {...register('type', { required: t.required(t.type) })}
              defaultValue=""
            >
              <option value="" disabled>{t.typePlaceholder}</option>
              <option value="narrative">{t.narrative}</option>
              <option value="expository">{t.expository}</option>
              <option value="argumentative">{t.argumentative}</option>
              <option value="lyrical">{t.lyrical}</option>
              <option value="descriptive">{t.descriptive}</option>
              <option value="practical">{t.practical}</option>
              <option value="travel">{t.travel}</option>
              <option value="diary">{t.diary}</option>
              <option value="bookReview">{t.bookReview}</option>
              <option value="movieReview">{t.movieReview}</option>
            </select>
            {errors.type && <span className="error">{errors.type.message}</span>}
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
            <div style={{display: "flex", alignItems:'center', height:"100%",fontWeight:"bold"}}>{t.wordCount}</div>
            <select
              disabled={isGenerating}
              {...register('wordCount', { required: t.required(t.wordCount) })}
              defaultValue=""
            >
              <option value="" disabled>{t.wordCountPlaceholder}</option>
              {wordCountOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.wordCount && <span className="error">{errors.wordCount.message}</span>}
          </div>
          <div className='language-select form-group' style={{display:"flex", alignItems:"center", justifyContent:"space-between"}}>
             <div className='' style={{display:'flex', alignItems:"center", fontWeight:"bold"}}>{t.lan}</div>
            <select
              disabled={isGenerating}
              {...register('language', { required: t.required('语言') })}
              defaultValue={language}
              onChange={(e) => setLanguage(e.target.value as 'zh' | 'en')}
            >
              <option value="zh">中文</option>
              <option value="en">English</option>
            </select>
            {errors.language && <span className="error">{errors.language.message}</span>}
          </div>
          <div className="language-switcher" style={{width:"100%",position:"relative"}}>
              <button 
                disabled={isGenerating}
                ref={submitBtnRef}
                onClick={() => {
                  setLanguage('zh')
                  handleSubmit(onSubmit)()
                }}
                type="button"
                style={{
                  display:"flex",
                  justifyContent:"center",
                  gap:"10px",
                  width:"100% !important",
                  background: "white !important",
                }}
              >
                <EditFilled style={{color: Theme.mainTheme.color }} color={Theme.mainTheme.color}/>
                <span style={{
                 color: Theme.mainTheme.color,
                }}>生成作文{isGenerating?" ......  ":""} </span>
                
                <GenerateIcon generating={isGenerating} />
              </button> 
              
          </div>
        </form>
      </div>

      {result && (
        <div className="result-section" ref={resWrap}>
          <div style={{
            display:"flex",
            justifyContent:"space-between",
            alignItems:"center"
          }}>
            <h2>{t.result}</h2>
          </div>
          <div className="essay-result">
            {result}
          </div>
          <div className='result-icon' style={{display:"flex", justifyContent:"space-between", alignItems:"center", gap:"30px"}}>
            <Button 
              onClick={copyResult} 
              disabled={isGenerating}
              className='!bg-[#D9D9D9]'
              style={{
                 
                  cursor: 'pointer',
                  width: "30% !important",
                  borderRadius: "4px !important",
                  color: Theme.mainTheme.color,
                  background: "white !important"
              }}>
                <CopyOutlined/>
              {
                t.copy
              } 
            </Button>
            <Button 
              disabled={isGenerating}
              onClick={()=> {
                clickTop();
                setTimeout(()=>{
                   submitBtnRef.current?.click();
                },500)
               
              }} 
              className='!bg-[#D9D9D9]'
              style={{
                  
                  cursor: 'pointer',
                  width: "30% !important",
                  borderRadius: "2px !important",
                  background: "white !important",
                  color: Theme.mainTheme.color
              }}>
               <TrademarkCircleOutlined />
              {
                 t.re_submit
              }
            </Button>
          </div>
          <TopButton onClick={clickTop}/>
        </div>
      )}

      <Modal
        title="历史记录"
        open={isHistoryModalOpen}
        onCancel={() => setIsHistoryModalOpen(false)}
        footer={null}
      >
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {history.length === 0 ? (
            <p>暂无历史记录</p>
          ) : (
            history.map((item, index) => (
              <div key={index} style={{ 
                padding: '10px', 
                borderBottom: '1px solid #f0f0f0',
                cursor: 'pointer'
              }} onClick={() => {
                setResult(item.data)
                setIsHistoryModalOpen(false)
                setTimeout(()=>{
                  resWrap.current?.scrollIntoView({behavior:"smooth"})
                },0)
                
              }}>
                {item.data.substring(0, 50)}...
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  )
}
