<template>
  <view class="partner-workbench ref-page">
    <view class="manager-topbar" :style="navStyle">
      <view class="manager-topbar__row" :style="navRowStyle">
        <view class="exit-button" @tap="goBackOrFallback('/pages/user/profile')">
          <SuIcon name="left" size="36" glyph-size="18" variant="inline" color="#102033" />
          <text>退出</text>
        </view>
        <view class="manager-topbar__title">
          <text>申请管理</text>
          <text class="su-line-1">{{ partner.title || '当前搭子需求' }}</text>
        </view>
        <view class="ref-icon-button" @tap="goPartnerDetail(currentId)">
          <SuIcon name="arrowRight" size="38" glyph-size="19" variant="inline" color="#102033" />
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="ref-scroll ref-scroll--no-tab" :style="contentTopStyle">
      <view class="manager-summary ref-card">
        <view>
          <text>{{ partner.intentCount || intents.length }}</text>
          <text>感兴趣</text>
        </view>
        <view>
          <text>{{ pendingCount }}</text>
          <text>待处理</text>
        </view>
        <view>
          <text>{{ acceptedCount }}</text>
          <text>私聊中</text>
        </view>
        <view>
          <text>{{ partner.followCount || 0 }}</text>
          <text>关注</text>
        </view>
      </view>

      <scroll-view scroll-x class="ref-filter-row sticky-tabs" :show-scrollbar="false">
        <text v-for="item in tabs" :key="item.key" :class="{ active: activeTab === item.key }" @tap="activeTab = item.key">
          {{ item.label }}
        </text>
      </scroll-view>

      <view v-if="activeTab === 'intent'" class="ref-stack">
        <view v-if="intents.length === 0" class="ref-empty ref-card">
          <SuIcon name="people" size="84" glyph-size="42" variant="inline" color="#cbd5e1" />
          <text>意向申请已处理完</text>
        </view>
        <view v-for="item in intents" :key="item.id" class="applicant-card ref-card">
          <view class="organizer-line">
            <image class="intent-avatar" :src="item.avatar" mode="aspectFill" />
            <view>
              <text>{{ item.nickname || '意向同学' }}</text>
              <text>天津大学 · 成行记录 {{ item.joinedCount || 12 }} 次</text>
            </view>
            <text class="ref-pill" :class="intentPillClass(item.status)">{{ getIntentStatusLabel(item.status) }}</text>
          </view>
          <text class="applicant-card__msg">{{ item.message || '时间合适，想先确认节奏再决定是否进群。' }}</text>
          <view v-if="item.status === 'pending'" class="button-row">
            <view class="ref-secondary" @tap="reviewIntent(item, 'rejected')">拒绝</view>
            <view class="ref-primary" @tap="reviewIntent(item, 'accepted')">通过</view>
          </view>
        </view>
      </view>

      <view v-if="activeTab === 'chat'" class="ref-stack">
        <view v-if="acceptedIntents.length === 0" class="ref-empty ref-card">
          <SuIcon name="chat" size="84" glyph-size="42" variant="inline" color="#cbd5e1" />
          <text>先通过意向，再开始沟通</text>
        </view>
        <view
          v-for="item in acceptedIntents"
          :key="`chat-${item.id}`"
          class="ref-task-card"
          @tap="openConversation(item)"
        >
          <SuIcon name="chat" size="44" glyph-size="22" variant="inline" color="#2388ff" />
          <view class="ref-task-card__body">
            <text>和 {{ item.nickname || '已通过同学' }} 私聊</text>
            <text>{{ item.message || '继续确认时间、地点和加入节奏。' }}</text>
          </view>
          <SuIcon name="arrowRight" size="36" glyph-size="18" variant="inline" color="#94a3b8" />
        </view>
        <view v-if="acceptedIntents.length > 1" class="ref-task-card" @tap="openGroupConversation">
          <SuIcon name="people" size="44" glyph-size="22" variant="inline" color="#2388ff" />
          <view class="ref-task-card__body">
            <text>创建临时群聊</text>
            <text>把已通过的同学拉到一起，统一确认时间、地点和注意事项。</text>
          </view>
          <SuIcon name="arrowRight" size="36" glyph-size="18" variant="inline" color="#94a3b8" />
        </view>
      </view>

      <view v-if="activeTab === 'convert'" class="ref-stack">
        <view class="ref-info-card ref-card">
          <text class="ref-info-card__title">公开约人</text>
          <text class="ref-info-card__text">还想继续招人，就让同校同学也能报名或候补。</text>
          <view class="ref-primary convert-button" @tap="handleConvert({ visibility: 'public' })">继续公开招人</view>
        </view>
        <view class="ref-info-card ref-card">
          <text class="ref-info-card__title">只约已通过的人</text>
          <text class="ref-info-card__text">人已经够了，就只通知已通过的同学。</text>
          <view class="ref-primary convert-button" @tap="handleConvert({ visibility: 'members_only' })">只通知这些人</view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import SuIcon from '@/components/surego/SuIcon.vue'
import { computed, ref } from 'vue'
import { onLoad, onPullDownRefresh } from '@dcloudio/uni-app'
import { PARTNER_INTENT_STATUS_META, convertPartnerPostToActivity, ensurePartnerGroupConversation, getPartnerPostDetail, listPartnerIntents, updatePartnerIntentStatus } from '@/common/api/partner.js'
import { makeRefreshHandler } from '@/common/utils/refresh.js'
import { getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goBackOrFallback, goManageDashboard, goPartnerConversation, goPartnerDetail } from '@/common/utils/route.js'

