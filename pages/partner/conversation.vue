<template>
  <view class="conversation su-page">
    <view class="conversation__nav" :style="navStyle">
      <view class="conversation__nav-row" :style="navRowStyle">
        <view class="conversation__back" @tap="goBackOrFallback('/pages/messages/index')">
          <uni-icons type="left" size="24" color="#111827" />
        </view>
        <view class="conversation__detail" @tap="goPartnerDetail(conversation.partnerPostId)">
          <text>搭子帖</text>
          <uni-icons type="right" size="16" color="#64748b" />
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="conversation__scroll" :style="contentTopStyle">
      <view v-if="!conversation.id" class="conversation__empty">
        <uni-icons type="info" size="42" color="#cbd5e1" />
        <text>会话不存在或暂无权限查看</text>
      </view>
      <view v-else>
        <view class="conversation__head">
          <text class="conversation__eyebrow">CONVERSATION</text>
          <text class="conversation__title">搭子连接已建立</text>
          <text class="conversation__meta">{{ participantIds.length }} 位成员 · {{ conversation.status }}</text>
        </view>

        <view class="conversation__panel">
          <text class="conversation__panel-title">当前状态</text>
          <text class="conversation__copy">{{ conversation.lastMessage || '可以开始沟通时间、地点和后续安排。' }}</text>
        </view>

        <view class="conversation__panel">
          <text class="conversation__panel-title">成员</text>
          <view class="conversation__members">
            <text v-for="id in participantIds" :key="id">{{ id }}</text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onPullDownRefresh } from '@dcloudio/uni-app'
import { getPartnerConversation } from '@/common/api/partner.js'
import { makeRefreshHandler } from '@/common/utils/refresh.js'
import { getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goBackOrFallback, goPartnerDetail } from '@/common/utils/route.js'

const currentId = ref('')
const conversation = ref({})
const navStyle = getMiniProgramNavStyle()
const navRowStyle = getMiniProgramNavRowStyle({ leftPaddingRpx: 34, minRightPaddingRpx: 24 })
const contentTopStyle = getMiniProgramNavContentStyle({ gapRpx: 18 })
const participantIds = computed(() => conversation.value.participantIds || conversation.value.participant_ids || [])

async function loadData() {
  conversation.value = await getPartnerConversation(currentId.value) || {}
}

onLoad((options = {}) => {
  currentId.value = options.id || ''
  loadData()
})

onPullDownRefresh(makeRefreshHandler(loadData))
</script>

<style scoped>
.conversation { min-height: 100vh; background: #f8f9f9; }
.conversation__nav { position: fixed; top: 0; right: 0; left: 0; z-index: 30; background: rgba(248, 249, 249, 0.88); backdrop-filter: blur(18px); }
.conversation__nav-row { display: flex; align-items: center; justify-content: space-between; }
.conversation__back { display: flex; width: 72rpx; height: 72rpx; align-items: center; justify-content: center; border: 1rpx solid #eef2f7; border-radius: 50%; background: #fff; box-shadow: 0 12rpx 28rpx rgba(15, 23, 42, 0.06); }
.conversation__detail { display: flex; height: 68rpx; align-items: center; gap: 6rpx; padding: 0 22rpx; border: 1rpx solid #eef2f7; border-radius: 999rpx; background: #fff; color: #64748b; font-size: 21rpx; font-weight: 900; }
.conversation__scroll { height: 100vh; }
.conversation__head { margin: 0 34rpx 24rpx; padding: 34rpx; border-radius: 40rpx; background: #111827; color: #fff; box-shadow: 0 22rpx 54rpx rgba(15, 23, 42, 0.18); }
.conversation__eyebrow { color: rgba(255, 255, 255, 0.58); font-size: 20rpx; font-weight: 900; }
.conversation__title { display: block; margin-top: 12rpx; color: #fff; font-size: 42rpx; font-style: italic; font-weight: 900; line-height: 1.25; }
.conversation__meta { display: block; margin-top: 16rpx; color: rgba(255, 255, 255, 0.72); font-size: 23rpx; font-weight: 800; }
.conversation__panel { margin: 0 34rpx 22rpx; padding: 30rpx; border: 1rpx solid #eef2f7; border-radius: 34rpx; background: #fff; box-shadow: 0 16rpx 42rpx rgba(15, 23, 42, 0.05); }
.conversation__panel-title { display: block; color: #111827; font-size: 29rpx; font-style: italic; font-weight: 900; }
.conversation__copy { display: block; margin-top: 16rpx; color: #64748b; font-size: 25rpx; font-weight: 800; line-height: 1.6; }
.conversation__members { display: flex; flex-wrap: wrap; gap: 12rpx; margin-top: 18rpx; }
.conversation__members text { padding: 10rpx 16rpx; border-radius: 999rpx; background: #f1f5f9; color: #475569; font-size: 20rpx; font-weight: 900; }
.conversation__empty { display: flex; flex-direction: column; align-items: center; gap: 16rpx; padding: 180rpx 0; color: #94a3b8; font-size: 24rpx; font-weight: 900; }
</style>
