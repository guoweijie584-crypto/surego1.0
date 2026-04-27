<template>
  <view class="detail su-page">
    <view class="detail__nav">
      <view class="detail__nav-btn" @tap="goBackHome">
        <uni-icons type="left" size="24" color="#0f172a" />
      </view>
      <text class="detail__nav-title">活动详情</text>
      <view class="detail__nav-actions">
        <view class="detail__nav-btn" @tap="showShare = true">
          <uni-icons type="redo" size="22" color="#0f172a" />
        </view>
        <view class="detail__nav-btn" @tap="showMore = true">
          <uni-icons type="more-filled" size="22" color="#0f172a" />
        </view>
      </view>
    </view>

    <view class="detail__main">
      <view class="hero-card">
        <view class="hero-card__image-wrap">
          <image class="hero-card__image" :src="activity.image" mode="aspectFill" />
          <view class="hero-card__mode" :class="`hero-card__mode--${activity.partyMode}`">
            <uni-icons :type="mode.icon" size="13" color="#fff" />
            <text>{{ mode.label }}</text>
          </view>
          <view class="hero-card__hot">
            <text>热行中</text>
          </view>
        </view>
        <view class="hero-card__content">
          <text class="hero-card__title">{{ activity.title }}</text>
          <view class="hero-card__meta">
            <uni-icons type="calendar" size="16" color="#94a3b8" />
            <text>{{ activity.date }} {{ activity.time }} - {{ activity.endTime }}</text>
          </view>
          <view class="hero-card__meta" @tap="openLocation">
            <uni-icons type="location" size="16" color="#94a3b8" />
            <text class="su-line-1">{{ activity.location }}</text>
          </view>
          <view class="hero-card__chips">
            <text class="hero-card__chip" :class="{ 'hero-card__chip--approval': activity.requireApproval }">
              {{ activity.requireApproval ? '审核制' : '自由报名' }}
            </text>
            <text v-if="activity.partyMode !== 'free'" class="hero-card__hint">{{ mode.desc }}</text>
          </view>
          <view class="hero-card__status">
            <view class="hero-card__status-dot" :class="statusClass" />
            <text>{{ statusText }}</text>
          </view>
        </view>
      </view>

      <view class="detail-card detail-card--intro">
        <uni-icons type="chatbubble-filled" size="48" color="rgba(34,197,94,.18)" />
        <text class="detail-card__kicker">活动详情</text>
        <text class="detail-card__description">“{{ activity.description }}”</text>
      </view>

      <view class="detail-card">
        <view class="progress-head">
          <text class="progress-head__label">当前人数</text>
          <text class="progress-head__count">
            {{ activity.participantCount }}
            <text v-if="activity.hasParticipantLimit"> / {{ activity.maxParticipants }}</text>
          </text>
        </view>
        <view v-if="activity.hasParticipantLimit" class="progress">
          <view class="progress__bar" :style="{ width: progressWidth }" />
        </view>
        <view class="progress-foot">
          <text>{{ seatsLeftText }}</text>
          <text>{{ activity.viewCount }} 次浏览 · {{ activity.likeCount }} 人心动</text>
        </view>
      </view>

      <view class="detail-card">
        <view class="detail-card__head">
          <view>
            <text class="detail-card__title">已确认成员</text>
            <text class="detail-card__sub">CONFIRMED MEMBERS</text>
          </view>
          <text class="detail-card__link" @tap="showComingSoon('成员列表后续迁移')">查看全部</text>
        </view>
        <view class="member-grid">
          <view v-for="member in visibleMembers" :key="member.id" class="member" @tap="selectMember(member)">
            <view class="member__avatar-wrap">
              <image class="member__avatar" :src="member.avatar" mode="aspectFill" />
              <view v-if="member.role === '局长'" class="member__crown">
                <uni-icons type="fire-filled" size="10" color="#fff" />
              </view>
            </view>
            <text class="member__name su-line-1">{{ member.name }}</text>
          </view>
          <view v-if="activity.hasParticipantLimit" class="member member--join" @tap="handlePrimaryAction">
            <view class="member__join">
              <uni-icons type="plusempty" size="24" color="#34d399" />
            </view>
            <text class="member__join-text">待加入</text>
          </view>
        </view>
      </view>

      <view v-if="isLeader" class="command-card">
        <view class="command-card__ghost">
          <uni-icons type="gear-filled" size="108" color="rgba(79,70,229,.08)" />
        </view>
        <view class="command-card__head">
          <view class="command-card__icon">
            <uni-icons type="staff-filled" size="20" color="#fff" />
          </view>
          <view>
            <text class="command-card__title">局面指挥台 / COMMAND</text>
            <text class="command-card__sub">Operational Console V2.0</text>
          </view>
        </view>
        <view class="command-card__stats">
          <view class="command-card__stat">
            <text>集结进度</text>
            <view><text>{{ padCount(activity.participantCount) }}</text><text>/{{ activity.maxParticipants }}</text></view>
          </view>
          <view class="command-card__stat command-card__stat--blue">
            <text>待审申请</text>
            <view><text>03</text></view>
          </view>
        </view>
        <view class="command-card__button" @tap="handlePrimaryAction">
          <text>进入局面管理中心</text>
        </view>
      </view>

      <view v-else class="organizer-card" @tap="showComingSoon('局长主页后续迁移')">
        <image class="organizer-card__avatar" :src="activity.organizerAvatar" mode="aspectFill" />
        <view class="organizer-card__info">
          <text class="organizer-card__name">{{ activity.organizer }}</text>
          <text class="organizer-card__role">本局局长 / FOUNDER</text>
        </view>
        <view class="organizer-card__chat" @tap.stop="showComingSoon('聊天后续迁移')">
          <uni-icons type="chat" size="20" color="#64748b" />
        </view>
      </view>
    </view>

    <view class="bottom-bar su-safe-bottom">
      <view class="bottom-bar__state">
        <text>当前状态</text>
        <view>
          <view class="bottom-bar__dot" :class="statusClass" />
          <text>{{ bottomStatusText }}</text>
        </view>
      </view>
      <view class="bottom-bar__button" :class="primaryButtonClass" @tap="handlePrimaryAction">
        <text>{{ primaryButtonText }}</text>
        <uni-icons :type="primaryIcon" size="18" color="#fff" />
      </view>
    </view>

    <SuActionSheet v-model="showShare" title="分享活动 / SHARE">
      <view class="sheet-grid">
        <button class="sheet-item" open-type="share">
          <view class="sheet-item__icon sheet-item__icon--green">
            <uni-icons type="weixin" size="28" color="#fff" />
          </view>
          <text>微信</text>
        </button>
        <view class="sheet-item" @tap="copySharePath">
          <view class="sheet-item__icon sheet-item__icon--dark">
            <uni-icons type="link" size="28" color="#fff" />
          </view>
          <text>复制链接</text>
        </view>
        <view class="sheet-item" @tap="showComingSoon('海报页后续迁移')">
          <view class="sheet-item__icon sheet-item__icon--blue">
            <uni-icons type="image" size="28" color="#fff" />
          </view>
          <text>生成海报</text>
        </view>
        <view class="sheet-item" @tap="showComingSoon('朋友圈分享需小程序转发能力')">
          <view class="sheet-item__icon sheet-item__icon--emerald">
            <uni-icons type="pyq" size="28" color="#fff" />
          </view>
          <text>朋友圈</text>
        </view>
      </view>
    </SuActionSheet>

    <SuActionSheet v-model="showMore" title="更多操作 / MORE">
      <view class="more-list">
        <view class="more-list__item more-list__item--danger" @tap="toastAndClose('举报已提交')">
          <uni-icons type="flag" size="20" color="#ef4444" />
          <text>举报该活动</text>
        </view>
        <view class="more-list__item" @tap="toastAndClose('已减少类似推荐')">
          <uni-icons type="hand-down-filled" size="20" color="#64748b" />
          <text>不喜欢这类内容</text>
        </view>
        <view class="more-list__item" @tap="toastAndClose('成行平台 v1.0')">
          <uni-icons type="info" size="20" color="#64748b" />
          <text>关于成行平台</text>
        </view>
      </view>
    </SuActionSheet>

    <view v-if="selectedMember" class="member-modal">
      <view class="member-modal__mask" @tap="selectedMember = null" />
      <view class="member-modal__panel">
        <image class="member-modal__avatar" :src="selectedMember.avatar" mode="aspectFill" />
        <text class="member-modal__name">{{ selectedMember.name }}</text>
        <text class="member-modal__role">{{ selectedMember.role }}</text>
        <view class="member-modal__rows">
          <view><text>参与次数</text><text>12 次</text></view>
          <view><text>信用分</text><text>96 分</text></view>
          <view><text>加入时间</text><text>今天</text></view>
        </view>
        <view class="member-modal__button" @tap="selectedMember = null">知道了</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onShareAppMessage } from '@dcloudio/uni-app'
