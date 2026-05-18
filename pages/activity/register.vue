<template>
  <view v-if="isPageLoading" class="ref-page">
    <SuPageLoading :style="contentTopStyle" text="报名信息加载中..." />
  </view>
  <view v-else class="ref-page">
    <view class="ref-topbar" :style="navStyle">
      <view class="ref-topbar__row" :style="navRowStyle">
        <view class="ref-back" @tap="goBackOrFallback(`/pages/activity/detail?id=${activity.id}`)">
          <SuIcon name="left" size="44" glyph-size="22" variant="inline" color="#102033" />
        </view>
        <text class="ref-topbar__title">{{ pageTitle }}</text>
        <view class="ref-icon-button">
          <SuIcon name="shield" size="40" glyph-size="20" variant="inline" color="#2388ff" />
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="ref-scroll ref-scroll--no-tab register__scroll" :style="contentTopStyle">
      <view class="ref-summary-card ref-card">
        <image :src="activity.image" mode="aspectFill" />
        <view>
          <text class="su-line-2">{{ activity.title }}</text>
          <text>{{ activity.date }} {{ activity.time }} · {{ shortLocation }}</text>
        </view>
      </view>

      <view class="ref-form-card ref-card register-gap">
        <text class="ref-form-card__title">发起人问题</text>
        <label v-for="(question, index) in visibleQuestions" :key="question">
          <text>{{ question }}</text>
          <textarea
            class="ref-textarea"
            :value="answers[index]"
            maxlength="120"
            adjust-position="false"
            cursor-spacing="28"
            disable-default-padding="true"
            placeholder="填写你的回答"
            placeholder-class="register-placeholder"
            @input="handleAnswerInput(index, $event)"
          />
        </label>
        <label>
          <text>补充说明</text>
          <textarea
            class="ref-textarea"
            :value="message"
            maxlength="180"
            adjust-position="false"
            cursor-spacing="28"
            disable-default-padding="true"
            placeholder="简单说说你为什么想参加这场活动"
            placeholder-class="register-placeholder"
            @input="message = $event.detail.value"
          />
        </label>
      </view>

      <view class="ref-form-card ref-card register-gap">
        <text class="ref-form-card__title">规则确认</text>
        <view class="ref-check-line" :class="{ 'ref-check-line--active': agreed }" @tap="agreed = !agreed">
          <SuIcon :name="agreed ? 'checkmarkempty' : 'circle'" size="36" glyph-size="18" variant="inline" :color="agreed ? '#047857' : '#94a3b8'" />
          <text>我已确认</text>
        </view>
      </view>

      <view class="ref-info-card ref-card register-gap">
        <text class="ref-info-card__title">手机号授权</text>
        <view class="phone-auth-card">
          <view>
            <text>{{ phoneAuthTitle }}</text>
            <text>{{ phoneAuthDesc }}</text>
          </view>
          <button v-if="!hasAuthorizedPhone" open-type="getPhoneNumber" @getphonenumber="handlePhoneNumber" class="phone-auth-button">
            授权手机号
          </button>
          <text v-else class="ref-pill ref-pill--blue register-pill">{{ maskedPhone }}</text>
        </view>
      </view>

      <view class="ref-bottom-cta">
        <button class="ref-primary" :class="{ 'ref-primary--disabled': !canSubmit || isSubmitting }" :disabled="!canSubmit || isSubmitting" @tap="handleSubmit">
          <text>{{ isSubmitting ? '提交中...' : submitText }}</text>
        </button>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import SuIcon from '@/components/surego/SuIcon.vue'
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { bindCurrentUserMobileByMpWeixin, getCurrentUser } from '@/common/api/user.js'
import { getActivityDetail, getActivityStatusMeta } from '@/common/api/activity.js'
import { getApplicationForActivity, submitApplication } from '@/common/api/application.js'
import { createEmptyActivity } from '@/common/utils/activity-default.js'
import SuPageLoading from '@/components/surego/SuPageLoading.vue'
import { getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goBackOrFallback, goPayment, goSuccess } from '@/common/utils/route.js'

const activity = ref(createEmptyActivity('101'))
const gender = ref('unknown')
const mbtiIndex = ref(0)
const message = ref('')
const answers = ref([])
const agreed = ref(false)
const isSubmitting = ref(false)
const isPageLoading = ref(true)
const currentUser = ref({})
const navStyle = getMiniProgramNavStyle()
const navRowStyle = getMiniProgramNavRowStyle({ leftPaddingRpx: 34, minRightPaddingRpx: 24 })
const contentTopStyle = getMiniProgramNavContentStyle({ gapRpx: 22 })

const mbtiOptions = [
  '请选择',
  'INTJ 建筑师',
  'INTP 逻辑学家',
  'ENTJ 指挥官',
  'ENTP 辩论家',
  'INFJ 提倡者',
  'INFP 调停者',
  'ENFJ 主人公',
  'ENFP 竞选者',
  'ISTJ 检查者',
  'ISFJ 守卫者',
  'ESTJ 总经理',
  'ESFJ 执政官',
  'ISTP 鉴赏家',
  'ISFP 探险家',
  'ESTP 企业家',
  'ESFP 表演者'
]

