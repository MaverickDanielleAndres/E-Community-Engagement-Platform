'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { z } from 'zod'
import { Toast } from '@/components/Toast'
import { Button } from '@/components/Button'
import { Upload, Loader2, CheckCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'

const idVerificationSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(100, 'Full name must be less than 100 characters'),
  age: z.coerce.number().min(18, 'You must be at least 18 years old').max(120, 'Age must be less than 120'),
  gender: z.enum(['male', 'female', 'other'], { message: 'Please select a gender' }),
  address: z.string().min(10, 'Address must be at least 10 characters').max(500, 'Address must be less than 500 characters'),
  id_number: z.string().min(5, 'ID number must be at least 5 characters').max(50, 'ID number must be less than 50 characters')
})

interface FilePreview {
  file: File | null
  preview: string | null
  name: string
}

export default function IDVerificationPage() {
  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    gender: '',
    address: '',
    id_number: ''
  })
  const [frontId, setFrontId] = useState<FilePreview>({ file: null, preview: null, name: '' })
  const [backId, setBackId] = useState<FilePreview>({ file: null, preview: null, name: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [email, setEmail] = useState('')
  const [showSampleImages, setShowSampleImages] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    } else {
      // If no email, try to get from session or redirect
      router.push('/auth/login')
    }
  }, [searchParams, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleGenderChange = (value: string) => {
    setFormData(prev => ({ ...prev, gender: value }))
    if (errors.gender) {
      setErrors(prev => ({ ...prev, gender: '' }))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back') => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setToast({ message: 'Please select an image file', type: 'error' })
        return
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setToast({ message: 'File size must be less than 5MB', type: 'error' })
        return
      }

      const preview = URL.createObjectURL(file)
      const previewData = { file, preview, name: file.name }

      if (type === 'front') {
        setFrontId(previewData)
      } else {
        setBackId(previewData)
      }
    }
  }

  const validateForm = () => {
    try {
      idVerificationSchema.parse({
        full_name: formData.full_name,
        age: formData.age,
        gender: formData.gender,
        address: formData.address,
        id_number: formData.id_number
      })
      if (!frontId.file || !backId.file) {
        setToast({ message: 'Please upload both ID images', type: 'error' })
        return false
      }
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {}
        error.errors.forEach(err => {
          fieldErrors[err.path[0] as string] = err.message
        })
        setErrors(fieldErrors)
      }
      return false
    }
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)

    const formDataToSend = new FormData()
    formDataToSend.append('full_name', formData.full_name)
    formDataToSend.append('age', formData.age.toString())
    formDataToSend.append('gender', formData.gender)
    formDataToSend.append('address', formData.address)
    formDataToSend.append('id_number', formData.id_number)
    formDataToSend.append('national_id_front', frontId.file!)
    formDataToSend.append('national_id_back', backId.file!)
    formDataToSend.append('email', email)

    try {
      const response = await fetch('/api/user/id-verification', {
        method: 'POST',
        body: formDataToSend
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setToast({ message: 'ID verification submitted successfully! You will be notified once approved.', type: 'success' })
        setTimeout(() => {
          router.push('/main/guest/waiting')
        }, 2000)
      } else {
        setToast({ message: result.message || 'Submission failed', type: 'error' })
      }
    } catch (error) {
      console.error('Submission error:', error)
      setToast({ message: 'An unexpected error occurred', type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Complete Your ID Verification
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Please provide your identification details to complete registration.
            </p>
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium mb-1">Important Notice:</p>
                  <p>Please ensure the address and ID number you provide exactly match what appears on your submitted ID document. Failure to provide accurate information may result in rejection of your verification request.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-6 bg-white dark:bg-slate-800">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Personal Information</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Enter your details accurately</p>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-3 py-2 border rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">This is the email you used to create your account</p>
              </div>

              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.full_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                />
                {errors.full_name && <p className="text-red-500 text-sm mt-1">{errors.full_name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="age" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Age</label>
                  <input
                    id="age"
                    name="age"
                    type="number"
                    value={formData.age}
                    onChange={handleInputChange}
                    placeholder="e.g., 25"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.age ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                  />
                  {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age}</p>}
                </div>
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={(e) => handleGenderChange(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.gender ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter your full address"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.address ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                />
                {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
              </div>

              <div>
                <label htmlFor="id_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ID Number</label>
                <input
                  id="id_number"
                  name="id_number"
                  type="text"
                  value={formData.id_number}
                  onChange={handleInputChange}
                  placeholder="Enter your national ID number"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.id_number ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                />
                {errors.id_number && <p className="text-red-500 text-sm mt-1">{errors.id_number}</p>}
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-6 bg-white dark:bg-slate-800">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">ID Document Upload</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Upload clear photos of both sides of your national ID</p>
              <button
                onClick={() => setShowSampleImages(!showSampleImages)}
                className="mt-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm flex items-center"
              >
                {showSampleImages ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                {showSampleImages ? 'Hide' : 'Show'} Sample Images
              </button>
            </div>

            {showSampleImages && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Sample ID Images:</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">Front Side Sample:</p>
                    <div className="bg-gray-200 dark:bg-slate-600 rounded-lg p-4 text-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        <div className="mb-2">📄</div>
                        <div>Sample ID Front</div>
                        <div className="text-xs mt-1">Shows photo, name, ID number</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">Back Side Sample:</p>
                    <div className="bg-gray-200 dark:bg-slate-600 rounded-lg p-4 text-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        <div className="mb-2">📄</div>
                        <div>Sample ID Back</div>
                        <div className="text-xs mt-1">Shows address, other details</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="front-id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">National ID Front</label>
                <div className="mt-2">
                  <input
                    id="front-id"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'front')}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                {frontId.preview && (
                  <div className="mt-4">
                    <Image
                      src={frontId.preview}
                      alt="ID Front Preview"
                      width={200}
                      height={150}
                      className="rounded-lg border"
                    />
                    <p className="text-sm text-gray-500 mt-1">{frontId.name}</p>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="back-id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">National ID Back</label>
                <div className="mt-2">
                  <input
                    id="back-id"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'back')}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                {backId.preview && (
                  <div className="mt-4">
                    <Image
                      src={backId.preview}
                      alt="ID Back Preview"
                      width={200}
                      height={150}
                      className="rounded-lg border"
                    />
                    <p className="text-sm text-gray-500 mt-1">{backId.name}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            disabled={isSubmitting || !frontId.file || !backId.file}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Submit ID Verification
              </>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  )
}
