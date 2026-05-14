<template>
  <view class="su-page-loading" :style="style">
    <view class="su-page-loading__card">
      <SuIcon name="spinner-cycle" size="52" glyph-size="26" variant="inline" color="#64748b" />
      <text class="su-page-loading__text">{{ text }}</text>
    </view>
  </view>
</template>

<script setup>
import SuIcon from '@/components/surego/SuIcon.vue'
const props = defineProps({
  text: {
    type: String,
    default: '加载中...'
  },
  style: {
    type: [Object, String],
    default: ''
  }
})
</script>

<style scoped>
.su-page-loading {
  display: flex;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
  box-sizing: border-box;
}

.su-page-loading__card {
  display: flex;
  align-items: center;
  gap: 14rpx;
  padding: 26rpx 30rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18rpx 42rpx rgba(15, 23, 42, 0.08);
}

.su-page-loading__text {
  color: #475569;
  font-size: 24rpx;
  font-weight: 900;
}
</style>