import SuActionSheet from '@/components/surego/SuActionSheet.vue'
import { getActivityDetail } from '@/common/api/activity.js'
import { activities, members } from '@/common/mock/activities.js'
import { goActivityRegister, goBackHome, goManageDashboard, goParticipantDashboard, showComingSoon } from '@/common/utils/route.js'

const activity = ref(activities[0])
const showShare = ref(false)
const showMore = ref(false)
const selectedMember = ref(null)

const visibleMembers = computed(() => members.slice(0, Math.min(activity.value.participantCount, members.length)))
const isLeader = computed(() => activity.value.isCreator)
const isJoined = computed(() => activity.value.status === 'approved' || isLeader.value)

const mode = computed(() => {
  if (activity.value.partyMode === 'sincerity') {
    return { label: `诚意金 ¥${activity.value.amount}`, desc: '签到后全额退回', icon: 'wallet' }
  }
  if (activity.value.partyMode === 'ticket') {
    return { label: `门票 ¥${activity.value.amount}`, desc: '支付后参与', icon: 'paperplane-filled' }
  }
  return { label: '免费局', desc: '免费参与', icon: 'checkmarkempty' }
})

const progressWidth = computed(() => {
  if (!activity.value.hasParticipantLimit) return '0%'
  return `${Math.min(100, Math.round((activity.value.participantCount / activity.value.maxParticipants) * 100))}%`
})

