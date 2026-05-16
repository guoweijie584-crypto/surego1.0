<template>
  <view class="ref-page">
    <view class="manager-topbar" :style="navStyle">
      <view class="manager-topbar__row" :style="navRowStyle">
        <view class="exit-button" @tap="handleBack">
          <SuIcon name="left" size="36" glyph-size="18" variant="inline" color="#102033" />
          <text>退出</text>
        </view>
        <view class="manager-topbar__title">
          <text>活动管理</text>
          <text class="su-line-1">{{ activity.title }}</text>
        </view>
        <view class="ref-icon-button" @tap="openActivityDetail">
          <SuIcon name="arrowRight" size="38" glyph-size="19" variant="inline" color="#102033" />
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="ref-scroll ref-scroll--no-tab" :scroll-top="scrollTop" scroll-with-animation :style="contentTopStyle">
      <view class="manager-summary ref-card">
        <view>
          <text>{{ activity.participantCount || 0 }}/{{ activity.maxParticipants || 0 }}</text>
          <text>报名人数</text>
        </view>
        <view>
          <text>{{ pendingCount }}</text>
          <text>待审核</text>
        </view>
        <view>
          <text>{{ waitlistCount }}</text>
          <text>候补</text>
        </view>
        <view>
          <text>{{ paidAmountText }}</text>
          <text>试运行订单金额</text>
        </view>
      </view>

      <scroll-view scroll-x class="ref-filter-row sticky-tabs" :show-scrollbar="false">
        <text v-for="item in tabs" :key="item.key" :class="{ active: activeTab === item.key }" @tap="activeTab = item.key">
          {{ item.label }}
        </text>
      </scroll-view>

      <view v-if="activeTab === 'overview'" class="ref-stack">
        <view class="ref-task-card" @tap="activeTab = 'review'">
          <SuIcon name="people" size="44" glyph-size="22" variant="inline" color="#2388ff" />
          <view class="ref-task-card__body">
            <text>先处理报名申请</text>
            <text>{{ pendingCount }} 个申请会影响是否准时成行</text>
          </view>
          <SuIcon name="arrowRight" size="36" glyph-size="18" variant="inline" color="#94a3b8" />
        </view>
        <view class="ref-task-card" @tap="activeTab = 'notice'">
          <SuIcon name="send" size="44" glyph-size="22" variant="inline" color="#2388ff" />
          <view class="ref-task-card__body">
            <text>发送集合提醒</text>
            <text>{{ activity.time }} {{ activity.location }}，提前通知成员</text>
          </view>
          <SuIcon name="arrowRight" size="36" glyph-size="18" variant="inline" color="#94a3b8" />
        </view>
        <view class="ref-task-card" @tap="activeTab = 'checkin'">
          <SuIcon name="scan" size="44" glyph-size="22" variant="inline" color="#2388ff" />
          <view class="ref-task-card__body">
            <text>活动当天核销</text>
            <text>现场到场名单</text>
          </view>
          <SuIcon name="arrowRight" size="36" glyph-size="18" variant="inline" color="#94a3b8" />
        </view>

        <view class="ref-info-card ref-card">
          <text class="ref-info-card__title">活动状态</text>
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
          <text class="ref-info-card__text state-hint">{{ lifecycleHint }}</text>
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
          <view v-else class="state-readonly">当前状态暂无可执行动作</view>
        </view>

        <view class="ref-info-card ref-card">
          <text class="ref-info-card__title">试运行订单状态</text>
          <view class="fund-row">
            <text>已确认/冻结</text>
            <text>{{ paidAmountText }}</text>
          </view>
          <view class="fund-row">
            <text>待核销</text>
            <text>{{ activity.participantCount || 0 }} 人</text>
          </view>
          <view class="fund-row">
            <text>争议挂起</text>
            <text>0 笔</text>
          </view>
        </view>
      </view>

      <view v-if="activeTab === 'review'" id="manage-applications" class="ref-stack">
        <view v-if="applications.length === 0" class="ref-empty ref-card">
          <SuIcon name="people" size="76" glyph-size="38" variant="inline" color="#cbd5e1" />
          <text>待审核申请已处理完</text>
        </view>
        <view v-for="item in applications" :key="item.id" class="applicant-card ref-card">
          <view class="organizer-line">
            <view class="initial-avatar" @tap.stop="goUserDetail(item.userId || item.user_id, { activityId: activity.id })">{{ getInitial(item) }}</view>
            <view>
              <text>报名同学</text>
              <text>信用 95 · {{ getApplicationStatusLabel(item.status) }}</text>
            </view>
            <text class="ref-pill" :class="item.status === 'approved' ? 'ref-pill--green' : item.status === 'rejected' ? 'ref-pill--amber' : 'ref-pill--blue'">
              {{ getApplicationStatusLabel(item.status) }}
            </text>
          </view>
          <text class="applicant-card__msg">{{ item.message || '能准时到场，接受活动规则，愿意配合核销。' }}</text>
          <view v-if="item.answers && item.answers.length" class="answer-list">
            <view v-for="answer in item.answers" :key="answer.question">
              <text>{{ answer.question }}</text>
              <text>{{ answer.answer }}</text>
            </view>
          </view>
          <view v-if="item.status === 'pending'" class="button-row">
            <view class="ref-secondary" @tap="openReview(item, 'rejected')">拒绝</view>
            <view class="ref-primary" @tap="openReview(item, 'approved')">通过</view>
          </view>
        </view>
      </view>

      <view v-if="activeTab === 'members'" class="ref-stack">
        <view v-for="item in memberRows" :key="item.name" class="member-row ref-card">
          <view class="initial-avatar">{{ item.name.slice(0, 1) }}</view>
          <view>
            <text>{{ item.name }}</text>
            <text>{{ item.desc }}</text>
          </view>
          <text class="ref-pill" :class="item.tone">{{ item.badge }}</text>
        </view>
      </view>

      <view v-if="activeTab === 'checkin'" class="ref-qr-card ref-card">
        <SuIcon name="scan" size="128" glyph-size="64" variant="inline" color="#2388ff" />
        <text class="ref-qr-card__code">发起人核销</text>
        <text class="ref-qr-card__hint">支持扫码、手动码、名单勾选；核销后有撤销窗口。</text>
        <input class="checkin-input" placeholder="输入手动核销码" />
        <view class="ref-primary checkin-button" @tap="goManageCheckin(activity.id)">确认核销</view>
      </view>

      <view v-if="activeTab === 'notice'" class="ref-form-card ref-card">
        <text class="ref-form-card__title">单向通知成员</text>
        <textarea
          v-model="noticeText"
          class="ref-textarea"
          maxlength="160"
          fixed="true"
          adjust-position="false"
          cursor-spacing="28"
          disable-default-padding="true"
        />
        <view class="ref-primary notice-button" @tap="sendNotice">发送给已报名成员</view>
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
  </view>
