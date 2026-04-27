export function goActivityDetail(id) {
  uni.navigateTo({
    url: `/pages/activity/detail?id=${encodeURIComponent(id)}`
  })
}

export function goBackHome() {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
    return
  }

  uni.reLaunch({
    url: '/pages/home/index'
  })
}

export function showComingSoon(title = '功能开发中') {
  uni.showToast({
    title,
    icon: 'none'
  })
}
