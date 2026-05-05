<template>
  <view class="manage su-page">
    <view class="manage__nav" :style="navStyle">
      <view class="manage__nav-row" :style="navRowStyle">
      <view class="manage__back" @tap="handleBack">
        <uni-icons type="left" size="24" color="#fff" />
      </view>
      <text>局面管理</text>
      <view class="manage__back" @tap="goActivityEdit(activity.id)">
        <uni-icons type="gear-filled" size="22" color="#fff" />
      </view>
      </view>
    </view>

    <scroll-view scroll-y class="manage__scroll" :scroll-top="scrollTop" scroll-with-animation :style="contentTopStyle">
      <view class="manage__hero">
        <text class="manage__kicker">COMMAND CENTER</text>
        <text class="manage__title">{{ activity.title }}</text>
        <text class="manage__meta">{{ activity.date }} {{ activity.time }} · {{ activity.location }}</text>
      </view>

      <view class="stats">
        <view class="stat">
          <text>参与人数</text>
          <text>{{ activity.participantCount }}/{{ activity.maxParticipants }}</text>
        </view>
        <view class="stat stat--blue">
          <text>待审申请</text>
          <text>{{ pendingCount }}</text>
        </view>
        <view class="stat stat--green">
          <text>浏览</text>
          <text>{{ activity.viewCount }}</text>
        </view>
      </view>

      <view class="panel state-panel">
        <view class="panel__head">
          <view>
            <text>活动状态</text>
            <text>{{ lifecycleLabel }}</text>
          </view>
          <text>LIFECYCLE</text>
        </view>
        <view class="state-summary">
          <view>
            <text>当前状态</text>
            <text>{{ lifecycleLabel }}</text>
          </view>
          <view>
            <text>运营审核</text>
            <text>{{ moderationLabel }}</text>
          </view>
        </view>
        <text class="state-hint">{{ lifecycleHint }}</text>
        <view v-if="availableLifecycleActions.length" class="state-action-list">
          <view
            v-for="item in availableLifecycleActions"
            :key="item.key"
            class="state-action"
            :class="{ 'state-action--danger': item.tone === 'danger' }"
            @tap="handleLifecycleAction(item)"
          >
            <text>{{ item.label }}</text>
            <text>{{ item.desc }}</text>
          </view>
        </view>
        <view v-else class="state-readonly">
          <text>当前状态暂时没有可执行动作</text>
        </view>
      </view>

      <view class="panel">
        <view class="panel__head">
          <text>快捷操作</text>
          <text>OPERATIONS</text>
        </view>
        <view class="action-grid">
          <view v-for="item in actions" :key="item.title" class="action" @tap="handleAction(item)">
            <view :class="['action__icon', item.tone]">
              <uni-icons :type="item.icon" size="24" color="#fff" />
            </view>
            <text>{{ item.title }}</text>
            <text>{{ item.desc }}</text>
          </view>
        </view>
      </view>

      <view id="manage-applications" class="panel">
        <view class="panel__head">
          <text>申请队列</text>
          <text>{{ applications.length }} REQUESTS</text>
        </view>
        <view v-if="applications.length === 0" class="empty">
          <uni-icons type="personadd-filled" size="38" color="#cbd5e1" />
          <text>暂无新的申请，等风来。</text>
        </view>
        <view v-for="item in applications" :key="item.id" class="applicant">
          <view class="applicant__avatar" @tap.stop="goUserDetail(item.userId || item.user_id, { activityId: activity.id })">{{ getInitial(item) }}</view>
          <view class="applicant__content">
            <view class="applicant__line">
              <text class="applicant__name">申请者</text>
              <text class="applicant__status" :class="`applicant__status--${item.status}`">
                {{ getApplicationStatusLabel(item.status) }}
              </text>
            </view>
            <text class="applicant__msg su-line-2">{{ item.message || '想加入这场活动' }}</text>
            <view v-if="item.answers && item.answers.length" class="answer-list">
              <view v-for="answer in item.answers" :key="answer.question" class="answer">
                <text>{{ answer.question }}</text>
                <text>{{ answer.answer }}</text>
              </view>
            </view>
            <text v-if="item.reviewNote" class="applicant__review">{{ item.reviewNote }}</text>
            <text v-if="item.rejectReason" class="applicant__review applicant__review--danger">{{ item.rejectReason }}</text>
          </view>
          <view v-if="item.status === 'pending'" class="applicant__buttons">
            <view @tap="openReview(item, 'approved')">通过</view>
            <view @tap="openReview(item, 'rejected')">拒绝</view>
          </view>
        </view>
      </view>
    </scroll-view>

    <SuActionSheet v-model="showReviewSheet" :title="reviewMode === 'approved' ? '通过申请' : '拒绝申请'">
      <view class="review-sheet">
        <textarea
          v-model="reviewForm.note"
          class="review-sheet__textarea"
          :placeholder="reviewMode === 'approved' ? '给参与者留一句欢迎提示' : '填写拒绝原因，参与者可在凭证页查看'"
          maxlength="120"
          fixed="true"
          adjust-position="false"
          cursor-spacing="28"
        />
        <view class="review-sheet__button" @tap="submitReview">
          {{ reviewMode === 'approved' ? '确认通过' : '确认拒绝' }}
        </view>
      </view>
    </SuActionSheet>

    <SuActionSheet v-model="showTicketSheet" title="票券与保证金">
      <view class="ticket-sheet">
        <view class="ticket-summary">
          <view v-for="item in ticketStats" :key="item.label">
            <text>{{ item.value }}</text>
            <text>{{ item.label }}</text>
          </view>
        </view>
        <view v-if="ticketOrders.length === 0" class="ticket-empty">暂无票券订单</view>
        <view v-for="item in ticketOrders" :key="item.id" class="ticket-order">
          <view>
            <text>{{ item.type === 'ticket' ? '门票' : '诚意金' }} ¥{{ item.amount }}</text>
            <text>{{ item.activityTitle || activity.title }}</text>
          </view>
          <text :class="`ticket-order__status ticket-order__status--${item.status}`">{{ getOrderStatusText(item.status) }}</text>
        </view>
      </view>
    </SuActionSheet>
  </view>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import { onLoad, onPullDownRefresh } from '@dcloudio/uni-app'
