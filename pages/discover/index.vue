<template>
  <view class="discover su-page">
    <view class="discover__top" :style="navStyle">
      <view class="discover__top-row" :style="navRowStyle">
        <view class="discover__avatar" @tap="goUserProfile">
          <image :src="currentAvatar" mode="aspectFill" />
        </view>
        <view class="discover__tools" :style="navActionsStyle">
          <view class="discover__city" @tap="goCityPicker">
            <uni-icons type="location-filled" size="18" color="#111827" />
            <text>{{ selectedCity }}</text>
          </view>
          <view class="discover__tool" @tap="goCalendar()">
            <uni-icons type="calendar" size="21" color="#111827" />
          </view>
          <view class="discover__tool" @tap="goMessages">
            <uni-icons type="notification-filled" size="21" color="#111827" />
            <view v-if="unreadCount > 0" class="discover__badge">
              <text>{{ unreadLabel }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="discover__scroll">
      <view class="discover__hero" :style="contentTopStyle">
        <text class="discover__kicker">成行</text>
        <text class="discover__title">本校正在约</text>
        <text class="discover__desc">按城市、分类和热度探索正在成行的校园活动。</text>
        <view class="discover__search" @tap="goSearch()">
          <uni-icons type="search" size="20" color="#94a3b8" />
          <text>搜索活动、兴趣、地点</text>
        </view>
      </view>

      <view class="section section--compact">
        <view class="section__head">
          <text class="section__title">热门主题</text>
          <text class="section__sub">热门场景</text>
        </view>
        <scroll-view scroll-x class="topic-scroll" :show-scrollbar="false">
          <view class="topic-list">
            <view v-for="topic in topics" :key="topic.name" class="topic-card" :style="{ background: topic.color }" @tap="activeCategory = topic.category">
              <text class="topic-card__icon">{{ topic.icon }}</text>
              <text class="topic-card__name">{{ topic.name }}</text>
              <text class="topic-card__count">{{ countByCategory(topic.category) }} 个局</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <view class="blind-box" @tap="openBlindPick">
        <view>
          <text class="blind-box__kicker">随机推荐</text>
          <text class="blind-box__title">不知道去哪？随机开一局</text>
          <text class="blind-box__desc">根据当前城市和热门活动，给你一个轻松的选择。</text>
        </view>
        <view class="blind-box__button">
          <uni-icons type="paperplane-filled" size="22" color="#fff" />
        </view>
      </view>

      <scroll-view scroll-x class="discover__chips" :show-scrollbar="false">
        <view class="discover__chip-list">
          <view v-for="item in categories" :key="item" class="discover__chip" :class="{ 'discover__chip--active': activeCategory === item }" @tap="activeCategory = item">
            <text>{{ item }}</text>
          </view>
        </view>
      </scroll-view>

      <view class="section">
        <view class="section__head">
          <text class="section__title">{{ activeCategory === '全部' ? '附近推荐' : activeCategory }}</text>
          <text class="section__sub">{{ filteredActivities.length }} 个活动</text>
        </view>
        <view class="discover__list">
          <SuActivityCard v-for="item in filteredActivities" :key="item.id" :activity="item" />
        </view>
        <view v-if="filteredActivities.length === 0" class="empty">
          <uni-icons type="map-pin-ellipse" size="42" color="#cbd5e1" />
          <text>这个筛选暂时没有活动</text>
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
import { listActivitiesByCity } from '@/common/api/activity.js'
import { getCurrentUserProfile, isLoggedIn, isSuregoProfileComplete } from '@/common/api/auth.js'
import { getUnreadMessageCount } from '@/common/api/message.js'
import { makeRefreshHandler } from '@/common/utils/refresh.js'
import { getMiniProgramNavActionsStyle, getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goActivityDetail, goCalendar, goCityPicker, goMessages, goSearch, goUserProfile } from '@/common/utils/route.js'

const DEFAULT_AVATAR = '/static/userImg/user.png'
const CITY_KEY = 'surego_selected_city'
const CITY_CODE_KEY = 'surego_selected_city_code'
const categories = ['全部', '户外', '美食', '运动', '学习', '展览', '夜生活']
const topics = [
  { name: '周末出逃', category: '户外', icon: '野', color: 'linear-gradient(135deg, #22c55e, #16a34a)' },
  { name: '饭搭子', category: '美食', icon: '食', color: 'linear-gradient(135deg, #f97316, #ef4444)' },
  { name: '自我充电', category: '学习', icon: '读', color: 'linear-gradient(135deg, #3b82f6, #0ea5e9)' },
  { name: '夜晚计划', category: '夜生活', icon: '夜', color: 'linear-gradient(135deg, #111827, #475569)' }
]

const activeCategory = ref('全部')
const selectedCity = ref('天津')
const selectedCityCode = ref('330100')
const currentAvatar = ref(DEFAULT_AVATAR)
const unreadCount = ref(0)
const activities = ref([])
const navStyle = getMiniProgramNavStyle()
const navRowStyle = getMiniProgramNavRowStyle({ leftPaddingRpx: 34, minRightPaddingRpx: 24 })
const navActionsStyle = getMiniProgramNavActionsStyle({ leftReserveRpx: 118 })
const contentTopStyle = getMiniProgramNavContentStyle({ gapRpx: 32 })

const filteredActivities = computed(() => activeCategory.value === '全部' ? activities.value : activities.value.filter((item) => item.category === activeCategory.value))
const unreadLabel = computed(() => (unreadCount.value > 99 ? '99+' : String(unreadCount.value)))

async function loadData() {
  refreshCurrentAvatar()
  selectedCity.value = uni.getStorageSync(CITY_KEY) || '天津'
  selectedCityCode.value = uni.getStorageSync(CITY_CODE_KEY) || '330100'
  const [items, unread] = await Promise.all([
    listActivitiesByCity(selectedCity.value, selectedCityCode.value),
    getUnreadMessageCount()
  ])
  activities.value = items
  unreadCount.value = unread
}

onShow(loadData)
onPullDownRefresh(makeRefreshHandler(loadData))

function refreshCurrentAvatar() {
  const profile = getCurrentUserProfile()
  currentAvatar.value = isLoggedIn() && isSuregoProfileComplete(profile) ? (profile.avatar || DEFAULT_AVATAR) : DEFAULT_AVATAR
}

function countByCategory(category) {
  return activities.value.filter((item) => item.category === category).length
}

function openBlindPick() {
  const source = filteredActivities.value.length ? filteredActivities.value : activities.value
  if (!source.length) {
    uni.showToast({ title: '暂无可推荐活动', icon: 'none' })
    return
  }
  const index = Math.floor(Date.now() % source.length)
  goActivityDetail(source[index].id)
}
</script>

<style scoped>
.discover { min-height: 100vh; padding-bottom: 180rpx; background: #f8f9f9; }
.discover__top { position: fixed; top: 0; right: 0; left: 0; z-index: 30; display: block; padding: 0; background: rgba(255, 255, 255, 0.52); backdrop-filter: blur(18px); }
.discover__top-row { display: flex; align-items: center; justify-content: space-between; }
.discover__avatar, .discover__avatar image { width: 88rpx; height: 88rpx; border-radius: 50%; }
.discover__avatar { border: 6rpx solid #fff; background: #f1f5f9; box-shadow: 0 16rpx 36rpx rgba(15, 23, 42, 0.12); }
.discover__tools { display: flex; align-items: center; flex-shrink: 0; gap: 8rpx; overflow: hidden; padding: 10rpx; border-radius: 999rpx; background: rgba(255, 255, 255, 0.88); box-shadow: 0 16rpx 38rpx rgba(15, 23, 42, 0.08); }
.discover__city, .discover__tool { position: relative; display: flex; height: 62rpx; align-items: center; justify-content: center; border-radius: 999rpx; }
.discover__city { gap: 6rpx; padding: 0 18rpx; color: #111827; font-size: 24rpx; font-weight: 900; }
.discover__city text { max-width: 108rpx; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.discover__tool { width: 62rpx; }
.discover__badge { position: absolute; top: 2rpx; right: 0; display: flex; min-width: 30rpx; height: 30rpx; align-items: center; justify-content: center; padding: 0 8rpx; border: 4rpx solid #fff; border-radius: 999rpx; background: #ef4444; color: #fff; font-size: 18rpx; font-weight: 900; line-height: 1; box-sizing: border-box; }
.discover__scroll { height: 100vh; }
.discover__hero { padding-right: 40rpx; padding-bottom: 32rpx; padding-left: 40rpx; }
.discover__kicker, .section__sub, .blind-box__kicker { color: #94a3b8; font-size: 20rpx; font-weight: 900; }
.discover__title { display: block; margin-top: 8rpx; color: #111827; font-size: 56rpx; font-style: italic; font-weight: 900; }
.discover__desc { display: block; margin-top: 18rpx; color: #64748b; font-size: 25rpx; font-weight: 800; line-height: 1.55; }
.discover__search { display: flex; height: 86rpx; align-items: center; gap: 16rpx; margin-top: 28rpx; padding: 0 28rpx; border: 1rpx solid #eef2f7; border-radius: 999rpx; background: #fff; color: #94a3b8; font-size: 25rpx; font-weight: 900; box-shadow: 0 18rpx 40rpx rgba(15, 23, 42, 0.05); }
.section { padding: 0 40rpx 34rpx; }
.section--compact { padding-right: 0; }
.section__head { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 24rpx; }
.section--compact .section__head { padding-right: 40rpx; }
.section__title { color: #111827; font-size: 34rpx; font-style: italic; font-weight: 900; }
.topic-scroll, .discover__chips { white-space: nowrap; }
.topic-list { display: inline-flex; gap: 18rpx; padding-right: 40rpx; }
.topic-card { display: inline-flex; width: 210rpx; min-height: 178rpx; flex-direction: column; justify-content: space-between; padding: 24rpx; border-radius: 38rpx; color: #fff; box-shadow: 0 18rpx 42rpx rgba(15, 23, 42, 0.12); }
.topic-card__icon { font-size: 42rpx; }
.topic-card__name { display: block; font-size: 29rpx; font-style: italic; font-weight: 900; }
.topic-card__count { display: block; margin-top: 8rpx; color: rgba(255, 255, 255, 0.78); font-size: 21rpx; font-weight: 900; }
.blind-box { display: flex; align-items: center; justify-content: space-between; margin: 0 40rpx 34rpx; padding: 30rpx; border-radius: 40rpx; background: #111827; color: #fff; box-shadow: 0 20rpx 52rpx rgba(15, 23, 42, 0.16); }
.blind-box__title { display: block; margin-top: 9rpx; color: #fff; font-size: 32rpx; font-style: italic; font-weight: 900; }
.blind-box__desc { display: block; max-width: 460rpx; margin-top: 10rpx; color: rgba(255, 255, 255, 0.7); font-size: 22rpx; font-weight: 800; line-height: 1.45; }
.blind-box__button { display: flex; width: 82rpx; height: 82rpx; flex: 0 0 82rpx; align-items: center; justify-content: center; border-radius: 50%; background: #ff6b6b; }
.discover__chip-list { display: flex; gap: 16rpx; padding: 0 40rpx 30rpx; }
.discover__chip { padding: 18rpx 30rpx; border: 1rpx solid #eef2f7; border-radius: 999rpx; background: #fff; color: #94a3b8; font-size: 23rpx; font-weight: 900; }
.discover__chip--active { border-color: #111827; background: #111827; color: #fff; }
.discover__list { display: flex; flex-direction: column; gap: 28rpx; }
.empty { display: flex; flex-direction: column; align-items: center; gap: 16rpx; padding: 90rpx 0 160rpx; color: #94a3b8; font-size: 24rpx; font-weight: 900; }
</style>
