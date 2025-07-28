'use client'

import { HistoryOutlined } from '@ant-design/icons'
import { Button, Modal } from 'antd'
import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { UserContext } from './components/Common'
import { GenerateIcon } from './components/GeneratingIcon'
import { TopButton } from './components/TopButton'
/**
 * 记叙文、说明文、议论文、抒情文、描写文、应用文、游记、日记、读后感、观后感
 */
const translations = {
  zh: {
    title: 'AI作文生成',
    topic: '作文主题',
    topicPlaceholder: '请输入作文主题',
    extra: "写作要求",
    extraPlaceholder: '补充说明',
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
  useEffect(() => {
    const savedHistory = localStorage.getItem('aiWriterHistory')
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory))
    }
  }, [])
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>()
  const t = translations['zh']
  const onSubmit = async (data: FormData) => {
    mainWrap.current?.scrollIntoView({behavior: 'smooth'})
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
        },0)
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
  return (
    <div className="ai-writer-container" ref={mainWrap}>
      <div style={{ display: 'flex', justifyContent:'end', marginBottom: '10px' }}>
              <div onClick={() => setIsHistoryModalOpen(true)} style={{
                background:"white !important",
                cursor: 'pointer',
                float:"right"
              }}>
                历史 <HistoryOutlined/>
              </div>
      </div>
      <div className="form-section">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label>{t.topic}</label>
            <textarea
              maxLength={50}
              style={{
                width:"100%",
                color:"gray"
              }}
              disabled={isGenerating}
              {...register('topic', { required: t.required(t.topic) })}
              placeholder={t.topicPlaceholder}
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
                height:"120px"
              }}
              disabled={isGenerating}
              {...register('extra')}
              placeholder={t.extraPlaceholder}
            />
            {errors.topic && <span className="error">{errors.topic.message}</span>}
          </div>

          <div className="form-group">
            <label>{t.type}</label>
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

          <div className="form-group">
            <label>{t.wordCount}</label>
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

          <div className="language-switcher" style={{
              display: "flex",
              width:"100%",
              marginBottom:"30px",
              marginTop:"10px",
              justifyContent:"space-around"
            }}>
              <button 
                disabled={isGenerating}
                className={language === 'zh' ? 'active' : ''}
                {...register("language")}
                onClick={() => {
                  setLanguage('zh')
                  handleSubmit(onSubmit)()
                }}
                type="button"
              >
                生成中文 <GenerateIcon generating={isGenerating} />
              </button> 
              <button
                disabled={isGenerating}
                className={language === 'en' ? 'active' : ''}
                onClick={() => {
                  setLanguage('en')
                  handleSubmit(onSubmit)()
                }}
                type="button"
              >
                生成英文 <GenerateIcon generating={isGenerating} />
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
          <div className='result-icon flex w-[100%]] gap-[20px]'>
            <Button 
              onClick={copyResult} 
              disabled={isGenerating}
              className='!bg-[#D9D9D9]'
              style={{
                  background:"#D9D9D9 !important",
                  cursor: 'pointer',
                  width: "40%",
                  color: "black"
              }}>
              {
                t.copy
              } 
            </Button>
            <Button 
              disabled={isGenerating}
              onClick={handleSubmit(onSubmit)} 
              className='!bg-[#D9D9D9]'
              style={{
                  background:"#D9D9D9 !important",
                  cursor: 'pointer',
                  width: "40%",
                  color: "black"
              }}>
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
