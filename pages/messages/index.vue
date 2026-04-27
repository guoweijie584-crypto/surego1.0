<template>
  <view class="messages su-page">
    <view class="messages__nav">
      <view class="messages__back" @tap="goBackHome">
        <uni-icons type="left" size="24" color="#111827" />
      </view>
      <text>消息中心</text>
      <view class="messages__back" @tap="handleMarkAllRead">
        <uni-icons type="trash" size="20" color="#94a3b8" />
      </view>
    </view>

    <scroll-view scroll-y class="messages__scroll">
      <scroll-view scroll-x class="tabs" :show-scrollbar="false">
        <view class="tabs__inner">
          <view
            v-for="item in tabs"
            :key="item"
            class="tabs__item"
            :class="{ 'tabs__item--active': activeTab === item }"
            @tap="activeTab = item"
          >
            <text>{{ item }}</text>
          </view>
        </view>
      </scroll-view>

      <view class="messages__list">
        <view v-if="filteredMessages.length === 0" class="empty">
          <uni-icons type="info" size="40" color="#cbd5e1" />
          <text>暂无相关消息</text>
        </view>
        <view
          v-for="item in filteredMessages"
          :key="item.id"
          class="message-card"
          :class="{ 'message-card--unread': !item.read }"
          @tap="openMessage(item)"
        >
          <view class="message-card__accent" :class="`message-card__accent--${item.type}`" />
          <view class="message-card__icon" :class="`message-card__icon--${item.type}`">
            <uni-icons :type="getIcon(item)" size="24" color="#fff" />
          </view>
          <view class="message-card__body">
            <view class="message-card__head">
              <text class="message-card__title su-line-1">{{ item.title }}</text>
              <text class="message-card__time">{{ item.createdAt }}</text>
            </view>
            <text class="message-card__content su-line-2">{{ item.content }}</text>
            <text v-if="item.type === 'application'" class="message-card__link">进入审核</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <SuBottomDock active="" />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import SuBottomDock from '@/components/surego/SuBottomDock.vue'
import { listMessages, markAllMessagesRead, markMessageRead } from '@/common/api/message.js'
import { goBackHome, goManageDashboard } from '@/common/utils/route.js'

const tabs = ['全部', '未读', '申请', '活动']
const activeTab = ref('全部')
const messages = ref([])

const filteredMessages = computed(() => {
  if (activeTab.value === '未读') return messages.value.filter((item) => !item.read)
  if (activeTab.value === '申请') return messages.value.filter((item) => item.type === 'application')
  if (activeTab.value === '活动') return messages.value.filter((item) => item.type === 'activity')
  return messages.value
})

onShow(async () => {
  messages.value = await listMessages()
})

function getIcon(item) {
  if (item.type === 'application') return 'personadd-filled'
  if (item.type === 'activity') return 'calendar'
  return 'notification-filled'
}

async function handleMarkAllRead() {
  messages.value = await markAllMessagesRead()
}

async function openMessage(item) {
  await markMessageRead(item.id)
  messages.value = messages.value.map((msg) => (msg.id === item.id ? { ...msg, read: true } : msg))
  if (item.type === 'application' && item.activityId) {
    goManageDashboard(item.activityId)
  }
}
</script>

<style scoped>
.messages {
  min-height: 100vh;
  padding-bottom: 180rpx;
  background: #f8f9f9;
}

.messages__nav {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 30;
  display: flex;
  height: 132rpx;
  align-items: flex-end;
  justify-content: space-between;
  padding: 0 34rpx 18rpx;
  border-bottom: 1rpx solid #f1f5f9;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(18px);
  color: #111827;
  font-size: 32rpx;
  font-style: italic;
  font-weight: 900;
}

.messages__back {
  display: flex;
  width: 70rpx;
  height: 70rpx;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #fff;
}

.messages__scroll {
  height: 100vh;
  padding-top: 150rpx;
}

.tabs {
  white-space: nowrap;
}

.tabs__inner {
  display: flex;
  gap: 16rpx;
  padding: 10rpx 40rpx 30rpx;
}

.tabs__item {
  padding: 18rpx 34rpx;
  border: 1rpx solid #eef2f7;
  border-radius: 999rpx;
  background: #fff;
  color: #94a3b8;
  font-size: 22rpx;
  font-weight: 900;
}

.tabs__item--active {
  border-color: #111827;
  background: #111827;
  color: #fff;
}

.messages__list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  padding: 0 34rpx 180rpx;
}

.message-card {
  position: relative;
  display: flex;
  gap: 22rpx;
  overflow: hidden;
  padding: 30rpx;
  border: 1rpx solid #f1f5f9;
  border-radius: 40rpx;
  background: #fff;
  box-shadow: 0 18rpx 46rpx rgba(15, 23, 42, 0.05);
}

.message-card__accent {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 10rpx;
  opacity: 0;
}

.message-card--unread .message-card__accent {
  opacity: 1;
}

.message-card__accent--application,
.message-card__icon--application {
  background: #8b5cf6;
}

.message-card__accent--activity,
.message-card__icon--activity {
  background: #3b82f6;
}

.message-card__accent--system,
.message-card__icon--system {
  background: #22c55e;
}

.message-card__icon {
  display: flex;
  width: 92rpx;
  height: 92rpx;
  flex: 0 0 92rpx;
  align-items: center;
  justify-content: center;
  border-radius: 30rpx;
}

.message-card__body {
  flex: 1;
  min-width: 0;
}

.message-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.message-card__title {
  color: #111827;
  font-size: 28rpx;
  font-style: italic;
  font-weight: 900;
}

.message-card__time {
  color: #cbd5e1;
  font-size: 18rpx;
  font-weight: 900;
  white-space: nowrap;
}

.message-card__content {
  display: block;
  margin-top: 14rpx;
  color: #64748b;
  font-size: 24rpx;
  font-weight: 800;
  line-height: 1.55;
}

.message-card__link {
  display: inline-flex;
  margin-top: 18rpx;
  color: #4f46e5;
  font-size: 22rpx;
  font-weight: 900;
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 16rpx;
  padding: 120rpx 0;
  color: #94a3b8;
  font-size: 24rpx;
  font-weight: 900;
}
</style>
