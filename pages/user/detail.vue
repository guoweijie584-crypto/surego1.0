<template>
  <view class="public-profile ref-page">
    <view class="ref-topbar" :style="navStyle">
      <view class="ref-topbar__row" :style="navRowStyle">
        <view class="ref-back" @tap="goBackOrFallback('/pages/partners/index')">
          <SuIcon name="left" size="44" glyph-size="22" variant="inline" color="#102033" />
        </view>
        <text class="ref-topbar__title">搭子主页</text>
        <view class="ref-icon-button">
          <SuIcon name="shield" size="40" glyph-size="20" variant="inline" color="#2388ff" />
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="ref-scroll ref-scroll--no-tab public-scroll" :style="contentTopStyle">
      <view class="ref-profile-card ref-card">
        <view class="ref-profile-card__top">
          <image class="ref-profile-card__avatar" :src="profile.avatar" mode="aspectFill" />
          <view class="ref-profile-card__body">
            <text class="ref-pill ref-pill--blue">天津大学 · 学信网增强认证</text>
            <text class="ref-profile-card__name">{{ profile.nickname }}</text>
            <text class="ref-profile-card__bio">
              {{ profile.bio || '硬核推理 / AI 黑客松 / 周末 Citywalk。' }}
            </text>
            <view class="ref-account-row">
              <view v-for="account in socialAccounts" :key="account.label" class="ref-account" :class="{ 'ref-account--active': account.active }">
                <SuIcon :name="account.icon" size="32" glyph-size="16" variant="inline" :color="account.active ? '#1d4ed8' : '#94a3b8'" />
                <text>{{ account.label }}</text>
              </view>
            </view>
          </view>
        </view>

        <view class="trust-strip">
          <view>
            <text>98.6%</text>
            <text>到场率</text>
          </view>
          <view>
            <text>{{ profile.activityCount || 0 }}</text>
            <text>成行</text>
          </view>
          <view>
            <text>{{ profile.hostedCount || 0 }}</text>
            <text>主办</text>
          </view>
          <view>
            <text>1.2%</text>
            <text>爽约率</text>
          </view>
        </view>
      </view>

      <view class="ref-bottom-cta public-actions">
        <view class="ref-primary" :class="{ 'ref-primary--dark': followed }" @tap="followed = !followed">{{ followed ? '已关注' : '关注 TA' }}</view>
        <view class="ref-secondary" @tap="openFirstActivity">看 TA 的局</view>
      </view>

      <view v-if="hasActivityContext" class="ref-info-card ref-card">
        <text class="ref-info-card__title">来自同一场活动</text>
        <text class="ref-info-card__text">你正在查看这位成员的公开 SureGo 名片。</text>
      </view>

      <view class="ref-info-card ref-card">
        <text class="ref-info-card__title">标签与印象</text>
        <view class="tag-list">
          <text v-for="item in tags" :key="item">{{ item }}</text>
        </view>
      </view>

      <view class="ref-info-card ref-card">
        <text class="ref-info-card__title">履历记录</text>
        <view v-if="recentActivities.length === 0" class="ref-empty">
          <SuIcon name="calendar" size="72" glyph-size="36" variant="inline" color="#cbd5e1" />
          <text>暂无公开活动</text>
        </view>
        <view v-for="item in recentActivities" :key="item.id" class="ref-record-row" @tap="openActivity(item)">
          <image :src="item.image" mode="aspectFill" />
          <view>
            <text class="su-line-1">{{ item.title }}</text>
            <text>{{ getActivityMeta(item) }}</text>
          </view>
        </view>
      </view>

      <view class="ref-info-card ref-card">
        <text class="ref-info-card__title">真实评价记录</text>
        <view class="review-list">
          <view v-for="item in reviews" :key="item.author" class="review-item">
            <view class="review-author">
              <view class="review-avatar">{{ item.author.slice(0, 1) }}</view>
              <view>
                <text>{{ item.author }}</text>
                <text>{{ item.source }}</text>
              </view>
            </view>
            <text>{{ item.content }}</text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import SuIcon from '@/components/surego/SuIcon.vue'
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { DEFAULT_USER_AVATAR } from '@/common/api/auth.js'
import { getUserProfileById } from '@/common/api/user.js'
import { getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goActivityDetail, goBackOrFallback } from '@/common/utils/route.js'

