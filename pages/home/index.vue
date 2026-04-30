<template>
  <view class="home su-page">
    <view class="home__top" :style="navStyle">
      <view class="home__top-row" :style="navRowStyle">
      <view class="home__brand" @tap="goUserProfile">
        <image class="home__avatar" :src="currentAvatar" mode="aspectFill" />
        <view>
          <text class="home__eyebrow">SUREGO</text>
          <text class="home__title">成行</text>
        </view>
      </view>
      <view class="home__actions" :style="navActionsStyle">
        <view class="home__icon" @tap="goSearch()">
          <uni-icons type="search" size="22" color="#111827" />
        </view>
        <view class="home__icon" @tap="goMessages">
          <uni-icons type="notification-filled" size="22" color="#111827" />
          <view class="home__notice-dot" />
        </view>
      </view>
      </view>
    </view>

    <view class="home__section home__section--selected" :style="contentTopStyle">
      <view class="home__section-head">
        <text class="home__section-title">精选活动</text>
        <text class="home__section-sub">SELECTED SPOTS</text>
      </view>
      <scroll-view scroll-x class="home__featured-scroll" :show-scrollbar="false">
        <view class="home__featured-list">
          <view
            v-for="item in featuredActivities"
            :key="item.id"
            class="featured-card"
            hover-class="featured-card--active"
            @tap="goActivityDetail(item.id)"
          >
            <image class="featured-card__image" :src="item.image" mode="aspectFill" />
            <view class="featured-card__shade" />
            <view class="featured-card__glass">
              <view class="featured-card__main">
                <text class="featured-card__title su-line-1">{{ item.title }}</text>
                <view class="featured-card__meta">
                  <uni-icons type="location-filled" size="12" color="rgba(255,255,255,.8)" />
                  <text>{{ getShortLocation(item.location) }}</text>
                  <view class="featured-card__dot" />
                  <uni-icons type="person-filled" size="12" color="rgba(255,255,255,.8)" />
                  <text>{{ item.participantCount }}人</text>
                </view>
              </view>
              <text class="featured-card__price">{{ getPriceText(item) }}</text>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <view class="home__section">
      <view class="home__section-head">
        <text class="home__section-title">我的局</text>
        <text class="home__section-link" @tap="goMyActivities">全部</text>
      </view>
      <scroll-view scroll-x class="home__mine-scroll" :show-scrollbar="false">
        <view class="home__mine-list">
          <view
            v-for="item in userActivities"
            :key="item.id"
            class="mine-card"
            hover-class="mine-card--active"
            @tap="goActivityDetail(item.id)"
          >
            <view class="mine-card__bar" />
            <view class="mine-card__head">
              <image class="mine-card__avatar" :src="item.organizerAvatar" mode="aspectFill" />
              <text class="mine-card__name su-line-1">{{ item.organizer }}</text>
              <view class="mine-card__days">
                <text>距离开始</text>
                <text class="mine-card__days-number">{{ getDaysLabel(item.id) }}</text>
                <text>天</text>
              </view>
            </view>
            <view class="mine-card__body">
              <image class="mine-card__cover" :src="item.image" mode="aspectFill" />
              <view class="mine-card__info">
                <text class="mine-card__badge">{{ item.isCreator ? '主办' : '参与' }}</text>
                <text class="mine-card__title su-line-2">{{ item.title }}</text>
                <text class="mine-card__meta su-line-1">{{ item.date }} {{ item.time }}</text>
                <text class="mine-card__meta su-line-1">{{ getShortLocation(item.location) }} 路 距您{{ item.distance }}km</text>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <view class="home__main">
      <view class="home__section-head">
        <text class="home__section-title">为你推荐</text>
        <text class="home__section-sub">JUST FOR YOU</text>
      </view>
      <view class="home__recommend-list">
        <SuActivityCard
          v-for="item in recommendedActivities"
          :key="item.id"
          :activity="item"
        />
      </view>
    </view>

    <SuBottomDock active="home" />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import SuActivityCard from '@/components/surego/SuActivityCard.vue'
