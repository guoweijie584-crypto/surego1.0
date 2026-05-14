<template>
  <view v-if="isPageLoading" class="detail su-page">
    <SuPageLoading :style="contentTopStyle" text="活动详情加载中..." />
  </view>
  <view v-else class="detail su-page">
    <scroll-view scroll-y class="detail__scroll">
      <view class="detail-cover">
        <image class="detail-cover__image" :src="activity.image" mode="aspectFill" />
        <view class="detail-cover__shade" />
        <view class="detail-cover__top" :style="navRowStyle">
          <view class="floating-back" @tap="goBackOrFallback('/pages/home/index')">返回</view>
          <view class="detail-cover__actions">
            <view @tap="showShare = true">
              <uni-icons type="redo" size="20" color="#fff" />
            </view>
            <view @tap="showMore = true">
              <uni-icons type="more-filled" size="20" color="#fff" />
            </view>
          </view>
        </view>
        <view class="detail-cover__body">
          <text class="pill" :class="{ 'pill--amber': isFull }">{{ isFull ? '满员候补中' : activityStatusMeta.label || '招募中' }}</text>
          <text class="detail-cover__title">{{ activity.title }}</text>
        </view>
      </view>

      <view class="detail__body">
        <view class="info-card priority">
          <view>
            <uni-icons type="calendar" size="18" color="#2388ff" />
            <text>{{ activity.date }} {{ activity.time }}</text>
            <text>{{ countdownText }}</text>
          </view>
          <view @tap="openLocation">
            <uni-icons type="location" size="18" color="#2388ff" />
            <text>{{ activity.location }}</text>
            <text>{{ activity.distance ? `${activity.distance}km` : '查看集合地点' }}</text>
          </view>
          <view>
            <uni-icons type="personadd" size="18" color="#2388ff" />
            <text>{{ participantText }}</text>
            <text>{{ seatsLeftText }}</text>
          </view>
        </view>

        <view class="info-card">
          <view class="section-title">
            <text>谁适合来</text>
          </view>
          <view class="question-list">
            <text v-for="item in detailTags" :key="item">{{ item }}</text>
          </view>
        </view>

        <view class="info-card">
          <view class="section-title">
            <text>详细碰头说明</text>
          </view>
          <text class="card-copy">{{ meetupText }}</text>
        </view>

        <view class="rule-card">
          <view>
            <text>报名与费用规则</text>
            <text>{{ mode.label }}</text>
          </view>
          <text>{{ refundRuleText }}</text>
          <text class="pill pill--blue">{{ mode.desc }}</text>
        </view>

        <view class="credit-card">
          <uni-icons type="auth-filled" size="30" color="#2388ff" />
          <view>
            <text>信用与安全提示</text>
            <text>报名成功后请按时到场，核销记录会影响后续活动和搭子匹配。</text>
          </view>
        </view>

        <view class="info-card">
          <view class="section-title">
            <text>报名问答</text>
          </view>
          <view class="question-list">
            <text v-for="question in detailQuestions" :key="question">{{ question }}</text>
          </view>
        </view>

        <view class="info-card">
          <view class="section-title section-title--inline">
            <text>大家问过</text>
            <text @tap="showComingSoon('提问功能正在接入')">提问</text>
          </view>
          <view v-for="item in faqList" :key="item.q" class="faq-item">
            <text>{{ item.q }}</text>
            <text>{{ item.a }}</text>
          </view>
        </view>

        <view class="info-card">
          <view class="section-title">
            <text>成行后怎么联系</text>
          </view>
          <text class="card-copy">报名成功并被发起人确认后，可以在我的页查看群二维码或个人二维码。</text>
          <text class="pill pill--blue">通过后再联系</text>
        </view>

        <view class="organizer-card" @tap="openOrganizerProfile">
          <image class="organizer-card__avatar" :src="activity.organizerAvatar" mode="aspectFill" />
          <view>
            <text>{{ activity.organizer }}</text>
            <text>{{ organizerSubText }}</text>
          </view>
          <uni-icons type="right" size="18" color="#94a3b8" />
        </view>
      </view>
    </scroll-view>

    <view class="bottom-cta su-safe-bottom">
      <view class="primary-button" :class="{ 'primary-button--disabled': primaryDisabled }" @tap="handlePrimaryAction">
        <text>{{ primaryButtonText }}</text>
      </view>
      <view class="secondary-button" @tap="openOrganizerProfile">看发起人</view>
    </view>

    <SuActionSheet v-model="showShare" title="分享活动 / SHARE">
      <view class="sheet-grid">
        <button class="sheet-item" open-type="share">微信</button>
        <view class="sheet-item" @tap="copySharePath">复制链接</view>
        <view class="sheet-item" @tap="openPoster">生成海报</view>
        <view class="sheet-item" @tap="showComingSoon('朋友圈分享需小程序转发能力')">朋友圈</view>
      </view>
    </SuActionSheet>

    <SuActionSheet v-model="showMore" title="更多操作 / MORE">
      <view class="more-list">
        <view class="more-list__item more-list__item--danger" @tap="submitActivityReport">举报该活动</view>
        <textarea
          v-model="reportReason"
          class="more-report__textarea"
          maxlength="120"
          placeholder="请填写举报理由，例如内容违规、活动异常等"
          placeholder-class="more-report__placeholder"
        />
        <view class="more-list__item" @tap="toastAndClose('已减少类似推荐')">不喜欢这类内容</view>
        <view class="more-list__item" @tap="toastAndClose('成行平台 v1.0')">关于成行平台</view>
      </view>
    </SuActionSheet>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onPullDownRefresh, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'