const seatsLeftText = computed(() => {
  if (!activity.value.hasParticipantLimit) return '不限人数，开放报名中'
  const left = Math.max(0, activity.value.maxParticipants - activity.value.participantCount)
  return left > 0 ? `还剩 ${left} 个名额` : '名额已满'
})

const statusText = computed(() => {
  if (isLeader.value) return '作为局长管理中'
  if (activity.value.status === 'approved') return '已获得准入'
  if (activity.value.status === 'pending') return '申请审核中'
  return '开放申请中'
})

const bottomStatusText = computed(() => statusText.value)

const statusClass = computed(() => {
  if (activity.value.status === 'pending') return 'is-pending'
  if (activity.value.status === 'rejected') return 'is-rejected'
  return 'is-ready'
})

const primaryButtonText = computed(() => {
  if (isLeader.value) return '局面中心'
  if (isJoined.value) return '入场凭证'
  if (activity.value.status === 'pending') return '审核中'
  return '申请入局'
})

const primaryIcon = computed(() => {
  if (isLeader.value) return 'staff-filled'
  if (isJoined.value) return 'paperplane-filled'
  return 'fire-filled'
})

const primaryButtonClass = computed(() => ({
  'bottom-bar__button--disabled': activity.value.status === 'pending',
  'bottom-bar__button--leader': isLeader.value
}))

onLoad(async (query) => {
  activity.value = await getActivityDetail((query && query.id) || '101')
})

onShareAppMessage(() => ({
  title: activity.value.title,
  path: `/pages/activity/detail?id=${activity.value.id}`,
  imageUrl: activity.value.image
}))

function padCount(count) {
  return String(count).padStart(2, '0')
}

function openLocation() {
  uni.showToast({
    title: '地图能力后续接入 uni.openLocation',
    icon: 'none'
  })
}

function selectMember(member) {
  selectedMember.value = member
}

