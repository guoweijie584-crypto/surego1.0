<template>
  <view class="partner-workbench ref-page">
    <view class="manager-topbar" :style="navStyle">
      <view class="manager-topbar__row" :style="navRowStyle">
        <view class="exit-button" @tap="goBackOrFallback('/pages/user/profile')">
          <uni-icons type="left" size="18" color="#102033" />
          <text>退出</text>
        </view>
        <view class="manager-topbar__title">
          <text>申请管理</text>
          <text class="su-line-1">{{ partner.title || '搭子工作台' }}</text>
        </view>
        <view class="ref-icon-button" @tap="goPartnerDetail(currentId)">
          <uni-icons type="right" size="19" color="#102033" />
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="ref-scroll ref-scroll--no-tab" :style="contentTopStyle">
      <view class="manager-summary ref-card">
        <view>
          <text>{{ partner.intentCount || intents.length }}</text>
          <text>感兴趣</text>
        </view>
        <view>
          <text>{{ pendingCount }}</text>
          <text>待处理</text>
        </view>
        <view>
          <text>{{ acceptedCount }}</text>
          <text>私聊中</text>
        </view>
        <view>
          <text>{{ partner.followCount || 0 }}</text>
          <text>关注</text>
        </view>
      </view>

      <scroll-view scroll-x class="ref-filter-row sticky-tabs" :show-scrollbar="false">
        <text v-for="item in tabs" :key="item.key" :class="{ active: activeTab === item.key }" @tap="activeTab = item.key">
          {{ item.label }}
        </text>
      </scroll-view>

      <view v-if="activeTab === 'intent'" class="ref-stack">
        <view v-if="intents.length === 0" class="ref-empty ref-card">
          <uni-icons type="personadd" size="42" color="#cbd5e1" />
          <text>意向申请已处理完</text>
        </view>
        <view v-for="item in intents" :key="item.id" class="applicant-card ref-card">
          <view class="organizer-line">
            <image class="intent-avatar" :src="item.avatar" mode="aspectFill" />
            <view>
              <text>{{ item.nickname || '意向同学' }}</text>
              <text>天津大学 · 成行记录 {{ item.joinedCount || 12 }} 次</text>
            </view>
            <text class="ref-pill" :class="intentPillClass(item.status)">{{ getIntentStatusLabel(item.status) }}</text>
          </view>
          <text class="applicant-card__msg">{{ item.message || '时间合适，想先确认节奏再决定是否进群。' }}</text>
          <view v-if="item.status === 'pending'" class="button-row">
            <view class="ref-secondary" @tap="reviewIntent(item, 'rejected')">拒绝</view>
            <view class="ref-primary" @tap="reviewIntent(item, 'accepted')">通过</view>
          </view>
        </view>
      </view>

      <view v-if="activeTab === 'chat'" class="ref-stack">
        <view class="ref-task-card" @tap="showComingSoon('通过意向后会生成私聊入口')">
          <uni-icons type="chat" size="22" color="#2388ff" />
          <view class="ref-task-card__body">
            <text>私聊确认时间</text>
            <text>{{ acceptedCount }} 个同学已通过，可以一对一确认细节。</text>
          </view>
          <uni-icons type="right" size="18" color="#94a3b8" />
        </view>
        <view class="ref-task-card" @tap="showComingSoon('临时群聊能力正在接入')">
          <uni-icons type="staff" size="22" color="#2388ff" />
          <view class="ref-task-card__body">
            <text>创建临时群聊</text>
            <text>把通过的同学拉到一起，确认时间、地点和注意事项。</text>
          </view>
          <uni-icons type="right" size="18" color="#94a3b8" />
        </view>
      </view>

      <view v-if="activeTab === 'convert'" class="ref-stack">
        <view class="ref-info-card ref-card">
          <text class="ref-info-card__title">公开约人</text>
          <text class="ref-info-card__text">还想继续招人，就让同校同学也能报名或候补。</text>
          <view class="ref-primary convert-button" @tap="showComingSoon('搭子转活动正在接入')">继续公开招人</view>
        </view>
        <view class="ref-info-card ref-card">
          <text class="ref-info-card__title">只约已通过的人</text>
          <text class="ref-info-card__text">人已经够了，就只通知已通过的同学。</text>
          <view class="ref-primary convert-button" @tap="showComingSoon('定向通知正在接入')">只通知这些人</view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onPullDownRefresh } from '@dcloudio/uni-app'
