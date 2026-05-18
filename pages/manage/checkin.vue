<template>
  <view class="checkin su-page">
    <view class="checkin__nav" :style="navStyle">
      <view class="checkin__nav-row" :style="navRowStyle">
        <view class="checkin__nav-btn" @tap="handleBack">
          <SuIcon name="left" size="48" glyph-size="24" variant="inline" color="#fff" />
        </view>
        <text class="checkin__nav-title">签到核销</text>
        <view class="checkin__nav-btn" @tap="refreshCode">
          <SuIcon name="refresh" size="40" glyph-size="20" variant="inline" color="#fff" />
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="checkin__scroll" :style="contentTopStyle">
      <view class="hero">
        <text class="hero__kicker">CHECK-IN DESK</text>
        <text class="hero__title">{{ activity.title }}</text>
        <text class="hero__meta">{{ activity.date }} {{ activity.time }} - {{ activity.location }}</text>
      </view>

      <view class="stats">
        <view class="stat">
          <text>已签到</text>
          <text>{{ checkedCount }}</text>
        </view>
        <view class="stat stat--blue">
          <text>待核销</text>
          <text>{{ pendingCount }}</text>
        </view>
        <view class="stat stat--green">
          <text>总人数</text>
          <text>{{ participantList.length }}</text>
        </view>
      </view>

      <view class="panel panel--code">
        <view class="panel__head">
          <view>
            <text class="panel__title">成员凭证核销</text>
          </view>
        </view>

        <view class="code-box">
          <SuQrCode v-if="nextCheckablePerson" class="code-box__qr" :value="nextCheckablePerson.entryCode" :size="304" />
          <text class="code-box__value">{{ nextCheckablePerson ? nextCheckablePerson.entryCode : '暂无待核销' }}</text>
        </view>

        <view class="code-actions">
          <view class="code-actions__input">
            <input v-model="codeInput" adjust-position="false" cursor-spacing="28" placeholder="输入成员入场凭证码" placeholder-class="input-placeholder" />
          </view>
          <view class="code-actions__button" @tap="confirmByCode">
            <SuIcon name="check" size="36" glyph-size="18" variant="inline" color="#fff" />
            <text>确认</text>
          </view>
        </view>

        <view class="scan-button" @tap="scanCheckinCode()">
          <SuIcon name="scan" size="44" glyph-size="22" variant="inline" color="#0f172a" />
          <text>扫码核销</text>
        </view>
      </view>

      <view class="panel">
        <view class="panel__head">
          <view>
            <text class="panel__title">参与者列表</text>
          </view>
          <text class="panel__hint">{{ checkedCount }}/{{ participantList.length }}</text>
        </view>

        <view v-for="person in participantList" :key="person.userId" class="member">
          <image class="member__avatar" :src="person.avatar" mode="aspectFill" @tap.stop="goUserDetail(person.userId, { activityId: activity.id })" />
          <view class="member__body">
            <view class="member__row">
              <text class="member__name">{{ person.name }}</text>
              <text class="member__status" :class="{ 'member__status--done': person.checked }">
                {{ person.checked ? '已签到' : getStatusLabel(person) }}
              </text>
            </view>
            <text class="member__meta">{{ person.note }}</text>
          </view>
          <view class="member__button" :class="{ 'member__button--done': person.checked }" @tap="toggleCheckin(person)">
            <SuIcon :name="person.checked ? 'checkmarkempty' : 'scan'" size="36" glyph-size="18" variant="inline" :color="person.checked ? '#16a34a' : '#fff'" />
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import SuIcon from '@/components/surego/SuIcon.vue'
import { computed, ref } from 'vue'
import { onLoad, onPullDownRefresh, onShow } from '@dcloudio/uni-app'
import { getActivityDetail } from '@/common/api/activity.js'
import { listApplications } from '@/common/api/application.js'
import { buildParticipantCheckinCode, confirmCheckin, getCheckinSummary, isValidCheckinCode, parseScannedCheckinCode } from '@/common/api/checkin.js'
import { listActivityMembers } from '@/common/api/member.js'
import { createEmptyActivity } from '@/common/utils/activity-default.js'
import { makeRefreshHandler } from '@/common/utils/refresh.js'
import { getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goActivityDetail, goBackOrFallback, goUserDetail } from '@/common/utils/route.js'
import SuQrCode from '@/components/surego/SuQrCode.vue'

