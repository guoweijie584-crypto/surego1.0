<template>
  <view class="partners su-page">
    <view class="partners__top" :style="navStyle">
      <view class="partners__top-row" :style="navRowStyle">
        <view class="brand-lockup" @tap="goUserProfile">
          <text>搭子</text>
          <text>{{ selectedCity || '本校' }}</text>
        </view>
        <view class="top-search" @tap="showComingSoon('搭子搜索正在接入')">
          <uni-icons type="search" size="17" color="#64748b" />
          <input disabled placeholder="搜饭搭子 / 项目组队" placeholder-class="top-search__placeholder" />
        </view>
        <view class="top-icon" :style="navActionsStyle" @tap="goMessages">
          <uni-icons type="notification-filled" size="20" color="#102033" />
          <view v-if="unreadCount > 0" class="top-icon__badge">
            <text>{{ unreadLabel }}</text>
          </view>
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="partners__scroll">
      <view class="partners__content" :style="contentTopStyle">
        <view class="hackathon-card" @tap="goHackathon">
          <image class="hackathon-card__image" src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=82&w=900" mode="aspectFill" />
          <view class="hackathon-card__shade" />
          <view class="hackathon-card__content">
            <text class="hackathon-card__pill">精选推荐</text>
            <text class="hackathon-card__title">AI 黑客松选手组队专区</text>
            <text class="hackathon-card__desc">按项目方向、还缺什么人和比赛时间找队友。先提交意向，队长确认后再继续准备参赛。</text>
            <view class="hackathon-card__stats">
              <view><text>{{ projectCount }}</text><text>组队帖</text></view>
              <view><text>{{ totalInterest }}</text><text>感兴趣</text></view>
              <view><text>48h</text><text>比赛周期</text></view>
            </view>
          </view>
        </view>

        <view class="quick-post-card" @tap="goPartnerCreate">
          <view class="quick-post-card__icon">
            <uni-icons type="plusempty" size="23" color="#fff" />
          </view>
          <view>
            <text>你想找什么搭子？</text>
            <text>约个时间、长期搭子、项目组队都从这里发。</text>
          </view>
          <uni-icons type="right" size="18" color="#94a3b8" />
        </view>

        <view class="section-title">
          <view>
            <text>场景分类</text>
            <text>快速判断这个人想找谁、是否适合你</text>
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
              <text>{{ item.label }}</text>
            </view>
          </view>
        </scroll-view>

        <view class="section-title section-title--inline">
          <view>
            <text>本校同学想找这些搭子</text>
            <text>{{ filteredPosts.length }} 个帖子</text>
          </view>
          <text class="section-title__action" @tap="activeScene = 'all'">看全部</text>
        </view>

        <view class="partners__list">
          <SuPartnerCard v-for="item in filteredPosts" :key="item.id" :partner="item" />
          <view v-if="filteredPosts.length === 0" class="empty-card">
            <uni-icons type="personadd" size="42" color="#cbd5e1" />
            <text>这个分类暂时还没人发布。</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <SuBottomDock active="partners" />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onPullDownRefresh, onShow } from '@dcloudio/uni-app'
import SuBottomDock from '@/components/surego/SuBottomDock.vue'
import SuPartnerCard from '@/components/surego/SuPartnerCard.vue'
import { listPartnerPosts } from '@/common/api/partner.js'
import { getUnreadMessageCount } from '@/common/api/message.js'
import { makeRefreshHandler } from '@/common/utils/refresh.js'
import { getMiniProgramNavActionsStyle, getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goHackathon, goMessages, goPartnerCreate, goUserProfile, showComingSoon } from '@/common/utils/route.js'

const CITY_KEY = 'surego_selected_city'
const selectedCity = ref('天津大学')
const posts = ref([])
const unreadCount = ref(0)
const activeScene = ref('all')
const activeType = activeScene
const navStyle = getMiniProgramNavStyle()
const navRowStyle = getMiniProgramNavRowStyle({ leftPaddingRpx: 34, minRightPaddingRpx: 24 })
const navActionsStyle = getMiniProgramNavActionsStyle({ leftReserveRpx: 620 })
const contentTopStyle = getMiniProgramNavContentStyle({ gapRpx: 24 })

const sceneFilters = [
  { key: 'all', label: '全部' },
  { key: 'food', label: '饭搭子' },
  { key: 'sport', label: '运动' },
  { key: 'study', label: '学习' },
  { key: 'game', label: '游戏' },
  { key: 'fun', label: '娱乐' },
  { key: 'project', label: '项目组队' },
  { key: 'longterm', label: '长期搭子' }
]

const filteredPosts = computed(() => {
  if (activeScene.value === 'all') return posts.value
  return posts.value.filter((item) => matchesScene(item, activeScene.value))
})

