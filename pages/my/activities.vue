<template>
  <view class="my su-page">
    <view class="my__top">
      <view>
        <text class="my__kicker">MY SPOTS</text>
        <text class="my__title">我的活动</text>
      </view>
      <view class="my__create" @tap="goActivityCreate">
        <uni-icons type="plusempty" size="22" color="#fff" />
      </view>
    </view>

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
        <uni-icons type="calendar" size="44" color="#cbd5e1" />
        <text>这里还没有活动</text>
      </view>
      <view v-for="item in currentList" :key="item.id" class="activity" @tap="openActivity(item)">
        <image class="activity__cover" :src="item.image" mode="aspectFill" />
        <view class="activity__content">
          <view class="activity__head">
            <text class="activity__badge">{{ getBadge(item) }}</text>
            <text class="activity__mode">{{ getMode(item) }}</text>
          </view>
          <text class="activity__title su-line-2">{{ item.title }}</text>
          <text class="activity__meta">{{ item.date }} {{ item.time }}</text>
          <text class="activity__meta">{{ item.location }}</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { listMyActivities } from '@/common/api/activity.js'
import { goActivityCreate, goActivityDetail, goManageDashboard } from '@/common/utils/route.js'

const activeTab = ref('hosting')
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

const currentList = computed(() => lists.value[activeTab.value] || [])
const counts = computed(() => ({
  hosting: lists.value.hosting.length,
  joined: lists.value.joined.length,
  pending: lists.value.pending.length
}))

onShow(async () => {
  lists.value = await listMyActivities()
})

function getBadge(item) {
  if (item.isCreator || item.status === 'hosting') return '局长'
  if (item.status === 'approved') return '已加入'
  return '审核中'
}

function getMode(item) {
  if (item.partyMode === 'sincerity') return '诚意金'
  if (item.partyMode === 'ticket') return '门票'
  return '免费'
}

function openActivity(item) {
  if (item.isCreator || item.status === 'hosting') {
    goManageDashboard(item.id)
    return
  }
  goActivityDetail(item.id)
}
</script>

<style scoped>
.my {
  min-height: 100vh;
  padding-bottom: 180rpx;
  background: #f8f9f9;
}

.my__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 70rpx 40rpx 28rpx;
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
  font-size: 48rpx;
  font-style: italic;
  font-weight: 900;
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
  height: calc(100vh - 280rpx);
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
  align-items: center;
  justify-content: space-between;
}

.activity__badge,
.activity__mode {
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
