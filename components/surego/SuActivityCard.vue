<template>
  <view class="activity-card" :class="{ 'activity-card--compact': compact }" hover-class="activity-card--active" @tap="openDetail">
    <view class="activity-card__cover">
      <image class="activity-card__image" :src="activity.image" mode="aspectFill" />
      <view class="activity-card__organizer" @tap.stop="openUser">
        <image class="activity-card__avatar" :src="organizerAvatar" mode="aspectFill" />
        <view>
          <text class="activity-card__organizer-name su-line-1">{{ activity.organizer || 'SureGo 用户' }}</text>
          <text class="activity-card__verified">{{ verifiedText }}</text>
        </view>
      </view>
      <text class="activity-card__price">{{ priceText }}</text>
    </view>

    <view class="activity-card__body">
      <view class="activity-card__tags">
        <text>{{ activity.category || '活动' }}</text>
        <text class="activity-card__status" :class="`activity-card__status--${statusMeta.tone}`">{{ statusMeta.label }}</text>
        <text v-if="activity.requireApproval">需确认</text>
        <text v-if="activity.hasParticipantLimit">可候补</text>
      </view>

      <text class="activity-card__title su-line-2">{{ activity.title }}</text>

      <view class="activity-card__meta-row">
        <view class="activity-card__meta">
          <SuIcon name="calendar" size="30" glyph-size="14" variant="inline" color="#64748b" />
          <text class="su-line-1">{{ activity.date }} {{ activity.time }}</text>
        </view>
        <view class="activity-card__meta">
          <SuIcon name="location" size="30" glyph-size="14" variant="inline" color="#64748b" />
          <text class="su-line-1">{{ displayLocation }}</text>
          <text v-if="distanceText" class="activity-card__distance">{{ distanceText }}</text>
        </view>
      </view>

      <view v-if="!compact" class="activity-card__signal" :class="signalClass">
        <text class="activity-card__signal-label">{{ heatSignal }}</text>
        <text>{{ seatCountText }}</text>
      </view>

      <view class="activity-card__footer" :class="{ 'activity-card__footer--compact': compact }">
        <view class="activity-card__pill-list">
          <text v-for="tag in displayTags" :key="tag">{{ tag }}</text>
          <text v-if="compact" class="activity-card__status-chip" :class="signalClass">{{ seatCountText }}</text>
        </view>
        <text class="activity-card__action">查看</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import SuIcon from '@/components/surego/SuIcon.vue'
import { getActivityStatusMeta } from '@/common/api/activity.js'
import { goActivityDetail, goUserDetail, goUserProfile } from '@/common/utils/route.js'

const props = defineProps({
  activity: {
    type: Object,
    required: true
  },
  compact: {
    type: Boolean,
    default: false
  }
})

const organizerAvatar = computed(() => {
  const avatar = String(props.activity.organizerAvatar || '').trim()
  if (!avatar || avatar.includes('api.dicebear.com') || avatar.includes('avataaars')) {
    return '/static/userImg/user.png'
  }
  return avatar
})

const verifiedText = computed(() => {
  if (props.activity.university) return props.activity.university
  if (props.activity.city) return `${props.activity.city} · 学生认证`
  return '学生认证'
})

const displayLocation = computed(() => {
  return (props.activity.location || '').split(' · ')[0].split(' 路 ')[0] || props.activity.location || '地点待定'
})

const statusMeta = computed(() => getActivityStatusMeta(props.activity))

const distanceText = computed(() => {
  if (props.activity.distanceText) return props.activity.distanceText
  if (props.activity.distance) return `${props.activity.distance}km`
  return props.activity.city || ''
})

const priceText = computed(() => {
  if (props.activity.partyMode === 'free') return '免费'
  const amount = props.activity.amount || props.activity.price || 0
  return props.activity.partyMode === 'sincerity' ? `诚意金 ¥${amount}` : `门票 ¥${amount}`
})

const slotsLeft = computed(() => {
  if (!props.activity.hasParticipantLimit && !props.activity.maxParticipants) return 0
  return Math.max(0, Number(props.activity.maxParticipants || 0) - Number(props.activity.participantCount || 0))
})

const heatSignal = computed(() => {
  if (slotsLeft.value <= 0) return '候补热'
  if (slotsLeft.value <= 2) return '接近成行'
  if (Number(props.activity.viewCount || 0) > 50 || Number(props.activity.likeCount || 0) > 10) return '升温中'
  return '新局'
})

