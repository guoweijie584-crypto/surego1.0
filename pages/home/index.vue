<template>
  <view class="home su-page">
    <view class="home__top" :style="navStyle">
      <view class="home__top-row" :style="navRowStyle">
        <view class="brand-lockup" @tap="goUserProfile">
          <text>成行</text>
          <text>{{ selectedSchool }}</text>
        </view>
        <view class="top-search" @tap="goSearch()">
          <SuIcon name="search" size="34" glyph-size="17" variant="inline" color="#64748b" />
          <input disabled placeholder="搜活动 / 饭搭子 / 地点" placeholder-class="top-search__placeholder" />
        </view>
        <view class="top-icon" :style="navActionsStyle" @tap="goMessages">
          <SuIcon name="bell" size="50" glyph-size="22" variant="soft" />
          <view v-if="unreadCount > 0" class="top-icon__badge">
            <text>{{ unreadLabel }}</text>
          </view>
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="home__scroll">
      <view class="home__content" :style="contentTopStyle">
        <view class="feature-card" @tap="openGraduationFeature">
          <image class="feature-card__image" src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/AUN_Students_in_Graduation_Gowns.jpg/1280px-AUN_Students_in_Graduation_Gowns.jpg" mode="aspectFill" />
          <view class="feature-card__shade" />
          <view class="feature-card__content">
            <text class="feature-card__pill">毕业季正在成行</text>
            <view class="feature-card__title-group">
              <text class="feature-card__title-line">最后一段校园时间</text>
              <text class="feature-card__title-line feature-card__title-line--strong">找同学一起认真告别</text>
            </view>
            <text class="feature-card__desc">学位服、海河夜景、校园草坪和宿舍楼前都有人在约。</text>
            <view class="feature-card__stats-bar">
              <view class="feature-card__stat-chip"><text class="feature-card__stat-chip-text"><text class="feature-card__stat-chip-num">4</text> 场约拍</text></view>
              <view class="feature-card__stat-chip"><text class="feature-card__stat-chip-text"><text class="feature-card__stat-chip-num">23</text> 人想拍</text></view>
              <view class="feature-card__stat-chip"><text class="feature-card__stat-chip-text"><text class="feature-card__stat-chip-num">6</text> 位摄影同学</text></view>
            </view>
          </view>
        </view>

        <scroll-view scroll-x class="scene-row" :show-scrollbar="false">
          <view class="scene-row__inner">
            <view
              v-for="item in sceneFilters"
              :key="item.key"
              class="scene-chip"
              :class="{ 'scene-chip--active': activeScene === item.key }"
              @tap="activeScene = item.key"
            >
              <SuIcon
                :name="item.icon"
                size="34"
                glyph-size="16"
                :variant="activeScene === item.key ? 'solid' : 'soft'"
              />
              <text>{{ item.label }}</text>
            </view>
          </view>
        </scroll-view>

        <view class="sort-tabs">
          <view
            v-for="item in sortOptions"
            :key="item.key"
            class="sort-tabs__item"
            :class="{ 'sort-tabs__item--active': activeSort === item.key }"
            @tap="activeSort = item.key"
          >
            <text>{{ item.label }}</text>
          </view>
        </view>

        <view class="section-title section-title--inline">
          <view>
            <text>本校正在约</text>
          </view>
          <text class="section-title__action" @tap="resetFilters">看全部</text>
        </view>

        <view class="home__list">
          <SuActivityCard v-for="item in sortedActivities" :key="item.id" :activity="item" />
          <view v-if="sortedActivities.length === 0" class="empty-card">
            <SuIcon name="emptyCalendar" size="88" glyph-size="42" variant="soft" color="#94a3b8" />
            <text>暂时没有符合条件的活动，换个场景看看。</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <SuBottomDock active="home" />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onPullDownRefresh, onShow } from '@dcloudio/uni-app'