const activityId = ref('103')
const activity = ref(createEmptyActivity('103'))
const applications = ref([])
const memberProfiles = ref([])
const checkins = ref([])
const codeInput = ref('')
const navStyle = getMiniProgramNavStyle()
const navRowStyle = getMiniProgramNavRowStyle({ leftPaddingRpx: 34, minRightPaddingRpx: 24 })
const contentTopStyle = getMiniProgramNavContentStyle({ gapRpx: 20 })

const checkinSourceOptions = {
  manual: { source: 'manual' },
  scan: { source: 'scan' }
}

const participantList = computed(() => {
  const baseMembers = memberProfiles.value.map((item) => ({
    userId: item.userId || item.id,
    name: item.name,
    avatar: item.avatar,
    status: 'approved',
    note: item.role || '参与者',
    isMe: Boolean(item.isMe),
    role: item.role || '参与者'
  }))

  const applicantMembers = applications.value
    .filter((item) => item.status === 'approved' || item.status === 'pending' || item.status === 'waitlist')
    .map((item, index) => ({
      userId: item.userId || item.id,
      name: item.nickname || `申请者 ${index + 1}`,
      avatar: `https://api.dicebear.com/7.x/avataaars/png?seed=${item.id}`,
      status: item.status,
      note: item.message || '来自报名申请',
      isMe: false,
      role: item.status === 'waitlist' ? '候补' : '参与者'
    }))

  const knownIds = new Set([...baseMembers, ...applicantMembers].map((person) => person.userId))
  const checkedGuests = checkins.value
    .filter((item) => !knownIds.has(item.userId))
    .map((item, index) => ({
      userId: item.userId,
      name: item.nickname || `现场用户 ${index + 1}`,
      avatar: `https://api.dicebear.com/7.x/avataaars/png?seed=${item.userId}`,
      status: 'approved',
      note: '已通过入场凭证签到',
      isMe: false,
      role: '参与者'
    }))

  const merged = [...baseMembers, ...applicantMembers, ...checkedGuests]
  return merged.map((person) => ({
    ...person,
    checked: checkins.value.some((item) => item.userId === person.userId),
    entryCode: buildParticipantCheckinCode(activityId.value, person.userId)
  }))
})

const checkedCount = computed(() => participantList.value.filter((item) => item.checked).length)
const pendingCount = computed(() => Math.max(0, participantList.value.length - checkedCount.value))
const nextCheckablePerson = computed(() => participantList.value.find((item) => !item.checked && !['pending', 'waitlist'].includes(item.status)) || null)

onLoad(async (query) => {
  activityId.value = (query && query.id) || '103'
  await loadState()
})

onShow(async () => {
  await loadState()
})

onPullDownRefresh(makeRefreshHandler(loadState))

async function loadState() {
  activity.value = await getActivityDetail(activityId.value)
  if (!ensureOwnerAccess()) return
  applications.value = await listApplications(activityId.value)
  memberProfiles.value = await listActivityMembers(activityId.value)
  const summary = await getCheckinSummary(activityId.value, activity.value.participantCount)
  checkins.value = summary.items || []
}

function ensureOwnerAccess() {
  if (activity.value?.isCreator) return true
  uni.showToast({ title: '只有局长可以核销签到', icon: 'none' })
  setTimeout(() => {
    goActivityDetail(activity.value?.id || activityId.value, { replace: true })
  }, 500)
  return false
}

function handleBack() {
  const id = activity.value?.id || activityId.value
  goBackOrFallback(`/pages/manage/dashboard?id=${encodeURIComponent(id)}`)
}

