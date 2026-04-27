export async function callSuregoFunction(name, action, payload = {}) {
  try {
    const response = await uniCloud.callFunction({
      name,
      data: {
        action,
        payload
      }
    })
    const result = response?.result || {}
    if (result.code && result.code !== 0) {
      throw new Error(result.message || result.errMsg || result.code)
    }
    return result.data !== undefined ? result.data : result
  } catch (error) {
    const message = error?.message || '云端服务暂不可用'
    uni.showToast({
      title: message,
      icon: 'none'
    })
    throw {
      code: 'SUREGO_CLOUD_ERROR',
      message
    }
  }
}
