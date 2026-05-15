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
              <SuIcon name="redo" size="40" glyph-size="20" variant="inline" color="#fff" />
            </view>
            <view @tap="showMore = true">
              <SuIcon name="more-filled" size="40" glyph-size="20" variant="inline" color="#fff" />
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
          <view class="priority-row">
            <SuIcon name="calendar" size="36" glyph-size="18" variant="inline" color="#2388ff" />
            <view class="priority-row__content">
              <text class="priority-row__primary">{{ activity.date }} {{ activity.time }}</text>
              <text class="priority-row__secondary">{{ countdownText }}</text>
            </view>
          </view>
          <view class="priority-row" @tap="openLocation">
            <SuIcon name="location" size="36" glyph-size="18" variant="inline" color="#2388ff" />
            <view class="priority-row__content">
              <text class="priority-row__primary">{{ activity.location }}</text>
              <text class="priority-row__secondary">{{ activity.distance ? `${activity.distance}km` : '查看集合地点' }}</text>
            </view>
          </view>
          <view class="priority-row">
            <SuIcon name="people" size="36" glyph-size="18" variant="inline" color="#2388ff" />
            <view class="priority-row__content">
              <text class="priority-row__primary">{{ participantText }}</text>
              <text class="priority-row__secondary">{{ seatsLeftText }}</text>
            </view>
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
          <text>碰头安排</text>
          </view>
          <text class="card-copy">{{ meetupText }}</text>
        </view>

        <view class="rule-card">
          <view>
          <text>报名与费用</text>
            <text>{{ mode.label }}</text>
          </view>
          <text>{{ refundRuleText }}</text>
          <text class="pill pill--blue">{{ mode.desc }}</text>
        </view>

        <view class="credit-card">
          <SuIcon name="shield" size="60" glyph-size="30" variant="inline" color="#2388ff" />
          <view>
          <text>信用与安全</text>
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
          <SuIcon name="arrowRight" size="36" glyph-size="18" variant="inline" color="#94a3b8" />
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
import SuIcon from '@/components/surego/SuIcon.vue'
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
  { q: '怎么联系？', a: '通知中心查看联系入口。' }
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
  if (activity.value.applicationStatus === 'invited') return '确认加入'
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
    const [application, memberGroups] = await Promise.all([
      getApplicationForActivity(detail.id),
      listActivityMembers(detail.id)
    ])
    activity.value = {
      ...detail,
      ...(application ? {
        applicationId: application.id,
        applicationStatus: application.status,
        reviewNote: application.reviewNote,
        rejectReason: application.rejectReason,
        paidAt: application.paidAt,
        orderId: application.orderId
      } : {}),
      memberCount: memberGroups.members.length,
      pendingCount: memberGroups.pending.length
    }
  } finally {
    isPageLoading.value = false
  }
}

onPullDownRefresh(makeRefreshHandler(() => loadData()))
onShareAppMessage(() => buildActivitySharePayload(activity.value))
onShareTimeline(() => buildActivitySharePayload(activity.value))

function handlePrimaryAction() {
  if (primaryDisabled.value) return
  if (isLeader.value) {
    goManageDashboard(activity.value.id)
    return
  }
  if (isJoined.value || ['pending', 'rejected'].includes(activity.value.applicationStatus)) {
    goParticipantDashboard(activity.value.id)
    return
  }
  goActivityRegister(activity.value.id)
}

function openLocation() {
  if (activity.value.latitude && activity.value.longitude) {
    uni.openLocation({
      latitude: Number(activity.value.latitude),
      longitude: Number(activity.value.longitude),
      name: activity.value.location || activity.value.title,
      address: activity.value.address || activity.value.location || ''
    })
    return
  }
  uni.showToast({ title: activity.value.location || '暂无地图坐标', icon: 'none' })
}

function openOrganizerProfile() {
  goUserDetail(activity.value.creatorId || activity.value.creator_id, { activityId: activity.value.id })
}

function copySharePath() {
  const path = buildActivitySharePath(activity.value)
  uni.setClipboardData({ data: path })
}

function openPoster() {
  showShare.value = false
  goSharePoster(activity.value.id)
}

async function submitActivityReport() {
  if (!reportReason.value.trim()) {
    uni.showToast({ title: '请填写举报理由', icon: 'none' })
    return
  }
  await createReport({
    targetType: 'activity',
    targetId: activity.value.id,
    reason: reportReason.value.trim()
  })
  reportReason.value = ''
  showMore.value = false
  uni.showToast({ title: '举报已提交', icon: 'none' })
}

function toastAndClose(title) {
  showMore.value = false
  uni.showToast({ title, icon: 'none' })
}
</script>

