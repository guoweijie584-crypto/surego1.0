<template>
  <view class="register su-page" :style="contentTopStyle">
    <view class="register__glow register__glow--green" />
    <view class="register__glow register__glow--blue" />

    <view class="register__nav" :style="navStyle">
      <view class="register__nav-row" :style="navRowStyle">
        <view class="register__nav-spacer" />
        <view class="register__close" @tap="goBackOrFallback">
          <uni-icons type="closeempty" size="28" color="rgba(255,255,255,.58)" />
        </view>
      </view>
    </view>

    <view class="register__panel">
      <view class="register__header">
        <view class="register__spark">
          <uni-icons type="fire-filled" size="32" color="#34d399" />
        </view>
        <text class="register__title">申请入局</text>
        <text class="register__subtitle">
          {{ activity.requireApproval ? `申请加入 ${activity.organizer} 发起的局，需要等待审核` : `报名加入 ${activity.organizer} 发起的局` }}
        </text>
      </view>

      <view class="register__activity">
        <image class="register__cover" :src="activity.image" mode="aspectFill" />
        <view class="register__activity-info">
          <text class="register__activity-title su-line-2">{{ activity.title }}</text>
          <text class="register__activity-meta">{{ activity.date }} {{ activity.time }} · {{ shortLocation }}</text>
        </view>
      </view>

      <view class="form">
        <view class="form__row">
          <view class="form__field form__field--half">
            <text class="form__label">性别 *</text>
            <view class="segmented">
              <view
                v-for="item in genderOptions"
                :key="item.value"
                class="segmented__item"
                :class="{ 'segmented__item--active': gender === item.value }"
                @tap="gender = item.value"
              >
                <text>{{ item.label }}</text>
              </view>
            </view>
          </view>

          <view class="form__field form__field--half">
            <text class="form__label">MBTI</text>
            <picker mode="selector" :range="mbtiOptions" :value="mbtiIndex" @change="handleMbtiChange">
              <view class="select">
                <text>{{ selectedMbti || '请选择' }}</text>
                <uni-icons type="arrowdown" size="14" color="rgba(255,255,255,.45)" />
              </view>
            </picker>
          </view>
        </view>

        <view v-if="activity.questions && activity.questions.length" class="form__field">
          <text class="form__label">局长设问 *</text>
          <view v-for="(question, index) in activity.questions" :key="question" class="question">
            <text class="question__title">{{ question }}</text>
            <textarea
              class="textarea textarea--small"
              :value="answers[index]"
              maxlength="120"
              auto-height
              adjust-position="false"
              cursor-spacing="28"
              placeholder="回答一下局长的问题..."
              placeholder-class="textarea__placeholder"
              @input="handleAnswerInput(index, $event)"
            />
          </view>
        </view>

        <view class="form__field">
          <view class="form__label-line">
            <text class="form__label">上车宣言 *</text>
            <text class="form__hint">真诚必杀</text>
          </view>
          <textarea
            class="textarea"
            :value="message"
            maxlength="180"
            auto-height
            adjust-position="false"
            cursor-spacing="28"
            placeholder="介绍一下自己，或者告诉局长你为什么想来..."
            placeholder-class="textarea__placeholder"
            @input="message = $event.detail.value"
          />
        </view>

        <view class="notice">
          <view class="notice__icon">
            <uni-icons type="auth-filled" size="22" color="#818cf8" />
          </view>
          <view class="notice__content">
            <text class="notice__title">上车须知</text>
            <text class="notice__text">{{ noticeText }}</text>
            <text v-if="activity.requireApproval" class="notice__text">申请通过后会在消息页通知你。</text>
          </view>
        </view>

        <button class="submit" :class="{ 'submit--disabled': !canSubmit || isSubmitting }" :disabled="!canSubmit || isSubmitting" @tap="handleSubmit">
          <text>{{ isSubmitting ? '提交中...' : submitText }}</text>
          <uni-icons v-if="!isSubmitting" type="paperplane-filled" size="18" color="#0f172a" />
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getActivityDetail } from '@/common/api/activity.js'
import { submitApplication } from '@/common/api/application.js'
import { createEmptyActivity } from '@/common/utils/activity-default.js'
import { getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goBackOrFallback, goPayment, goSuccess } from '@/common/utils/route.js'

const activity = ref(createEmptyActivity('101'))
const gender = ref('')
const mbtiIndex = ref(0)
const message = ref('')
const answers = ref([])
const isSubmitting = ref(false)
const navStyle = getMiniProgramNavStyle()
const navRowStyle = getMiniProgramNavRowStyle({ leftPaddingRpx: 34, minRightPaddingRpx: 24 })
const contentTopStyle = getMiniProgramNavContentStyle({ gapRpx: 20 })

const genderOptions = [
  { label: '男', value: 'male' },
  { label: '女', value: 'female' }
]

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

const shortLocation = computed(() => {
  return (activity.value.location || '').split(' 路 ')[0] || activity.value.location
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
  if (activity.value.partyMode === 'free') return '申请入局'
  return '提交申请并确认订单'
})

const requiredAnswersDone = computed(() => {
  if (!activity.value.questions || !activity.value.questions.length) return true
  return activity.value.questions.every((_, index) => String(answers.value[index] || '').trim().length > 0)
})

const canSubmit = computed(() => {
  return gender.value && message.value.trim().length > 0 && requiredAnswersDone.value
})

onLoad(async (query) => {
  activity.value = await getActivityDetail((query && query.id) || '101')
  answers.value = (activity.value.questions || []).map(() => '')
  validateJoinEligibility(true)
})

