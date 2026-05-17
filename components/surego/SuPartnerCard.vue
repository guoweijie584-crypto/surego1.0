<template>
  <view class="partner-post-card partner-post-card--compact" hover-class="partner-post-card--active" @tap="openDetail">
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

    <text v-if="moderationLabel" class="partner-post-card__moderation">{{ moderationLabel }}</text>

    <text class="partner-post-card__title su-line-2">{{ partner.title }}</text>

    <view class="partner-post-card__wants">
      <text v-for="tag in displayTags" :key="tag">{{ tag }}</text>
    </view>

    <view class="compact-meta-row">
      <view class="compact-meta-chip">
        <SuIcon name="calendar" size="30" glyph-size="14" variant="inline" color="#2388ff" />
        <text class="su-line-1">{{ partner.available || partner.schedule }}</text>
      </view>
      <view class="compact-meta-chip">
        <SuIcon name="location" size="30" glyph-size="14" variant="inline" color="#2388ff" />
        <text class="su-line-1">{{ partner.locationRange || partner.location }}</text>
      </view>
    </view>

    <view class="contract-row">
      <view class="contract-row__copy">
        <text>{{ partner.interested || partner.intentCount || 0 }} 人感兴趣</text>
        <text class="su-line-1">{{ displayConnectionSummary }}</text>
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

const displayConnectionSummary = computed(() => {
  const text = String(props.partner.connectionRule || props.partner.connectionMode || '').trim()
  return text.split(/[；;。]/).filter(Boolean)[0] || text
})

const moderationLabel = computed(() => {
  const status = props.partner.moderationStatus || props.partner.moderation_status
  const labels = {
    pending: '待审核',
    rejected: '未通过',
    hidden: '已下架'
  }
  return labels[status] || ''
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
  gap: 14rpx;
  padding: 24rpx;
  border: 1rpx solid rgba(24, 24, 27, 0.08);
  border-radius: 34rpx;
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
  gap: 12rpx;
}

.organizer-line__avatar {
  width: 56rpx;
  height: 56rpx;
  flex: 0 0 56rpx;
  border: 3rpx solid #fff;
  border-radius: 50%;
  background: #f1f5f9;
  box-shadow: 0 8rpx 18rpx rgba(15, 23, 42, 0.08);
}

.organizer-line__name,
.organizer-line__meta {
  display: block;
}

.organizer-line__name {
  max-width: 330rpx;
  color: #102033;
  font-size: 23rpx;
  font-weight: 950;
}

.organizer-line__meta {
  margin-top: 3rpx;
  color: #64748b;
  font-size: 18rpx;
  font-weight: 850;
}

.partner-post-card__kind {
  flex: 0 0 auto;
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  font-size: 18rpx;
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
  font-size: 31rpx;
  font-weight: 950;
  line-height: 1.24;
}

.partner-post-card__moderation {
  width: fit-content;
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  background: #fff7ed;
  color: #c2410c;
  font-size: 18rpx;
  font-weight: 950;
  line-height: 1;
}

.compact-meta-row {
  display: flex;
  gap: 10rpx;
}

.compact-meta-chip {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  gap: 8rpx;
  padding: 10rpx 12rpx;
  border-radius: 20rpx;
  background: #f0f7ff;
  overflow: hidden;
}

.compact-meta-chip text {
  min-width: 0;
  color: #395b80;
  font-size: 20rpx;
  font-weight: 900;
}

.partner-post-card__wants {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
}

.partner-post-card__wants text {
  padding: 8rpx 12rpx;
  border-radius: 999rpx;
  background: #f4f4f5;
  color: #52525b;
  font-size: 18rpx;
  font-weight: 950;
}

.contract-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14rpx;
  padding-top: 14rpx;
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
  font-size: 22rpx;
  font-weight: 950;
}

.contract-row__copy text:last-child {
  margin-top: 5rpx;
  color: #64748b;
  font-size: 18rpx;
  font-weight: 850;
  line-height: 1.35;
}

.contract-row__action {
  display: inline-block;
  flex: 0 0 auto;
  width: auto;
  min-width: 152rpx;
  max-width: 210rpx;
  padding: 13rpx 18rpx;
  border-radius: 999rpx;
  background: #2388ff;
  color: #fff;
  font-size: 20rpx;
  font-weight: 950;
  overflow: hidden;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