<style scoped>
.detail { min-height: 100vh; padding-bottom: 180rpx; background: #f8f9f9; }
.detail__scroll { height: 100vh; }
.detail-cover { position: relative; min-height: 560rpx; overflow: hidden; background: #102033; color: #fff; }
.detail-cover__image, .detail-cover__shade { position: absolute; inset: 0; width: 100%; height: 100%; }
.detail-cover__shade { background: linear-gradient(180deg, rgba(15, 23, 42, 0.1), rgba(15, 23, 42, 0.82)); }
.detail-cover__top { position: relative; z-index: 2; display: flex; align-items: center; justify-content: space-between; }
.floating-back, .detail-cover__actions view { display: flex; align-items: center; justify-content: center; border-radius: 999rpx; background: rgba(255, 255, 255, 0.18); backdrop-filter: blur(14px); }
.floating-back { height: 70rpx; padding: 0 22rpx; font-size: 23rpx; font-weight: 950; }
.detail-cover__actions { display: flex; gap: 14rpx; }
.detail-cover__actions view { width: 70rpx; height: 70rpx; }
.detail-cover__body { position: absolute; right: 34rpx; bottom: 44rpx; left: 34rpx; z-index: 2; }
.pill { display: inline-flex; align-self: flex-start; padding: 11rpx 18rpx; border-radius: 999rpx; background: #dcfce7; color: #047857; font-size: 22rpx; font-weight: 950; }
.pill--amber { background: #fef3c7; color: #b45309; }
.pill--blue { background: #eff6ff; color: #2388ff; }
.detail-cover__title { display: block; margin-top: 22rpx; color: #fff; font-size: 54rpx; font-weight: 950; line-height: 1.12; }
.detail__body { display: flex; flex-direction: column; gap: 22rpx; padding: 22rpx 20rpx 140rpx; }
.info-card, .rule-card, .credit-card, .organizer-card { border: 1rpx solid rgba(24, 24, 27, 0.08); border-radius: 32rpx; background: #fff; box-shadow: 0 12rpx 28rpx rgba(15, 23, 42, 0.04); }
.info-card { padding: 30rpx; }
.priority { display: flex; flex-direction: column; gap: 0; padding: 0 30rpx; }
.priority-row { display: flex; align-items: flex-start; gap: 14rpx; padding: 28rpx 0; border-bottom: 1rpx solid #eef2f7; }
.priority-row:last-child { border-bottom: 0; }
.priority-row__content { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 8rpx; }
.priority-row__primary { display: block; min-width: 0; color: #102033; font-size: 25rpx; font-weight: 950; line-height: 1.35; word-break: normal; overflow-wrap: break-word; }
.priority-row__secondary { display: block; min-width: 0; color: #94a3b8; font-size: 21rpx; font-weight: 850; line-height: 1.35; word-break: normal; overflow-wrap: break-word; }
.section-title { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18rpx; }
.section-title text:first-child { color: #102033; font-size: 31rpx; font-weight: 950; }
.section-title text:last-child { color: #2388ff; font-size: 22rpx; font-weight: 950; }
.question-list { display: flex; flex-wrap: wrap; gap: 12rpx; }
.question-list text { padding: 11rpx 18rpx; border-radius: 999rpx; background: #f1f5f9; color: #64748b; font-size: 22rpx; font-weight: 850; }
.card-copy { display: block; color: #64748b; font-size: 25rpx; font-weight: 850; line-height: 1.68; }
.rule-card { display: flex; flex-direction: column; gap: 18rpx; padding: 30rpx; }
.rule-card view text { display: block; }
.rule-card view text:first-child { color: #64748b; font-size: 22rpx; font-weight: 900; }
.rule-card view text:last-child { margin-top: 8rpx; color: #102033; font-size: 34rpx; font-weight: 950; }
.rule-card > text:nth-child(2) { color: #64748b; font-size: 24rpx; font-weight: 850; line-height: 1.6; }
.credit-card, .organizer-card { display: flex; align-items: center; gap: 18rpx; padding: 30rpx; }
.credit-card text { display: block; }
.credit-card text:first-child { color: #102033; font-size: 29rpx; font-weight: 950; }
.credit-card text:last-child { margin-top: 8rpx; color: #64748b; font-size: 23rpx; font-weight: 850; line-height: 1.55; }
.faq-item { padding: 20rpx 0; border-top: 1rpx solid #f1f5f9; }
.faq-item text { display: block; }
.faq-item text:first-child { color: #102033; font-size: 25rpx; font-weight: 950; }
.faq-item text:last-child { margin-top: 8rpx; color: #64748b; font-size: 23rpx; font-weight: 850; line-height: 1.55; }
.organizer-card__avatar { width: 86rpx; height: 86rpx; flex: 0 0 86rpx; border-radius: 50%; background: #e2e8f0; }
.organizer-card > view { flex: 1; min-width: 0; }
.organizer-card text { display: block; }
.organizer-card text:first-child { color: #102033; font-size: 27rpx; font-weight: 950; }
.organizer-card text:last-child { margin-top: 7rpx; color: #94a3b8; font-size: 22rpx; font-weight: 850; }
.bottom-cta { position: fixed; right: 0; bottom: 0; left: 0; z-index: 20; display: grid; grid-template-columns: 1fr 0.45fr; gap: 16rpx; padding: 22rpx 24rpx; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(18px); box-shadow: 0 -12rpx 34rpx rgba(15, 23, 42, 0.08); }
.primary-button, .secondary-button { display: flex; height: 86rpx; align-items: center; justify-content: center; border-radius: 999rpx; font-size: 25rpx; font-weight: 950; }
.primary-button { background: #2388ff; color: #fff; box-shadow: 0 16rpx 32rpx rgba(35, 136, 255, 0.26); }
.primary-button--disabled { background: #94a3b8; box-shadow: none; }
.secondary-button { border: 1rpx solid #dbeafe; background: #fff; color: #102033; }
.sheet-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16rpx; padding: 0 4rpx; }
.sheet-item { display: flex; height: 90rpx; align-items: center; justify-content: center; border: 1rpx solid #eef2f7; border-radius: 26rpx; background: #f8fafc; color: #102033; font-size: 25rpx; font-weight: 900; }
.more-list { display: flex; flex-direction: column; gap: 14rpx; }
.more-list__item { padding: 26rpx; border-radius: 26rpx; background: #f8fafc; color: #102033; font-size: 25rpx; font-weight: 900; }
.more-list__item--danger { background: #fee2e2; color: #dc2626; }
.more-report__textarea { width: 100%; min-height: 140rpx; box-sizing: border-box; padding: 22rpx; border-radius: 24rpx; background: #f8fafc; color: #102033; font-size: 24rpx; font-weight: 800; line-height: 1.5; }
.more-report__placeholder { color: #94a3b8; }
</style>
