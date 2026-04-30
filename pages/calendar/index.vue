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
      <view class="month-panel">
        <view class="month-panel__head">
          <view>
            <text class="month-panel__label">{{ selectedRelativeLabel }}</text>
            <text class="month-panel__title">{{ monthTitle }}</text>
          </view>
          <view class="month-panel__actions">
            <view class="month-panel__btn" @tap="shiftMonth(-1)">
              <uni-icons type="left" size="18" color="#111827" />
            </view>
            <view class="month-panel__btn" @tap="shiftMonth(1)">
              <uni-icons type="right" size="18" color="#111827" />
            </view>
          </view>
        </view>

        <view class="weekday-row">
          <text v-for="item in weekLabels" :key="item">{{ item }}</text>
        </view>

        <view class="month-grid">
          <view
            v-for="cell in calendarCells"
            :key="cell.key"
            class="day-cell"
            :class="{
              'day-cell--muted': !cell.currentMonth,
              'day-cell--today': cell.today,
              'day-cell--active': cell.label === activeDate
            }"
            @tap="selectDate(cell)"
          >
            <text class="day-cell__num">{{ cell.day }}</text>
            <view v-if="cell.count > 0" class="day-cell__dots">
              <view v-for="dot in Math.min(cell.count, 3)" :key="dot" />
            </view>
            <text v-if="cell.count > 0" class="day-cell__count">{{ cell.count }}</text>
          </view>
        </view>
      </view>

      <view class="calendar-summary">
        <view>
          <text class="calendar-summary__label">{{ activeGroup.dayOfWeek || selectedWeekday }}</text>
          <text class="calendar-summary__title">{{ activeDate || '全部活动' }}</text>
        </view>
        <view class="calendar-summary__count">{{ activeActivities.length }}</view>
      </view>

      <view class="calendar-tabs">
        <view
          v-for="item in tabs"
          :key="item.key"
          class="calendar-tab"
          :class="{ 'calendar-tab--active': activeTab === item.key }"
          @tap="activeTab = item.key"
        >
          <text>{{ item.label }}</text>
        </view>
      </view>

      <view class="calendar-list">
        <view
          v-for="item in visibleActivities"
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
            {{ getCardStatus(item) }}
          </view>
        </view>

        <view v-if="visibleActivities.length === 0" class="empty">
          <uni-icons type="calendar" size="44" color="#cbd5e1" />
          <text>这一天暂时没有活动</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { getActivityCalendar } from '@/common/api/activity.js'
import { getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goActivityDetail, goBackOrFallback, goManageDashboard, goParticipantDashboard } from '@/common/utils/route.js'

const weekLabels = ['日', '一', '二', '三', '四', '五', '六']
const tabs = [
  { key: 'all', label: '全部' },
  { key: 'joined', label: '我参与的' },
  { key: 'hosting', label: '我主办的' }
]

const groups = ref([])
const activeDate = ref('')
const activeTab = ref('all')
const currentMonth = ref(new Date())
const navStyle = getMiniProgramNavStyle()
const navRowStyle = getMiniProgramNavRowStyle({ leftPaddingRpx: 40, minRightPaddingRpx: 24 })
const contentTopStyle = getMiniProgramNavContentStyle({ gapRpx: 18 })

const groupMap = computed(() => {
  const map = {}
  groups.value.forEach((group) => {
    map[group.date] = group
  })
  return map
})

const activeGroup = computed(() => groupMap.value[activeDate.value] || { items: [] })
const activeActivities = computed(() => activeGroup.value.items || [])
const visibleActivities = computed(() => {
  if (activeTab.value === 'joined') return activeActivities.value.filter((item) => item.applicationStatus === 'approved')
  if (activeTab.value === 'hosting') return activeActivities.value.filter((item) => item.isCreator)
  return activeActivities.value
})
const monthTitle = computed(() => `${currentMonth.value.getFullYear()}年${currentMonth.value.getMonth() + 1}月`)
const selectedDateValue = computed(() => parseActivityDate(activeDate.value, activeGroup.value.items?.[0]?.dateValue))
const selectedWeekday = computed(() => `星期${weekLabels[selectedDateValue.value.getDay()]}`)
const selectedRelativeLabel = computed(() => {
  const today = new Date()
  const target = new Date(selectedDateValue.value)
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  const diff = target.getTime() - today.getTime()
  const dayMs = 24 * 60 * 60 * 1000
  if (diff === 0) return '今天'
  if (diff === dayMs) return '明天'
  if (diff === -dayMs) return '昨天'
  return selectedWeekday.value
})
const calendarCells = computed(() => buildMonthCells(currentMonth.value))