import SuActionSheet from '@/components/surego/SuActionSheet.vue'
import { getActivityDetail, getAllowedActivityStatusTransitions, updateActivityStatus } from '@/common/api/activity.js'
import { listApplications, reviewApplication } from '@/common/api/application.js'
import { createMessage } from '@/common/api/message.js'
import { getOrderStatusText, listOrdersByActivity } from '@/common/api/order.js'
import { createEmptyActivity } from '@/common/utils/activity-default.js'
import { makeRefreshHandler } from '@/common/utils/refresh.js'
import { getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goActivityDetail, goActivityEdit, goBackOrFallback, goManageCheckin, goMessages, goUserDetail, showComingSoon } from '@/common/utils/route.js'

const activityId = ref('103')
const activity = ref(createEmptyActivity('103'))
const applications = ref([])
const ticketOrders = ref([])
const scrollTop = ref(0)
const showReviewSheet = ref(false)
const showTicketSheet = ref(false)
const reviewTarget = ref(null)
const reviewMode = ref('approved')
const reviewForm = ref({ note: '' })
const navStyle = getMiniProgramNavStyle()
const navRowStyle = getMiniProgramNavRowStyle({ leftPaddingRpx: 34, minRightPaddingRpx: 24 })
const contentTopStyle = getMiniProgramNavContentStyle({ gapRpx: 20 })

const actions = [
  { title: '审核申请', desc: '处理待加入成员', icon: 'personadd-filled', tone: 'action__icon--blue', key: 'review' },
  { title: '发群通知', desc: '同步集合信息', icon: 'chatboxes-filled', tone: 'action__icon--green', key: 'message' },
  { title: '签到核销', desc: '现场确认到场', icon: 'scan', tone: 'action__icon--dark', key: 'checkin' },
  { title: '票券设置', desc: '金额与规则', icon: 'wallet-filled', tone: 'action__icon--rose', key: 'ticket' }
]

const lifecycleActions = [
  { key: 'draft', label: '草稿', desc: '仅自己可见' },
  { key: 'reviewing', label: '审核中', desc: '等待平台确认' },
  { key: 'published', label: '已发布', desc: '可被浏览' },
  { key: 'recruiting', label: '报名中', desc: '开放申请' },
  { key: 'formed', label: '已成局', desc: '名额锁定' },
  { key: 'ongoing', label: '进行中', desc: '现场进行' },
  { key: 'finished', label: '已结束', desc: '等待复盘' },
  { key: 'cancelled', label: '已取消', desc: '停止报名' }
]