import SuBottomDock from '@/components/surego/SuBottomDock.vue'
import { isHomeVisibleMyActivity, listActivities, listMyActivities, sortActivitiesByStatusPriority } from '@/common/api/activity.js'
import { getCurrentUserProfile, isLoggedIn, isSuregoProfileComplete } from '@/common/api/auth.js'
import { getMiniProgramNavActionsStyle, getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goActivityDetail, goMessages, goMyActivities, goSearch, goUserProfile } from '@/common/utils/route.js'

const DEFAULT_AVATAR = '/static/userImg/user.png'
const navStyle = getMiniProgramNavStyle()
const navRowStyle = getMiniProgramNavRowStyle({ leftPaddingRpx: 40, minRightPaddingRpx: 24 })
const navActionsStyle = getMiniProgramNavActionsStyle({ leftReserveRpx: 390 })
const contentTopStyle = getMiniProgramNavContentStyle({ gapRpx: 26 })
const currentAvatar = ref(DEFAULT_AVATAR)
const allActivities = ref([])
const myGroups = ref({
  hosting: [],
  joined: [],
  pending: []
})

const featuredActivities = computed(() => allActivities.value.filter((item) => item.image).slice(0, 3))
const userActivities = computed(() => sortActivitiesByStatusPriority([
  ...myGroups.value.hosting,
  ...myGroups.value.joined
]).filter(isHomeVisibleMyActivity).slice(0, 4))
const recommendedActivities = computed(() => allActivities.value)

onShow(async () => {
  refreshCurrentAvatar()
  allActivities.value = await listActivities()
  myGroups.value = await listMyActivities()
})

function refreshCurrentAvatar() {
  const profile = getCurrentUserProfile()
  currentAvatar.value = isLoggedIn() && isSuregoProfileComplete(profile)
    ? (profile.avatar || DEFAULT_AVATAR)
    : DEFAULT_AVATAR
}

function getShortLocation(location) {
  return (location || '').split(' 路 ')[0] || location
}

function getPriceText(activity) {
  if (activity.partyMode === 'free') return '免费'
  if (activity.partyMode === 'sincerity') return `诚意金 ${activity.amount}`
  return `门票 ${activity.amount}`
}

function getDaysLabel(id) {
  const seed = Number(String(id).replace(/\D/g, '').slice(-1)) || 1
  return (seed % 6) + 1
}
</script>

<style scoped>
.home {
  padding: 0 0 180rpx;
}

.home__top {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 30;
  display: block;
  padding: 0;
  background: rgba(255, 255, 255, 0.52);
  backdrop-filter: blur(18px);
}

.home__top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.home__brand {
  display: flex;
  align-items: center;
  gap: 18rpx;
}

.home__avatar {
  width: 86rpx;
  height: 86rpx;
  border: 6rpx solid #fff;
  border-radius: 50%;
  background: #f1f5f9;
  box-shadow: 0 16rpx 36rpx rgba(15, 23, 42, 0.12);
}

.home__eyebrow {
  display: block;
  color: #94a3b8;
  font-size: 20rpx;
  font-weight: 900;
  letter-spacing: 0;
}

.home__title {
  display: block;
  margin-top: 4rpx;
  color: #111827;
  font-size: 54rpx;
  font-weight: 900;
  line-height: 1;
}

.home__actions {
  display: flex;
  flex-shrink: 0;
  gap: 14rpx;
  overflow: hidden;
}

.home__icon {
  position: relative;
  display: flex;
  width: 76rpx;
  height: 76rpx;
  align-items: center;
  justify-content: center;
  border: 1rpx solid #f1f5f9;
  border-radius: 26rpx;
  background: #fff;
  box-shadow: 0 16rpx 36rpx rgba(15, 23, 42, 0.06);
}

.home__notice-dot {
  position: absolute;
  top: 18rpx;
  right: 18rpx;
  width: 13rpx;
  height: 13rpx;
  border: 4rpx solid #fff;
  border-radius: 50%;
  background: #ff5e7e;
}

.home__section {
  margin-bottom: 56rpx;
}

.home__section--selected {
  overflow: hidden;
}

.home__section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 0 40rpx;
  margin-bottom: 28rpx;
}

.home__section-title {
  color: #111827;
  font-size: 38rpx;
  font-style: italic;
  font-weight: 900;
  line-height: 1;
}

