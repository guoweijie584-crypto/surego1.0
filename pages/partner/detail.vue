<template>
  <view class="partner-detail su-page">
    <view class="detail__nav" :style="navStyle">
      <view class="detail__nav-row" :style="navRowStyle">
        <view class="detail__back" @tap="goBackOrFallback('/pages/partners/index')">
          <SuIcon name="left" size="48" glyph-size="24" variant="inline" color="#111827" />
        </view>
        <view v-if="partner.isCreator" class="detail__manage" @tap="goPartnerWorkbench(partner.id)">
          <SuIcon name="settings" size="34" glyph-size="17" variant="inline" color="#111827" />
          <text>管理</text>
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="detail__scroll" :style="contentTopStyle">
      <view v-if="!partner.id" class="detail__empty">
        <SuIcon name="info" size="84" glyph-size="42" variant="inline" color="#cbd5e1" />
        <text>搭子需求不存在或已下线</text>
      </view>
      <view v-else>
        <view class="detail__hero">
          <view class="detail__author">
            <image class="detail__avatar" :src="partner.avatar" mode="aspectFill" />
            <view>
              <text class="detail__name">{{ partner.author || partner.creator }}</text>
              <text class="detail__meta">{{ partner.school || `${partner.city} · 学生认证` }}</text>
            </view>
          </view>
          <text class="detail__title">{{ partner.title }}</text>
          <text class="detail__bio">{{ partner.detail || partner.description }}</text>
          <view class="detail__tags">
            <text v-for="tag in displayTags" :key="tag">{{ tag }}</text>
          </view>
        </view>

        <view class="detail__panel detail__panel--priority">
          <view>
            <SuIcon name="calendar" size="36" glyph-size="18" variant="inline" color="#2388ff" />
            <text>{{ partner.available || partner.schedule }}</text>
            <text>可约时间</text>
          </view>
          <view>
            <SuIcon name="location" size="36" glyph-size="18" variant="inline" color="#2388ff" />
            <text>{{ partner.locationRange || partner.location }}</text>
            <text>地点范围</text>
          </view>
          <view>
            <SuIcon name="people" size="36" glyph-size="18" variant="inline" color="#2388ff" />
            <text>{{ partner.interested || partner.intentCount }} 人感兴趣</text>
            <text>对方会先看申请，再决定是否联系</text>
          </view>
        </view>

        <view class="detail__panel">
          <text class="detail__panel-title">需求详情</text>
          <text class="detail__copy">{{ partner.detail || partner.description }}</text>
        </view>

        <view class="detail__panel">
          <text class="detail__panel-title">希望对方</text>
          <text class="detail__copy">{{ partner.expectation }}</text>
          <view v-if="displayWants.length" class="detail__tags detail__tags--inline">
            <text v-for="tag in displayWants" :key="tag">{{ tag }}</text>
          </view>
        </view>

        <view class="rule-card">
          <view>
            <text>怎么联系</text>
            <text>{{ connectionHelp }}</text>
          </view>
          <text>{{ partner.connectionRule || partner.connectionMode }}</text>
          <text class="rule-card__pill">聊清楚后再一起约时间</text>
        </view>

        <view class="partner-action-grid">
          <view class="partner-action partner-action--primary" @tap="handleFollow">
            <SuIcon name="sceneAll" size="34" glyph-size="17" variant="inline" color="#fff" />
            <text>关注</text>
          </view>
          <view class="partner-action" @tap="handlePrivateChat">
            <SuIcon name="chat" size="34" glyph-size="17" variant="inline" color="#102033" />
            <text>私聊</text>
          </view>
          <view class="partner-action" @tap="handleGroupChat">
            <SuIcon name="people" size="34" glyph-size="17" variant="inline" color="#102033" />
            <text>群聊</text>
          </view>
          <view class="partner-action partner-action--primary" @tap="partner.isCreator ? goPartnerWorkbench(partner.id) : handleIntent()">
            <text>{{ primaryActionText }}</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <view v-if="partner.id" class="detail__bar su-safe-bottom">
      <view class="detail__secondary" @tap="handleFollow">
        <SuIcon name="heart" size="40" glyph-size="20" variant="inline" color="#111827" />
        <text>关注</text>
      </view>
      <view class="detail__primary" @tap="partner.isCreator ? goPartnerWorkbench(partner.id) : handleIntent()">
        <text>{{ partner.isCreator ? '进入工作台' : '发送意向' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import SuIcon from '@/components/surego/SuIcon.vue'
import { computed, ref } from 'vue'
import { onLoad, onPullDownRefresh } from '@dcloudio/uni-app'
import { createPartnerIntent, followPartnerPost, getPartnerPostDetail } from '@/common/api/partner.js'
import { makeRefreshHandler } from '@/common/utils/refresh.js'
import { getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goBackOrFallback, goPartnerWorkbench, guardLoginAction, showComingSoon } from '@/common/utils/route.js'

const partner = ref({})
const currentId = ref('')
const navStyle = getMiniProgramNavStyle()
const navRowStyle = getMiniProgramNavRowStyle({ leftPaddingRpx: 34, minRightPaddingRpx: 24 })
const contentTopStyle = getMiniProgramNavContentStyle({ gapRpx: 18 })
const displayTags = computed(() => {
  const tags = Array.isArray(partner.value.fitTags) && partner.value.fitTags.length
    ? partner.value.fitTags
    : partner.value.tags || []
  return (Array.isArray(tags) ? tags : []).filter(Boolean).slice(0, 4)
})
const displayWants = computed(() => (
  (Array.isArray(partner.value.wants) ? partner.value.wants : []).filter(Boolean).slice(0, 4)
))
const connectionHelp = computed(() => {
  if (partner.value.type === 'long_term') return '先申请认识，合适后稳定约'
  if (partner.value.type === 'project') return '先看角色和投入时间，再确认组队'
  return '先约一次，确认合适再继续'
})
const primaryActionText = computed(() => {
  if (partner.value.isCreator) return '进入工作台'
  if (partner.value.type === 'long_term') return '申请认识'
  if (partner.value.type === 'project') return '申请加入'
  return '提交意向'
})

async function loadData() {
  partner.value = await getPartnerPostDetail(currentId.value) || {}
}

onLoad((options = {}) => {
  currentId.value = options.id || ''
  loadData()
})

onPullDownRefresh(makeRefreshHandler(loadData))

async function handleIntent() {
  if (!partner.value.id) return
  if (!guardLoginAction(`/pages/partner/detail?id=${encodeURIComponent(partner.value.id)}`, { replace: true })) return
  await createPartnerIntent({
    partnerPostId: partner.value.id,
    creatorId: partner.value.creatorId,
    message: '我对这个搭子计划感兴趣'
  })
  uni.showToast({ title: '意向已发送', icon: 'success' })
  loadData()
}

async function handleFollow() {
  if (!partner.value.id) return
  if (!guardLoginAction(`/pages/partner/detail?id=${encodeURIComponent(partner.value.id)}`, { replace: true })) return
  await followPartnerPost(partner.value.id)
  uni.showToast({ title: '已关注', icon: 'success' })
}

function handlePrivateChat() {
  if (!partner.value.id) return
  if (!guardLoginAction(`/pages/partner/detail?id=${encodeURIComponent(partner.value.id)}`, { replace: true })) return
  showComingSoon('通过意向后开放私聊')
}

function handleGroupChat() {
  if (!partner.value.id) return
  if (!guardLoginAction(`/pages/partner/detail?id=${encodeURIComponent(partner.value.id)}`, { replace: true })) return
  showComingSoon('通过意向后可拉临时群')
}
</script>

<style scoped>
.partner-detail { min-height: 100vh; padding-bottom: 180rpx; background: #f8f9f9; }
.detail__nav { position: fixed; top: 0; right: 0; left: 0; z-index: 30; background: rgba(248, 249, 249, 0.84); backdrop-filter: blur(18px); }
.detail__nav-row { display: flex; align-items: center; justify-content: space-between; }
.detail__back, .detail__manage { display: flex; height: 72rpx; align-items: center; justify-content: center; border: 1rpx solid #eef2f7; background: #fff; box-shadow: 0 12rpx 28rpx rgba(15, 23, 42, 0.06); }
.detail__back { width: 72rpx; border-radius: 50%; }
.detail__manage { gap: 8rpx; padding: 0 22rpx; border-radius: 999rpx; color: #111827; font-size: 21rpx; font-weight: 900; }
.detail__scroll { height: 100vh; }
.detail__hero { margin: 0 34rpx 24rpx; padding: 34rpx; border-radius: 42rpx; background: linear-gradient(135deg, #ffffff, #edf6ff); color: #111827; box-shadow: 0 22rpx 54rpx rgba(15, 23, 42, 0.08); }
.detail__author { display: flex; align-items: center; gap: 16rpx; }
.detail__avatar { width: 78rpx; height: 78rpx; border: 4rpx solid rgba(255, 255, 255, 0.28); border-radius: 50%; background: #f1f5f9; }
.detail__name { display: block; color: #102033; font-size: 26rpx; font-weight: 900; }
.detail__meta { display: block; margin-top: 6rpx; color: #64748b; font-size: 20rpx; font-weight: 800; }
.detail__title { display: block; margin-top: 34rpx; color: #102033; font-size: 45rpx; font-weight: 900; line-height: 1.24; }
.detail__bio { display: block; margin-top: 18rpx; color: #64748b; font-size: 24rpx; font-weight: 800; line-height: 1.52; }
.detail__tags { display: flex; flex-wrap: wrap; gap: 12rpx; margin-top: 28rpx; }
.detail__tags--inline { margin-top: 20rpx; }
.detail__tags text { padding: 9rpx 16rpx; border-radius: 999rpx; background: #f3f6fa; color: #64748b; font-size: 20rpx; font-weight: 900; }
.detail__panel { margin: 0 34rpx 22rpx; padding: 30rpx; border: 1rpx solid #eef2f7; border-radius: 34rpx; background: #fff; box-shadow: 0 16rpx 42rpx rgba(15, 23, 42, 0.05); }
.detail__panel--priority { display: grid; gap: 18rpx; }
.detail__panel--priority view { display: grid; grid-template-columns: 38rpx 1fr; column-gap: 12rpx; align-items: center; padding-bottom: 18rpx; border-bottom: 1rpx solid #f1f5f9; }
.detail__panel--priority view:last-child { padding-bottom: 0; border-bottom: 0; }
.detail__panel--priority view text:nth-child(2) { color: #102033; font-size: 25rpx; font-weight: 900; }
.detail__panel--priority view text:nth-child(3) { grid-column: 2; margin-top: 5rpx; color: #94a3b8; font-size: 21rpx; font-weight: 800; line-height: 1.35; }
.detail__panel-title { display: block; color: #111827; font-size: 29rpx; font-weight: 900; }
.detail__copy { display: block; margin-top: 16rpx; color: #64748b; font-size: 25rpx; font-weight: 800; line-height: 1.6; }
.detail__grid { display: grid; gap: 18rpx; margin-top: 20rpx; }
.detail__grid-item { display: flex; justify-content: space-between; gap: 24rpx; padding-bottom: 18rpx; border-bottom: 1rpx solid #f1f5f9; }
.detail__grid-item:last-child { padding-bottom: 0; border-bottom: 0; }
.detail__grid-item text:first-child { flex: 0 0 150rpx; color: #94a3b8; font-size: 22rpx; font-weight: 900; }
.detail__grid-item text:last-child { flex: 1; color: #111827; font-size: 24rpx; font-weight: 900; text-align: right; }
.detail__empty { display: flex; flex-direction: column; align-items: center; gap: 16rpx; padding: 180rpx 0; color: #94a3b8; font-size: 24rpx; font-weight: 900; }
.rule-card { margin: 0 34rpx 22rpx; padding: 30rpx; border: 1rpx solid rgba(35, 136, 255, 0.18); border-radius: 34rpx; background: #eef7ff; box-shadow: 0 16rpx 42rpx rgba(35, 136, 255, 0.08); }
.rule-card view { display: flex; flex-direction: column; gap: 8rpx; }
.rule-card view text:first-child { color: #64748b; font-size: 21rpx; font-weight: 900; }
.rule-card view text:last-child { color: #102033; font-size: 30rpx; font-weight: 900; line-height: 1.3; }
.rule-card > text:nth-child(2) { display: block; margin-top: 18rpx; color: #64748b; font-size: 24rpx; font-weight: 800; line-height: 1.55; }
.rule-card__pill { display: inline-flex !important; margin-top: 20rpx !important; padding: 10rpx 18rpx; border-radius: 999rpx; background: #2388ff; color: #fff !important; font-size: 21rpx !important; font-weight: 900 !important; }
.partner-action-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16rpx; margin: 0 34rpx 40rpx; }
.partner-action { display: flex; height: 82rpx; align-items: center; justify-content: center; gap: 8rpx; border: 1rpx solid #e2e8f0; border-radius: 999rpx; background: #fff; color: #102033; font-size: 24rpx; font-weight: 900; }
.partner-action--primary { border-color: #2388ff; background: #2388ff; color: #fff; box-shadow: 0 14rpx 30rpx rgba(35, 136, 255, 0.22); }
.detail__bar { position: fixed; right: 0; bottom: 0; left: 0; z-index: 40; display: flex; gap: 18rpx; padding: 22rpx 34rpx; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(18px); box-shadow: 0 -12rpx 36rpx rgba(15, 23, 42, 0.08); }
.detail__secondary, .detail__primary { display: flex; height: 86rpx; align-items: center; justify-content: center; border-radius: 999rpx; font-size: 25rpx; font-weight: 900; }
.detail__secondary { width: 190rpx; gap: 8rpx; border: 1rpx solid #e2e8f0; color: #111827; background: #fff; }
.detail__primary { flex: 1; color: #fff; background: #ff6b6b; box-shadow: 0 16rpx 34rpx rgba(255, 107, 107, 0.28); }
</style>