const lifecycleLabels = {
  draft: '草稿',
  reviewing: '审核中',
  published: '已发布',
  recruiting: '报名中',
  formed: '已成局',
  ongoing: '进行中',
  finished: '已结束',
  cancelled: '已取消'
}
const moderationLabels = {
  pending: '待运营审核',
  approved: '运营已通过',
  visible: '运营已通过',
  rejected: '运营已驳回',
  hidden: '运营已下架'
}
const lifecycleActionCopy = {
  reviewing: { key: 'reviewing', label: '提交审核', desc: '进入平台审核，审核通过后公开报名' },
  draft: { key: 'draft', label: '撤回编辑', desc: '从审核中撤回，活动仅自己可见' },
  formed: { key: 'formed', label: '确认成局', desc: '锁定名额，准备现场组织' },
  cancelled: { key: 'cancelled', label: '取消活动', desc: '停止报名并保留记录', tone: 'danger', confirm: true },
  ongoing: { key: 'ongoing', label: '开始活动', desc: '标记现场进行中' },
  finished: { key: 'finished', label: '结束活动', desc: '结束后进入复盘状态', confirm: true }
}

const pendingCount = computed(() => applications.value.filter((item) => item.status === 'pending').length)
const lifecycleLabel = computed(() => lifecycleLabels[activity.value.status] || '报名中')
const moderationLabel = computed(() => moderationLabels[activity.value.moderationStatus] || moderationLabels.pending)
const availableLifecycleActions = computed(() => (
  getAllowedActivityStatusTransitions(activity.value)
    .map((status) => lifecycleActionCopy[status])
    .filter(Boolean)
))
const lifecycleHint = computed(() => {
  const status = activity.value.status
  const moderationStatus = activity.value.moderationStatus
  if (moderationStatus === 'pending') return '活动正在等待运营审核，审核通过后才会公开展示。'
  if (moderationStatus === 'rejected') return '活动未通过运营审核，可编辑后重新提交。'
  if (moderationStatus === 'hidden') return '活动已被运营下架，状态只读。'
  const hints = {
    draft: '草稿仅自己可见，提交审核后等待平台确认。',
    reviewing: '审核中不能直接公开，需等待运营通过。',
    recruiting: '活动正在开放报名，可确认成局或取消活动。',
    published: '历史已发布状态按报名中处理，可确认成局或取消活动。',
    formed: '活动已成局，可开始活动或取消。',
    ongoing: '现场进行中，活动结束后请标记结束。',
    finished: '活动已结束，状态只读。',
    cancelled: '活动已取消，状态只读。'
  }
  return hints[status] || '当前状态只读。'
})
const ticketStats = computed(() => {
  const paid = ticketOrders.value.filter((item) => item.status === 'paid')
  const pending = ticketOrders.value.filter((item) => item.status === 'pending')
  const refunded = ticketOrders.value.filter((item) => item.status === 'refunded')
  const amount = paid.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  return [
    { label: '待支付', value: pending.length },
    { label: '已支付', value: paid.length },
    { label: '退款/关闭', value: refunded.length + ticketOrders.value.filter((item) => item.status === 'closed').length },
    { label: '已收金额', value: `¥${amount}` }
  ]
})

onLoad(async (query) => {
  activityId.value = (query && query.id) || '103'
  await loadData()
})

async function loadData() {
  activity.value = await getActivityDetail(activityId.value)
  if (!ensureOwnerAccess()) return
  applications.value = await listApplications(activityId.value)
  ticketOrders.value = await listOrdersByActivity(activityId.value)
}

onPullDownRefresh(makeRefreshHandler(loadData))

function ensureOwnerAccess() {
  if (activity.value?.isCreator) return true
  uni.showToast({ title: '只有局长可以管理活动', icon: 'none' })
  setTimeout(() => {
    goActivityDetail(activity.value?.id || activityId.value, { replace: true })
  }, 500)
  return false
}

function handleBack() {
  const id = activity.value?.id || activityId.value
  goBackOrFallback(`/pages/activity/detail?id=${encodeURIComponent(id)}`)
}

function getInitial(item) {
  return item.gender === 'female' ? '她' : '他'
}

function getLifecycleLabel(status) {
  return lifecycleActions.find((item) => item.key === status)?.label || '报名中'
}