</template>

<script setup>
import SuIcon from '@/components/surego/SuIcon.vue'
import { computed, nextTick, ref } from 'vue'
import { onLoad, onPullDownRefresh } from '@dcloudio/uni-app'
import SuActionSheet from '@/components/surego/SuActionSheet.vue'
import { getActivityDetail, getAllowedActivityStatusTransitions, updateActivityStatus } from '@/common/api/activity.js'
import { listApplications, reviewApplication } from '@/common/api/application.js'
import { createMessage } from '@/common/api/message.js'
import { getOrderStatusText, listOrdersByActivity } from '@/common/api/order.js'
import { createEmptyActivity } from '@/common/utils/activity-default.js'
import { makeRefreshHandler } from '@/common/utils/refresh.js'
import { getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goActivityDetail, goBackOrFallback, goManageCheckin, goMessages, goUserDetail } from '@/common/utils/route.js'

const activityId = ref('103')
const activity = ref(createEmptyActivity('103'))
const applications = ref([])
const ticketOrders = ref([])
const activeTab = ref('overview')
const scrollTop = ref(0)
const showReviewSheet = ref(false)
const reviewTarget = ref(null)
const reviewMode = ref('approved')
const reviewForm = ref({ note: '' })
const noticeText = ref('集合地点已确认：请大家提前 10 分钟到达，迟到会影响开始。')
const navStyle = getMiniProgramNavStyle()
const navRowStyle = getMiniProgramNavRowStyle({ leftPaddingRpx: 34, minRightPaddingRpx: 24 })
const contentTopStyle = getMiniProgramNavContentStyle({ gapRpx: 20 })