function handlePrimaryAction() {
  if (activity.value.status === 'pending') return
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
    data: `/pages/activity/detail?id=${activity.value.id}`,
    success() {
      showShare.value = false
    }
  })
}

function toastAndClose(title) {
  uni.showToast({ title, icon: 'none' })
  showMore.value = false
}
</script>

<style scoped>
.detail {
  min-height: 100vh;
  padding-bottom: 178rpx;
  background: #f0f4f8;
}

.detail__nav {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 30;
  display: flex;
  height: 136rpx;
  align-items: flex-end;
  justify-content: space-between;
  padding: 0 34rpx 18rpx;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.65);
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(18px);
}

.detail__nav-title {
  color: #1e293b;
  font-size: 28rpx;
  font-weight: 900;
}

.detail__nav-actions {
  display: flex;
  gap: 18rpx;
}

.detail__nav-btn {
  display: flex;
  width: 58rpx;
  height: 58rpx;
  align-items: center;
  justify-content: center;
}

.detail__main {
  display: flex;
  flex-direction: column;
  gap: 28rpx;
  padding: 164rpx 34rpx 0;
}

.hero-card,
.detail-card,
.organizer-card,
.command-card {
  overflow: hidden;
  border: 1rpx solid rgba(255, 255, 255, 0.86);
  border-radius: 50rpx;
  background: #fff;
  box-shadow: 0 14rpx 44rpx rgba(15, 23, 42, 0.04);
}

.hero-card__image-wrap {
  position: relative;
  height: 386rpx;
  background: #e2e8f0;
}

.hero-card__image {
  width: 100%;
  height: 100%;
}

.hero-card__mode,
.hero-card__hot {
  position: absolute;
  top: 28rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 11rpx 20rpx;
  border-radius: 999rpx;
  color: #fff;
  font-size: 20rpx;
  font-weight: 900;
}

.hero-card__mode {
  left: 28rpx;
  background: #22c55e;
}

.hero-card__mode--sincerity {
  background: #ef4444;
}

.hero-card__mode--ticket {
  background: #8b5cf6;
}

.hero-card__hot {
  right: 28rpx;
  background: rgba(16, 185, 129, 0.9);
}

.hero-card__content {
  padding: 36rpx;
}

.hero-card__title {
  display: block;
  color: #0f172a;
  font-size: 39rpx;
  font-weight: 900;
  line-height: 1.45;
}

.hero-card__meta {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 22rpx;
  color: #64748b;
  font-size: 25rpx;
  font-weight: 800;
}

.hero-card__chips {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin-top: 24rpx;
}

.hero-card__chip {
  padding: 9rpx 18rpx;
  border-radius: 12rpx;
  background: #dcfce7;
  color: #16a34a;
  font-size: 20rpx;
  font-weight: 900;
}

.hero-card__chip--approval {
  background: #e0e7ff;
  color: #4f46e5;
}

.hero-card__hint {
  color: #94a3b8;
  font-size: 21rpx;
  font-weight: 800;
}

.hero-card__status {
  display: inline-flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 24rpx;
  padding: 10rpx 20rpx;
  border-radius: 999rpx;
  background: #dcfce7;
  color: #15803d;
  font-size: 21rpx;
  font-weight: 900;
}

.hero-card__status-dot,
.bottom-bar__dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #22c55e;
}

.is-pending {
  background: #f59e0b;
}

.is-rejected {
  background: #ef4444;
}

.is-ready {
  background: #22c55e;
}

.detail-card {
  padding: 36rpx;
}

.detail-card--intro {
  position: relative;
  padding: 52rpx 46rpx;
}

.detail-card__kicker {
  display: block;
  margin-top: -46rpx;
  color: #cbd5e1;
  font-size: 22rpx;
  font-weight: 900;
}

.detail-card__description {
  display: block;
  margin-top: 24rpx;
  color: #334155;
  font-size: 33rpx;
  font-style: italic;
  font-weight: 800;
  line-height: 1.72;
}

.progress-head,
.progress-foot,
.detail-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.progress-head__label,
.detail-card__sub {
  color: #cbd5e1;
  font-size: 20rpx;
  font-weight: 900;
}

