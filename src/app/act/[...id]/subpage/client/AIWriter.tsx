'use client'

import { CopyOutlined, HistoryOutlined, LoadingOutlined } from '@ant-design/icons'
import { message, Modal, Spin } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

const translations = {
  zh: {
    title: 'AI作文生成',
    topic: '作文主题',
    topicPlaceholder: '请输入作文主题',
    type: '作文类型',
    typePlaceholder: '请选择作文类型',
    wordCount: '作文字数',
    wordCountPlaceholder: '请选择作文字数',
    generate: '生成作文',
    generating: '生成中...',
    generated:"生成作文完成，点击重新生成",
    result: '生成结果',
    narrative: '记叙文',
    argumentative: '议论文',
    descriptive: '描写文',
    expository: '说明文',
    copy_done:"复制成功",
    required: (field: string) => `请输入${field}`
  },
  en: {
    title: 'AI Essay Generator',
    topic: 'Essay Topic',
    topicPlaceholder: 'Enter essay topic',
    type: 'Essay Type',
    typePlaceholder: 'Select essay type',
    wordCount: 'Word Count',
    wordCountPlaceholder: 'Select word count',
    generate: 'Generate Essay',
    generating: 'Generating...',
    generated:"Generated, Click to ReGenerate",
    result: 'Result',
    narrative: 'Narrative',
    argumentative: 'Argumentative',
    descriptive: 'Descriptive',
    expository: 'Expository',
    copy_done:"Copy Done",
    required: (field: string) => `Please enter ${field}`
  }
}

type EssayType = 'narrative' | 'argumentative' | 'descriptive' | 'expository'
type FormData = {
  topic: string
  type: EssayType
  wordCount: number
  language: "zh" | "en"
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
  const [history, setHistory] = useState<string[]>([])
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  
  useEffect(() => {
    const savedHistory = localStorage.getItem('aiWriterHistory')
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory))
    }
  }, [])
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>()
  const t = translations[language]
  const onSubmit = async (data: FormData) => {
    if(isGenerating){
      return;
    }
    setIsGenerating(true)
    try {
      // 模拟API调用
      const result = await fetch("/api/aiact/1",{
        method:"post",
        body: JSON.stringify({
          type: data.type,
          theme: data.topic,
          count: data.wordCount,
          language: language
        })
      })
      const response = await result.json();
      if(response.status === 200) {
        setResult(response.data)
        const newHistory = [response.data, ...history].slice(0, 10)
        setHistory(newHistory)
        localStorage.setItem('aiWriterHistory', JSON.stringify(newHistory))
      }
      
      // setResult(`这是一篇关于"${data.topic}"的${data.type}作文，字数要求${data.wordCount}字...`)
    } finally {
      setIsGenerating(false)
    }
  }
  const copyResult = useCallback(() => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    message.success({
      content:t.copy_done
    })
  }, [result,t]);
  return (
    <div className="ai-writer-container" >
      
      <div className="form-section">
       
        <form onSubmit={
          handleSubmit(onSubmit)
        }>
           <div className="language-switcher" style={{
              display: "flex",
              width:"100%",
              marginBottom:"30px",
              marginTop:"10px",
              justifyContent:"space-around"
            }}>
              <button 
                className={language === 'zh' ? 'active' : ''}
                {...register("language")}
                onClick={() => setLanguage('zh')}
              >
                中文
              </button>
              <button
                className={language === 'en' ? 'active' : ''}
                onClick={() => setLanguage('en')}
              >
                English
              </button>
          </div>
          <div className="form-group">
            <label>{t.topic}</label>
            <textarea
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
            <label>{t.type}</label>
            <select
              disabled={isGenerating}
              {...register('type', { required: t.required(t.type) })}
              defaultValue=""
            >
              <option value="" disabled>{t.typePlaceholder}</option>
              <option value="narrative">{t.narrative}</option>
              <option value="argumentative">{t.argumentative}</option>
              <option value="descriptive">{t.descriptive}</option>
              <option value="expository">{t.expository}</option>
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

          <button type="submit" disabled={isGenerating}>
            {isGenerating ? <><span>{t.generating}</span><Spin indicator={antIcon} /></> : result? t.generated : t.generate}
          </button>
        </form>
      </div>

      {result && (
        <div className="result-section">
          <div style={{
            display:"flex",
            justifyContent:"space-between",
            alignItems:"center"
          }}>
            <h2>{t.result}</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div onClick={copyResult} style={{
                background:"white !important",
                cursor: 'pointer'
              }}>
                copy <CopyOutlined/>
              </div>
              <div onClick={() => setIsHistoryModalOpen(true)} style={{
                background:"white !important",
                cursor: 'pointer'
              }}>
                历史 <HistoryOutlined/>
              </div>
            </div>
          </div>
          <div className="essay-result">
            {result}
          </div>
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
                setResult(item)
                setIsHistoryModalOpen(false)
              }}>
                {item.substring(0, 50)}...
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  )
}