onLoad(async (options = {}) => {
  await loadCalendar(options.date)
})

onShow(async () => {
  await loadCalendar(activeDate.value)
})

async function loadCalendar(preferredDate = '') {
  groups.value = await getActivityCalendar()
  const fallbackDate = groups.value[0]?.date || formatActivityDate(new Date())
  activeDate.value = preferredDate || activeDate.value || fallbackDate
  currentMonth.value = new Date(parseActivityDate(activeDate.value, activeGroup.value.items?.[0]?.dateValue))
}

function buildMonthCells(monthDate) {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const first = new Date(year, month, 1)
  const start = new Date(year, month, 1 - first.getDay())
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    const label = formatActivityDate(date)
    return {
      key: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
      date,
      label,
      day: date.getDate(),
      currentMonth: date.getMonth() === month,
      today: isSameDay(date, new Date()),
      count: groupMap.value[label]?.items?.length || 0
    }
  })
}

function parseActivityDate(label = '', dateValue = '') {
  if (dateValue) {
    const parsed = new Date(dateValue)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }
  const matched = String(label).match(/(\d{1,2})月(\d{1,2})日/)
  if (matched) return new Date(new Date().getFullYear(), Number(matched[1]) - 1, Number(matched[2]))
  return new Date()
}

function formatActivityDate(date) {
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function selectDate(cell) {
  activeDate.value = cell.label
  currentMonth.value = new Date(cell.date)
}

function shiftMonth(offset) {
  const next = new Date(currentMonth.value)
  next.setMonth(next.getMonth() + offset)
  currentMonth.value = next
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

function getCardStatus(item) {
  if (item.applicationStatus === 'approved') return '已加入'
  if (item.applicationStatus === 'pending') return '申请中'
  if (item.isCreator) return '主办'
  return '查看'
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
.calendar-summary__label,
.month-panel__label {
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

.month-panel {
  margin: 0 28rpx 28rpx;
  padding: 28rpx;
  border: 1rpx solid #eef2f7;
  border-radius: 40rpx;
  background: #fff;
  box-shadow: 0 18rpx 48rpx rgba(15, 23, 42, 0.05);
}

.month-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  margin-bottom: 24rpx;
}

.month-panel__title {
  display: block;
  margin-top: 8rpx;
  color: #111827;
  font-size: 40rpx;
  font-style: italic;
  font-weight: 900;
}

.month-panel__actions {
  display: flex;
  gap: 12rpx;
}

.month-panel__btn {
  display: flex;
  width: 62rpx;
  height: 62rpx;
  align-items: center;
  justify-content: center;
  border-radius: 22rpx;
  background: #f8fafc;
}

.weekday-row,
.month-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.weekday-row {
  margin-bottom: 12rpx;
}

.weekday-row text {
  color: #cbd5e1;
  font-size: 19rpx;
  font-weight: 900;
  text-align: center;
}

.month-grid {
  gap: 8rpx 0;
}

.day-cell {
  position: relative;
  display: flex;
  min-height: 82rpx;
  align-items: center;
  justify-content: center;
  border-radius: 28rpx;
  color: #111827;
}

.day-cell--muted {
  color: #cbd5e1;
}

.day-cell--today {
  background: #f1f5f9;
}

.day-cell--active {
  background: #ff9900;
  color: #fff;
  box-shadow: 0 16rpx 34rpx rgba(249, 115, 22, 0.2);
}

.day-cell__num {
  position: relative;
  z-index: 1;
  font-size: 27rpx;
  font-style: italic;
  font-weight: 900;
}

.day-cell__dots {
  position: absolute;
  bottom: 9rpx;
  display: flex;
  gap: 4rpx;
}

.day-cell__dots view {
  width: 6rpx;
  height: 6rpx;
  border-radius: 50%;
  background: #6366f1;
}

.day-cell--active .day-cell__dots view {
  background: #fff;
}

.day-cell__count {
  position: absolute;
  top: 9rpx;
  right: 9rpx;
  color: #94a3b8;
  font-size: 17rpx;
  font-weight: 900;
}

.day-cell--active .day-cell__count {
  color: rgba(255, 255, 255, 0.84);
}

.calendar-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 40rpx 24rpx;
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

.calendar-tabs {
  display: flex;
  gap: 14rpx;
  padding: 0 40rpx 24rpx;
}

.calendar-tab {
  padding: 15rpx 26rpx;
  border: 1rpx solid #eef2f7;
  border-radius: 999rpx;
  background: #fff;
  color: #94a3b8;
  font-size: 22rpx;
  font-weight: 900;
}

.calendar-tab--active {
  border-color: #111827;
  background: #111827;
  color: #fff;
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