import SuActivityCard from '@/components/surego/SuActivityCard.vue'
import SuBottomDock from '@/components/surego/SuBottomDock.vue'
import SuIcon from '@/components/surego/SuIcon.vue'
import { isHomeVisibleMyActivity, listActivities, listMyActivities, sortActivitiesByStatusPriority } from '@/common/api/activity.js'
import { getCurrentUserProfile, isLoggedIn, isSuregoProfileComplete } from '@/common/api/auth.js'
import { getUnreadMessageCount } from '@/common/api/message.js'
import { makeRefreshHandler } from '@/common/utils/refresh.js'
import { getMiniProgramNavActionsStyle, getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goGraduation, goMessages, goParticipantDashboard, goSearch, goUserProfile } from '@/common/utils/route.js'

const DEFAULT_AVATAR = '/static/userImg/user.png'
const currentAvatar = ref(DEFAULT_AVATAR)
const selectedSchool = '天津大学'
const unreadCount = ref(0)
const activities = ref([])
const myGroups = ref({ hosting: [], joined: [], pending: [] })
const activeScene = ref('all')
const activeSort = ref('recommend')
const navStyle = getMiniProgramNavStyle()
const navRowStyle = getMiniProgramNavRowStyle({ leftPaddingRpx: 34, minRightPaddingRpx: 24 })
const navActionsStyle = getMiniProgramNavActionsStyle({ leftReserveRpx: 620 })
const contentTopStyle = getMiniProgramNavContentStyle({ gapRpx: 24 })

const sceneFilters = [
  { key: 'all', label: '全部', icon: 'sceneAll' },
  { key: '剧本杀/桌游', label: '剧本杀/桌游', icon: 'sceneBoard' },
  { key: '饭搭子/探店', label: '饭搭子/探店', icon: 'sceneFood' },
  { key: '运动', label: '运动', icon: 'sceneSport' },
  { key: '学习/自习', label: '学习/自习', icon: 'sceneStudy' },
  { key: '约拍/展览/微醺', label: '约拍/展览/微醺', icon: 'scenePhoto' }
]

const sortOptions = [
  { key: 'recommend', label: '推荐' },
  { key: 'soon', label: '最近开始' },
  { key: 'closing', label: '快约满' },
  { key: 'nearby', label: '离我近' }
]

const visibleMyActivities = computed(() => sortActivitiesByStatusPriority([
  ...myGroups.value.hosting,
  ...myGroups.value.joined,
  ...myGroups.value.pending
]).filter(isHomeVisibleMyActivity))

const filteredActivities = computed(() => {
  if (activeScene.value === 'all') return activities.value
  return activities.value.filter((item) => item.category === activeScene.value)
})

const sortedActivities = computed(() => {
  const items = [...filteredActivities.value]
  if (activeSort.value === 'soon') {
    return items.sort((a, b) => String(a.dateValue || a.date || '').localeCompare(String(b.dateValue || b.date || '')))
  }
  if (activeSort.value === 'closing') {
    return items.sort((a, b) => getSlotsLeft(a) - getSlotsLeft(b))
  }
  if (activeSort.value === 'nearby') {
    return items.sort((a, b) => Number.parseFloat(a.distance || 999) - Number.parseFloat(b.distance || 999))
  }
  return items
})

const unreadLabel = computed(() => (unreadCount.value > 99 ? '99+' : String(unreadCount.value)))

async function loadData() {
  refreshCurrentAvatar()
  const [activityItems, groups, unread] = await Promise.all([
    listActivities(),
    listMyActivities(),
    getUnreadMessageCount()
  ])
  activities.value = activityItems
  myGroups.value = groups
  unreadCount.value = unread
}

onShow(loadData)
onPullDownRefresh(makeRefreshHandler(loadData))