const seatCountText = computed(() => {
  const current = Number(props.activity.participantCount || 0)
  const max = Number(props.activity.maxParticipants || 0)
  return max > 0 ? `${current}/${max} 已占位` : `${current} 人感兴趣`
})

const signalClass = computed(() => {
  if (slotsLeft.value <= 0) return 'activity-card__signal--waitlist'
  if (slotsLeft.value <= 2) return 'activity-card__signal--urgent'
  return 'activity-card__signal--fresh'
})

const displayTags = computed(() => {
  const tags = Array.isArray(props.activity.tags) ? props.activity.tags : []
  return tags.filter(Boolean).slice(0, 3)
})

function openDetail() {
  goActivityDetail(props.activity.id)
}

function openUser() {
  const userId = props.activity.creatorId || props.activity.creator_id
  if (userId) {
    goUserDetail(userId, { activityId: props.activity.id })
    return
  }
  goUserProfile()
}
</script>

<style scoped>
.activity-card {
  display: block;
  overflow: hidden;
  border: 1rpx solid rgba(24, 24, 27, 0.08);
  border-radius: 42rpx;
  background: #fff;
  box-shadow: 0 18rpx 46rpx rgba(30, 88, 156, 0.08);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.activity-card--active {
  transform: scale(0.985);
  box-shadow: 0 10rpx 28rpx rgba(30, 88, 156, 0.12);
}

.activity-card--compact {
  min-width: 580rpx;
}

.activity-card__cover {
  position: relative;
  height: 308rpx;
  overflow: hidden;
  background: #e2e8f0;
}

.activity-card__image {
  width: 100%;
  height: 100%;
}

.activity-card__cover::after {
  position: absolute;
  inset: 0;
  content: "";
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.06), rgba(15, 23, 42, 0.42));
}

.activity-card__organizer {
  position: absolute;
  top: 22rpx;
  left: 22rpx;
  z-index: 2;
  display: flex;
  max-width: calc(100% - 190rpx);
  align-items: center;
  gap: 12rpx;
  padding: 8rpx 16rpx 8rpx 8rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(14px);
}

.activity-card__avatar {
  width: 54rpx;
  height: 54rpx;
  flex: 0 0 54rpx;
  border-radius: 50%;
  background: #f1f5f9;
}

.activity-card__organizer-name,
.activity-card__verified {
  display: block;
}

.activity-card__organizer-name {
  max-width: 260rpx;
  color: #102033;
  font-size: 22rpx;
  font-weight: 950;
  line-height: 1;
}

.activity-card__verified {
  margin-top: 5rpx;
  color: #64748b;
  font-size: 18rpx;
  font-weight: 850;
  line-height: 1;
}

.activity-card__price {
  position: absolute;
  top: 22rpx;
  right: 22rpx;
  z-index: 2;
  padding: 13rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.92);
  color: #102033;
  font-size: 22rpx;
  font-weight: 950;
}

.activity-card__body {
  padding: 26rpx;
}

.activity-card__tags,
.activity-card__pill-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
}

.activity-card__tags text,
.activity-card__pill-list text {
  padding: 9rpx 14rpx;
  border-radius: 999rpx;
  background: #edf6ff;
  color: #1d4ed8;
  font-size: 19rpx;
  font-weight: 950;
  line-height: 1;
}

.activity-card__pill-list text {
  background: #f6f3e8;
  color: #76602a;
}

.activity-card__tags .activity-card__status--green {
  background: #ecfdf5;
  color: #047857;
}

.activity-card__tags .activity-card__status--blue {
  background: #eff6ff;
  color: #1d4ed8;
}

.activity-card__tags .activity-card__status--amber {
  background: #fffbeb;
  color: #b45309;
}

.activity-card__tags .activity-card__status--gray {
  background: #f1f5f9;
  color: #64748b;
}

.activity-card__tags .activity-card__status--red {
  background: #fef2f2;
  color: #dc2626;
}

.activity-card__status-chip {
  border: 1rpx solid #eef2f7;
  background: #f8fafc !important;
  color: #102033 !important;
}

.activity-card__status-chip.activity-card__signal--urgent {
  border-color: #fed7aa;
  background: #fff7ed !important;
  color: #9a3412 !important;
}

.activity-card__status-chip.activity-card__signal--waitlist {
  border-color: #fde68a;
  background: #fef3c7 !important;
  color: #92400e !important;
}

.activity-card__status-chip.activity-card__signal--fresh {
  border-color: #bbf7d0;
  background: #ecfdf5 !important;
  color: #047857 !important;
}