.progress-head__count {
  color: #0f172a;
  font-size: 36rpx;
  font-weight: 900;
}

.progress-head__count text {
  color: #cbd5e1;
  font-size: 26rpx;
  font-style: italic;
}

.progress {
  height: 14rpx;
  margin-top: 22rpx;
  overflow: hidden;
  border-radius: 999rpx;
  background: #f1f5f9;
}

.progress__bar {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #22c55e, #3b82f6);
}

.progress-foot {
  margin-top: 18rpx;
  color: #94a3b8;
  font-size: 21rpx;
  font-weight: 800;
}

.detail-card__title {
  display: block;
  color: #0f172a;
  font-size: 31rpx;
  font-weight: 900;
}

.detail-card__link {
  color: #3b82f6;
  font-size: 22rpx;
  font-weight: 900;
}

.member-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 26rpx 18rpx;
  margin-top: 34rpx;
}

.member {
  display: flex;
  min-width: 0;
  align-items: center;
  flex-direction: column;
  gap: 12rpx;
}

.member__avatar-wrap {
  position: relative;
}

.member__avatar,
.member__join {
  width: 92rpx;
  height: 92rpx;
  border-radius: 50%;
}

.member__avatar {
  border: 4rpx solid #fff;
  box-shadow: 0 10rpx 24rpx rgba(15, 23, 42, 0.12);
}

.member__crown {
  position: absolute;
  right: -2rpx;
  bottom: -4rpx;
  display: flex;
  width: 30rpx;
  height: 30rpx;
  align-items: center;
  justify-content: center;
  border: 4rpx solid #fff;
  border-radius: 10rpx;
  background: #4f46e5;
}

.member__name,
.member__join-text {
  width: 100%;
  color: #64748b;
  text-align: center;
  font-size: 19rpx;
  font-weight: 900;
}

.member__join {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3rpx dashed #bbf7d0;
  background: #f0fdf4;
}

.member__join-text {
  color: #34d399;
}

.command-card {
  position: relative;
  padding: 42rpx;
}

.command-card__ghost {
  position: absolute;
  top: 28rpx;
  right: 24rpx;
}

.command-card__head {
  position: relative;
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.command-card__icon {
  display: flex;
  width: 70rpx;
  height: 70rpx;
  align-items: center;
  justify-content: center;
  border-radius: 24rpx;
  background: #4f46e5;
  box-shadow: 0 12rpx 30rpx rgba(79, 70, 229, 0.3);
}

.command-card__title,
.command-card__sub {
  display: block;
}

.command-card__title {
  color: #0f172a;
  font-size: 24rpx;
  font-weight: 900;
}

.command-card__sub {
  margin-top: 5rpx;
  color: #cbd5e1;
  font-size: 17rpx;
  font-weight: 900;
}

.command-card__stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 22rpx;
  margin-top: 42rpx;
}

.command-card__stat {
  padding: 30rpx;
  border-radius: 34rpx;
  background: #f8fafc;
}

.command-card__stat--blue {
  background: rgba(79, 70, 229, 0.08);
}

.command-card__stat > text {
  display: block;
  color: #cbd5e1;
  font-size: 19rpx;
  font-weight: 900;
}

.command-card__stat view {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
  margin-top: 10rpx;
}

.command-card__stat view text:first-child {
  color: #0f172a;
  font-size: 46rpx;
  font-style: italic;
  font-weight: 900;
}

.command-card__stat view text:last-child {
  color: #cbd5e1;
  font-size: 21rpx;
  font-weight: 900;
}

.command-card__button {
  display: flex;
  height: 88rpx;
  align-items: center;
  justify-content: center;
  margin-top: 38rpx;
  border-radius: 26rpx;
  background: #0f172a;
  color: #fff;
  font-size: 22rpx;
  font-weight: 900;
}

.organizer-card {
  display: flex;
  align-items: center;
  gap: 26rpx;
  padding: 38rpx;
}

.organizer-card__avatar {
  width: 106rpx;
  height: 106rpx;
  border-radius: 28rpx;
  background: #f1f5f9;
}