async function handleLifecycleAction(item) {
  if (!item) return
  const run = async () => {
    try {
      await setActivityLifecycle(item.key)
      if (item.key === 'cancelled') {
        const targets = applications.value.filter((application) => ['approved', 'pending'].includes(application.status))
        await Promise.all(targets.map((application) => createMessage({
          userId: application.userId || application.user_id,
          eventKey: `activity:cancelled:${activity.value.id}:${application.userId || application.user_id}` ,
          type: 'activity',
          title: '?????',
          content: `?????${activity.value.title}?????????????????`,
          sender: activity.value.organizer || 'SureGo',
          activityId: activity.value.id,
          read: false
        }).catch(() => null)))
      }
    } catch (error) {
      uni.showToast({ title: error?.message || '状态暂不可切换', icon: 'none' })
    }
  }
  if (item.confirm) {
    uni.showModal({
      title: item.label,
      content: `确认${item.label}？该操作会更新参与者看到的活动状态。`,
      confirmColor: item.tone === 'danger' ? '#ef4444' : '#0f172a',
      success: (res) => {
        if (res.confirm) run()
      }
    })
    return
  }
  await run()
}

async function setActivityLifecycle(status) {
  if (activity.value.status === status) {
    uni.showToast({ title: '已是当前状态', icon: 'none' })
    return
  }
  const result = await updateActivityStatus(activity.value.id, status)
  activity.value = {
    ...activity.value,
    status: result.status || status,
    lifecycleStatus: result.status || status,
    ...((result.status || status) === 'reviewing' ? { moderationStatus: 'pending', moderation_status: 'pending' } : {})
  }
  uni.showToast({ title: `已切换为${getLifecycleLabel(activity.value.status)}`, icon: 'none' })
}

async function handleAction(item) {
  if (item.key === 'review') {
    scrollTop.value = 0
    await nextTick()
    scrollTop.value = 760
    return
  }

  if (item.key === 'message') {
    goMessages()
    return
  }

  if (item.key === 'checkin') {
    goManageCheckin(activity.value.id)
    return
  }

  if (item.key === 'ticket') {
    if (activity.value.partyMode === 'free') {
      uni.showToast({ title: '本局免费，无需票券', icon: 'none' })
      return
    }
    ticketOrders.value = await listOrdersByActivity(activity.value.id)
    showTicketSheet.value = true
    return
  }

  showComingSoon(`${item.title}将在专项页面接入`)
}

function getApplicationStatusLabel(status) {
  const labels = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝'
  }
  return labels[status] || '待审核'
}

function openReview(item, status) {
  reviewTarget.value = item
  reviewMode.value = status
  reviewForm.value = { note: '' }
  showReviewSheet.value = true
}

async function submitReview() {
  if (!reviewTarget.value) return
  const status = reviewMode.value
  const note = reviewForm.value.note.trim()
  if (status === 'rejected' && !note) {
    uni.showToast({ title: '请填写拒绝原因', icon: 'none' })
    return
  }
  const options = status === 'approved'
    ? { reviewNote: note, application: { ...reviewTarget.value, activityTitle: activity.value.title } }
    : { rejectReason: note, application: { ...reviewTarget.value, activityTitle: activity.value.title } }
  const reviewed = await reviewApplication(reviewTarget.value.id, status, options)
  const previousStatus = reviewTarget.value.status
  applications.value = applications.value.map((app) => (app.id === reviewTarget.value.id ? { ...app, ...reviewed } : app))
  if (previousStatus !== 'approved' && status === 'approved') {
    activity.value = {
      ...activity.value,
      participantCount: Number(activity.value.participantCount || 0) + 1
    }
  } else if (previousStatus === 'approved' && status !== 'approved') {
    activity.value = {
      ...activity.value,
      participantCount: Math.max(0, Number(activity.value.participantCount || 0) - 1)
    }
  }
  showReviewSheet.value = false
  uni.showToast({
    title: status === 'approved' ? '已通过' : '已拒绝',
    icon: 'none'
  })
}
</script>

<style scoped>
.manage {
  min-height: 100vh;
  background: #0f172a;
}

.manage__nav {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 20;
  color: #fff;
  font-size: 28rpx;
  font-weight: 900;
  background: rgba(15, 23, 42, 0.78);
  backdrop-filter: blur(18px);
}

.manage__nav-row {
  display: flex;
  box-sizing: border-box;
  align-items: center;
  justify-content: space-between;
}

.manage__back {
  display: flex;
  width: 62rpx;
  height: 62rpx;
  align-items: center;
  justify-content: center;
}

