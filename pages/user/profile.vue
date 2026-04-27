<template>
  <view class="profile su-page">
    <view class="profile__nav">
      <view class="profile__back" @tap="goBackHome">
        <uni-icons type="left" size="24" color="#111827" />
      </view>
      <view class="profile__nav-actions">
        <view class="profile__nav-btn" @tap="goCalendar()">
          <uni-icons type="calendar" size="20" color="#111827" />
        </view>
        <view class="profile__nav-btn" @tap="goMessages">
          <uni-icons type="notification-filled" size="20" color="#111827" />
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="profile__scroll">
      <view class="profile__head">
        <view class="profile__avatar-wrap">
          <image class="profile__avatar" :src="user.avatar" mode="aspectFill" />
          <view class="profile__glow" />
        </view>
        <view class="profile__identity">
          <view class="profile__name-row">
            <text class="profile__name">{{ user.nickname }}</text>
            <text class="profile__credit">信用 {{ user.credit }}</text>
          </view>
          <text class="profile__bio">{{ user.bio }} / {{ user.mbti }}</text>
          <text class="profile__quote">{{ user.quote }}</text>
        </view>
      </view>

      <view class="stats">
        <view
          v-for="item in tabs"
          :key="item.key"
          class="stats__item"
          :class="{ 'stats__item--active': activeTab === item.key }"
          @tap="activeTab = item.key"
        >
          <text>{{ item.count }}</text>
          <text>{{ item.label }}</text>
        </view>
        <view class="stats__edit" @tap="goUserEdit">编辑资料</view>
      </view>

      <view v-if="activeTab === 'activities'" class="profile__list">
        <view v-for="item in activityList" :key="item.id" class="profile-card" @tap="openActivity(item)">
          <image class="profile-card__cover" :src="item.image" mode="aspectFill" />
          <view class="profile-card__body">
            <view class="profile-card__row">
              <text class="profile-card__title su-line-1">{{ item.title }}</text>
              <text v-if="item.isCreator" class="profile-card__badge">主办</text>
            </view>
            <text class="profile-card__meta">{{ item.date }} {{ item.time }}</text>
          </view>
        </view>
      </view>

      <view v-if="activeTab === 'reviews'" class="profile__list">
        <view class="review-card">
          <uni-icons type="star-filled" size="22" color="#ffb020" />
          <text>靠谱、准时、会照顾新朋友，值得继续一起成行。</text>
        </view>
        <view class="review-card">
          <uni-icons type="star-filled" size="22" color="#ffb020" />
          <text>活动组织清晰，现场氛围很好。</text>
        </view>
      </view>

      <view v-if="activeTab === 'orders'" class="profile__list">
        <view v-if="orders.length === 0" class="empty">
          <uni-icons type="wallet-filled" size="42" color="#cbd5e1" />
          <text>暂无订单</text>
        </view>
        <view v-for="item in orders" :key="item.id" class="order-card">
          <view>
            <text class="order-card__title">{{ item.type === 'ticket' ? '门票订单' : '诚意金订单' }}</text>
            <text class="order-card__meta">¥{{ item.amount }} · {{ item.status }}</text>
          </view>
          <uni-icons type="wallet-filled" size="22" color="#64748b" />
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { listMyActivities } from '@/common/api/activity.js'
import { listOrders } from '@/common/api/order.js'
import { getCurrentUser } from '@/common/api/user.js'
import { goActivityDetail, goBackHome, goCalendar, goManageDashboard, goMessages, goParticipantDashboard, goUserEdit } from '@/common/utils/route.js'

const activeTab = ref('activities')
const myActivities = ref({ hosting: [], joined: [], pending: [] })
const orders = ref([])
const user = ref({
  nickname: '吴哈哈',
  avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=Lucky',
  credit: 100,
  mbti: 'ENFP',
  bio: '爱摄影、爱生活的斜杠青年',
  quote: '希望能在这里遇到更多志同道合的小伙伴，一起探索城市里的光影。'
})

const activityList = computed(() => [...myActivities.value.hosting, ...myActivities.value.joined, ...myActivities.value.pending])
const tabs = computed(() => [
  { key: 'activities', label: '活动', count: activityList.value.length },
  { key: 'reviews', label: '评价', count: 2 },
  { key: 'orders', label: '订单', count: orders.value.length }
])

onShow(async () => {
  user.value = await getCurrentUser()
  myActivities.value = await listMyActivities()
  orders.value = await listOrders()
})

function openActivity(item) {
  if (item.isCreator) {
    goManageDashboard(item.id)
    return
  }
  if (item.applicationStatus === 'approved') {
    goParticipantDashboard(item.id)
    return
  }
  goActivityDetail(item.id)
}
</script>