const projectCount = computed(() => posts.value.filter((item) => item.type === 'project').length)
const totalInterest = computed(() => posts.value.reduce((sum, item) => sum + Number(item.intentCount || 0), 0))
const unreadLabel = computed(() => (unreadCount.value > 99 ? '99+' : String(unreadCount.value)))

async function loadData() {
  selectedCity.value = uni.getStorageSync(CITY_KEY) || '天津大学'
  const [items, unread] = await Promise.all([
    listPartnerPosts(),
    getUnreadMessageCount()
  ])
  posts.value = items
  unreadCount.value = unread
}

onShow(loadData)
onPullDownRefresh(makeRefreshHandler(loadData))

function matchesScene(item = {}, scene = 'all') {
  if (item.scene === scene) return true
  const haystack = [
    item.title,
    item.description,
    item.expectation,
    item.location,
    item.scene,
    item.type,
    item.typeLabel,
    ...(Array.isArray(item.fitTags) ? item.fitTags : [])
  ].join(' ')

  const sceneWords = {
    food: ['饭', '吃', '美食', '咖啡', '餐'],
    sport: ['运动', '羽毛球', '跑', '球', '健身'],
    study: ['学习', '自习', '阅读', '考研'],
    game: ['游戏', 'Switch', '桌游'],
    fun: ['看展', '摄影', '娱乐', 'Citywalk'],
    project: ['project', '项目', '组队', 'AI', '小程序'],
    longterm: ['long_term', '长期', '固定', '稳定']
  }
  return (sceneWords[scene] || []).some((word) => haystack.includes(word))
}
</script>

<style scoped>
.partners {
  min-height: 100vh;
  padding-bottom: 180rpx;
  background: #f6fbff;
}

.partners__top {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 30;
  background: rgba(247, 251, 255, 0.9);
  backdrop-filter: blur(18px);
}

.partners__top-row {
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

.partners__scroll {
  height: 100vh;
}

.partners__content {
  padding-right: 34rpx;
  padding-bottom: 188rpx;
  padding-left: 34rpx;
}

.hackathon-card {
  position: relative;
  overflow: hidden;
  border-radius: 52rpx;
  background: #2563eb;
  box-shadow: 0 28rpx 60rpx rgba(37, 99, 235, 0.2);
}

.hackathon-card__image,
.hackathon-card__shade {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.hackathon-card__shade {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.9), rgba(109, 91, 208, 0.72));
}

.hackathon-card__content {
  position: relative;
  z-index: 1;
  padding: 42rpx 36rpx;
  color: #fff;
}

.hackathon-card__pill {
  display: inline-flex;
  padding: 14rpx 20rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.18);
  font-size: 22rpx;
  font-weight: 950;
  backdrop-filter: blur(12px);
}

.hackathon-card__title {
  display: block;
  margin-top: 28rpx;
  font-size: 56rpx;
  font-weight: 950;
  line-height: 1.08;
}

.hackathon-card__desc {
  display: block;
  margin-top: 18rpx;
  color: rgba(255, 255, 255, 0.84);
  font-size: 25rpx;
  font-weight: 850;
  line-height: 1.55;
}

.hackathon-card__stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14rpx;
  margin-top: 28rpx;
}

.hackathon-card__stats view {
  padding: 20rpx 18rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(14px);
}

.hackathon-card__stats text {
  display: block;
}

.hackathon-card__stats text:first-child {
  font-size: 38rpx;
  font-weight: 950;
}

.hackathon-card__stats text:last-child {
  margin-top: 5rpx;
  color: rgba(255, 255, 255, 0.78);
  font-size: 19rpx;
  font-weight: 850;
}

.quick-post-card {
  display: grid;
  grid-template-columns: 72rpx minmax(0, 1fr) 24rpx;
  align-items: center;
  gap: 20rpx;
  margin-top: 28rpx;
  padding: 28rpx;
  border: 1rpx solid rgba(24, 24, 27, 0.08);
  border-radius: 36rpx;
  background: #fff;
  box-shadow: 0 18rpx 46rpx rgba(30, 88, 156, 0.08);
}

.quick-post-card__icon {
  display: flex;
  width: 72rpx;
  height: 72rpx;
  align-items: center;
  justify-content: center;
  border-radius: 24rpx;
  background: #2388ff;
}

.quick-post-card text {
  display: block;
}

.quick-post-card text:first-child {
  color: #102033;
  font-size: 28rpx;
  font-weight: 950;
}

.quick-post-card text:last-child {
  margin-top: 7rpx;
  color: #64748b;
  font-size: 22rpx;
  font-weight: 850;
  line-height: 1.4;
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
  margin-right: -34rpx;
  margin-left: -34rpx;
  white-space: nowrap;
}

.scene-row__inner {
  display: inline-flex;
  gap: 16rpx;
  padding: 0 34rpx 8rpx;
}

.scene-chip {
  display: inline-flex;
  align-items: center;
  padding: 18rpx 28rpx;
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

.partners__list {
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
