<template>
  <view class="messages ref-page">
    <view class="ref-topbar" :style="navStyle">
      <view class="ref-topbar__row" :style="navRowStyle">
        <text class="ref-topbar__title">通知</text>
        <view class="ref-top-action" @tap="handleMarkAllRead">
          <SuIcon name="check" size="30" glyph-size="14" variant="inline" color="#2388ff" />
          <text>{{ allRead ? '已全部读' : '全部已读' }}</text>
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="ref-scroll" :style="contentTopStyle">
      <scroll-view scroll-x class="ref-filter-row" :show-scrollbar="false">
        <text
          v-for="item in tabs"
          :key="item"
          :class="{ active: activeTab === item }"
          @tap="activeTab = item"
        >
          {{ item }}
        </text>
      </scroll-view>

      <view class="ref-stack">
        <view v-if="filteredMessages.length === 0" class="ref-empty ref-card">
          <SuIcon name="info" size="80" glyph-size="40" variant="inline" color="#cbd5e1" />
          <text>暂无相关通知</text>
        </view>

        <view
          v-for="item in filteredMessages"
          :key="item.id"
          class="notice-card ref-card"
          :class="{ 'notice-card--unread': !item.read && !allRead }"
          @tap="openMessage(item)"
        >
          <text class="ref-pill" :class="pillClass(item)">{{ noticeTypeLabel(item) }}</text>
          <text class="notice-card__title su-line-1">{{ item.title }}</text>
          <text class="notice-card__content su-line-2">{{ item.content }}</text>
          <text class="notice-card__time">{{ getMessageTime(item) }}</text>
        </view>
      </view>
    </scroll-view>

    <SuBottomDock active="messages" />
  </view>
</template>

<script setup>
import SuIcon from '@/components/surego/SuIcon.vue'
import { computed, ref } from 'vue'
import { onPullDownRefresh, onShow } from '@dcloudio/uni-app'
import SuBottomDock from '@/components/surego/SuBottomDock.vue'
import { getActivityDetail } from '@/common/api/activity.js'
import { listMessages, markAllMessagesRead, markMessageRead } from '@/common/api/message.js'
import { makeRefreshHandler } from '@/common/utils/refresh.js'
import { formatMessageTime } from '@/common/utils/time-format.js'
import { getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goActivityDetail, goManageDashboard, goParticipantDashboard, goPartnerConversation, goPartnerDetail } from '@/common/utils/route.js'

const tabs = ['全部', '活动审核', '候补', '搭子申请', '私聊', '群聊', '已成局']
const activeTab = ref('全部')
const messages = ref([])
const allRead = ref(false)
const navStyle = getMiniProgramNavStyle()
const navRowStyle = getMiniProgramNavRowStyle({ leftPaddingRpx: 34, minRightPaddingRpx: 24 })
const contentTopStyle = getMiniProgramNavContentStyle({ gapRpx: 18 })

const filteredMessages = computed(() => {
  if (activeTab.value === '全部') return messages.value
  if (activeTab.value === '活动审核') return messages.value.filter((item) => item.type === 'application')
  if (activeTab.value === '候补') return messages.value.filter((item) => item.type === 'activity' && /候补|席位/.test(item.title + item.content))
  if (activeTab.value === '搭子申请') return messages.value.filter((item) => item.type === 'partner')
  if (activeTab.value === '私聊') return messages.value.filter((item) => item.conversationId && item.conversationType !== 'group')
  if (activeTab.value === '群聊') return messages.value.filter((item) => item.conversationType === 'group')
  if (activeTab.value === '已成局') return messages.value.filter((item) => /成局|已成/.test(item.title + item.content))
  return messages.value
})

async function loadData() {
  messages.value = await listMessages()
  allRead.value = messages.value.every((item) => item.read)
}

onShow(loadData)
onPullDownRefresh(makeRefreshHandler(loadData))

function noticeTypeLabel(item) {
  if (item.type === 'application') return '活动审核'
  if (item.type === 'partner') return item.conversationId ? '私聊' : '搭子申请'
  if (item.conversationType === 'group') return '群聊'
  if (/候补|席位/.test(item.title + item.content)) return '候补'
  if (/成局|已成/.test(item.title + item.content)) return '已成局'
  return '活动通知'
}

function pillClass(item) {
  const label = noticeTypeLabel(item)
  if (label === '搭子申请' || label === '已成局') return 'ref-pill--purple'
  if (label === '候补') return 'ref-pill--amber'
  if (label === '私聊' || label === '群聊') return 'ref-pill--green'
  return 'ref-pill--blue'
}

function getMessageTime(item) {
  return formatMessageTime(item.createdAt)
}

async function handleMarkAllRead() {
  messages.value = await markAllMessagesRead()
  allRead.value = true
}

async function openMessage(item) {
  await markMessageRead(item.id)
  messages.value = messages.value.map((msg) => (msg.id === item.id ? { ...msg, read: true } : msg))
  allRead.value = messages.value.every((msg) => msg.read)
  if (item.type === 'application' && item.activityId) {
    goManageDashboard(item.activityId)
    return
  }
  if (item.type === 'partner' && item.partnerPostId) {
    if (item.conversationId) {
      goPartnerConversation(item.conversationId)
      return
    }
    goPartnerDetail(item.partnerPostId)
    return
  }
  if ((item.type === 'activity' || item.type === 'system') && item.activityId) {
    const activity = await getActivityDetail(item.activityId)
    if (activity?.isCreator) {
      goManageDashboard(item.activityId)
      return
    }
    if (['approved', 'pending'].includes(activity?.applicationStatus)) {
      goParticipantDashboard(item.activityId)
      return
    }
    goActivityDetail(item.activityId)
    return
  }
  uni.showToast({ title: '已标记为已读', icon: 'none' })
}
</script>

<style scoped>
.messages {
  padding-bottom: 180rpx;
}

.messages .ref-topbar__title {
  text-align: left;
  font-size: 34rpx;
}

.notice-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  padding: 32rpx;
}

.notice-card--unread::before {
  position: absolute;
  top: 36rpx;
  right: 36rpx;
  width: 18rpx;
  height: 18rpx;
  border-radius: 50%;
  background: #2388ff;
  content: "";
}

.notice-card__title {
  color: #102033;
  font-size: 28rpx;
  font-weight: 950;
}

.notice-card__content {
  color: #64748b;
  font-size: 24rpx;
  font-weight: 800;
  line-height: 1.55;
}

.notice-card__time {
  color: #94a3b8;
  font-size: 21rpx;
  font-weight: 850;
}
</style>