async function refreshCode() {
  codeInput.value = ''
  await loadState()
  uni.showToast({ title: '核销状态已刷新', icon: 'none' })
}

function getStatusLabel(person) {
  if (person.status === 'waitlist') return '候补中'
  return person.status === 'pending' ? '待审核' : '待签到'
}

async function toggleCheckin(person) {
  if (person.checked) {
    uni.showToast({ title: '该成员已签到', icon: 'none' })
    return
  }

  if (person.isMe || person.role === '局长') {
    await confirmPerson(person, person.entryCode, checkinSourceOptions.manual.source)
    return
  }

  await scanCheckinCode(person)
}

async function confirmByCode() {
  const code = codeInput.value.trim()
  if (!isValidCheckinCode(code)) {
    uni.showToast({ title: '请输入 SG 开头核销码', icon: 'none' })
    return
  }

  const target = participantList.value.find((person) => person.entryCode === parseScannedCheckinCode(code))
  if (!target) {
    uni.showToast({ title: '未找到对应成员', icon: 'none' })
    return
  }

  await confirmPerson(target, code, checkinSourceOptions.manual.source)
  codeInput.value = ''
}

async function simulateScanCheckin(target = null) {
  const person = target || nextCheckablePerson.value
  if (!person) {
    uni.showToast({ title: '暂无可签到成员', icon: 'none' })
    return
  }
  codeInput.value = person.entryCode
  await confirmPerson(person, person.entryCode, checkinSourceOptions.scan.source)
}

async function scanCheckinCode(target = null) {
  if (typeof uni.scanCode !== 'function') {
    await simulateScanCheckin(target)
    return
  }

  uni.scanCode({
    onlyFromCamera: true,
    scanType: ['qrCode', 'barCode'],
    success: async (result) => {
      const code = parseScannedCheckinCode(result.result)
      if (!isValidCheckinCode(code)) {
        uni.showToast({ title: '未识别到有效凭证码', icon: 'none' })
        return
      }
      const matchedPerson = target
        ? (target.entryCode === code ? target : null)
        : participantList.value.find((person) => person.entryCode === code)
      if (!matchedPerson) {
        uni.showToast({ title: '该凭证不属于本活动成员', icon: 'none' })
        return
      }
      codeInput.value = code
      await confirmPerson(matchedPerson, code, checkinSourceOptions.scan.source)
    },
    fail: async (error) => {
      const message = String(error?.errMsg || '')
      if (message.includes('cancel')) return
      await simulateScanCheckin(target)
    }
  })
}

async function confirmNextByScan() {
  await scanCheckinCode(nextCheckablePerson.value)
}

async function confirmPerson(person, code, source = 'manual') {
  if (person.status === 'pending' || person.status === 'waitlist') {
    uni.showToast({ title: person.status === 'waitlist' ? '候补未补位，不能签到' : '待审核成员不能签到', icon: 'none' })
    return
  }

  if (person.checked) {
    uni.showToast({ title: '该成员已签到', icon: 'none' })
    return
  }

  const result = await confirmCheckin({
    activityId: activityId.value,
    userId: person.userId,
    code,
    source,
    remark: source === 'scan' ? '局长扫码核销' : '局长手动输入核销',
    checkedBy: 'leader'
  })
  if (!result) return
  await loadState()
  uni.showToast({ title: `${person.name} 已签到`, icon: 'none' })
}
</script>