function refreshCurrentAvatar() {
  const profile = getCurrentUserProfile()
  currentAvatar.value = isLoggedIn() && isSuregoProfileComplete(profile)
    ? (profile.avatar || DEFAULT_AVATAR)
    : DEFAULT_AVATAR
}

function getSlotsLeft(item = {}) {
  if (!item.hasParticipantLimit && !item.maxParticipants) return 99
  return Math.max(0, Number(item.maxParticipants || 0) - Number(item.participantCount || 0))
}

function resetFilters() {
  activeScene.value = 'all'
  activeSort.value = 'recommend'
}

function openGraduationFeature() {
  goGraduation()
}

function openUserActivity(item = {}) {
  if (!item.id) return
  goParticipantDashboard(item.id)
}
</script>

<style scoped>
.home {
  min-height: 100vh;
  padding-bottom: 180rpx;
  background: #f6fbff;
}

.home__top {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 30;
  background: rgba(247, 251, 255, 0.9);
  backdrop-filter: blur(18px);
}

.home__top-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) 76rpx;
  align-items: center;
  gap: 16rpx;
}

.brand-lockup {
  display: grid;
  min-width: 92rpx;
  gap: 4rpx;
}

.brand-lockup text:first-child {
  color: #102033;
  font-size: 39rpx;
  font-weight: 950;
  line-height: 1;
}

.brand-lockup text:last-child {
  max-width: 120rpx;
  overflow: hidden;
  color: #64748b;
  font-size: 18rpx;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.top-search {
  display: flex;
  min-width: 0;
  height: 76rpx;
  align-items: center;
  gap: 12rpx;
  padding: 0 22rpx;
  border: 1rpx solid rgba(24, 24, 27, 0.08);
  border-radius: 999rpx;
  background: #fff;
  box-shadow: 0 12rpx 28rpx rgba(30, 88, 156, 0.06);
}

.top-search input {
  flex: 1;
  min-width: 0;
  color: #102033;
  font-size: 24rpx;
  font-weight: 850;
}

.top-search__placeholder {
  color: #94a3b8;
}

.top-icon {
  position: relative;
  display: flex;
  width: 76rpx;
  height: 76rpx;
  align-items: center;
  justify-content: center;
  border: 1rpx solid rgba(24, 24, 27, 0.08);
  border-radius: 28rpx;
  background: #fff;
  box-shadow: 0 12rpx 28rpx rgba(30, 88, 156, 0.06);
}

.top-icon__badge {
  position: absolute;
  top: 9rpx;
  right: 8rpx;
  display: flex;
  min-width: 30rpx;
  height: 30rpx;
  align-items: center;
  justify-content: center;
  padding: 0 8rpx;
  border: 4rpx solid #fff;
  border-radius: 999rpx;
  background: #ef4444;
  color: #fff;
  font-size: 18rpx;
  font-weight: 950;
  line-height: 1;
}

.home__scroll {
  height: 100vh;
}

.home__content {
  padding-right: 34rpx;
  padding-bottom: 188rpx;
  padding-left: 34rpx;
}

.feature-card {
  position: relative;
  min-height: 386rpx;
  overflow: hidden;
  border-radius: 44rpx;
  background: #dbeafe;
  box-shadow: 0 20rpx 44rpx rgba(35, 136, 255, 0.14);
}

.feature-card__image,
.feature-card__shade {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.feature-card__shade {
  background:
    linear-gradient(180deg, rgba(31, 94, 205, 0.54), rgba(31, 94, 205, 0.24) 42%, rgba(9, 37, 90, 0.2) 100%),
    linear-gradient(135deg, rgba(35, 136, 255, 0.36), rgba(37, 99, 235, 0.12));
}

.feature-card__content {
  position: relative;
  z-index: 2;
  display: flex;
  min-height: 386rpx;
  flex-direction: column;
  justify-content: space-between;
  padding: 32rpx 30rpx 28rpx;
  color: #fff;
}

.feature-card__pill {
  align-self: flex-start;
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.14);
  border: 1rpx solid rgba(255, 255, 255, 0.14);
  font-size: 18rpx;
  font-weight: 950;
  backdrop-filter: blur(12px);
}

.feature-card__title-group {
  display: grid;
  gap: 2rpx;
  margin-top: 14rpx;
  max-width: 560rpx;
}

.feature-card__title-line {
  display: block;
  font-size: 37rpx;
  font-weight: 950;
  line-height: 1.08;
  text-shadow: 0 8rpx 20rpx rgba(7, 25, 59, 0.24);
}

.feature-card__title-line--strong {
  font-size: 46rpx;
}

.feature-card__desc {
  display: block;
  margin-top: 12rpx;
  max-width: 560rpx;
  color: rgba(255, 255, 255, 0.82);
  font-size: 20rpx;
  font-weight: 850;
  line-height: 1.45;
  text-shadow: 0 8rpx 20rpx rgba(7, 25, 59, 0.18);
}

.feature-card__stats-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-top: 18rpx;
}