const currentId = ref('')
const partner = ref({})
const intents = ref([])
const activeTab = ref('intent')
const navStyle = getMiniProgramNavStyle()
const navRowStyle = getMiniProgramNavRowStyle({ leftPaddingRpx: 34, minRightPaddingRpx: 24 })
const contentTopStyle = getMiniProgramNavContentStyle({ gapRpx: 20 })
const tabs = [
  { key: 'intent', label: '意向申请' },
  { key: 'chat', label: '私聊/群聊' },
  { key: 'convert', label: '约成活动' }
]
const pendingCount = computed(() => intents.value.filter((item) => item.status === 'pending').length)
const acceptedCount = computed(() => intents.value.filter((item) => item.status === 'accepted').length)
const acceptedIntents = computed(() => intents.value.filter((item) => item.status === 'accepted'))

async function loadData() {
  const [detail, items] = await Promise.all([
    getPartnerPostDetail(currentId.value),
    listPartnerIntents(currentId.value)
  ])
  partner.value = detail || {}
  intents.value = items
}

onLoad((options = {}) => {
  currentId.value = options.id || ''
  loadData()
})

onPullDownRefresh(makeRefreshHandler(loadData))

function getIntentStatusLabel(status) {
  return PARTNER_INTENT_STATUS_META[status]?.label || '待确认'
}

function intentPillClass(status) {
  if (status === 'accepted') return 'ref-pill--green'
  if (status === 'rejected') return 'ref-pill--amber'
  return 'ref-pill--blue'
}

async function reviewIntent(item, status) {
  await updatePartnerIntentStatus(item.id, status)
  uni.showToast({ title: '已处理', icon: 'success' })
  loadData()
}

function openConversation(item) {
  if (!item?.conversationId) {
    uni.showToast({ title: '私聊入口准备中', icon: 'none' })
    return
  }
  goPartnerConversation(item.conversationId)
}

async function openGroupConversation() {
  const participantIds = acceptedIntents.value
    .map((item) => item.userId || item.user_id)
    .filter(Boolean)
  const conversation = await ensurePartnerGroupConversation(currentId.value, participantIds)
  if (!conversation?.id) {
    uni.showToast({ title: '暂时无法创建群聊', icon: 'none' })
    return
  }
  goPartnerConversation(conversation.id)
}

async function handleConvert({ visibility }) {
  const participantIds = acceptedIntents.value
    .map((item) => item.userId || item.user_id)
    .filter(Boolean)
  const activity = await convertPartnerPostToActivity({
    partnerPostId: currentId.value,
    visibility,
    participantIds
  })
  if (!activity?.id) {
    uni.showToast({ title: '转活动失败', icon: 'none' })
    return
  }
  uni.showToast({ title: visibility === 'public' ? '已转为公开活动' : '已转为私密活动', icon: 'success' })
  goManageDashboard(activity.id, { replace: true })
}
</script>

<style scoped>
.manager-topbar {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 30;
  background: rgba(247, 248, 245, 0.9);
  backdrop-filter: blur(18px);
}

.manager-topbar__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
}

.exit-button {
  display: inline-flex;
  height: 70rpx;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 0 18rpx;
  border: 1rpx solid rgba(24, 24, 27, 0.08);
  border-radius: 999rpx;
  background: #fff;
  color: #102033;
  font-size: 22rpx;
  font-weight: 950;
}

.manager-topbar__title {
  min-width: 0;
  flex: 1;
  text-align: center;
}

.manager-topbar__title text:first-child {
  display: block;
  color: #64748b;
  font-size: 20rpx;
  font-weight: 950;
}

.manager-topbar__title text:last-child {
  display: block;
  margin-top: 4rpx;
  color: #102033;
  font-size: 30rpx;
  font-weight: 950;
}

.manager-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12rpx;
  padding: 24rpx;
}

.manager-summary view {
  min-width: 0;
  border-radius: 28rpx;
  background: #edf6ff;
  padding: 22rpx 12rpx;
  text-align: center;
}

.manager-summary text:first-child,
.manager-summary text:last-child {
  display: block;
}

.manager-summary text:first-child {
  color: #102033;
  font-size: 30rpx;
  font-weight: 950;
  line-height: 1.1;
}

.manager-summary text:last-child {
  margin-top: 8rpx;
  color: #64748b;
  font-size: 19rpx;
  font-weight: 850;
}

.sticky-tabs {
  position: sticky;
  top: 0;
  z-index: 10;
  margin-top: 24rpx;
  padding-top: 8rpx;
  background: rgba(247, 251, 255, 0.92);
  backdrop-filter: blur(18px);
}

.applicant-card {
  padding: 30rpx;
}

.organizer-line {
  display: flex;
  align-items: center;
  gap: 18rpx;
}

.intent-avatar {
  width: 76rpx;
  height: 76rpx;
  flex: 0 0 76rpx;
  border-radius: 50%;
  background: #edf2f7;
}

.organizer-line > view {
  min-width: 0;
  flex: 1;
}

.organizer-line > view text:first-child,
.organizer-line > view text:last-child {
  display: block;
}

.organizer-line > view text:first-child {
  color: #102033;
  font-size: 26rpx;
  font-weight: 950;
}

.organizer-line > view text:last-child {
  margin-top: 6rpx;
  color: #64748b;
  font-size: 21rpx;
  font-weight: 850;
}

.applicant-card__msg {
  display: block;
  margin-top: 22rpx;
  color: #64748b;
  font-size: 23rpx;
  font-weight: 800;
  line-height: 1.55;
}

.button-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18rpx;
  margin-top: 24rpx;
}

.convert-button {
  margin-top: 24rpx;
}
</style>
