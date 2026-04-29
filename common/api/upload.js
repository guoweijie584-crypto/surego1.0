import { ALLOW_MOCK_FALLBACK } from '../config/runtime.js'

function buildCloudPath(prefix = 'surego', filePath = '') {
  const extMatch = String(filePath).match(/\.[a-zA-Z0-9]+$/)
  const ext = extMatch ? extMatch[0] : '.jpg'
  return `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
}

export function chooseImageFile(options = {}) {
  return new Promise((resolve, reject) => {
    uni.chooseImage({
      count: options.count || 1,
      sizeType: options.sizeType || ['compressed'],
      sourceType: options.sourceType || ['album', 'camera'],
      success(result = {}) {
        const filePath = (result.tempFilePaths || [])[0]
        if (!filePath) {
          reject(new Error('No image selected'))
          return
        }
        resolve(filePath)
      },
      fail(error) {
        reject(error)
      }
    })
  })
}

export async function uploadImageFile(filePath, options = {}) {
  if (!filePath) {
    throw new Error('Image file path is required')
  }

  if (typeof uniCloud === 'undefined' || typeof uniCloud.uploadFile !== 'function') {
    if (ALLOW_MOCK_FALLBACK) {
      return {
        url: filePath,
        fileID: filePath,
        cloudPath: filePath,
        isLocalFallback: true
      }
    }
    throw new Error('图片上传服务不可用')
  }

  const cloudPath = options.cloudPath || buildCloudPath(options.prefix || 'surego/images', filePath)
  const result = await uniCloud.uploadFile({
    filePath,
    cloudPath,
    cloudPathAsRealPath: true
  })
  const url = result.fileID || result.fileUrl || result.url || ''
  return {
    url,
    fileID: result.fileID || url,
    cloudPath,
    isLocalFallback: false
  }
}

export async function chooseAndUploadImage(options = {}) {
  try {
    const filePath = await chooseImageFile(options)
    const uploaded = await uploadImageFile(filePath, options)
    return uploaded
  } catch (error) {
    const message = error?.message || '图片上传失败'
    uni.showToast({
      title: message,
      icon: 'none'
    })
    throw error
  }
}
