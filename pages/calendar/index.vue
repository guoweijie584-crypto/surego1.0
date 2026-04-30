<template>
  <view class="calendar-page su-page">
    <view class="calendar-page__nav" :style="navStyle">
      <view class="calendar-page__nav-row" :style="navRowStyle">
        <view class="calendar-page__back" @tap="goBackOrFallback">
          <uni-icons type="left" size="24" color="#111827" />
        </view>
        <view>
          <text class="calendar-page__eyebrow">CALENDAR</text>
          <text class="calendar-page__title">活动日历</text>
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="calendar-page__scroll" :style="contentTopStyle">
      <scroll-view scroll-x class="date-strip" :show-scrollbar="false">
        <view class="date-strip__inner">
          <view
            v-for="group in groups"
            :key="group.date"
            class="date-pill"
            :class="{ 'date-pill--active': activeDate === group.date }"
            @tap="activeDate = group.date"
          >
            <text>{{ group.date }}</text>
            <text>{{ group.items.length }} 个局</text>
          </view>
        </view>
      </scroll-view>

      <view class="calendar-summary">
        <view>
          <text class="calendar-summary__label">{{ activeGroup.dayOfWeek || '近期' }}</text>
          <text class="calendar-summary__title">{{ activeDate || '全部活动' }}</text>
        </view>
        <view class="calendar-summary__count">{{ activeActivities.length }}</view>
      </view>

      <view class="calendar-list">
        <view
          v-for="item in activeActivities"
          :key="item.id"
          class="calendar-card"
          @tap="openActivity(item)"
        >
          <image class="calendar-card__cover" :src="item.image" mode="aspectFill" />
          <view class="calendar-card__body">
            <view class="calendar-card__time">
              <text>{{ item.time }}</text>
              <text>{{ item.endTime }}</text>
            </view>
            <text class="calendar-card__title su-line-2">{{ item.title }}</text>
            <view class="calendar-card__meta">
              <uni-icons type="location" size="14" color="#94a3b8" />
              <text class="su-line-1">{{ getShortLocation(item.location) }}</text>
            </view>
          </view>
          <view class="calendar-card__status" :class="{ 'calendar-card__status--joined': item.applicationStatus === 'approved' }">
            {{ item.applicationStatus === 'approved' ? '已加入' : item.isCreator ? '主办' : '查看' }}
          </view>
        </view>

        <view v-if="activeActivities.length === 0" class="empty">
          <uni-icons type="calendar" size="44" color="#cbd5e1" />
          <text>这一天暂时没有活动</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getActivityCalendar } from '@/common/api/activity.js'
import { getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goActivityDetail, goBackOrFallback, goManageDashboard, goParticipantDashboard } from '@/common/utils/route.js'

const groups = ref([])
const activeDate = ref('')
const navStyle = getMiniProgramNavStyle()
const navRowStyle = getMiniProgramNavRowStyle({ leftPaddingRpx: 40, minRightPaddingRpx: 24 })
const contentTopStyle = getMiniProgramNavContentStyle({ gapRpx: 18 })

const activeGroup = computed(() => groups.value.find((item) => item.date === activeDate.value) || groups.value[0] || { items: [] })
const activeActivities = computed(() => activeGroup.value.items || [])

onLoad(async (options = {}) => {
  groups.value = await getActivityCalendar()
  activeDate.value = options.date || groups.value[0]?.date || ''
})

function openActivity(item) {
  if (item.isCreator) {
    goManageDashboard(item.id)
    return
  }
  if (item.applicationStatus === 'approved') {
    goParticipantDashboard(item.id)
    return
  }
  goActivityDetail(item.id)
}

function getShortLocation(location) {
  return (location || '').split(' 路 ')[0] || location
}
</script>

<style scoped>
.calendar-page {
  min-height: 100vh;
  background: #f8f9f9;
}

.calendar-page__nav {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 20;
  background: rgba(248, 249, 249, 0.9);
  backdrop-filter: blur(18px);
}