.feature-card__stat-chip {
  display: inline-flex;
  min-height: 52rpx;
  align-items: center;
  justify-content: center;
  padding: 0 18rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.96);
  border: 1rpx solid rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(12px);
  box-shadow: 0 8rpx 20rpx rgba(11, 51, 122, 0.14);
}

.feature-card__stat-chip-text {
  color: #274d8f;
  font-size: 18rpx;
  font-weight: 900;
  line-height: 1;
}

.feature-card__stat-chip-num {
  color: #102033;
  font-size: 21rpx;
  font-weight: 950;
  line-height: 1;
  vertical-align: baseline;
}

.section-title {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20rpx;
  margin: 42rpx 0 22rpx;
}

.section-title text {
  display: block;
}

.section-title view text:first-child {
  color: #102033;
  font-size: 35rpx;
  font-weight: 950;
}

.section-title view text:last-child {
  margin-top: 7rpx;
  color: #64748b;
  font-size: 22rpx;
  font-weight: 850;
}

.section-title__action {
  color: #2388ff;
  font-size: 23rpx;
  font-weight: 950;
}

.scene-row {
  margin-top: 24rpx;
  margin-right: -34rpx;
  margin-left: -34rpx;
  white-space: nowrap;
}

.scene-row__inner {
  display: inline-flex;
  gap: 16rpx;
  padding: 4rpx 34rpx 8rpx;
}

.scene-chip {
  display: inline-flex;
  align-items: center;
  gap: 10rpx;
  padding: 18rpx 25rpx;
  border: 1rpx solid #dbeafe;
  border-radius: 999rpx;
  background: #fff;
  color: #2388ff;
  font-size: 23rpx;
  font-weight: 950;
  box-shadow: 0 10rpx 24rpx rgba(30, 88, 156, 0.05);
}

.scene-chip--active {
  border-color: #2388ff;
  background: #2388ff;
  color: #fff;
}

.sort-tabs {
  display: flex;
  gap: 12rpx;
  margin-top: 24rpx;
  overflow-x: auto;
  white-space: nowrap;
}

.sort-tabs__item {
  flex: 0 0 auto;
  padding: 17rpx 28rpx;
  border-radius: 999rpx;
  background: #fff;
  color: #64748b;
  font-size: 22rpx;
  font-weight: 950;
  box-shadow: 0 10rpx 24rpx rgba(30, 88, 156, 0.05);
}

.sort-tabs__item--active {
  background: #102033;
  color: #fff;
}

.home__list {
  display: flex;
  flex-direction: column;
  gap: 26rpx;
}

.empty-card {
  display: flex;
  min-height: 260rpx;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 16rpx;
  border: 1rpx solid rgba(24, 24, 27, 0.08);
  border-radius: 36rpx;
  background: #fff;
  color: #94a3b8;
  font-size: 24rpx;
  font-weight: 900;
}
</style>