<style scoped>
.profile {
  min-height: 100vh;
  background: #f8f9f9;
}

.profile__nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 58rpx 40rpx 22rpx;
}

.profile__back,
.profile__nav-btn {
  display: flex;
  width: 78rpx;
  height: 78rpx;
  align-items: center;
  justify-content: center;
  border: 1rpx solid #f1f5f9;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 14rpx 34rpx rgba(15, 23, 42, 0.06);
}

.profile__nav-actions {
  display: flex;
  gap: 16rpx;
}

.profile__scroll {
  height: calc(100vh - 158rpx);
}

.profile__head {
  display: flex;
  gap: 34rpx;
  padding: 34rpx 40rpx 38rpx;
}

.profile__avatar-wrap {
  position: relative;
  width: 170rpx;
  height: 170rpx;
  flex: 0 0 170rpx;
}

.profile__avatar {
  position: relative;
  z-index: 2;
  width: 170rpx;
  height: 170rpx;
  border: 8rpx solid #fff;
  border-radius: 50%;
  background: #f1f5f9;
  box-shadow: 0 20rpx 48rpx rgba(15, 23, 42, 0.14);
}

.profile__glow {
  position: absolute;
  inset: -8rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #22c55e, #ff6b6b);
  filter: blur(10rpx);
  opacity: 0.28;
}

.profile__identity {
  flex: 1;
  min-width: 0;
}

.profile__name-row {
  display: flex;
  align-items: center;
  gap: 14rpx;
  flex-wrap: wrap;
}

.profile__name {
  color: #111827;
  font-size: 48rpx;
  font-style: italic;
  font-weight: 900;
}

.profile__credit {
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: #22c55e;
  color: #fff;
  font-size: 18rpx;
  font-weight: 900;
}

.profile__bio,
.profile__quote {
  display: block;
  margin-top: 14rpx;
  color: #64748b;
  font-size: 22rpx;
  font-weight: 800;
  line-height: 1.5;
}

.profile__quote {
  padding-left: 18rpx;
  border-left: 4rpx solid rgba(34, 197, 94, 0.35);
  color: #94a3b8;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr) 132rpx;
  gap: 18rpx;
  align-items: center;
  padding: 0 40rpx 28rpx;
}

.stats__item {
  padding: 12rpx 0 16rpx;
  border-bottom: 4rpx solid transparent;
  color: #94a3b8;
}

.stats__item text:first-child {
  display: block;
  color: inherit;
  font-size: 34rpx;
  font-style: italic;
  font-weight: 900;
}

.stats__item text:last-child {
  display: block;
  margin-top: 6rpx;
  font-size: 18rpx;
  font-weight: 900;
}

.stats__item--active {
  border-bottom-color: #22c55e;
  color: #111827;
}

.stats__edit {
  display: flex;
  height: 62rpx;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  background: #22c55e;
  color: #fff;
  font-size: 20rpx;
  font-weight: 900;
}

.profile__list {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
  padding: 12rpx 34rpx 70rpx;
}

.profile-card,
.review-card,
.order-card {
  display: flex;
  gap: 22rpx;
  padding: 24rpx;
  border: 1rpx solid #f1f5f9;
  border-radius: 34rpx;
  background: #fff;
  box-shadow: 0 14rpx 36rpx rgba(15, 23, 42, 0.05);
}

.profile-card__cover {
  width: 142rpx;
  height: 142rpx;
  border-radius: 26rpx;
  background: #e2e8f0;
}

.profile-card__body {
  flex: 1;
  min-width: 0;
}

.profile-card__row {
  display: flex;
  gap: 10rpx;
  align-items: center;
}

.profile-card__title,
.order-card__title {
  color: #111827;
  font-size: 27rpx;
  font-style: italic;
  font-weight: 900;
}

.profile-card__badge {
  padding: 5rpx 12rpx;
  border-radius: 999rpx;
  background: #e0e7ff;
  color: #4f46e5;
  font-size: 18rpx;
  font-weight: 900;
}

.profile-card__meta,
.order-card__meta {
  display: block;
  margin-top: 16rpx;
  color: #94a3b8;
  font-size: 22rpx;
  font-weight: 800;
}

.review-card {
  align-items: flex-start;
  color: #64748b;
  font-size: 25rpx;
  font-weight: 800;
  line-height: 1.55;
}

.order-card {
  align-items: center;
  justify-content: space-between;
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 16rpx;
  padding: 120rpx 0;
  color: #94a3b8;
  font-size: 24rpx;
  font-weight: 900;
}
</style>