import SuActionSheet from '@/components/surego/SuActionSheet.vue'
import SuPageLoading from '@/components/surego/SuPageLoading.vue'
import { getActivityDetail, getActivityStatusMeta } from '@/common/api/activity.js'
import { getApplicationForActivity } from '@/common/api/application.js'
import { listActivityMembers } from '@/common/api/member.js'
import { createReport } from '@/common/api/moderation.js'
import { createEmptyActivity } from '@/common/utils/activity-default.js'
import { makeRefreshHandler } from '@/common/utils/refresh.js'
import { getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goActivityRegister, goBackOrFallback, goManageDashboard, goParticipantDashboard, goSharePoster, goUserDetail, showComingSoon } from '@/common/utils/route.js'
import { buildActivitySharePath, buildActivitySharePayload } from '@/common/utils/share.js'

const activity = ref(createEmptyActivity('101'))
const showShare = ref(false)
const showMore = ref(false)
const reportReason = ref('')
const isPageLoading = ref(true)
const navStyle = getMiniProgramNavStyle()
const navRowStyle = getMiniProgramNavRowStyle({ leftPaddingRpx: 34, minRightPaddingRpx: 24 })
const contentTopStyle = getMiniProgramNavContentStyle({ gapRpx: 28 })

const activityStatusMeta = computed(() => getActivityStatusMeta(activity.value))
const isLeader = computed(() => activity.value.isCreator)
const isJoined = computed(() => activity.value.applicationStatus === 'approved' || isLeader.value)
const isTerminalActivity = computed(() => ['finished', 'cancelled', 'hidden', 'rejected'].includes(activityStatusMeta.value.key))
const isFull = computed(() => activity.value.hasParticipantLimit && Number(activity.value.participantCount || 0) >= Number(activity.value.maxParticipants || 0))
const primaryDisabled = computed(() => activity.value.applicationStatus === 'pending' || (isTerminalActivity.value && !isLeader.value))

