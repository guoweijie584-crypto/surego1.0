<template>
  <view class="my su-page">
    <view class="my__top" :style="navStyle">
      <view class="my__top-row" :style="navRowStyle">
      <view>
        <text class="my__kicker">MY SPOTS</text>
        <text class="my__title">我的活动</text>
      </view>
      <view class="my__create" @tap="goActivityCreate">
        <SuIcon name="navPublish" size="44" glyph-size="22" variant="inline" color="#fff" />
      </view>
      </view>
    </view>

    <view class="my__body" :style="contentTopStyle">
    <view class="tabs">
      <view
        v-for="item in tabs"
        :key="item.key"
        class="tabs__item"
        :class="{ 'tabs__item--active': activeTab === item.key }"
        @tap="activeTab = item.key"
      >
        <text>{{ item.label }}</text>
        <text>{{ counts[item.key] || 0 }}</text>
      </view>
    </view>

    <scroll-view scroll-y class="my__scroll">
      <view v-if="currentList.length === 0" class="empty">
        <SuIcon name="calendar" size="88" glyph-size="44" variant="inline" color="#cbd5e1" />
        <text>这里还没有活动</text>
      </view>
      <view v-for="item in currentList" :key="item.id" class="activity" @tap="openActivity(item)">
        <image class="activity__cover" :src="item.image" mode="aspectFill" />
        <view class="activity__content">
          <view class="activity__head">
            <text class="activity__badge">{{ getBadge(item) }}</text>
            <text class="activity__mode">{{ getMode(item) }}</text>
            <text class="activity__status" :class="`activity__status--${getActivityStatusMeta(item).tone}`">{{ getActivityStatusMeta(item).label }}</text>
          </view>
          <text class="activity__title su-line-2">{{ item.title }}</text>
          <text class="activity__meta">{{ item.date }} {{ item.time }}</text>
          <text class="activity__meta">{{ item.location }}</text>
        </view>
      </view>
    </scroll-view>
    </view>
  </view>
</template>

<script setup>
import SuIcon from '@/components/surego/SuIcon.vue'
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getActivityStatusMeta, listMyActivities, sortActivitiesByStatusPriority } from '@/common/api/activity.js'
import { getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goActivityCreate, goActivityDetail, goManageDashboard, goParticipantDashboard } from '@/common/utils/route.js'

const activeTab = ref('hosting')
const navStyle = getMiniProgramNavStyle()
const navRowStyle = getMiniProgramNavRowStyle({ leftPaddingRpx: 40, minRightPaddingRpx: 24 })
const contentTopStyle = getMiniProgramNavContentStyle({ gapRpx: 18 })
const lists = ref({
  hosting: [],
  joined: [],
  pending: []
})

const tabs = [
  { key: 'hosting', label: '主办' },
  { key: 'joined', label: '参加' },
  { key: 'pending', label: '申请中' }
]

const currentList = computed(() => sortActivitiesByStatusPriority(lists.value[activeTab.value] || []))
const counts = computed(() => ({
  hosting: lists.value.hosting.length,
  joined: lists.value.joined.length,
  pending: lists.value.pending.length
}))

onShow(async () => {
  lists.value = await listMyActivities()
})

function getBadge(item) {
  if (item.isCreator) return '局长'
  if (item.applicationStatus === 'approved') return '已加入'
  return '审核中'
}

function getMode(item) {
  if (item.partyMode === 'sincerity') return '诚意金'
  if (item.partyMode === 'ticket') return '门票'
  return '免费'
}

function openActivity(item) {
  if (item.isCreator) {
    goManageDashboard(item.id)
    return
  }
  if (['approved', 'pending', 'rejected'].includes(item.applicationStatus)) {
    goParticipantDashboard(item.id)
    return
  }
  goActivityDetail(item.id)
}
</script>

<style scoped>
.my {
  min-height: 100vh;
  background: #f8f9f9;
}

.my__top {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 20;
  background: rgba(248, 249, 249, 0.9);
  backdrop-filter: blur(18px);
}

.my__top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.my__body {
  display: flex;
  height: 100vh;
  box-sizing: border-box;
  flex-direction: column;
  padding-bottom: 180rpx;
}

.my__kicker {
  color: #94a3b8;
  font-size: 20rpx;
  font-weight: 900;
}

.my__title {
  display: block;
  margin-top: 8rpx;
  color: #0f172a;
  font-size: 48rpx; font-weight: 900;
}

.my__create {
  display: flex;
  width: 78rpx;
  height: 78rpx;
  align-items: center;
  justify-content: center;
  border-radius: 28rpx;
  background: #0f172a;
  box-shadow: 0 18rpx 38rpx rgba(15, 23, 42, 0.18);
}

.tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14rpx;
  padding: 0 40rpx 24rpx;
}

.tabs__item {
  display: flex;
  height: 82rpx;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  border-radius: 28rpx;
  background: #fff;
  color: #94a3b8;
  font-size: 23rpx;
  font-weight: 900;
}

.tabs__item--active {
  background: #0f172a;
  color: #fff;
}

.my__scroll {
  min-height: 0;
  flex: 1;
}

.empty {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 18rpx;
  padding: 120rpx 0;
  color: #94a3b8;
  font-size: 25rpx;
  font-weight: 900;
}

.activity {
  display: flex;
  gap: 24rpx;
  margin: 0 40rpx 24rpx;
  padding: 22rpx;
  border-radius: 34rpx;
  background: #fff;
  box-shadow: 0 18rpx 46rpx rgba(15, 23, 42, 0.05);
}

.activity__cover {
  width: 176rpx;
  height: 176rpx;
  flex: 0 0 176rpx;
  border-radius: 28rpx;
  background: #e2e8f0;
}

.activity__content {
  min-width: 0;
  flex: 1;
}

.activity__head {
  display: flex;
  gap: 8rpx;
  align-items: center;
  flex-wrap: wrap;
}

.activity__badge,
.activity__mode,
.activity__status {
  padding: 7rpx 15rpx;
  border-radius: 999rpx;
  font-size: 19rpx;
  font-weight: 900;
}

.activity__badge {
  background: #eef2ff;
  color: #4f46e5;
}

.activity__mode {
  background: #f8fafc;
  color: #94a3b8;
}

.activity__status--green {
  background: #dcfce7;
  color: #16a34a;
}

.activity__status--blue {
  background: #dbeafe;
  color: #2563eb;
}

.activity__status--amber {
  background: #fef3c7;
  color: #d97706;
}

.activity__status--gray {
  background: #f1f5f9;
  color: #64748b;
}

.activity__status--red {
  background: #fee2e2;
  color: #ef4444;
}

.activity__title {
  display: block;
  margin-top: 16rpx;
  color: #0f172a;
  font-size: 29rpx;
  font-weight: 900;
  line-height: 1.38;
}

.activity__meta {
  display: block;
  margin-top: 10rpx;
  color: #94a3b8;
  font-size: 21rpx;
  font-weight: 800;
}
</style>