import { PARTNER_INTENT_STATUS_META, getPartnerPostDetail, listPartnerIntents, updatePartnerIntentStatus } from '@/common/api/partner.js'
import { makeRefreshHandler } from '@/common/utils/refresh.js'
import { getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goBackOrFallback, goPartnerDetail, showComingSoon } from '@/common/utils/route.js'

const currentId = ref('')
const partner = ref({})
const intents = ref([])
const activeTab = ref('intent')
const navStyle = getMiniProgramNavStyle()
const navRowStyle = getMiniProgramNavRowStyle({ leftPaddingRpx: 34, minRightPaddingRpx: 24 })
const contentTopStyle = getMiniProgramNavContentStyle({ gapRpx: 20 })
const tabs = [
  { key: 'intent', label: '意向申请' },
  { key: 'chat', label: '私聊/群聊' },
  { key: 'convert', label: '约成活动' }
]
const pendingCount = computed(() => intents.value.filter((item) => item.status === 'pending').length)
const acceptedCount = computed(() => intents.value.filter((item) => item.status === 'accepted').length)

async function loadData() {
  const [detail, items] = await Promise.all([
    getPartnerPostDetail(currentId.value),
    listPartnerIntents(currentId.value)
  ])
  partner.value = detail || {}
  intents.value = items
}

onLoad((options = {}) => {
  currentId.value = options.id || ''
  loadData()
})

onPullDownRefresh(makeRefreshHandler(loadData))

function getIntentStatusLabel(status) {
  return PARTNER_INTENT_STATUS_META[status]?.label || '待确认'
}

function intentPillClass(status) {
  if (status === 'accepted') return 'ref-pill--green'
  if (status === 'rejected') return 'ref-pill--amber'
  return 'ref-pill--blue'
}

async function reviewIntent(item, status) {
  await updatePartnerIntentStatus(item.id, status)
  uni.showToast({ title: '已处理', icon: 'success' })
  loadData()
}
</script>

<style scoped>
.manager-topbar {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 30;
  background: rgba(247, 248, 245, 0.9);
  backdrop-filter: blur(18px);
}

.manager-topbar__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
}

.exit-button {
  display: inline-flex;
  height: 70rpx;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 0 18rpx;
  border: 1rpx solid rgba(24, 24, 27, 0.08);
  border-radius: 999rpx;
  background: #fff;
  color: #102033;
  font-size: 22rpx;
  font-weight: 950;
}

.manager-topbar__title {
  min-width: 0;
  flex: 1;
  text-align: center;
}

.manager-topbar__title text:first-child {
  display: block;
  color: #64748b;
  font-size: 20rpx;
  font-weight: 950;
}

.manager-topbar__title text:last-child {
  display: block;
  margin-top: 4rpx;
  color: #102033;
  font-size: 30rpx;
  font-weight: 950;
}

.manager-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12rpx;
  padding: 24rpx;
}

.manager-summary view {
  min-width: 0;
  border-radius: 28rpx;
  background: #edf6ff;
  padding: 22rpx 12rpx;
  text-align: center;
}

.manager-summary text:first-child,
.manager-summary text:last-child {
  display: block;
}

.manager-summary text:first-child {
  color: #102033;
  font-size: 30rpx;
  font-weight: 950;
  line-height: 1.1;
}

.manager-summary text:last-child {
  margin-top: 8rpx;
  color: #64748b;
  font-size: 19rpx;
  font-weight: 850;
}

.sticky-tabs {
  position: sticky;
  top: 0;
  z-index: 10;
  margin-top: 24rpx;
  padding-top: 8rpx;
  background: rgba(247, 251, 255, 0.92);
  backdrop-filter: blur(18px);
}

.applicant-card {
  padding: 30rpx;
}

.organizer-line {
  display: flex;
  align-items: center;
  gap: 18rpx;
}

.intent-avatar {
  width: 76rpx;
  height: 76rpx;
  flex: 0 0 76rpx;
  border-radius: 50%;
  background: #edf2f7;
}

.organizer-line > view {
  min-width: 0;
  flex: 1;
}

.organizer-line > view text:first-child,
.organizer-line > view text:last-child {
  display: block;
}

.organizer-line > view text:first-child {
  color: #102033;
  font-size: 26rpx;
  font-weight: 950;
}

.organizer-line > view text:last-child {
  margin-top: 6rpx;
  color: #64748b;
  font-size: 21rpx;
  font-weight: 850;
}

.applicant-card__msg {
  display: block;
  margin-top: 22rpx;
  color: #64748b;
  font-size: 23rpx;
  font-weight: 800;
  line-height: 1.55;
}

.button-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18rpx;
  margin-top: 24rpx;
}

.convert-button {
  margin-top: 24rpx;
}
</style>
