'use client'
import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Mbutton } from '../../uis'
import { doRequest } from '../../utils/request'
interface Banner {
  id: string
  banner_image: string
  action: string
  status: string
  lane: string
  content: string
  name: string
  type: "normal" | "icon"
}

export default function BannerPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<{
    banner_image: string | File
    action: string
    status: string
    lane: string
    content: string
    name: string
    type: "normal" | "icon"
  }>({
    banner_image: '',
    action: 'link',
    status: 'active',
    lane: 'whale',
    content: "",
    name: "",
    type: "normal"
  })

  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    setLoading(true)
    try {
      const res = await doRequest('/api/admin/banner?lane=whale')
      const data = res.data.list
      setBanners(data)
    } catch (error) {
      console.error('获取banner列表失败', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      let bannerImageUrl = formData.banner_image
      
      if (formData.banner_image instanceof File) {
        const formDataUpload = new FormData()
        formDataUpload.append('file', formData.banner_image)
        const uploadRes = await doRequest('/api/admin/file_upload', {
          method: 'POST',
          body: formDataUpload
        })
  
        bannerImageUrl = uploadRes.data
      }
      
      const res = await doRequest(editingId ? '/api/admin/banner' : '/api/admin/banner', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { 
          ...formData, 
          id: editingId,
          banner_image: bannerImageUrl,
          action: `${formData.action || "link"}::${formData.content}`
        } : {
          ...formData,
          banner_image: bannerImageUrl,
          action: `${formData.action || "link" }::${formData.content}`
        })
      })

      if(res.status === 200) {
        setShowForm(false)
        fetchBanners()
      }
    } catch (error) {
      console.error('操作失败', error)
    }
  }

  const handleEdit = (banner: Banner) => {
    setEditingId(banner.id)
    setPreviewImage(banner.banner_image)
    const [action, content] = banner.action.split('::')
    console.log({action, content})
    setFormData({
      banner_image: banner.banner_image,
      action: action,
      status: banner.status,
      lane: banner.lane,
      content: content,
      name: banner.name,
      type: banner.type || "normal"
    })
    setShowForm(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const onSubmit = useCallback(() => {
    if(!formData.banner_image) {
      alert('请上传图片')
      return
    }
    if(!formData.content) {
      alert('请填写banner内容')
      return
    }
    if (formRef.current) {
      formRef.current.requestSubmit()
    }
  },[formData,formRef])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Banner管理</h1>
      
      <Mbutton 
        onClick={() => {
          setPreviewImage(null)
          setShowForm(true)
          setEditingId(null)
          setFormData({
            banner_image: '',
            action: 'link',
            status: 'active',
            lane: 'whale',
            content: "http://",
            name: "",
            type: "normal"
          })
        }}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm"
      >
        新增Banner
      </Mbutton>

      {showForm && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingId ? '编辑Banner' : '新增Banner'}
            </h2>
            <form onSubmit={handleSubmit} ref={formRef} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">图片</label>
                {previewImage && (
                  <div className="mb-2">
                    <Image 
                      src={previewImage} 
                      width={100} 
                      height={100} 
                      alt="Banner Preview" 
                      
                      className="rounded-lg"
                    />
                  </div>
                )}
                <input
                  type="file"
                  name="banner_image"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setPreviewImage(URL.createObjectURL(e.target.files[0]))
                      setFormData(prev => ({
                        ...prev,
                        banner_image: e.target.files![0]
                      }))
                    }
                  }}
                  placeholder='上传Banner图片'
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
                {!formData.banner_image && (
                  <p className="text-gray-500 text-sm mt-1">未上传图片</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="请输入运营名称"
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                >
                  <option value="normal">大banner</option>
                  <option value="icon">icon点位</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                <select
                  name="action"
                  value={formData.action}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                >
                  <option value="link">链接</option>
                  <option value="miniprogram">小程序内页</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                >
                  <option value="active">生效</option>
                  <option value="deactive">失效</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">内容</label>
                <input
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  required
                  placeholder="请输入Banner内容"
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <Mbutton 
                  onClick={onSubmit}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg"
                >
                  保存
                </Mbutton>
                <Mbutton 
                  type="text" 
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 !text-[black] py-2 rounded-lg"
                >
                  取消
                </Mbutton>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <p className="text-gray-500">加载中...</p>
        </div>
      ) : (
        <div className="mt-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Banner列表</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {banners.map(banner => (
              <div 
                key={banner.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="mb-3">
                  <Image 
                    src={banner.banner_image} 
                    width={100} 
                    height={100} 
                    alt="Banner Image" 
                    className="rounded-lg w-full"
                  />
                </div>
                <div className="space-y-2">
                  <p><span className="font-medium">名称:</span> {banner.name}</p>
                  <p><span className="font-medium">类型:</span> {banner.type}</p>
                  <div>
                    <p className="font-medium">Action:</p>
                    <p>{banner.action.split('::')[0]}</p>
                    <p className="font-medium">内容:</p>
                    <p>{banner.action.split('::')[1]}</p>
                  </div>
                  <p><span className="font-medium">状态:</span> {banner.status}</p>
                </div>
                <Mbutton 
                  onClick={() => handleEdit(banner)}
                  className="mt-3 w-full bg-blue-500 hover:bg-blue-600 text-white py-1.5 rounded-lg"
                >
                  编辑
                </Mbutton>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