.manage__scroll {
  height: 100vh;
  box-sizing: border-box;
}

.manage__hero {
  padding: 0 40rpx 40rpx;
}

.manage__kicker {
  color: #818cf8;
  font-size: 20rpx;
  font-weight: 900;
}

.manage__title {
  display: block;
  margin-top: 14rpx;
  color: #fff;
  font-size: 42rpx;
  font-weight: 900;
  line-height: 1.38;
}

.manage__meta {
  display: block;
  margin-top: 18rpx;
  color: rgba(255, 255, 255, 0.52);
  font-size: 23rpx;
  font-weight: 800;
  line-height: 1.5;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
  padding: 0 28rpx;
}

.stat {
  padding: 26rpx 20rpx;
  border-radius: 30rpx;
  background: rgba(255, 255, 255, 0.08);
}

.stat text:first-child {
  display: block;
  color: rgba(255, 255, 255, 0.42);
  font-size: 19rpx;
  font-weight: 900;
}

.stat text:last-child {
  display: block;
  margin-top: 12rpx;
  color: #fff;
  font-size: 34rpx;
  font-style: italic;
  font-weight: 900;
}

.stat--blue {
  background: rgba(79, 70, 229, 0.22);
}

.stat--green {
  background: rgba(34, 197, 94, 0.18);
}

.panel {
  margin: 28rpx;
  padding: 30rpx;
  border-radius: 38rpx;
  background: #fff;
}

.panel__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 28rpx;
}

.panel__head text:first-child {
  color: #0f172a;
  font-size: 32rpx;
  font-weight: 900;
}

.panel__head text:last-child {
  color: #cbd5e1;
  font-size: 19rpx;
  font-weight: 900;
}

.state-summary {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14rpx;
}

.state-summary view {
  padding: 22rpx;
  border-radius: 24rpx;
  background: #f8fafc;
}

.state-summary text:first-child {
  display: block;
  color: #94a3b8;
  font-size: 19rpx;
  font-weight: 900;
}

.state-summary text:last-child {
  display: block;
  margin-top: 8rpx;
  color: #0f172a;
  font-size: 28rpx;
  font-weight: 900;
}

.state-hint {
  display: block;
  margin: 18rpx 0;
  color: #64748b;
  font-size: 22rpx;
  font-weight: 800;
  line-height: 1.55;
}

.state-action-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14rpx;
}

.state-readonly {
  padding: 22rpx;
  border-radius: 24rpx;
  background: #f8fafc;
  color: #94a3b8;
  font-size: 22rpx;
  font-weight: 900;
}

.state-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14rpx;
}

.state-action {
  min-height: 108rpx;
  box-sizing: border-box;
  padding: 20rpx;
  border: 2rpx solid #f1f5f9;
  border-radius: 26rpx;
  background: #f8fafc;
}

.state-action text:first-child {
  display: block;
  color: #0f172a;
  font-size: 24rpx;
  font-weight: 900;
}

.state-action text:last-child {
  display: block;
  margin-top: 8rpx;
  color: #94a3b8;
  font-size: 19rpx;
  font-weight: 800;
}

.state-action--active {
  border-color: #ff6b6b;
  background: #fff1f2;
}

.state-action--active text:first-child {
  color: #ff6b6b;
}

.state-action--danger {
  border-color: #fecaca;
  background: #fff1f2;
}

.state-action--danger text:first-child {
  color: #ef4444;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18rpx;
}

.action {
  padding: 26rpx;
  border-radius: 30rpx;
  background: #f8fafc;
}

.action__icon {
  display: flex;
  width: 70rpx;
  height: 70rpx;
  align-items: center;
  justify-content: center;
  border-radius: 24rpx;
}

.action__icon--blue {
  background: #4f46e5;
}

.action__icon--green {
  background: #22c55e;
}

.action__icon--dark {
  background: #0f172a;
}

.action__icon--rose {
  background: #ef4444;
}

.action text:nth-child(2) {
  display: block;
  margin-top: 18rpx;
  color: #0f172a;
  font-size: 25rpx;
  font-weight: 900;
}

.action text:nth-child(3) {
  display: block;
  margin-top: 8rpx;
  color: #94a3b8;
  font-size: 20rpx;
  font-weight: 800;
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 16rpx;
  padding: 70rpx 0;
  color: #94a3b8;
  font-size: 24rpx;
  font-weight: 900;
}

