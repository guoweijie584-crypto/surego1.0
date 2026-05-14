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
        <view class="featured-card" @tap="goHackathon">
          <image class="featured-card__image" src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=82&w=900" mode="aspectFill" />
          <view class="featured-card__shade" />
          <view class="featured-card__content">
            <text class="featured-card__eyebrow">主题推荐</text>
            <view class="featured-card__copy">
              <text class="featured-card__title">天津高校 AI 黑客松组队中</text>
              <text class="featured-card__desc">找产品、前端、算法、设计、路演队友。按方向和角色快速上车。</text>
            </view>
            <view class="hero-live-row">
              <text>12 支队伍</text>
              <text>缺 28 位队友</text>
              <text>周末开赛</text>
            </view>
          </view>
          <view class="featured-card__badge">
            <uni-icons type="star-filled" size="22" color="#fff" />
            <text>Hackathon</text>
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
            <text class="section-title__title">场景分类</text>
          </view>
        </view>

        <scroll-view scroll-x class="scene-scroll-row" :show-scrollbar="false">
          <view class="scene-scroll-row__inner">
            <view
              v-for="item in sceneFilters"
              :key="item.key"
              class="scene-filter-chip"
              :class="{ active: activeScene === item.key }"
              @tap="activeScene = item.key"
            >
              <text>{{ item.label }}</text>
            </view>
          </view>
        </scroll-view>

        <view class="section-title section-title--inline">
          <view>
            <text class="section-title__eyebrow">正在找</text>
            <text class="section-title__title">本校同学想找这些搭子</text>
          </view>
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

.featured-card {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 172rpx;
  gap: 28rpx;
  overflow: hidden;
  min-height: 440rpx;
  padding: 40rpx;
  border-radius: 56rpx;
  color: #fff;
  box-shadow: 0 28rpx 60rpx rgba(37, 99, 235, 0.2);
  box-sizing: border-box;
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
  background: linear-gradient(135deg, rgba(24, 24, 27, 0.72), rgba(37, 99, 235, 0.54));
}

.featured-card__content {
  position: relative;
  z-index: 1;
  display: grid;
  align-content: space-between;
  gap: 20rpx;
  min-width: 0;
}

.featured-card__eyebrow {
  display: flex;
  width: 112rpx;
  align-items: center;
  justify-content: center;
  padding: 14rpx 20rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.18);
  font-size: 22rpx;
  font-weight: 950;
  backdrop-filter: blur(12px);
}

.featured-card__copy {
  display: grid;
  gap: 14rpx;
}

.featured-card__title {
  display: block;
  font-size: 56rpx;
  font-weight: 950;
  line-height: 1.08;
}

.featured-card__desc {
  display: block;
  color: rgba(255, 255, 255, 0.84);
  font-size: 26rpx;
  font-weight: 850;
  line-height: 1.45;
}

.hero-live-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.hero-live-row text {
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.9);
  padding: 16rpx 20rpx;
  color: #12342e;
  font-size: 22rpx;
  font-weight: 950;
  line-height: 1;
}

.featured-card__badge {
  position: relative;
  z-index: 1;
  display: grid;
  align-self: end;
  justify-items: center;
  gap: 14rpx;
  padding: 28rpx 16rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.18);
  border-radius: 44rpx;
  background: rgba(255, 255, 255, 0.16);
  text-align: center;
  backdrop-filter: blur(16px);
}

.featured-card__badge text {
  color: #fff;
  font-size: 22rpx;
  font-weight: 950;
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

.section-title view .section-title__eyebrow {
  color: #64748b;
  font-size: 22rpx;
  font-weight: 900;
}

.section-title view .section-title__title {
  margin-top: 0;
  color: #102033;
  font-size: 35rpx;
  font-weight: 950;
}

.section-title view .section-title__eyebrow + .section-title__title {
  margin-top: 7rpx;
}

.scene-scroll-row {
  margin-right: -34rpx;
  margin-left: -34rpx;
  white-space: nowrap;
}

.scene-scroll-row__inner {
  display: inline-flex;
  gap: 16rpx;
  padding: 0 34rpx 8rpx;
}

.scene-filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 12rpx;
  padding: 22rpx 26rpx;
  border: 1rpx solid rgba(24, 24, 27, 0.08);
  border-radius: 999rpx;
  background: #fff;
  color: #64748b;
  font-size: 23rpx;
  font-weight: 950;
  box-shadow: 0 10rpx 24rpx rgba(30, 88, 156, 0.05);
}

.scene-filter-chip.active {
  border-color: rgba(35, 136, 255, 0.34);
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