function handleMbtiChange(event) {
  mbtiIndex.value = Number(event.detail.value)
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
    answers: (activity.value.questions || []).map((question, index) => ({
      question,
      answer: answers.value[index] || ''
    })),
    requireApproval: activity.value.requireApproval
  }

  await submitApplication(application)

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
.register {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  padding-right: 34rpx;
  padding-bottom: 56rpx;
  padding-left: 34rpx;
  background: #0f172a;
}

.register__glow {
  position: absolute;
  width: 420rpx;
  height: 420rpx;
  border-radius: 50%;
  filter: blur(92rpx);
  opacity: 0.32;
}

.register__glow--green {
  top: -100rpx;
  left: -140rpx;
  background: #10b981;
}

.register__glow--blue {
  right: -150rpx;
  bottom: -120rpx;
  background: #6366f1;
}

.register__nav {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 3;
}

.register__nav-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.register__nav-spacer {
  width: 64rpx;
  height: 64rpx;
}

.register__close {
  display: flex;
  width: 64rpx;
  height: 64rpx;
  align-items: center;
  justify-content: center;
}

.register__panel {
  position: relative;
  z-index: 2;
  padding: 48rpx 34rpx 36rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.12);
  border-radius: 54rpx;
  background: rgba(255, 255, 255, 0.1);
  box-shadow: 0 28rpx 90rpx rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(22px);
}

.register__header {
  display: flex;
  align-items: center;
  flex-direction: column;
  text-align: center;
}

.register__spark {
  display: flex;
  width: 116rpx;
  height: 116rpx;
  align-items: center;
  justify-content: center;
  border: 1rpx solid rgba(52, 211, 153, 0.32);
  border-radius: 34rpx;
  background: rgba(16, 185, 129, 0.18);
}

.register__title {
  margin-top: 28rpx;
  color: #fff;
  font-size: 54rpx;
  font-weight: 900;
  line-height: 1;
}

.register__subtitle {
  max-width: 500rpx;
  margin-top: 16rpx;
  color: rgba(255, 255, 255, 0.5);
  font-size: 22rpx;
  font-weight: 900;
  line-height: 1.65;
}

.register__activity {
  display: flex;
  gap: 22rpx;
  margin-top: 42rpx;
  padding: 18rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 30rpx;
  background: rgba(255, 255, 255, 0.06);
}

.register__cover {
  width: 136rpx;
  height: 136rpx;
  flex: 0 0 136rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.1);
}

.register__activity-info {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  justify-content: center;
}

.register__activity-title {
  color: #fff;
  font-size: 27rpx;
  font-weight: 900;
  line-height: 1.4;
}

.register__activity-meta {
  margin-top: 12rpx;
  color: rgba(255, 255, 255, 0.38);
  font-size: 21rpx;
  font-weight: 800;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 34rpx;
  margin-top: 42rpx;
}

.form__row {
  display: flex;
  gap: 22rpx;
}

.form__field {
  min-width: 0;
}

.form__field--half {
  flex: 1;
}

.form__label,
.form__hint {
  display: block;
  padding-left: 10rpx;
  color: rgba(255, 255, 255, 0.42);
  font-size: 20rpx;
  font-weight: 900;
}

.form__label-line {
  display: flex;
  justify-content: space-between;
  margin-bottom: 14rpx;
}

.form__hint {
  padding-left: 0;
  color: rgba(255, 255, 255, 0.22);
}

.segmented {
  display: flex;
  gap: 6rpx;
  margin-top: 14rpx;
  padding: 6rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.06);
}

.segmented__item {
  display: flex;
  height: 64rpx;
  flex: 1;
  align-items: center;
  justify-content: center;
  border-radius: 19rpx;
  color: rgba(255, 255, 255, 0.58);
  font-size: 23rpx;
  font-weight: 900;
}

.segmented__item--active {
  background: #fff;
  color: #0f172a;
}

.select {
  display: flex;
  height: 78rpx;
  align-items: center;
  justify-content: space-between;
  margin-top: 14rpx;
  padding: 0 24rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  font-size: 23rpx;
  font-weight: 900;
}

.question {
  margin-top: 24rpx;
}

.question__title {
  display: block;
  margin-bottom: 12rpx;
  padding-left: 10rpx;
  color: rgba(255, 255, 255, 0.82);
  font-size: 23rpx;
  font-weight: 800;
}

.textarea {
  width: 100%;
  min-height: 168rpx;
  padding: 30rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 34rpx;
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  font-size: 25rpx;
  font-weight: 700;
  line-height: 1.55;
}

.textarea--small {
  min-height: 104rpx;
  border-radius: 26rpx;
}

.textarea__placeholder {
  color: rgba(255, 255, 255, 0.22);
}

.notice {
  display: flex;
  gap: 20rpx;
  padding: 24rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.06);
}

.notice__icon {
  display: flex;
  width: 58rpx;
  height: 58rpx;
  flex: 0 0 58rpx;
  align-items: center;
  justify-content: center;
  border-radius: 18rpx;
  background: rgba(99, 102, 241, 0.18);
}

.notice__content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8rpx;
}

.notice__title {
  color: #fff;
  font-size: 22rpx;
  font-weight: 900;
}

.notice__text {
  color: rgba(255, 255, 255, 0.44);
  font-size: 20rpx;
  font-weight: 800;
  line-height: 1.55;
}

.submit {
  display: flex;
  height: 102rpx;
  align-items: center;
  justify-content: center;
  gap: 14rpx;
  border-radius: 34rpx;
  background: #fff;
  color: #0f172a;
  font-size: 29rpx;
  font-weight: 900;
  box-shadow: 0 24rpx 60rpx rgba(255, 255, 255, 0.16);
}

.submit--disabled {
  opacity: 0.48;
}
</style>
