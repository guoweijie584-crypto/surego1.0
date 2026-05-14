<template>
  <view class="su-dock su-safe-bottom">
    <view
      v-for="item in navItems"
      :key="item.key"
      class="su-dock__item"
      :class="{ 'su-dock__item--active': active === item.key }"
      @tap="handleTap(item)"
    >
      <view v-if="item.key === 'publish'" class="su-dock__create">
        <uni-icons type="plusempty" size="31" color="#fff" />
      </view>
      <template v-else>
        <uni-icons :type="item.icon" size="23" :color="active === item.key ? '#111827' : '#94a3b8'" />
        <text>{{ item.label }}</text>
      </template>
    </view>
  </view>
</template>

<script setup>
import { goHomeRoot, goMessages, goPartnersRoot, goPublishCenter, goUserProfile } from '@/common/utils/route.js'

const props = defineProps({
  active: {
    type: String,
    default: 'home'
  }
})

const navItems = [
  { key: 'home', label: '成行', icon: 'home-filled', action: goHomeRoot },
  { key: 'partners', label: '找搭子', icon: 'staff-filled', action: goPartnersRoot },
  { key: 'publish', label: '发布', icon: 'plusempty', action: goPublishCenter },
  { key: 'messages', label: '通知', icon: 'notification-filled', action: () => goMessages({ root: true }) },
  { key: 'profile', label: '我的', icon: 'person-filled', action: () => goUserProfile({ root: true }) }
]

function handleTap(item) {
  if (props.active === item.key && item.key !== 'publish') return
  item.action()
}
</script>

<style scoped>
.su-dock {
  position: fixed;
  bottom: 30rpx;
  left: 50%;
  z-index: 50;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  align-items: center;
  width: 92%;
  max-width: 720rpx;
  min-height: 112rpx;
  padding: 12rpx 18rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.72);
  border-radius: 48rpx;
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 24rpx 64rpx rgba(15, 23, 42, 0.16);
  backdrop-filter: blur(18px);
  transform: translateX(-50%);
}

.su-dock__item {
  position: relative;
  display: flex;
  min-width: 0;
  height: 88rpx;
  align-items: center;
  justify-content: center;
  gap: 5rpx;
  flex-direction: column;
  color: #94a3b8;
  font-size: 18rpx;
  font-weight: 900;
}

.su-dock__item--active {
  color: #111827;
}

.su-dock__create {
  display: flex;
  width: 104rpx;
  height: 104rpx;
  align-items: center;
  justify-content: center;
  margin-top: -46rpx;
  border: 10rpx solid #f8f9f9;
  border-radius: 50%;
  background: #ff6b6b;
  box-shadow: 0 18rpx 42rpx rgba(255, 107, 107, 0.38);
}
</style>
