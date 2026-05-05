<template>
  <view class="su-card" hover-class="su-card--active" @tap="openDetail">
    <view class="su-card__organizer" @tap.stop="openUser">
      <image class="su-card__avatar" :src="organizerAvatar" mode="aspectFill" />
      <text class="su-card__name su-line-1">{{ activity.organizer }}</text>
      <text class="su-card__role">局长</text>
    </view>

    <view class="su-card__body">
      <view class="su-card__cover-wrap">
        <image class="su-card__cover" :src="activity.image" mode="aspectFill" />
        <text class="su-card__category">{{ activity.category }}</text>
        <view class="su-card__status" :class="`su-card__status--${cardStatus.tone}`">
          <text>{{ cardStatus.label }}</text>
        </view>
        <view class="su-card__count">
          <uni-icons type="person-filled" size="12" color="#fff" />
          <text>{{ activity.participantCount }}人参加</text>
        </view>
      </view>

      <view class="su-card__content">
        <view>
          <text class="su-card__title su-line-2">{{ activity.title }}</text>
          <view class="su-card__meta">
            <uni-icons type="calendar" size="14" color="#94a3b8" />
            <text class="su-line-1">{{ activity.date }} {{ activity.time }}</text>
          </view>
          <view class="su-card__meta su-card__meta--countdown">
            <uni-icons type="reload" size="14" color="#94a3b8" />
            <text class="su-line-1">{{ countdownMeta.label }} {{ countdownMeta.text }}</text>
          </view>
          <view class="su-card__meta">
            <uni-icons type="location" size="14" color="#94a3b8" />
            <text class="su-line-1">{{ displayLocation }}</text>
            <text v-if="distanceText" class="su-card__distance">{{ distanceText }}</text>
          </view>
        </view>

        <view class="su-card__price">
          <text class="su-card__price-main">{{ priceText }}</text>
          <text v-if="priceLabel" class="su-card__price-label">{{ priceLabel }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { getActivityCardStatusMeta, getActivityCountdownMeta } from '@/common/api/activity.js'
import { goActivityDetail, goUserDetail, goUserProfile } from '@/common/utils/route.js'

const props = defineProps({
  activity: {
    type: Object,
    required: true
  }
})

const cardStatus = computed(() => getActivityCardStatusMeta(props.activity))
const countdownMeta = computed(() => getActivityCountdownMeta(props.activity))

const displayLocation = computed(() => {
  return (props.activity.location || '').split(' 路 ')[0] || props.activity.location
})

const distanceText = computed(() => {
  if (props.activity.distanceText) return props.activity.distanceText
  if (props.activity.distance) return `${props.activity.distance}km`
  return props.activity.city || ''
})

const priceText = computed(() => {
  if (props.activity.partyMode === 'free') return '免费'
  return `¥${props.activity.amount || props.activity.price || 0}`
})

const priceLabel = computed(() => {
  if (props.activity.partyMode === 'sincerity') return '诚意金'
  if (props.activity.partyMode === 'ticket') return '门票'
  return ''
})

const organizerAvatar = computed(() => {
  const avatar = String(props.activity.organizerAvatar || '').trim()
  if (!avatar || avatar.includes('api.dicebear.com') || avatar.includes('avataaars')) {
    return '/static/userImg/user.png'
  }
  return avatar
})

function openDetail() {
  goActivityDetail(props.activity.id)
}

function openUser() {
  const userId = props.activity.creatorId || props.activity.creator_id
  if (userId) {
    goUserDetail(userId)
    return
  }
  goUserProfile()
}
</script>

<style scoped>
.su-card {
  width: 100%;
  overflow: hidden;
  border: 1rpx solid #f1f5f9;
  border-radius: 32rpx;
  background: #fff;
  box-shadow: 0 18rpx 45rpx rgba(15, 23, 42, 0.05);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.su-card--active {
  transform: scale(0.985);
  box-shadow: 0 10rpx 28rpx rgba(15, 23, 42, 0.08);
}

.su-card__organizer {
  display: flex;
  align-items: center;
  gap: 12rpx;
  height: 72rpx;
  padding: 0 24rpx;
  border-bottom: 1rpx solid #f1f5f9;
}

.su-card__avatar {
  width: 42rpx;
  height: 42rpx;
  flex: 0 0 42rpx;
  border: 1rpx solid #e2e8f0;
  border-radius: 50%;
  background: #f8fafc;
}

.su-card__name {
  max-width: 220rpx;
  color: #475569;
  font-size: 24rpx;
  font-weight: 800;
}

.su-card__role {
  color: #cbd5e1;
  font-size: 18rpx;
  font-weight: 900;
}

.su-card__body {
  display: flex;
  gap: 24rpx;
  padding: 24rpx;
}

.su-card__cover-wrap {
  position: relative;
  width: 190rpx;
  height: 190rpx;
  flex: 0 0 190rpx;
  overflow: hidden;
  border-radius: 24rpx;
  background: #f1f5f9;
}

.su-card__cover {
  width: 100%;
  height: 100%;
}

.su-card__category {
  position: absolute;
  top: 14rpx;
  left: 14rpx;
  padding: 5rpx 14rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.86);
  color: #3b82f6;
  font-size: 18rpx;
  font-weight: 900;
}

.su-card__status {
  position: absolute;
  top: 14rpx;
  right: 14rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 96rpx;
  padding: 6rpx 16rpx;
  border-radius: 999rpx;
  color: #fff;
  font-size: 18rpx;
  font-weight: 900;
  box-shadow: 0 8rpx 20rpx rgba(15, 23, 42, 0.18);
}

.su-card__status--green {
  background: rgba(34, 197, 94, 0.92);
}

.su-card__status--blue {
  background: rgba(59, 130, 246, 0.92);
}

.su-card__status--gray {
  background: rgba(100, 116, 139, 0.92);
}

.su-card__count {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
  height: 48rpx;
  background: linear-gradient(0deg, rgba(15, 23, 42, 0.72), rgba(15, 23, 42, 0));
  color: #fff;
  font-size: 19rpx;
  font-weight: 900;
}

.su-card__content {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  justify-content: space-between;
}

.su-card__title {
  color: #0f172a;
  font-size: 29rpx;
  font-weight: 900;
  line-height: 1.45;
}

.su-card__meta {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 13rpx;
  color: #64748b;
  font-size: 22rpx;
  font-weight: 800;
}

.su-card__meta--countdown {
  color: #475569;
}

.su-card__distance {
  flex: 0 0 auto;
  color: #94a3b8;
}

.su-card__price {
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
  gap: 10rpx;
  margin-top: 18rpx;
}

.su-card__price-main {
  color: #f59e0b;
  font-size: 36rpx;
  font-weight: 900;
}

.su-card__price-label {
  color: #94a3b8;
  font-size: 21rpx;
  font-weight: 900;
}
</style>
