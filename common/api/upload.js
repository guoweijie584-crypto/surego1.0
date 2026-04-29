import { ALLOW_MOCK_FALLBACK } from '../config/runtime.js'

export const USER_CANCEL_IMAGE_PICKER = 'USER_CANCEL_IMAGE_PICKER'

function buildCloudPath(prefix = 'surego', filePath = '') {
  const extMatch = String(filePath).match(/\.[a-zA-Z0-9]+$/)
  const ext = extMatch ? extMatch[0] : '.jpg'
  return `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
}

function createCancelError(error = {}) {
  const next = new Error('用户取消选择图片')
  next.code = USER_CANCEL_IMAGE_PICKER
  next.errMsg = error.errMsg || USER_CANCEL_IMAGE_PICKER
  return next
}

export function isImagePickerCancel(error = {}) {
  const message = String(error.errMsg || error.message || '').toLowerCase()
  return error.code === USER_CANCEL_IMAGE_PICKER
    || message.includes('cancel')
    || message.includes('取消')
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
          reject(createCancelError())
          return
        }
        resolve(filePath)
      },
      fail(error = {}) {
        reject(isImagePickerCancel(error) ? createCancelError(error) : error)
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
    return await uploadImageFile(filePath, options)
  } catch (error) {
    if (isImagePickerCancel(error)) {
      return null
    }

    const message = error?.message || '图片上传失败，请稍后重试'
    uni.showToast({
      title: message,
      icon: 'none'
    })
    throw error
  }
}