<style scoped>
.checkin {
  min-height: 100vh;
  background: #0f172a;
}
.checkin__nav {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 20;
  color: #fff;
  background: rgba(15, 23, 42, 0.82);
  backdrop-filter: blur(18px);
}
.checkin__nav-row {
  display: flex;
  box-sizing: border-box;
  align-items: center;
  justify-content: space-between;
}
.checkin__nav-title {
  font-size: 30rpx;
  font-weight: 900;
}
.checkin__nav-btn {
  display: flex;
  width: 64rpx;
  height: 64rpx;
  align-items: center;
  justify-content: center;
}
.checkin__scroll {
  height: 100vh;
  box-sizing: border-box;
}
.hero {
  padding: 0 40rpx 38rpx;
}
.hero__kicker {
  color: #818cf8;
  font-size: 20rpx;
  font-weight: 900;
}
.hero__title {
  display: block;
  margin-top: 14rpx;
  color: #fff;
  font-size: 42rpx;
  font-weight: 900;
  line-height: 1.38;
}
.hero__meta {
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
  padding: 0 28rpx 28rpx;
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
  font-size: 36rpx; font-weight: 900;
}
.stat--blue {
  background: rgba(79, 70, 229, 0.22);
}
.stat--green {
  background: rgba(34, 197, 94, 0.18);
}
.panel {
  margin: 0 28rpx 28rpx;
  padding: 30rpx;
  border-radius: 38rpx;
  background: #fff;
}
.panel--code {
  background: linear-gradient(135deg, #ffffff, #eef2ff);
}
.panel__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18rpx;
}
.panel__title {
  display: block;
  color: #0f172a;
  font-size: 32rpx;
  font-weight: 900;
}
.panel__sub,
.panel__hint {
  display: block;
  margin-top: 6rpx;
  color: #94a3b8;
  font-size: 19rpx;
  font-weight: 900;
}
.code-box {
  display: flex;
  flex-direction: column;
  min-height: 150rpx;
  align-items: center;
  justify-content: center;
  margin-top: 28rpx;
  border: 2rpx dashed rgba(79, 70, 229, 0.28);
  border-radius: 34rpx;
  background: rgba(79, 70, 229, 0.08);
  padding: 24rpx;
}
.code-box__qr {
  margin-bottom: 18rpx;
}
.code-box__value {
  color: #0f172a;
  font-size: 40rpx; font-weight: 900;
  letter-spacing: 4rpx;
  text-align: center;
}
.code-actions {
  display: grid;
  grid-template-columns: 1fr 170rpx;
  gap: 16rpx;
  margin-top: 24rpx;
}
.code-actions__input {
  display: flex;
  height: 86rpx;
  align-items: center;
  padding: 0 24rpx;
  border-radius: 26rpx;
  background: #fff;
}
.code-actions__input input {
  width: 100%;
  color: #0f172a;
  font-size: 25rpx;
  font-weight: 800;
}
.input-placeholder {
  color: #cbd5e1;
}
.code-actions__button,
.scan-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  border-radius: 26rpx;
  font-size: 24rpx;
  font-weight: 900;
}
.code-actions__button {
  background: #0f172a;
  color: #fff;
}
.scan-button {
  height: 86rpx;
  margin-top: 18rpx;
  background: #fff;
  color: #0f172a;
}
.member {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 22rpx 0;
  border-top: 1rpx solid #f1f5f9;
}
.member:first-of-type {
  border-top: 0;
}
.member__avatar {
  width: 78rpx;
  height: 78rpx;
  flex: 0 0 78rpx;
  border-radius: 26rpx;
  background: #eef2ff;
}
.member__body {
  flex: 1;
  min-width: 0;
}
.member__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}
.member__name {
  color: #0f172a;
  font-size: 26rpx;
  font-weight: 900;
}
.member__status {
  padding: 7rpx 14rpx;
  border-radius: 999rpx;
  background: #fef3c7;
  color: #d97706;
  font-size: 18rpx;
  font-weight: 900;
}
.member__status--done {
  background: #dcfce7;
  color: #16a34a;
}
.member__meta {
  display: block;
  margin-top: 8rpx;
  color: #94a3b8;
  font-size: 21rpx;
  font-weight: 800;
}
.member__button {
  display: flex;
  width: 68rpx;
  height: 68rpx;
  flex: 0 0 68rpx;
  align-items: center;
  justify-content: center;
  border-radius: 24rpx;
  background: #0f172a;
}
.member__button--done {
  background: #dcfce7;
}
</style>