.home__section-sub,
.home__section-link {
  color: #94a3b8;
  font-size: 20rpx;
  font-weight: 900;
}

.home__section-link {
  color: #3b82f6;
}

.home__featured-scroll,
.home__mine-scroll {
  width: 100%;
  white-space: nowrap;
}

.home__featured-list,
.home__mine-list {
  display: inline-flex;
  gap: 28rpx;
  padding: 0 40rpx 12rpx;
}

.featured-card {
  position: relative;
  display: inline-flex;
  width: 630rpx;
  height: 354rpx;
  overflow: hidden;
  border-radius: 52rpx;
  background: #e2e8f0;
  box-shadow: 0 22rpx 58rpx rgba(15, 23, 42, 0.18);
  transition: transform 0.18s ease;
}

.featured-card--active,
.mine-card--active {
  transform: scale(0.985);
}

.featured-card__image,
.featured-card__shade {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.featured-card__shade {
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.02), rgba(15, 23, 42, 0.34));
}

.featured-card__glass {
  position: absolute;
  right: 28rpx;
  bottom: 28rpx;
  left: 28rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
  padding: 28rpx 30rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.38);
  border-radius: 42rpx;
  background: rgba(255, 255, 255, 0.22);
  color: #fff;
  backdrop-filter: blur(16px);
}

.featured-card__main {
  min-width: 0;
  flex: 1;
}

.featured-card__title {
  display: block;
  color: #fff;
  font-size: 29rpx;
  font-style: italic;
  font-weight: 900;
}

.featured-card__meta {
  display: flex;
  align-items: center;
  gap: 9rpx;
  margin-top: 12rpx;
  color: rgba(255, 255, 255, 0.82);
  font-size: 20rpx;
  font-weight: 900;
}

.featured-card__dot {
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.45);
}

.featured-card__price {
  color: #fff;
  flex: 0 0 auto;
  font-size: 27rpx;
  font-style: italic;
  font-weight: 900;
}

.mine-card {
  position: relative;
  display: inline-block;
  width: 560rpx;
  overflow: hidden;
  border: 1rpx solid #f1f5f9;
  border-radius: 48rpx;
  background: #fff;
  box-shadow: 0 26rpx 70rpx rgba(15, 23, 42, 0.06);
  transition: transform 0.18s ease;
}

.mine-card__bar {
  height: 5rpx;
  background: linear-gradient(90deg, #3b82f6, #22c55e, #ef4444);
}

.mine-card__head {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 18rpx 28rpx;
  border-bottom: 1rpx solid #f8fafc;
  background: rgba(248, 250, 252, 0.74);
}

.mine-card__avatar {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
}

.mine-card__name {
  max-width: 180rpx;
  color: #64748b;
  font-size: 21rpx;
  font-weight: 900;
}

.mine-card__days {
  display: flex;
  align-items: baseline;
  gap: 5rpx;
  margin-left: auto;
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  background: #ffe4e4;
  color: #e57373;
  font-size: 17rpx;
  font-weight: 900;
}

.mine-card__days-number {
  font-size: 25rpx;
}

.mine-card__body {
  display: flex;
  gap: 24rpx;
  padding: 28rpx;
}

.mine-card__cover {
  width: 160rpx;
  height: 160rpx;
  flex: 0 0 160rpx;
  border-radius: 30rpx;
  background: #f1f5f9;
}

.mine-card__info {
  min-width: 0;
  flex: 1;
}

.mine-card__badge {
  display: inline-flex;
  padding: 8rpx 18rpx;
  border-radius: 12rpx;
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  font-size: 18rpx;
  font-weight: 900;
}

.mine-card__title {
  display: block;
  margin-top: 16rpx;
  color: #27272a;
  font-size: 29rpx;
  font-style: italic;
  font-weight: 900;
  line-height: 1.36;
}

.mine-card__meta {
  display: block;
  margin-top: 11rpx;
  color: #94a3b8;
  font-size: 21rpx;
  font-weight: 800;
}

.home__main {
  padding-bottom: 26rpx;
}

.home__recommend-list {
  display: flex;
  flex-direction: column;
  gap: 28rpx;
  padding: 0 40rpx;
}
</style>
