<template>
  <view>
    <web-view :src="url"></web-view>
  </view>
</template>

<script>
const ALLOWED_WEBVIEW_HOSTS = [
  'surego.example.com'
]

function sanitizeWebviewUrl(value = '') {
  try {
    const decoded = decodeURIComponent(String(value || '').trim())
    const parsed = new URL(decoded)
    if (parsed.protocol !== 'https:') return ''
    if (!ALLOWED_WEBVIEW_HOSTS.includes(parsed.hostname)) return ''
    return parsed.toString()
  } catch (error) {
    return ''
  }
}

export default {
  async onLoad({ url, title }) {
    const safeUrl = sanitizeWebviewUrl(url)
    if (!safeUrl) {
      uni.showToast({ title: '链接不受信任', icon: 'none' })
      setTimeout(() => uni.navigateBack(), 300)
      return
    }
    this.url = safeUrl
    if (title) uni.setNavigationBarTitle({ title: String(title).slice(0, 20) })
  },
  data() {
    return {
      url: ''
    }
  }
}
</script>
