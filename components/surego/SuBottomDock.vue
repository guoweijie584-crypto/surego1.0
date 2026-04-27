<template>
  <view class="su-dock su-safe-bottom">
    <view
      v-for="item in items"
      :key="item.key"
      class="su-dock__item"
      :class="{ 'su-dock__item--active': active === item.key }"
      @tap="handleTap(item)"
    >
      <uni-icons :type="item.icon" size="22" :color="active === item.key ? '#111827' : '#94a3b8'" />
      <text>{{ item.label }}</text>
    </view>
  </view>
</template>

<script setup>
import { showComingSoon } from '@/common/utils/route.js'

const props = defineProps({
  active: {
    type: String,
    default: 'home'
  }
})

const items = [
  { key: 'home', label: '发现', icon: 'home-filled', url: '/pages/home/index' },
  { key: 'calendar', label: '日历', icon: 'calendar' },
  { key: 'create', label: '发起', icon: 'plusempty' },
  { key: 'message', label: '消息', icon: 'chatboxes' },
  { key: 'profile', label: '我的', icon: 'person-filled' }
]

function handleTap(item) {
  if (item.key === props.active) return
  if (item.url) {
    uni.reLaunch({ url: item.url })
    return
  }
  showComingSoon(`${item.label}页后续迁移`)
}
</script>

<style scoped>
.su-dock {
  position: fixed;
  right: 24rpx;
  bottom: 24rpx;
  left: 24rpx;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-around;
  min-height: 104rpx;
  padding: 14rpx 18rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.7);
  border-radius: 36rpx;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 22rpx 60rpx rgba(15, 23, 42, 0.14);
  backdrop-filter: blur(18px);
}

.su-dock__item {
  display: flex;
  min-width: 86rpx;
  align-items: center;
  gap: 6rpx;
  flex-direction: column;
  color: #94a3b8;
  font-size: 19rpx;
  font-weight: 900;
}

.su-dock__item--active {
  color: #111827;
}
</style>