const mode = computed(() => {
  if (activity.value.partyMode === 'sincerity') {
    return { label: `诚意金 ¥${activity.value.amount}`, desc: '签到后按规则退回' }
  }
  if (activity.value.partyMode === 'ticket') {
    return { label: `门票 ¥${activity.value.amount}`, desc: '支付后锁定席位' }
  }
  return { label: '免费局', desc: '免费参与' }
})
const detailTags = computed(() => {
  const base = [
    ...(activity.value.tags || []),
    activity.value.category,
    activity.value.requireApproval ? '发起人审核' : '直接报名',
    activity.value.hasParticipantLimit ? `${activity.value.maxParticipants} 人以内` : '不限人数'
  ]
  return [...new Set(base.filter(Boolean))].slice(0, 8)
})
const detailQuestions = computed(() => {
  const questions = activity.value.questions || []
  return questions.length ? questions : ['你为什么想参加这场活动？', '是否能按时到场？']
})
const faqList = computed(() => [
  { q: '临时有事可以退出吗？', a: activity.value.partyMode === 'free' ? '请尽早联系发起人，避免影响成行。' : '按费用规则处理，具体以活动说明为准。' },
  { q: '通过后怎么联系？', a: '通过后可在我的页或通知中心查看联系入口。' }
])
const meetupText = computed(() => activity.value.meetup || activity.value.description || '发起人会在报名通过后同步集合点和注意事项。')
const refundRuleText = computed(() => {
  if (activity.value.partyMode === 'sincerity') return '诚意金用于确认席位，到场核销后按规则退回；临时爽约会影响信用记录。'
  if (activity.value.partyMode === 'ticket') return '门票确认后保留名额，活动取消时进入退款流程。'
  return '本活动免费参与，请按时到场。若无法参加，请提前告知发起人。'
})
const participantText = computed(() => {
  if (!activity.value.hasParticipantLimit) return `${activity.value.participantCount || 0} 人已加入`
  return `${activity.value.participantCount}/${activity.value.maxParticipants} 已占位`
})
const seatsLeftText = computed(() => {
  if (!activity.value.hasParticipantLimit) return '开放报名中'
  const left = Math.max(0, Number(activity.value.maxParticipants || 0) - Number(activity.value.participantCount || 0))
  if (left <= 0) return '当前仅可候补'
  return `还差 ${left} 人成行`
})
const countdownText = computed(() => activity.value.dayOfWeek || '即将开始')
const organizerSubText = computed(() => `${activity.value.city || '本校'} · 发起人主页`)
const primaryButtonText = computed(() => {
  if (isLeader.value) return '进入活动管理'
  if (isTerminalActivity.value) return activityStatusMeta.value.label
  if (isJoined.value) return '查看到场凭证'
  if (activity.value.applicationStatus === 'pending') return '审核中'
  if (activity.value.applicationStatus === 'rejected') return '未通过'
  if (isFull.value) return '加入候补'
  if (activity.value.requireApproval) return '提交申请'
  if (activity.value.partyMode === 'free') return '立即报名'
  return '报名并支付'
})

onLoad(async (query) => {
  const id = (query && query.id) || '101'
  await loadData(id)
})

async function loadData(id = activity.value.id || '101') {
  isPageLoading.value = true
  try {
    const detail = await getActivityDetail(id)
    const application = await getApplicationForActivity(detail.id || id)
    activity.value = {
      ...detail,
      ...(application ? {
        application,
        applicationStatus: application.status || detail.applicationStatus,
        reviewNote: application.reviewNote || detail.reviewNote || '',
        rejectReason: application.rejectReason || detail.rejectReason || ''
      } : {})
    }
  } finally {
    isPageLoading.value = false
  }
}

onPullDownRefresh(makeRefreshHandler(() => loadData(activity.value.id || '101')))
onShareAppMessage(() => buildActivitySharePayload(activity.value))
onShareTimeline(() => buildActivitySharePayload(activity.value))

function openLocation() {
  const latitude = Number(activity.value.latitude || 0)
  const longitude = Number(activity.value.longitude || 0)
  if (!latitude || !longitude) {
    uni.showToast({ title: activity.value.location || '暂无地图坐标', icon: 'none' })
    return
  }
  uni.openLocation({
    latitude,
    longitude,
    name: activity.value.location,
    address: activity.value.address || activity.value.location
  })
}

function openOrganizerProfile() {
  goUserDetail(activity.value.creatorId || activity.value.creator_id, { activityId: activity.value.id })
}

