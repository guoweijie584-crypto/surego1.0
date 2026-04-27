<template>
  <view class="su-dock su-safe-bottom">
    <view
      class="su-dock__item"
      :class="{ 'su-dock__item--active': active === 'home' }"
      @tap="goHome"
    >
      <uni-icons type="home-filled" size="24" :color="active === 'home' ? '#111827' : '#94a3b8'" />
      <text>首页</text>
    </view>

    <view class="su-dock__create" @tap="goCreate">
      <uni-icons type="plusempty" size="34" color="#fff" />
    </view>

    <view
      class="su-dock__item"
      :class="{ 'su-dock__item--active': active === 'discover' }"
      @tap="goDiscover"
    >
      <uni-icons type="paperplane-filled" size="24" :color="active === 'discover' ? '#111827' : '#94a3b8'" />
      <text>发现</text>
    </view>
  </view>
</template>

<script setup>
const props = defineProps({
  active: {
    type: String,
    default: 'home'
  }
})

function goHome() {
  if (props.active === 'home') return
  uni.reLaunch({ url: '/pages/home/index' })
}

function goCreate() {
  uni.navigateTo({ url: '/pages/activity/create' })
}

function goDiscover() {
  if (props.active === 'discover') return
  uni.navigateTo({ url: '/pages/discover/index' })
}
</script>

<style scoped>
.su-dock {
  position: fixed;
  bottom: 34rpx;
  left: 50%;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 90%;
  max-width: 720rpx;
  min-height: 112rpx;
  padding: 12rpx 32rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.7);
  border-radius: 50rpx;
  background: rgba(255, 255, 255, 0.34);
  box-shadow: 0 28rpx 70rpx rgba(15, 23, 42, 0.18);
  backdrop-filter: blur(18px);
  transform: translateX(-50%);
}

.su-dock__item {
  display: flex;
  width: 180rpx;
  align-items: center;
  gap: 6rpx;
  flex-direction: column;
  color: #94a3b8;
  font-size: 19rpx;
  font-weight: 900;
}

.su-dock__item--active {
  color: #111827;
  transform: scale(1.08);
}

.su-dock__create {
  display: flex;
  width: 128rpx;
  height: 128rpx;
  align-items: center;
  justify-content: center;
  margin-top: -56rpx;
  border: 12rpx solid #f8f9f9;
  border-radius: 50%;
  background: #ff6b6b;
  box-shadow: 0 20rpx 50rpx rgba(255, 107, 107, 0.42);
}
</style>
