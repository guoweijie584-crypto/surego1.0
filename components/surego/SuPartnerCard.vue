<template>
  <view class="partner-post-card" hover-class="partner-post-card--active" @tap="openDetail">
    <view class="partner-post-card__head">
      <view class="organizer-line">
        <image class="organizer-line__avatar" :src="partner.avatar" mode="aspectFill" />
        <view>
          <text class="organizer-line__name su-line-1">{{ partner.author || partner.creator }}</text>
          <text class="organizer-line__meta su-line-1">{{ partner.school || `${partner.city || '天津大学'} · 学生认证` }}</text>
        </view>
      </view>
      <text class="partner-post-card__kind" :class="`partner-post-card__kind--${kindTone}`">{{ partner.typeLabel }}</text>
    </view>

    <text class="partner-post-card__title su-line-2">{{ partner.title }}</text>
    <text class="partner-post-card__desc su-line-2">{{ partner.detail || partner.description }}</text>

    <view class="partner-post-card__wants">
      <text v-for="tag in displayTags" :key="tag">{{ tag }}</text>
      <text v-if="displayExpectation" class="partner-post-card__want-main su-line-1">{{ displayExpectation }}</text>
    </view>

    <view class="partner-meta-grid">
      <view class="partner-meta-grid__item">
        <SuIcon name="calendar" size="40" glyph-size="18" variant="soft" />
        <view class="partner-meta-grid__copy">
          <text class="partner-meta-grid__value su-line-1">{{ partner.available || partner.schedule }}</text>
          <text class="partner-meta-grid__label">可约时间</text>
        </view>
      </view>
      <view class="partner-meta-grid__item">
        <SuIcon name="location" size="40" glyph-size="18" variant="soft" />
        <view class="partner-meta-grid__copy">
          <text class="partner-meta-grid__value su-line-1">{{ partner.locationRange || partner.location }}</text>
          <text class="partner-meta-grid__label">地点范围</text>
        </view>
      </view>
    </view>

    <view class="contract-row">
      <view class="contract-row__copy">
        <text>{{ partner.interested || partner.intentCount || 0 }} 人感兴趣</text>
        <text>{{ partner.connectionRule || partner.connectionMode }}</text>
      </view>
      <text class="contract-row__action">{{ actionLabel }}</text>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import SuIcon from '@/components/surego/SuIcon.vue'
import { goPartnerDetail } from '@/common/utils/route.js'

const props = defineProps({
  partner: {
    type: Object,
    required: true
  }
})

const kindTone = computed(() => {
  if (props.partner.type === 'project') return 'purple'
  if (props.partner.type === 'long_term') return 'blue'
  return 'green'
})

const displayTags = computed(() => {
  const tags = Array.isArray(props.partner.wants) && props.partner.wants.length
    ? props.partner.wants
    : props.partner.fitTags
  return (Array.isArray(tags) ? tags : []).filter(Boolean).slice(0, 3)
})

const displayExpectation = computed(() => {
  const value = props.partner.expectation || ''
  if (!value || displayTags.value.includes(value)) return ''
  return value
})

const actionLabel = computed(() => {
  if (props.partner.actionLabel) return props.partner.actionLabel
  if (props.partner.type === 'project') return '申请加入'
  if (props.partner.type === 'long_term') return '申请认识'
  return '提交意向'
})

function openDetail() {
  goPartnerDetail(props.partner.id)
}
</script>

<style scoped>
.partner-post-card {
  display: grid;
  gap: 24rpx;
  padding: 32rpx;
  border: 1rpx solid rgba(24, 24, 27, 0.08);
  border-radius: 48rpx;
  background: #fff;
  box-shadow: 0 12rpx 28rpx rgba(30, 88, 156, 0.055);
  transition: transform 0.18s ease;
}

.partner-post-card--active {
  transform: scale(0.985);
}

.partner-post-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
}

.organizer-line {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 14rpx;
}

.organizer-line__avatar {
  width: 72rpx;
  height: 72rpx;
  flex: 0 0 72rpx;
  border: 4rpx solid #fff;
  border-radius: 50%;
  background: #f1f5f9;
  box-shadow: 0 10rpx 24rpx rgba(15, 23, 42, 0.08);
}

.organizer-line__name,
.organizer-line__meta {
  display: block;
}

.organizer-line__name {
  max-width: 330rpx;
  color: #102033;
  font-size: 25rpx;
  font-weight: 950;
}

.organizer-line__meta {
  margin-top: 6rpx;
  color: #64748b;
  font-size: 20rpx;
  font-weight: 850;
}

.partner-post-card__kind {
  flex: 0 0 auto;
  padding: 10rpx 17rpx;
  border-radius: 999rpx;
  font-size: 19rpx;
  font-weight: 950;
  line-height: 1;
}

.partner-post-card__kind--green {
  background: rgba(16, 185, 129, 0.12);
  color: #047857;
}

.partner-post-card__kind--blue {
  background: rgba(59, 130, 246, 0.12);
  color: #1d4ed8;
}

.partner-post-card__kind--purple {
  background: rgba(139, 92, 246, 0.13);
  color: #6d28d9;
}

.partner-post-card__title {
  display: block;
  color: #102033;
  font-size: 40rpx;
  font-weight: 950;
  line-height: 1.22;
}

.partner-post-card__desc {
  display: block;
  color: #64748b;
  font-size: 24rpx;
  font-weight: 850;
  line-height: 1.55;
}

.partner-meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}

.partner-meta-grid__item {
  display: flex;
  align-items: center;
  gap: 14rpx;
  min-width: 0;
  padding: 20rpx;
  border-radius: 32rpx;
  background: #edf6ff;
}

.partner-meta-grid__copy {
  min-width: 0;
}

.partner-meta-grid__copy text {
  display: block;
}

.partner-meta-grid__value {
  overflow: hidden;
  color: #102033;
  font-size: 24rpx;
  font-weight: 950;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.partner-meta-grid__label {
  margin-top: 8rpx;
  color: #64748b;
  font-size: 20rpx;
  font-weight: 950;
}

.partner-post-card__wants {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
}

.partner-post-card__wants text {
  padding: 10rpx 15rpx;
  border-radius: 999rpx;
  background: #f4f4f5;
  color: #52525b;
  font-size: 20rpx;
  font-weight: 950;
}

.partner-post-card__want-main {
  max-width: 100%;
}

.contract-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #dbeafe;
}

.contract-row__copy {
  min-width: 0;
  flex: 1;
}

.contract-row__copy text {
  display: block;
}

.contract-row__copy text:first-child {
  color: #102033;
  font-size: 25rpx;
  font-weight: 950;
}

.contract-row__copy text:last-child {
  margin-top: 7rpx;
  color: #64748b;
  font-size: 20rpx;
  font-weight: 850;
  line-height: 1.45;
}

.contract-row__action {
  display: inline-block;
  flex: 0 0 auto;
  width: auto;
  min-width: 152rpx;
  max-width: 210rpx;
  padding: 16rpx 22rpx;
  border-radius: 999rpx;
  background: #2388ff;
  color: #fff;
  font-size: 21rpx;
  font-weight: 950;
  overflow: hidden;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
