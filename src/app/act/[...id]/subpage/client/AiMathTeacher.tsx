'use client'
import { CheckCircleFilled } from '@ant-design/icons'
import { Button, Input, message, Modal } from 'antd'
import { useCallback, useContext, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { UserContext } from './components/Common'
import { GenerateIcon } from './components/GeneratingIcon'

const rangeOptions = ['20以内', '40以内', '100以内', '500以内', '1000以内', '自定义']
const countOptions = [20, 30, 40, 50, 60, 70, 80, 90, 100]
const arithmeticOptions = [
  { label: '加(+)', value: '+' },
  { label: '减(-)', value: '-' },
  { label: '乘(×)', value: '×' },
  { label: '除(÷)', value: '÷' }
]

export default function AiMathTeacher() {
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [customRange, setCustomRange] = useState('')
  const [selectedRangeIndex, setSelectedRangeIndex] = useState(0)
  const [selectedArithmetic, setSelectedArithmetic] = useState<string[]>(arithmeticOptions.map(item=>item.value))
  const [selectedCount, setSelectedCount] = useState(20)
  const { handleSubmit } = useForm()
  const [result, setResult] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const resWrap = useRef<HTMLDivElement>(null)
  const {openId} = useContext(UserContext)
  const onSubmit = async () => {
    if (selectedRangeIndex === -1 && !customRange) {
      alert('请选择数字范围')
      return
    }
    if (selectedArithmetic.length === 0) {
      alert('请至少选择一种运算')
      return
    }
    setIsGenerating(true)
    try {
      const response = await fetch('/api/aiact/math', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "x-user-id": openId
        },
        body: JSON.stringify({
          range: selectedRangeIndex === -1 ? `${customRange}以内` : rangeOptions[selectedRangeIndex],
          arithmetic: selectedArithmetic,
          count: selectedCount
        })  
      })
      const { data } = await response.json()
      message.success(`成功生成${selectedCount}道题目`)
      console.log('生成的题目数据:', data) // 处理返回数据
      setResult(data.split("\n").map((str:string,index:number)=>`(${index})  ${str}\n`))
      setTimeout(()=>{
        resWrap.current?.scrollIntoView({
          behavior:"smooth"
        })
      },0)
    } catch {
      message.error('生成题目失败')
    } finally{
      setIsGenerating(false)
    }
  }

  const handleCustomConfirm = useCallback(() => {
    if (!customRange || isNaN(Number(customRange)) || Number(customRange) < 10 || Number(customRange) > 10000) {
      alert('请输入10-10000之间的数字')
      return
    }
    setSelectedRangeIndex(5)
    setShowCustomModal(false)
  },[customRange])
  const copyResult = useCallback(() => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    // message.success({
    //  content:t.copy_done
    // })
    alert("复制成功")
  }, [result]);
  return (
    <div className="ai-math-teacher">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* 数字范围选择 */}
        <div className="section">
          <h3>数字范围</h3>
          <div className="range-buttons" style={{
            display:"grid",
            gridTemplateColumns:"1fr 1fr 1fr"
          }}>
            {rangeOptions.map((option,index) => (
              <Button
                key={option}
                type={selectedRangeIndex === index ? 'primary' : 'default'}
                shape="round"
                style={{
                  width:"100%",
                  height:"100px",
                  borderRadius:"12px",
                  fontSize:"16px",
                  fontWeight:'bold'
                }}
                onClick={() => {
                  if (option === '自定义') {
                    setShowCustomModal(true)
                  } else {
                    setSelectedRangeIndex(index)
                  }
                }}
              >
                {option === '自定义' && selectedRangeIndex === index && customRange
                  ? `${customRange}以内`
                  : option}
              </Button>
            ))}
          </div>
        </div>

        {/* 运算符选择 */}
        <div className="section">
          <h3>运算类型</h3>
          <div className="arithmetic-buttons" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {arithmeticOptions.map(({ label, value }) => (
              <Button
                key={value}
                type={selectedArithmetic.includes(value) ? 'primary' : 'default'}
                shape="round"
                style={{ borderRadius: '12px', fontSize:'16px', fontWeight: "bold" }}
                onClick={() => {
                  if (selectedArithmetic.includes(value)) {
                    setSelectedArithmetic(selectedArithmetic.filter(v => v !== value))
                  } else {
                    setSelectedArithmetic([...selectedArithmetic, value])
                  }
                }}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* 题目数量选择 */}
        <div className="section">
          <h3>题目数量</h3>
          <div className="count-buttons">
            {countOptions.map(count => (
              <Button
                key={count}
                type={selectedCount === count ? 'primary' : 'default'}
                shape="round"
                style={{
                  borderRadius:"12px"
                }}
                onClick={() => setSelectedCount(count)}
              >
                {count}
              </Button>
            ))}
          </div>
        </div>
        

        <Button type="primary" htmlType="submit"
          onClick={handleSubmit(onSubmit)}
          disabled={isGenerating}
          style={{
          width:"100%",
          height:"50px",
          fontWeight:'bolder',
          fontSize: "16px",
          background:"#D9D9D9",
          color:"black"
        }}>
          生成题目 <GenerateIcon generating={isGenerating}/>
        </Button>
      </form>
      {
        result &&  <div className='section result' ref={resWrap} style={{
          borderRadius:"12px",
          border:"1px #D9D9D9 solid",
          marginTop:"12px",
          marginBottom:"12px"
        }}>
              <div style={{
                fontSize:"22px",
                margin: "12px",
                borderBottom:"1px #D9D9D9 solid",
                paddingBottom:"12px"
              }}> <CheckCircleFilled color='green' style={{color:"green"}}/> 生成结果 </div>
              <div style={{
                width: "100%", 
                wordWrap: "break-word",
                padding: "12px",
                whiteSpace: "pre-line",
                fontSize:"18px" 
              }}>
                {result}
              </div>
        </div>
      }
      {
        result && <Button type="primary" htmlType="submit"
                onClick={copyResult}
                style={{
                  width:"100%",
                  height:"50px",
                  fontWeight:'bolder',
                  fontSize: "16px",
                  background:"#D9D9D9",
                  color:"black",
                  marginTop:"12px"
                }}>
                复制
                </Button>
      }
     
      
      
      {/* 自定义范围弹窗 */}
      <Modal
        title="自定义数字范围"
        open={showCustomModal}
        onCancel={() => setShowCustomModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowCustomModal(false)}>
            取消
          </Button>,
          <Button key="confirm" type="primary" onClick={handleCustomConfirm}>
            确认
          </Button>
        ]}
      >
        <Input
          type='number'
          min="1"
          max="1000"
          placeholder="输入10-1000之间的数字"
          value={customRange}
          onChange={(e) => setCustomRange(e.target.value)}
          style={{ width: '100%', padding: '8px' }}
        />
      </Modal>

      <style jsx>{`
        .ai-math-teacher {
          padding: 20px;
        }
        .section {
          margin-bottom: 24px;
        }
        h3 {
          margin-bottom: 12px;
        }
        .range-buttons,
        .count-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
      `}</style>
    </div>
  )
}