const selectedMbti = computed(() => (mbtiIndex.value > 0 ? mbtiOptions[mbtiIndex.value] : ''))
const isFull = computed(() => activity.value.hasParticipantLimit && Number(activity.value.participantCount || 0) >= Number(activity.value.maxParticipants || 0))
const waitlistEnabled = computed(() => activity.value.waitlist !== false && activity.value.allowWaitlist !== false && activity.value.allow_waitlist !== false)
const isWaitlistRegistration = computed(() => waitlistEnabled.value && isFull.value && !['pending', 'approved', 'rejected', 'waitlist'].includes(activity.value.applicationStatus))
const hasExistingApplication = computed(() => ['pending', 'approved', 'rejected', 'waitlist'].includes(activity.value.applicationStatus))
const pageTitle = computed(() => (isWaitlistRegistration.value || activity.value.applicationStatus === 'waitlist' ? '候补申请' : '报名申请'))
const visibleQuestions = computed(() => (
  activity.value.questions && activity.value.questions.length
    ? activity.value.questions
    : ['你为什么想参加这场活动？']
))

const shortLocation = computed(() => {
  return (activity.value.location || '').split(' · ')[0] || activity.value.location
})

const noticeText = computed(() => {
  if (isWaitlistRegistration.value || activity.value.applicationStatus === 'waitlist') {
    return '当前名额已满，提交后会进入候补队列。候补不占用名额，发起人放出空位并通过后会通知你。'
  }
  if (activity.value.partyMode === 'sincerity') {
    return `本局为诚意金局，申请后进入试运营订单确认，金额 ¥${activity.value.amount}，签到后记录为可退回状态。`
  }
  if (activity.value.partyMode === 'ticket') {
    return `本局为门票局，申请后进入试运营订单确认，金额 ¥${activity.value.amount}，确认后锁定名额。`
  }
  return '请按时成行，爽约会影响信用星级。'
})

const submitText = computed(() => {
  if (activity.value.applicationStatus === 'pending') return '已申请，等待审核'
  if (activity.value.applicationStatus === 'approved') return '已加入该活动'
  if (activity.value.applicationStatus === 'waitlist') return '已加入候补'
  if (activity.value.applicationStatus === 'rejected') return '申请未通过'
  if (activity.value.applicationStatus === 'invited') return '确认加入'
  if (isWaitlistRegistration.value) return '加入候补队列'
  if (activity.value.requireApproval) return '提交申请'
  if (activity.value.partyMode === 'free') return '报名成功'
  return '提交申请并确认订单'
})

const requiredAnswersDone = computed(() => {
  return visibleQuestions.value.every((_, index) => String(answers.value[index] || '').trim().length > 0)
})

const canSubmit = computed(() => {
  return !hasExistingApplication.value && agreed.value && message.value.trim().length > 0 && requiredAnswersDone.value
})
const authorizedPhone = computed(() => String(currentUser.value.mobile || currentUser.value.phone || '').trim())
const hasAuthorizedPhone = computed(() => Boolean(authorizedPhone.value))
const maskedPhone = computed(() => `已授权：${maskPhoneNumber(authorizedPhone.value)}`)
const phoneAuthTitle = computed(() => (hasAuthorizedPhone.value ? '手机号已授权' : '手机号未授权'))
const phoneAuthDesc = computed(() => (
  hasAuthorizedPhone.value
    ? '用于活动临时联系和履约安全，其他用户不会直接看到完整号码。'
    : '微信小程序需要你主动授权手机号，未授权时不会展示模拟号码。'
))

onLoad(async (query) => {
  const id = (query && query.id) || '101'
  isPageLoading.value = true
  try {
    currentUser.value = await getCurrentUser().catch(() => ({}))
    const detail = await getActivityDetail(id)
    if (!detail?.id) {
      uni.showToast({ title: '活动不存在或暂不可报名', icon: 'none' })
      return
    }
    activity.value = detail
    await syncApplicationStatus(detail.id)
    answers.value = visibleQuestions.value.map(() => '')
    validateJoinEligibility(true)
  } finally {
    isPageLoading.value = false
  }
})

function maskPhoneNumber(value = '') {
  const text = String(value || '').trim()
  if (!text) return '未授权'
  if (text.length < 7) return text
  return `${text.slice(0, 3)}****${text.slice(-4)}`
}

async function handlePhoneNumber(event = {}) {
  const detail = event.detail || {}
  if (detail.errMsg && !String(detail.errMsg).includes('ok')) {
    uni.showToast({ title: '未完成手机号授权', icon: 'none' })
    return
  }
  try {
    currentUser.value = await bindCurrentUserMobileByMpWeixin(detail)
    uni.showToast({ title: '手机号已授权', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: error?.message || '手机号授权失败', icon: 'none' })
  }
}