.applicant {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 20rpx 0;
  border-top: 1rpx solid #f1f5f9;
}

.applicant__avatar {
  display: flex;
  width: 76rpx;
  height: 76rpx;
  align-items: center;
  justify-content: center;
  border-radius: 26rpx;
  background: #eef2ff;
  color: #4f46e5;
  font-weight: 900;
}

.applicant__content {
  flex: 1;
  min-width: 0;
}

.applicant__line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.applicant__name {
  color: #0f172a;
  font-size: 25rpx;
  font-weight: 900;
}

.applicant__status {
  flex-shrink: 0;
  padding: 6rpx 12rpx;
  border-radius: 999rpx;
  background: #fef3c7;
  color: #d97706;
  font-size: 18rpx;
  font-weight: 900;
}

.applicant__status--approved {
  background: #dcfce7;
  color: #16a34a;
}

.applicant__status--rejected {
  background: #fee2e2;
  color: #ef4444;
}

.applicant__msg {
  margin-top: 6rpx;
  color: #64748b;
  font-size: 21rpx;
  font-weight: 700;
}

.answer-list {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-top: 12rpx;
}

.answer {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  padding: 12rpx 14rpx;
  border-radius: 18rpx;
  background: #f8fafc;
}

.answer text:first-child {
  color: #94a3b8;
  font-size: 18rpx;
  font-weight: 800;
}

.answer text:last-child {
  color: #334155;
  font-size: 21rpx;
  font-weight: 800;
}

.applicant__review {
  display: block;
  margin-top: 10rpx;
  color: #16a34a;
  font-size: 21rpx;
  font-weight: 800;
}

.applicant__review--danger {
  color: #ef4444;
}

.applicant__buttons {
  display: flex;
  gap: 10rpx;
}

.applicant__buttons view {
  padding: 12rpx 18rpx;
  border-radius: 18rpx;
  background: #dcfce7;
  color: #16a34a;
  font-size: 20rpx;
  font-weight: 900;
}

.applicant__buttons view:last-child {
  background: #fee2e2;
  color: #ef4444;
}

.review-sheet {
  padding: 10rpx 2rpx 4rpx;
}

.review-sheet__textarea {
  box-sizing: border-box;
  width: 100%;
  min-height: 180rpx;
  padding: 22rpx;
  border: 1rpx solid #e2e8f0;
  border-radius: 26rpx;
  background: #f8fafc;
  color: #0f172a;
  font-size: 24rpx;
  font-weight: 700;
}

.review-sheet__button {
  display: flex;
  height: 88rpx;
  align-items: center;
  justify-content: center;
  margin-top: 22rpx;
  border-radius: 28rpx;
  background: #0f172a;
  color: #fff;
  font-size: 26rpx;
  font-weight: 900;
}

.ticket-sheet {
  padding: 4rpx 0 8rpx;
}

.ticket-summary {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14rpx;
}

.ticket-summary view {
  padding: 22rpx;
  border-radius: 24rpx;
  background: #f8fafc;
}

.ticket-summary text:first-child {
  display: block;
  color: #0f172a;
  font-size: 32rpx;
  font-style: italic;
  font-weight: 900;
}

.ticket-summary text:last-child {
  display: block;
  margin-top: 6rpx;
  color: #94a3b8;
  font-size: 20rpx;
  font-weight: 900;
}

.ticket-empty {
  padding: 54rpx 0;
  color: #94a3b8;
  text-align: center;
  font-size: 23rpx;
  font-weight: 900;
}

.ticket-order {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  padding: 22rpx 0;
  border-top: 1rpx solid #f1f5f9;
}

.ticket-order text:first-child {
  display: block;
  color: #0f172a;
  font-size: 24rpx;
  font-weight: 900;
}

.ticket-order text:nth-child(2) {
  display: block;
  margin-top: 6rpx;
  color: #94a3b8;
  font-size: 20rpx;
  font-weight: 800;
}

.ticket-order__status {
  flex-shrink: 0;
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  background: #fef3c7;
  color: #d97706;
  font-size: 19rpx;
  font-weight: 900;
}

.ticket-order__status--paid {
  background: #dcfce7;
  color: #16a34a;
}

.ticket-order__status--refunded {
  background: #e0e7ff;
  color: #4f46e5;
}

.ticket-order__status--closed {
  background: #fee2e2;
  color: #ef4444;
}
</style>