.organizer-card__info {
  flex: 1;
  min-width: 0;
}

.organizer-card__name {
  display: block;
  color: #0f172a;
  font-size: 34rpx;
  font-weight: 900;
}

.organizer-card__role {
  display: block;
  margin-top: 6rpx;
  color: #94a3b8;
  font-size: 20rpx;
  font-weight: 900;
}

.organizer-card__chat {
  display: flex;
  width: 82rpx;
  height: 82rpx;
  align-items: center;
  justify-content: center;
  border-radius: 28rpx;
  background: #f8fafc;
}

.bottom-bar {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 25;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 44rpx 32rpx;
  border-top: 1rpx solid #f1f5f9;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(18px);
}

.bottom-bar__state > text {
  display: block;
  color: #cbd5e1;
  font-size: 19rpx;
  font-weight: 900;
}

.bottom-bar__state view {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-top: 8rpx;
  color: #0f172a;
  font-size: 26rpx;
  font-weight: 900;
}

.bottom-bar__button {
  display: flex;
  height: 88rpx;
  min-width: 220rpx;
  align-items: center;
  justify-content: center;
  gap: 14rpx;
  padding: 0 34rpx;
  border-radius: 28rpx;
  background: #6366f1;
  color: #fff;
  font-size: 26rpx;
  font-weight: 900;
  box-shadow: 0 18rpx 42rpx rgba(99, 102, 241, 0.3);
}

.bottom-bar__button--leader {
  background: #4f46e5;
}

.bottom-bar__button--disabled {
  background: #94a3b8;
  box-shadow: none;
}

.sheet-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20rpx;
}

.sheet-item {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 14rpx;
  color: #475569;
  font-size: 22rpx;
  font-weight: 900;
}

.sheet-item__icon {
  display: flex;
  width: 88rpx;
  height: 88rpx;
  align-items: center;
  justify-content: center;
  border-radius: 30rpx;
}

.sheet-item__icon--green,
.sheet-item__icon--emerald {
  background: #22c55e;
}

.sheet-item__icon--dark {
  background: #0f172a;
}

.sheet-item__icon--blue {
  background: #3b82f6;
}

.more-list {
  display: flex;
  flex-direction: column;
}

.more-list__item {
  display: flex;
  align-items: center;
  gap: 18rpx;
  min-height: 92rpx;
  color: #334155;
  font-size: 27rpx;
  font-weight: 900;
}

.more-list__item--danger {
  color: #ef4444;
}

.member-modal {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 80;
}

.member-modal__mask {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: rgba(15, 23, 42, 0.48);
}

.member-modal__panel {
  position: absolute;
  top: 50%;
  right: 48rpx;
  left: 48rpx;
  padding: 52rpx 40rpx 40rpx;
  border-radius: 44rpx;
  background: #fff;
  text-align: center;
  transform: translateY(-50%);
}

.member-modal__avatar {
  width: 150rpx;
  height: 150rpx;
  border-radius: 34rpx;
  box-shadow: 0 14rpx 34rpx rgba(15, 23, 42, 0.14);
}

.member-modal__name,
.member-modal__role {
  display: block;
}

.member-modal__name {
  margin-top: 24rpx;
  color: #0f172a;
  font-size: 40rpx;
  font-weight: 900;
}

.member-modal__role {
  margin-top: 8rpx;
  color: #94a3b8;
  font-size: 24rpx;
  font-weight: 800;
}

.member-modal__rows {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  margin-top: 34rpx;
}

.member-modal__rows view {
  display: flex;
  justify-content: space-between;
  padding: 22rpx 26rpx;
  border-radius: 24rpx;
  background: #f8fafc;
  color: #64748b;
  font-size: 24rpx;
  font-weight: 800;
}

.member-modal__rows view text:last-child {
  color: #0f172a;
  font-weight: 900;
}

.member-modal__button {
  display: flex;
  height: 82rpx;
  align-items: center;
  justify-content: center;
  margin-top: 32rpx;
  border-radius: 26rpx;
  background: #4f46e5;
  color: #fff;
  font-size: 25rpx;
  font-weight: 900;
}
</style>
