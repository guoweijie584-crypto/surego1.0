<template>
  <view class="partners su-page">
    <view class="partners__top" :style="navStyle">
      <view class="partners__top-row" :style="navRowStyle">
        <view class="brand-lockup" @tap="goUserProfile">
          <text>搭子</text>
          <text>{{ selectedSchool }}</text>
        </view>
        <view class="top-search" @tap="showComingSoon('搭子搜索正在接入')">
          <SuIcon name="search" size="34" glyph-size="17" variant="inline" color="#64748b" />
          <input disabled placeholder="搜饭搭子 / 项目组队" placeholder-class="top-search__placeholder" />
        </view>
        <view class="top-icon" :style="navActionsStyle" @tap="goMessages">
          <SuIcon name="bell" size="50" glyph-size="22" variant="soft" />
          <view v-if="unreadCount > 0" class="top-icon__badge">
            <text>{{ unreadLabel }}</text>
          </view>
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="partners__scroll">
      <view class="partners__content" :style="contentTopStyle">
        <view class="feature-card" @tap="goHackathon">
          <image class="feature-card__image" src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=82&w=900" mode="aspectFill" />
          <view class="feature-card__shade" />
          <view class="feature-card__content">
            <text class="feature-card__pill">主题推荐</text>
            <view class="feature-card__title-group">
              <text class="feature-card__title-line">天津高校 AI 黑客松</text>
              <text class="feature-card__title-line feature-card__title-line--strong">组队中</text>
            </view>
            <text class="feature-card__desc">找产品、前端、算法、设计、路演队友。按方向和角色快速上车。</text>
            <view class="feature-card__stats-bar">
              <view class="feature-card__stat-chip"><text class="feature-card__stat-chip-text"><text class="feature-card__stat-chip-num">12</text> 支队伍</text></view>
              <view class="feature-card__stat-chip"><text class="feature-card__stat-chip-text"><text class="feature-card__stat-chip-num">28</text> 缺队友</text></view>
              <view class="feature-card__stat-chip"><text class="feature-card__stat-chip-text">周末开赛</text></view>
            </view>
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

        <view class="section-title section-title--inline">
          <view>
            <text class="section-title__eyebrow">正在找</text>
          </view>
        </view>

        <view class="partners__list">
          <SuPartnerCard v-for="item in filteredPosts" :key="item.id" :partner="item" />
          <view v-if="filteredPosts.length === 0" class="empty-card">
            <SuIcon name="emptyPartner" size="88" glyph-size="42" variant="soft" color="#94a3b8" />
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
import SuIcon from '@/components/surego/SuIcon.vue'
import SuPartnerCard from '@/components/surego/SuPartnerCard.vue'
import { listPartnerPosts } from '@/common/api/partner.js'
import { getUnreadMessageCount } from '@/common/api/message.js'
import { makeRefreshHandler } from '@/common/utils/refresh.js'
import { getMiniProgramNavActionsStyle, getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goHackathon, goMessages, goPartnerCreate, goUserProfile, showComingSoon } from '@/common/utils/route.js'

const selectedSchool = '天津大学'
const posts = ref([])
const unreadCount = ref(0)
const activeScene = ref('all')
const activeType = activeScene
const navStyle = getMiniProgramNavStyle()
const navRowStyle = getMiniProgramNavRowStyle({ leftPaddingRpx: 34, minRightPaddingRpx: 24 })
const navActionsStyle = getMiniProgramNavActionsStyle({ leftReserveRpx: 620 })
const contentTopStyle = getMiniProgramNavContentStyle({ gapRpx: 24 })

const sceneFilters = [
  { key: 'all', label: '全部', icon: 'sceneAll' },
  { key: 'food', label: '饭搭子', icon: 'sceneFood' },
  { key: 'sport', label: '运动', icon: 'sceneSport' },
  { key: 'study', label: '学习', icon: 'sceneStudy' },
  { key: 'game', label: '游戏', icon: 'sceneGame' },
  { key: 'fun', label: '娱乐', icon: 'sceneFun' },
  { key: 'project', label: '项目组队', icon: 'sceneProject' },
  { key: 'longterm', label: '长期搭子', icon: 'sceneLongterm' }
]

const filteredPosts = computed(() => {
  if (activeScene.value === 'all') return posts.value
  return posts.value.filter((item) => matchesScene(item, activeScene.value))
})

const unreadLabel = computed(() => (unreadCount.value > 99 ? '99+' : String(unreadCount.value)))

async function loadData() {
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

.feature-card {
  position: relative;
  min-height: 308rpx;
  overflow: hidden;
  border-radius: 36rpx;
  background: #dbeafe;
  box-shadow: 0 16rpx 36rpx rgba(35, 136, 255, 0.12);
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
    linear-gradient(180deg, rgba(13, 45, 92, 0.64), rgba(13, 45, 92, 0.3) 42%, rgba(9, 37, 90, 0.24) 100%),
    linear-gradient(135deg, rgba(35, 136, 255, 0.28), rgba(37, 99, 235, 0.1));
}

.feature-card__content {
  position: relative;
  z-index: 2;
  display: flex;
  min-height: 308rpx;
  flex-direction: column;
  justify-content: space-between;
  padding: 24rpx 24rpx 22rpx;
  color: #fff;
}

.feature-card__pill {
  align-self: flex-start;
  padding: 7rpx 12rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.14);
  border: 1rpx solid rgba(255, 255, 255, 0.14);
  font-size: 16rpx;
  font-weight: 950;
  backdrop-filter: blur(12px);
}

.feature-card__title-group {
  display: grid;
  gap: 2rpx;
  margin-top: 10rpx;
  max-width: 560rpx;
}

.feature-card__title-line {
  display: block;
  font-size: 31rpx;
  font-weight: 950;
  line-height: 1.08;
  text-shadow: 0 8rpx 20rpx rgba(7, 25, 59, 0.24);
}

.feature-card__title-line--strong {
  font-size: 36rpx;
}

.feature-card__desc {
  display: block;
  margin-top: 8rpx;
  max-width: 560rpx;
  color: rgba(255, 255, 255, 0.82);
  font-size: 18rpx;
  font-weight: 850;
  line-height: 1.36;
  text-shadow: 0 8rpx 20rpx rgba(7, 25, 59, 0.18);
}

.feature-card__stats-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-top: 12rpx;
}

.feature-card__stat-chip {
  display: inline-flex;
  min-height: 42rpx;
  align-items: center;
  justify-content: center;
  padding: 0 14rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.96);
  border: 1rpx solid rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(12px);
  box-shadow: 0 8rpx 20rpx rgba(11, 51, 122, 0.14);
}

.feature-card__stat-chip-text {
  color: #274d8f;
  font-size: 16rpx;
  font-weight: 900;
  line-height: 1;
}

.feature-card__stat-chip-num {
  color: #102033;
  font-size: 18rpx;
  font-weight: 950;
  line-height: 1;
  vertical-align: baseline;
}

.section-title {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20rpx;
  margin: 18rpx 0 8rpx;
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

.section-title--inline {
  margin-bottom: 6rpx;
}

.scene-scroll-row {
  margin-top: 16rpx;
  margin-right: -34rpx;
  margin-left: -34rpx;
  white-space: nowrap;
}

.scene-scroll-row__inner {
  display: inline-flex;
  gap: 14rpx;
  padding: 0 34rpx 4rpx;
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
  gap: 18rpx;
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