function handlePrimaryAction() {
  if (primaryDisabled.value) return
  if (isLeader.value) {
    goManageDashboard(activity.value.id)
    return
  }
  if (isJoined.value) {
    goParticipantDashboard(activity.value.id)
    return
  }
  goActivityRegister(activity.value.id)
}

function copySharePath() {
  uni.setClipboardData({
    data: buildActivitySharePath(activity.value),
    success() {
      showShare.value = false
    }
  })
}

function openPoster() {
  showShare.value = false
  goSharePoster(activity.value.id)
}

async function submitActivityReport() {
  const note = reportReason.value.trim()
  if (!note) {
    uni.showToast({ title: '请填写举报理由', icon: 'none' })
    return
  }
  await createReport({
    activityId: activity.value.id,
    activityTitle: activity.value.title,
    reason: 'content',
    note
  })
  reportReason.value = ''
  showMore.value = false
  uni.showToast({ title: '举报已提交', icon: 'none' })
}

function toastAndClose(title) {
  uni.showToast({ title, icon: 'none' })
  showMore.value = false
}
</script>

<style scoped>
.detail { min-height: 100vh; padding-bottom: 170rpx; background: #f8f9f9; }
.detail__scroll { height: 100vh; }
.detail-cover { position: relative; min-height: 620rpx; overflow: hidden; background: #102033; }
.detail-cover__image, .detail-cover__shade { position: absolute; inset: 0; width: 100%; height: 100%; }
.detail-cover__shade { background: linear-gradient(180deg, rgba(16, 32, 51, 0.2), rgba(16, 32, 51, 0.84)); }
.detail-cover__top { position: relative; z-index: 2; display: flex; align-items: center; justify-content: space-between; }
.floating-back { display: flex; height: 68rpx; align-items: center; padding: 0 22rpx; border-radius: 999rpx; background: rgba(255, 255, 255, 0.18); color: #fff; font-size: 23rpx; font-weight: 950; backdrop-filter: blur(12px); }
.detail-cover__actions { display: flex; gap: 12rpx; }
.detail-cover__actions view { display: flex; width: 68rpx; height: 68rpx; align-items: center; justify-content: center; border-radius: 50%; background: rgba(255, 255, 255, 0.18); backdrop-filter: blur(12px); }
.detail-cover__body { position: absolute; right: 34rpx; bottom: 46rpx; left: 34rpx; z-index: 2; display: flex; flex-direction: column; gap: 18rpx; }
.detail-cover__title { color: #fff; font-size: 56rpx; font-weight: 950; line-height: 1.12; }
.pill { align-self: flex-start; padding: 11rpx 18rpx; border-radius: 999rpx; background: #dcfce7; color: #16a34a; font-size: 21rpx; font-weight: 950; }
.pill--amber { background: #fef3c7; color: #d97706; }
.pill--blue { margin-top: 20rpx; background: #dbeafe; color: #2563eb; }
.detail__body { display: flex; flex-direction: column; gap: 22rpx; padding: 24rpx 34rpx 40rpx; }
.info-card, .rule-card, .credit-card, .organizer-card { border: 1rpx solid rgba(24, 24, 27, 0.08); border-radius: 34rpx; background: #fff; box-shadow: 0 14rpx 36rpx rgba(15, 23, 42, 0.05); }
.info-card, .rule-card, .credit-card { padding: 30rpx; }
.priority { display: grid; gap: 18rpx; }
.priority view { display: grid; grid-template-columns: 40rpx 1fr; align-items: center; column-gap: 12rpx; padding-bottom: 18rpx; border-bottom: 1rpx solid #f1f5f9; }
.priority view:last-child { padding-bottom: 0; border-bottom: 0; }
.priority view text:nth-child(2) { color: #102033; font-size: 25rpx; font-weight: 950; }
.priority view text:nth-child(3) { grid-column: 2; margin-top: 6rpx; color: #94a3b8; font-size: 21rpx; font-weight: 850; }
.section-title { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18rpx; }
.section-title text:first-child { color: #102033; font-size: 31rpx; font-style: italic; font-weight: 950; }
.section-title--inline text:last-child { color: #2388ff; font-size: 23rpx; font-weight: 950; }
.question-list { display: flex; flex-wrap: wrap; gap: 12rpx; }
.question-list text { padding: 12rpx 18rpx; border-radius: 999rpx; background: #f3f6fa; color: #64748b; font-size: 22rpx; font-weight: 900; }
.card-copy, .rule-card > text:nth-child(2) { display: block; color: #64748b; font-size: 25rpx; font-weight: 800; line-height: 1.62; }
.rule-card { background: #eef7ff; }
.rule-card view text { display: block; }
.rule-card view text:first-child { color: #64748b; font-size: 21rpx; font-weight: 950; }
.rule-card view text:last-child { margin-top: 8rpx; color: #102033; font-size: 34rpx; font-style: italic; font-weight: 950; }
.rule-card > text:nth-child(2) { margin-top: 18rpx; }
.credit-card { display: grid; grid-template-columns: 58rpx 1fr; gap: 18rpx; align-items: flex-start; background: #fff; }
.credit-card text:first-child { display: block; color: #102033; font-size: 28rpx; font-weight: 950; }
.credit-card text:last-child { display: block; margin-top: 8rpx; color: #64748b; font-size: 22rpx; font-weight: 800; line-height: 1.5; }
.faq-item { padding: 20rpx 0; border-top: 1rpx solid #f1f5f9; }
.faq-item text:first-child { display: block; color: #102033; font-size: 24rpx; font-weight: 950; }
.faq-item text:last-child { display: block; margin-top: 8rpx; color: #64748b; font-size: 22rpx; font-weight: 800; line-height: 1.5; }
.organizer-card { display: grid; grid-template-columns: 94rpx 1fr 30rpx; gap: 20rpx; align-items: center; padding: 26rpx; }
.organizer-card__avatar { width: 94rpx; height: 94rpx; border-radius: 28rpx; background: #f1f5f9; }
.organizer-card view text:first-child { display: block; color: #102033; font-size: 30rpx; font-weight: 950; }
.organizer-card view text:last-child { display: block; margin-top: 8rpx; color: #94a3b8; font-size: 21rpx; font-weight: 850; }
.bottom-cta { position: fixed; right: 0; bottom: 0; left: 0; z-index: 40; display: grid; grid-template-columns: 1fr 190rpx; gap: 16rpx; padding: 22rpx 34rpx; background: rgba(255, 255, 255, 0.92); box-shadow: 0 -12rpx 36rpx rgba(15, 23, 42, 0.08); backdrop-filter: blur(18px); }
.primary-button, .secondary-button { display: flex; height: 88rpx; align-items: center; justify-content: center; border-radius: 999rpx; font-size: 25rpx; font-weight: 950; }
.primary-button { background: #2388ff; color: #fff; box-shadow: 0 16rpx 34rpx rgba(35, 136, 255, 0.28); }
.primary-button--disabled { background: #94a3b8; box-shadow: none; }
.secondary-button { border: 1rpx solid #e2e8f0; background: #fff; color: #102033; }
.sheet-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16rpx; }
.sheet-item { display: flex; min-height: 80rpx; align-items: center; justify-content: center; border-radius: 24rpx; background: #f3f6fa; color: #102033; font-size: 22rpx; font-weight: 950; }
.more-list { display: flex; flex-direction: column; gap: 18rpx; }
.more-list__item { min-height: 74rpx; color: #102033; font-size: 25rpx; font-weight: 950; }
.more-list__item--danger { color: #ef4444; }
.more-report__textarea { width: 100%; min-height: 160rpx; box-sizing: border-box; padding: 22rpx; border: 1rpx solid #e2e8f0; border-radius: 24rpx; background: #f8fafc; color: #102033; font-size: 24rpx; line-height: 1.5; }
.more-report__placeholder { color: #cbd5e1; }
</style>