const tabs = [
  { key: 'overview', label: '总览' },
  { key: 'review', label: '报名' },
  { key: 'members', label: '成员' },
  { key: 'checkin', label: '核销' },
  { key: 'notice', label: '通知' }
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
const waitlistCount = computed(() => applications.value.filter((item) => item.status === 'waitlist').length)
const paidAmount = computed(() => ticketOrders.value.filter((item) => item.status === 'paid').reduce((sum, item) => sum + Number(item.amount || 0), 0))
const paidAmountText = computed(() => activity.value.partyMode === 'free' ? '无' : `¥${paidAmount.value}`)
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
    draft: '草稿状态。',
    reviewing: '审核中不能直接公开，需要等待运营通过。',
    recruiting: '活动正在开放报名，可确认成局或取消活动。',
    published: '历史已发布状态按报名中处理，可确认成局或取消活动。',
    formed: '活动已成局，可开始活动或取消。',
    ongoing: '现场进行中，活动结束后请标记结束。',
    finished: '活动已结束，状态只读。',
    cancelled: '活动已取消，状态只读。'
  }
  return hints[status] || '当前状态只读。'
})
const memberRows = computed(() => {
  const approved = applications.value.filter((item) => item.status === 'approved')
  const rows = approved.length
    ? approved.map((item, index) => ({
        name: item.nickname || `报名同学 ${index + 1}`,
        desc: '已占位 · 待核销',
        badge: '成员',
        tone: 'ref-pill--blue'
      }))
    : [
        { name: '林同学', desc: '已占位 · 待核销', badge: '成员', tone: 'ref-pill--blue' },
        { name: '小周', desc: '已占位 · 待核销', badge: '成员', tone: 'ref-pill--blue' }
      ]
  if (waitlistCount.value > 0) {
    rows.push({ name: '候补同学', desc: '候补第 1 位', badge: '候补', tone: 'ref-pill--amber' })
  }
  return rows
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
  uni.showToast({ title: '只有发起人可以管理活动', icon: 'none' })
  setTimeout(() => {
    goActivityDetail(activity.value?.id || activityId.value, { replace: true })
  }, 500)
  return false
}

function handleBack() {
  const id = activity.value?.id || activityId.value
  goBackOrFallback(`/pages/activity/detail?id=${encodeURIComponent(id)}`)
}

function openActivityDetail() {
  goActivityDetail(activity.value.id)
}

function getInitial(item) {
  return item.gender === 'female' ? '女' : '同'
}

function getLifecycleLabel(status) {
  return lifecycleLabels[status] || '报名中'
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
          eventKey: `activity:cancelled:${activity.value.id}:${application.userId || application.user_id}`,
          type: 'activity',
          title: '活动已取消',
          content: `你报名的「${activity.value.title}」已取消，请查看后续安排。`,
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
      confirmColor: item.tone === 'danger' ? '#ef4444' : '#102033',
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

async function handleAction(key) {
  if (key === 'review') {
    activeTab.value = 'review'
    scrollTop.value = 0
    await nextTick()
    scrollTop.value = 760
    return
  }
  if (key === 'message') {
    goMessages()
    return
  }
  if (key === 'checkin') {
    goManageCheckin(activity.value.id)
    return
  }
}

function getApplicationStatusLabel(status) {
  const labels = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
    waitlist: '候补'
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

function sendNotice() {
  uni.showToast({ title: '通知已发送', icon: 'none' })
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

.manager-summary text:first-child {
  display: block;
  color: #102033;
  font-size: 30rpx;
  font-weight: 950;
  line-height: 1.1;
}

.manager-summary text:last-child {
  display: block;
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

.state-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
}

.state-summary view {
  border-radius: 28rpx;
  background: #edf6ff;
  padding: 22rpx;
}

.state-summary text:first-child,
.state-summary text:last-child {
  display: block;
}

.state-summary text:first-child {
  color: #64748b;
  font-size: 21rpx;
  font-weight: 850;
}

.state-summary text:last-child {
  margin-top: 8rpx;
  color: #102033;
  font-size: 28rpx;
  font-weight: 950;
}

.state-hint {
  margin-top: 22rpx;
}

.state-action-list {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  margin-top: 24rpx;
}

.state-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  border-radius: 28rpx;
  background: #edf6ff;
  padding: 22rpx;
}

.state-action text:first-child {
  color: #102033;
  font-size: 24rpx;
  font-weight: 950;
}

.state-action text:last-child {
  color: #64748b;
  font-size: 20rpx;
  font-weight: 800;
  text-align: right;
}

.state-action--danger text:first-child {
  color: #b91c1c;
}

.state-readonly {
  margin-top: 24rpx;
  color: #94a3b8;
  font-size: 22rpx;
  font-weight: 850;
}

.fund-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 0;
  border-top: 1rpx solid #edf2f7;
  color: #64748b;
  font-size: 23rpx;
  font-weight: 850;
}

.fund-row text:last-child {
  color: #102033;
  font-weight: 950;
}

.applicant-card {
  padding: 30rpx;
}

.organizer-line {
  display: flex;
  align-items: center;
  gap: 18rpx;
}

.initial-avatar {
  display: flex;
  width: 76rpx;
  height: 76rpx;
  flex: 0 0 76rpx;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: linear-gradient(135deg, #dbeafe, #93c5fd);
  color: #0f4f9f;
  font-size: 26rpx;
  font-weight: 950;
}

.organizer-line > view:nth-child(2) {
  min-width: 0;
  flex: 1;
}

.organizer-line > view:nth-child(2) text:first-child,
.member-row > view:nth-child(2) text:first-child {
  display: block;
  color: #102033;
  font-size: 26rpx;
  font-weight: 950;
}

.organizer-line > view:nth-child(2) text:last-child,
.member-row > view:nth-child(2) text:last-child {
  display: block;
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

.answer-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-top: 20rpx;
}

.answer-list view {
  border-radius: 24rpx;
  background: #edf6ff;
  padding: 18rpx;
}

.answer-list text:first-child,
.answer-list text:last-child {
  display: block;
  font-size: 21rpx;
  font-weight: 850;
  line-height: 1.45;
}

.answer-list text:first-child {
  color: #64748b;
}

.answer-list text:last-child {
  margin-top: 6rpx;
  color: #102033;
}

.button-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18rpx;
  margin-top: 24rpx;
}

.member-row {
  display: grid;
  grid-template-columns: 76rpx minmax(0, 1fr) auto;
  align-items: center;
  gap: 18rpx;
  padding: 26rpx;
}

.checkin-input {
  width: 100%;
  height: 88rpx;
  border: 0;
  border-radius: 26rpx;
  background: #edf6ff;
  padding: 0 26rpx;
  color: #102033;
  font-size: 24rpx;
  font-weight: 850;
}

.checkin-button,
.notice-button {
  width: 100%;
  margin-top: 24rpx;
}

.review-sheet {
  padding: 8rpx 4rpx 0;
}

.review-sheet__textarea {
  width: 100%;
  min-height: 180rpx;
  box-sizing: border-box;
  border: 0;
  border-radius: 28rpx;
  background: #f8fafc;
  padding: 24rpx;
  color: #102033;
  font-size: 25rpx;
  font-weight: 800;
  line-height: 1.5;
}

.review-sheet__button {
  display: flex;
  height: 88rpx;
  align-items: center;
  justify-content: center;
  margin-top: 22rpx;
  border-radius: 999rpx;
  background: #2388ff;
  color: #fff;
  font-size: 26rpx;
  font-weight: 950;
}
</style>
