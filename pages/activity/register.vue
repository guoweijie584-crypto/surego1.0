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
        <text class="ref-topbar__title">报名申请</text>
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
        <text class="ref-info-card__text">{{ noticeText }}</text>
        <view class="ref-check-line" :class="{ 'ref-check-line--active': agreed }" @tap="agreed = !agreed">
          <SuIcon :name="agreed ? 'checkmarkempty' : 'circle'" size="36" glyph-size="18" variant="inline" :color="agreed ? '#047857' : '#94a3b8'" />
          <text>我已阅读报名、退款、结算和爽约规则</text>
        </view>
      </view>

      <view class="ref-info-card ref-card register-gap">
        <text class="ref-info-card__title">手机号授权</text>
        <text class="ref-pill ref-pill--blue register-pill">已授权：138****9021</text>
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
import { getActivityDetail } from '@/common/api/activity.js'
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
const hasExistingApplication = computed(() => ['pending', 'approved', 'rejected'].includes(activity.value.applicationStatus))
const visibleQuestions = computed(() => (
  activity.value.questions && activity.value.questions.length
    ? activity.value.questions
    : ['你为什么想参加这场活动？']
))

const shortLocation = computed(() => {
  return (activity.value.location || '').split(' · ')[0] || activity.value.location
})

const noticeText = computed(() => {
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
  if (activity.value.applicationStatus === 'rejected') return '申请未通过'
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

onLoad(async (query) => {
  const id = (query && query.id) || '101'
  isPageLoading.value = true
  try {
    activity.value = await getActivityDetail(id)
    await syncApplicationStatus(id)
    answers.value = visibleQuestions.value.map(() => '')
    validateJoinEligibility(true)
  } finally {
    isPageLoading.value = false
  }
})

async function syncApplicationStatus(id = activity.value.id) {
  const application = await getApplicationForActivity(id)
  if (!application) return
  activity.value = {
    ...activity.value,
    application,
    applicationStatus: application.status || activity.value.applicationStatus,
    reviewNote: application.reviewNote || activity.value.reviewNote || '',
    rejectReason: application.rejectReason || activity.value.rejectReason || ''
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
    requireApproval: activity.value.requireApproval
  }

  await submitApplication(application)
  await syncApplicationStatus(activity.value.id)

  setTimeout(() => {
    if (activity.value.partyMode !== 'free') {
      goPayment({
        activityId: activity.value.id,
        type: activity.value.partyMode,
        amount: activity.value.amount,
        requireApproval: activity.value.requireApproval ? '1' : '0'
      })
      return
    }
    goSuccess({
      type: 'JOIN',
      activityId: activity.value.id,
      requireApproval: activity.value.requireApproval ? '1' : '0'
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
  } else if (current.applicationStatus === 'rejected') {
    messageText = '该活动申请未通过，暂不可重复提交'
  } else if (current.hasParticipantLimit && Number(current.participantCount || 0) >= Number(current.maxParticipants || 0)) {
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
</style>