async function syncApplicationStatus(id = activity.value.id) {
  try {
    const application = await getApplicationForActivity(id)
    if (!application) return
    activity.value = {
      ...activity.value,
      application,
      applicationStatus: application.status || activity.value.applicationStatus,
      reviewNote: application.reviewNote || activity.value.reviewNote || '',
      rejectReason: application.rejectReason || activity.value.rejectReason || ''
    }
  } catch (error) {
    // Keep the real activity detail visible even if viewer-specific application state is unavailable.
  }
}

function handleAnswerInput(index, event) {
  const next = answers.value.slice()
  next[index] = event.detail.value
  answers.value = next
}

async function handleSubmit() {
  if (!canSubmit.value || isSubmitting.value) return
  if (!validateJoinEligibility()) return

  isSubmitting.value = true
  const isInviteConfirmation = activity.value.applicationStatus === 'invited'
  const application = {
    activityId: activity.value.id,
    activityCreatorId: activity.value.creatorId || activity.value.creator_id,
    activityTitle: activity.value.title,
    gender: gender.value,
    mbti: selectedMbti.value,
    message: message.value,
    answers: visibleQuestions.value.map((question, index) => ({
      question,
      answer: answers.value[index] || ''
    })),
    status: isWaitlistRegistration.value ? 'waitlist' : undefined,
    requireApproval: isInviteConfirmation || isWaitlistRegistration.value ? false : activity.value.requireApproval,
    hasParticipantLimit: activity.value.hasParticipantLimit,
    participantCount: activity.value.participantCount || 0,
    maxParticipants: activity.value.maxParticipants || 0,
    waitlist: activity.value.waitlist !== false,
    allowWaitlist: activity.value.allowWaitlist !== false,
    allow_waitlist: activity.value.allow_waitlist !== false
  }

  await submitApplication(application)
  await syncApplicationStatus(activity.value.id)

  setTimeout(() => {
    if (activity.value.applicationStatus === 'waitlist') {
      goSuccess({
        type: 'WAITLIST',
        activityId: activity.value.id,
        requireApproval: '1'
      })
      return
    }
    if (activity.value.partyMode !== 'free') {
      goPayment({
        activityId: activity.value.id,
        type: activity.value.partyMode,
        amount: activity.value.amount,
        requireApproval: isInviteConfirmation ? '0' : (activity.value.requireApproval ? '1' : '0')
      })
      return
    }
    goSuccess({
      type: 'JOIN',
      activityId: activity.value.id,
      requireApproval: isInviteConfirmation ? '0' : (activity.value.requireApproval ? '1' : '0')
    })
  }, 650)
}

function validateJoinEligibility(silent = false) {
  const current = activity.value || {}
  let messageText = ''

  if (current.isCreator) {
    messageText = '自己发起的活动不能报名'
  } else if (current.applicationStatus === 'pending') {
    messageText = '你已提交申请，请等待审核'
  } else if (current.applicationStatus === 'approved') {
    messageText = '你已加入该活动'
  } else if (current.applicationStatus === 'waitlist') {
    messageText = '你已加入候补队列'
  } else if (current.applicationStatus === 'rejected') {
    messageText = '该活动申请未通过，暂不可重复提交'
  } else if (!['published', 'recruiting'].includes(getActivityStatusMeta(current).key)) {
    messageText = '活动当前不在报名状态'
  } else if (!waitlistEnabled.value && current.hasParticipantLimit && Number(current.participantCount || 0) >= Number(current.maxParticipants || 0)) {
    messageText = '活动名额已满'
  } else if (['finished', 'cancelled'].includes(current.status) || ['finished', 'cancelled'].includes(current.lifecycleStatus)) {
    messageText = '活动已结束或取消'
  } else if (current.moderationStatus && current.moderationStatus !== 'visible' && current.moderationStatus !== 'approved') {
    messageText = '活动暂不可报名'
  }

  if (!messageText) return true
  if (!silent) {
    uni.showToast({ title: messageText, icon: 'none' })
  }
  return false
}
</script>

<style scoped>
.register-gap {
  margin-top: 24rpx;
}

.register-pill {
  margin-top: 22rpx;
}

.register-placeholder {
  color: #94a3b8;
}

.phone-auth-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 18rpx;
  margin-top: 18rpx;
  padding: 20rpx;
  border-radius: 28rpx;
  background: #f8fafc;
}

.phone-auth-card view {
  min-width: 0;
}

.phone-auth-card view text {
  display: block;
}

.phone-auth-card view text:first-child {
  color: #102033;
  font-size: 25rpx;
  font-weight: 950;
}

.phone-auth-card view text:last-child {
  margin-top: 6rpx;
  color: #64748b;
  font-size: 21rpx;
  font-weight: 800;
  line-height: 1.35;
}

.phone-auth-button {
  height: 64rpx;
  padding: 0 22rpx;
  border-radius: 999rpx;
  background: #2388ff;
  color: #fff;
  font-size: 22rpx;
  font-weight: 950;
  line-height: 64rpx;
  white-space: nowrap;
}
</style>