const userId = ref('')
const contextActivityId = ref('')
const followed = ref(false)
const profile = ref({
  nickname: '微信用户',
  avatar: DEFAULT_USER_AVATAR,
  credit: 100,
  mbti: '',
  bio: '',
  quote: '',
  activityCount: 0,
  hostedCount: 0,
  joinedCount: 0,
  recentActivities: []
})
const navStyle = getMiniProgramNavStyle()
const navRowStyle = getMiniProgramNavRowStyle({ leftPaddingRpx: 34, minRightPaddingRpx: 24 })
const contentTopStyle = getMiniProgramNavContentStyle({ gapRpx: 22 })

const hasActivityContext = computed(() => Boolean(contextActivityId.value))
const recentActivities = computed(() => Array.isArray(profile.value.recentActivities) ? profile.value.recentActivities : [])
const socialAccounts = computed(() => [
  { label: '小红书', icon: 'compose', active: true },
  { label: '抖音', icon: 'videocam-filled', active: false },
  { label: 'GitHub', icon: 'gear-filled', active: String(profile.value.nickname || '').includes('林') },
  { label: '微信', icon: 'chatboxes-filled', active: false }
])
const tags = computed(() => [
  profile.value.mbti || '规则清楚',
  '靠谱发起人',
  '准时',
  '推理爱好者',
  'AI 项目'
])
const reviews = [
  {
    author: '吴同学',
    source: '来自剧本杀局 · 3 天前',
    content: '集合点、费用和迟到规则都清楚。'
  },
  {
    author: '小周',
    source: '来自桌游局 · 上周',
    content: '现场节奏舒服，照顾新手，也没有临时改地点。'
  }
]

onLoad(async (query = {}) => {
  userId.value = String(query.id || query.userId || '')
  contextActivityId.value = String(query.activityId || '')
  if (!userId.value) {
    uni.showToast({ title: '未找到用户', icon: 'none' })
    return
  }
  const data = await getUserProfileById(userId.value)
  profile.value = {
    ...profile.value,
    ...data,
    avatar: data.avatar || DEFAULT_USER_AVATAR,
    nickname: data.nickname || '微信用户',
    recentActivities: Array.isArray(data.recentActivities) ? data.recentActivities : []
  }
})

function getActivityMeta(item = {}) {
  return [item.date, item.time, item.city || item.location].filter(Boolean).join(' · ') || '公开活动'
}

function openActivity(item = {}) {
  if (!item.id) return
  goActivityDetail(item.id)
}

function openFirstActivity() {
  if (recentActivities.value[0]?.id) {
    goActivityDetail(recentActivities.value[0].id)
    return
  }
  uni.showToast({ title: '暂无公开活动', icon: 'none' })
}
</script>

<style scoped>
.public-scroll {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.trust-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12rpx;
  margin-top: 28rpx;
}

.trust-strip view {
  min-width: 0;
  border-radius: 26rpx;
  background: #edf6ff;
  padding: 18rpx 10rpx;
  text-align: center;
}

.trust-strip text:first-child {
  display: block;
  color: #102033;
  font-size: 28rpx;
  font-weight: 950;
}

.trust-strip text:last-child {
  display: block;
  margin-top: 6rpx;
  color: #64748b;
  font-size: 19rpx;
  font-weight: 850;
}

.public-actions {
  margin-top: 0;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
}

.tag-list text {
  border-radius: 999rpx;
  background: #edf6ff;
  padding: 14rpx 18rpx;
  color: #3f3f46;
  font-size: 22rpx;
  font-weight: 900;
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
}

.review-item {
  border-top: 1rpx solid #edf2f7;
  padding-top: 22rpx;
}

.review-author {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.review-avatar {
  display: flex;
  width: 66rpx;
  height: 66rpx;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: linear-gradient(135deg, #dbeafe, #93c5fd);
  color: #0f4f9f;
  font-size: 24rpx;
  font-weight: 950;
}

.review-author text:first-child,
.review-author text:last-child,
.review-item > text {
  display: block;
}

.review-author text:first-child {
  color: #102033;
  font-size: 24rpx;
  font-weight: 950;
}

.review-author text:last-child {
  margin-top: 4rpx;
  color: #94a3b8;
  font-size: 20rpx;
  font-weight: 850;
}

.review-item > text {
  margin-top: 16rpx;
  color: #64748b;
  font-size: 23rpx;
  font-weight: 800;
  line-height: 1.55;
}
</style>