.calendar-page__nav-row {
  display: flex;
  align-items: center;
  gap: 22rpx;
}

.calendar-page__back {
  display: flex;
  width: 78rpx;
  height: 78rpx;
  flex: 0 0 78rpx;
  align-items: center;
  justify-content: center;
  border: 1rpx solid #f1f5f9;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 14rpx 34rpx rgba(15, 23, 42, 0.06);
}

.calendar-page__eyebrow,
.calendar-summary__label {
  color: #94a3b8;
  font-size: 20rpx;
  font-weight: 900;
}

.calendar-page__title {
  display: block;
  margin-top: 4rpx;
  color: #111827;
  font-size: 48rpx;
  font-style: italic;
  font-weight: 900;
}

.calendar-page__scroll {
  height: 100vh;
  box-sizing: border-box;
}

.date-strip {
  white-space: nowrap;
}

.date-strip__inner {
  display: inline-flex;
  gap: 16rpx;
  padding: 10rpx 40rpx 24rpx;
}

.date-pill {
  display: inline-flex;
  min-width: 150rpx;
  flex-direction: column;
  gap: 8rpx;
  padding: 20rpx 24rpx;
  border: 1rpx solid #eef2f7;
  border-radius: 28rpx;
  background: #fff;
  color: #94a3b8;
  font-size: 20rpx;
  font-weight: 900;
}

.date-pill text:first-child {
  color: #111827;
  font-size: 26rpx;
  font-style: italic;
}

.date-pill--active {
  border-color: #111827;
  background: #111827;
  color: rgba(255, 255, 255, 0.74);
}

.date-pill--active text:first-child {
  color: #fff;
}

.calendar-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 40rpx 28rpx;
  padding: 32rpx;
  border-radius: 38rpx;
  background: linear-gradient(135deg, #ff6b6b, #f97316);
  color: #fff;
  box-shadow: 0 22rpx 52rpx rgba(249, 115, 22, 0.18);
}

.calendar-summary__title {
  display: block;
  margin-top: 8rpx;
  color: #fff;
  font-size: 42rpx;
  font-style: italic;
  font-weight: 900;
}

.calendar-summary__count {
  display: flex;
  width: 88rpx;
  height: 88rpx;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.24);
  color: #fff;
  font-size: 38rpx;
  font-style: italic;
  font-weight: 900;
}

.calendar-list {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
  padding: 0 40rpx 70rpx;
}

.calendar-card {
  position: relative;
  display: flex;
  gap: 22rpx;
  padding: 22rpx;
  border: 1rpx solid #eef2f7;
  border-radius: 34rpx;
  background: #fff;
  box-shadow: 0 14rpx 36rpx rgba(15, 23, 42, 0.05);
}

.calendar-card__cover {
  width: 154rpx;
  height: 154rpx;
  flex: 0 0 154rpx;
  border-radius: 26rpx;
  background: #e2e8f0;
}

.calendar-card__body {
  min-width: 0;
  flex: 1;
}

.calendar-card__time {
  display: flex;
  gap: 10rpx;
  color: #ff6b6b;
  font-size: 21rpx;
  font-weight: 900;
}

.calendar-card__title {
  display: block;
  margin-top: 10rpx;
  color: #111827;
  font-size: 29rpx;
  font-style: italic;
  font-weight: 900;
  line-height: 1.38;
}

.calendar-card__meta {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 12rpx;
  color: #94a3b8;
  font-size: 22rpx;
  font-weight: 800;
}

.calendar-card__status {
  position: absolute;
  right: 22rpx;
  bottom: 22rpx;
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: #f1f5f9;
  color: #64748b;
  font-size: 19rpx;
  font-weight: 900;
}

.calendar-card__status--joined {
  background: #dcfce7;
  color: #16a34a;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  padding: 100rpx 0;
  color: #94a3b8;
  font-size: 24rpx;
  font-weight: 900;
}
</style>