.activity-card__title {
  display: block;
  margin-top: 18rpx;
  color: #102033;
  font-size: 34rpx;
  font-weight: 950;
  line-height: 1.24;
}

.activity-card__meta-row {
  display: block;
}

.activity-card__meta {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10rpx;
  margin-top: 14rpx;
  color: #64748b;
  font-size: 23rpx;
  font-weight: 850;
}

.activity-card__meta .su-line-1 {
  min-width: 0;
  flex: 1 1 auto;
}

.activity-card__distance {
  flex: 0 0 auto;
  color: #94a3b8;
}

.activity-card__signal {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
  margin-top: 18rpx;
  padding: 0 0 2rpx;
}

.activity-card__signal > text {
  flex: 0 0 auto;
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  border: 1rpx solid #eef2f7;
  background: #f8fafc;
  color: #102033;
  font-size: 20rpx;
  font-weight: 950;
}

.activity-card__signal-label {
  min-width: 0;
  flex: 1 1 auto !important;
  padding: 0 !important;
  border: 0 !important;
  background: transparent !important;
  color: #94a3b8 !important;
  font-size: 20rpx !important;
  font-weight: 900 !important;
}

.activity-card__signal--urgent {
  color: #ef4444;
}

.activity-card__signal--waitlist {
  color: #d97706;
}

.activity-card__signal--fresh {
  color: #16a34a;
}

.activity-card__signal--urgent > text:last-child {
  border-color: #fed7aa;
  background: #fff7ed;
  color: #9a3412;
}

.activity-card__signal--waitlist > text:last-child {
  border-color: #fde68a;
  background: #fef3c7;
  color: #92400e;
}

.activity-card__signal--fresh > text:last-child {
  border-color: #bbf7d0;
  background: #ecfdf5;
  color: #047857;
}

.activity-card__footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18rpx;
  margin-top: 20rpx;
}

.activity-card__action {
  flex: 0 0 auto;
  padding: 14rpx 20rpx;
  border-radius: 999rpx;
  background: #2388ff;
  color: #fff;
  font-size: 21rpx;
  font-weight: 950;
}

.activity-card--compact .activity-card__cover {
  height: 200rpx;
}

.activity-card--compact .activity-card__organizer {
  top: 16rpx;
  left: 16rpx;
  max-width: calc(100% - 158rpx);
  gap: 8rpx;
  padding: 6rpx 12rpx 6rpx 6rpx;
}

.activity-card--compact .activity-card__avatar {
  width: 44rpx;
  height: 44rpx;
  flex-basis: 44rpx;
}

.activity-card--compact .activity-card__organizer-name {
  max-width: 220rpx;
  font-size: 20rpx;
}

.activity-card--compact .activity-card__verified {
  margin-top: 3rpx;
  font-size: 16rpx;
}

.activity-card--compact .activity-card__price {
  top: 16rpx;
  right: 16rpx;
  padding: 10rpx 14rpx;
  font-size: 19rpx;
  white-space: nowrap;
}

.activity-card--compact .activity-card__body {
  padding: 20rpx;
}

.activity-card--compact .activity-card__tags,
.activity-card--compact .activity-card__pill-list {
  gap: 8rpx;
}

.activity-card--compact .activity-card__tags text,
.activity-card--compact .activity-card__pill-list text {
  padding: 7rpx 11rpx;
  font-size: 17rpx;
}

.activity-card--compact .activity-card__title {
  margin-top: 12rpx;
  font-size: 30rpx;
  line-height: 1.22;
}

.activity-card--compact .activity-card__meta-row {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12rpx;
  margin-top: 9rpx;
}

.activity-card--compact .activity-card__meta {
  flex: 1 1 0;
  gap: 7rpx;
  margin-top: 0;
  font-size: 20rpx;
}

.activity-card--compact .activity-card__distance {
  max-width: 76rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.activity-card--compact .activity-card__footer {
  gap: 12rpx;
  margin-top: 10rpx;
}

.activity-card__footer--compact {
  align-items: center;
}

.activity-card__footer--compact .activity-card__pill-list {
  min-width: 0;
  flex: 1 1 auto;
  align-items: center;
  flex-wrap: nowrap;
  overflow: hidden;
}

.activity-card__footer--compact .activity-card__pill-list text {
  max-width: 128rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.activity-card__footer--compact .activity-card__status-chip {
  max-width: none;
  flex: 0 0 auto;
}

.activity-card--compact .activity-card__action {
  padding: 11rpx 16rpx;
  font-size: 19rpx;
  white-space: nowrap;
}
</style>
