<template>
  <view class="profile su-page">
    <view class="profile__nav" :style="navStyle">
      <view class="profile__nav-row" :style="navRowStyle">
        <view class="profile__back" @tap="goBackOrFallback">
          <uni-icons type="left" size="24" color="#111827" />
        </view>
        <view class="profile__nav-actions" :style="navActionsStyle">
          <view class="profile__nav-btn" @tap="goCalendar()">
            <uni-icons type="calendar" size="20" color="#111827" />
          </view>
          <view class="profile__nav-btn" @tap="goMessages">
            <uni-icons type="notification-filled" size="20" color="#111827" />
          </view>
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="profile__scroll" :style="contentTopStyle">
      <view class="profile__head">
        <view class="profile__avatar-wrap">
          <image class="profile__avatar" :src="user.avatar" mode="aspectFill" />
          <view class="profile__glow" />
        </view>
        <view class="profile__identity">
          <view class="profile__name-row">
            <text class="profile__name">{{ user.nickname }}</text>
            <text v-if="loggedIn" class="profile__credit">信用 {{ user.credit }}</text>
            <text v-else class="profile__guest">未授权</text>
          </view>
          <text class="profile__bio">{{ user.bio }}<text v-if="user.mbti"> / {{ user.mbti }}</text></text>
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
        <view class="stats__edit" @tap="loggedIn ? goUserEdit() : goLogin()">
          {{ loggedIn ? '编辑资料' : '微信登录' }}
        </view>
      </view>

      <view v-if="!loggedIn" class="login-card">
        <view class="login-card__icon">
          <uni-icons type="personadd-filled" size="28" color="#fff" />
        </view>
        <view class="login-card__copy">
          <text class="login-card__title">你还没有登录</text>
          <text class="login-card__desc">授权微信登录后，可以同步活动、订单、消息和现场凭证。</text>
        </view>
        <button class="login-card__button" @tap.stop="goLogin">微信登录</button>
      </view>

      <view v-else>
        <view v-if="!profileComplete" class="complete-card">
          <view class="complete-card__copy">
            <text class="complete-card__title">完善微信资料</text>
            <text class="complete-card__desc">选择头像和昵称后，其他玩家能更容易认出你。</text>
          </view>
          <button class="complete-card__button" @tap="profileSheetVisible = true">去完善</button>
        </view>

        <view v-if="canUseOps" class="ops-entry" @tap="goOpsDashboard">
          <view class="ops-entry__icon">
            <uni-icons type="gear-filled" size="22" color="#fff" />
          </view>
          <view class="ops-entry__copy">
            <text class="ops-entry__title">运营控制台</text>
            <text class="ops-entry__desc">处理举报、活动审核和试运营数据</text>
          </view>
          <uni-icons type="right" size="18" color="#94a3b8" />
        </view>

        <view v-if="activeTab === 'activities'" class="profile__list">
          <view v-if="activityList.length > 0" class="activity-filters">
            <view
              v-for="item in activityFilters"
              :key="item.key"
              class="activity-filter"
              :class="{ 'activity-filter--active': activeActivityFilter === item.key }"
              @tap="activeActivityFilter = item.key"
            >
              {{ item.label }}
            </view>
          </view>
          <view v-if="filteredActivityList.length === 0" class="empty">
            <uni-icons type="calendar" size="42" color="#cbd5e1" />
            <text>暂无活动</text>
          </view>
          <view v-for="item in filteredActivityList" :key="item.id" class="profile-card" @tap="openActivity(item)">
            <image class="profile-card__cover" :src="item.image" mode="aspectFill" />
            <view class="profile-card__body">
              <view class="profile-card__row">
                <text class="profile-card__title su-line-1">{{ item.title }}</text>
                <view class="profile-card__tags">
                  <text class="profile-card__status" :class="`profile-card__status--${getActivityStatusMeta(item).tone}`">{{ getActivityStatusMeta(item).label }}</text>
                  <text class="profile-card__badge">{{ item.isCreator ? '主办' : '参与' }}</text>
                </view>
              </view>
              <text class="profile-card__meta">{{ item.date }} {{ item.time }}</text>
            </view>
          </view>
        </view>

        <view v-if="activeTab === 'reviews'" class="profile__list">
          <view v-if="reviews.length === 0" class="empty">
            <uni-icons type="star-filled" size="42" color="#cbd5e1" />
            <text>暂无评价</text>
          </view>
          <view v-for="item in reviews" :key="item.id" class="review-card">
            <uni-icons type="star-filled" size="22" color="#ffb020" />
            <text>{{ item.content }}</text>
          </view>
        </view>

        <view v-if="activeTab === 'orders'" class="profile__list">
          <view class="order-filters">
            <view
              v-for="item in orderFilters"
              :key="item.key"
              class="order-filter"
              :class="{ 'order-filter--active': activeOrderFilter === item.key }"
              @tap="activeOrderFilter = item.key"
            >
              {{ item.label }}
            </view>
          </view>
          <view v-if="filteredOrders.length === 0" class="empty">
            <uni-icons type="wallet-filled" size="42" color="#cbd5e1" />
            <text>暂无订单</text>
          </view>
          <view v-for="item in filteredOrders" :key="item.id" class="order-card" @tap="goOrderDetail(item.id)">
            <view>
              <text class="order-card__title">{{ item.type === 'ticket' ? '门票订单' : '诚意金订单' }}</text>
              <text class="order-card__meta">{{ item.activityTitle || 'SureGo 活动' }}</text>
              <text class="order-card__meta">￥{{ item.amount }} · {{ getOrderStatusText(item.status) }}</text>
            </view>
            <text class="order-card__badge" :class="`order-card__badge--${item.status}`">{{ getOrderStatusText(item.status) }}</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <SuWechatProfileSheet
      :visible="profileSheetVisible"
      :initial-profile="user"
      @saved="handleProfileSaved"
      @close="profileSheetVisible = false"
    />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import SuWechatProfileSheet from '@/components/surego/SuWechatProfileSheet.vue'
import { ACTIVITY_STATUS_FILTERS, filterActivitiesByStatusGroup, getActivityStatusMeta, listMyActivities, sortActivitiesByStatusPriority } from '@/common/api/activity.js'
import { getOrderStatusText, listOrders } from '@/common/api/order.js'
import { getCurrentUser } from '@/common/api/user.js'
import { getCurrentUserProfile, hasOpsRole, isLoggedIn, isSuregoProfileComplete } from '@/common/api/auth.js'
import { getMiniProgramNavActionsStyle, getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goActivityDetail, goAuthLogin, goBackOrFallback, goCalendar, goManageDashboard, goMessages, goOpsDashboard, goOrderDetail, goParticipantDashboard, goUserEdit } from '@/common/utils/route.js'

const activeTab = ref('activities')
const activeActivityFilter = ref('all')
const activeOrderFilter = ref('all')
const loggedIn = ref(false)
const canUseOps = ref(false)
const myActivities = ref({ hosting: [], joined: [], pending: [] })
const orders = ref([])
const reviews = ref([])
const user = ref(getCurrentUserProfile())
const profileSheetVisible = ref(false)
const navStyle = getMiniProgramNavStyle()
const navRowStyle = getMiniProgramNavRowStyle({ leftPaddingRpx: 40, minRightPaddingRpx: 24 })
const navActionsStyle = getMiniProgramNavActionsStyle({ leftReserveRpx: 210 })
const contentTopStyle = getMiniProgramNavContentStyle({ gapRpx: 18 })
const activityFilters = ACTIVITY_STATUS_FILTERS

const activityList = computed(() => sortActivitiesByStatusPriority([
  ...myActivities.value.hosting,
  ...myActivities.value.joined,
  ...myActivities.value.pending
]))
const filteredActivityList = computed(() => filterActivitiesByStatusGroup(activityList.value, activeActivityFilter.value))
const profileComplete = computed(() => isSuregoProfileComplete(user.value))
const orderFilters = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待支付' },
  { key: 'paid', label: '已支付' },
  { key: 'refunded', label: '退款' },
  { key: 'closed', label: '已关闭' }
]
const filteredOrders = computed(() => {
  if (activeOrderFilter.value === 'all') return orders.value
  return orders.value.filter((item) => item.status === activeOrderFilter.value)
})
const tabs = computed(() => [
  { key: 'activities', label: '活动', count: activityList.value.length },
  { key: 'reviews', label: '评价', count: reviews.value.length },
  { key: 'orders', label: '订单', count: orders.value.length }
])

onShow(async () => {
  loggedIn.value = isLoggedIn()
  if (!loggedIn.value) {
    user.value = getCurrentUserProfile()
    canUseOps.value = false
    myActivities.value = { hosting: [], joined: [], pending: [] }
    orders.value = []
    reviews.value = []
    return
  }

  user.value = await getCurrentUser()
  canUseOps.value = hasOpsRole(user.value)
  myActivities.value = await listMyActivities()
  orders.value = await listOrders()
  reviews.value = []
})

function goLogin() {
  goAuthLogin({ redirect: '/pages/user/profile' })
}

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

function handleProfileSaved(nextUser) {
  user.value = {
    ...user.value,
    ...(nextUser || {})
  }
  canUseOps.value = hasOpsRole(user.value)
  profileSheetVisible.value = false
  uni.showToast({ title: '资料已保存', icon: 'none' })
}
</script>

<style scoped>
.profile {
  min-height: 100vh;
  background: #f8f9f9;
}

.profile__nav {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 20;
  background: rgba(248, 249, 249, 0.88);
  backdrop-filter: blur(18px);
}

.profile__nav-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  min-width: 0;
}

.profile__scroll {
  height: 100vh;
  box-sizing: border-box;
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

.profile__credit,
.profile__guest {
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  color: #fff;
  font-size: 18rpx;
  font-weight: 900;
}

.profile__credit {
  background: #22c55e;
}

.profile__guest {
  background: #94a3b8;
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

.login-card,
.ops-entry,
.complete-card {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin: 0 34rpx 20rpx;
  padding: 24rpx;
  border: 1rpx solid rgba(15, 23, 42, 0.08);
  border-radius: 28rpx;
  box-shadow: 0 18rpx 42rpx rgba(15, 23, 42, 0.12);
}

.login-card {
  background: #fff;
}

.complete-card {
  background: linear-gradient(135deg, #fff7ed, #ffffff);
}

.ops-entry {
  background: #0f172a;
}

.login-card__icon,
.ops-entry__icon {
  display: flex;
  width: 70rpx;
  height: 70rpx;
  align-items: center;
  justify-content: center;
  border-radius: 22rpx;
  background: #ff6b6b;
}

.login-card__copy,
.ops-entry__copy,
.complete-card__copy {
  flex: 1;
  min-width: 0;
}

.login-card__title,
.login-card__desc,
.ops-entry__title,
.ops-entry__desc,
.complete-card__title,
.complete-card__desc {
  display: block;
}

.login-card__title,
.ops-entry__title,
.complete-card__title {
  color: #111827;
  font-size: 27rpx;
  font-weight: 900;
}

.ops-entry__title {
  color: #fff;
}

.login-card__desc,
.ops-entry__desc,
.complete-card__desc {
  margin-top: 6rpx;
  color: #64748b;
  font-size: 21rpx;
  font-weight: 800;
}

.ops-entry__desc {
  color: #cbd5e1;
}

.login-card__button {
  flex: 0 0 auto;
  height: 64rpx;
  padding: 0 24rpx;
  border-radius: 999rpx;
  background: #22c55e;
  color: #fff;
  font-size: 22rpx;
  font-weight: 900;
  line-height: 64rpx;
}

.complete-card__button {
  flex: 0 0 auto;
  height: 64rpx;
  padding: 0 24rpx;
  border-radius: 999rpx;
  background: #ff6b6b;
  color: #fff;
  font-size: 22rpx;
  font-weight: 900;
  line-height: 64rpx;
}

.profile__list {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
  padding: 12rpx 34rpx 70rpx;
}

.activity-filters,
.order-filters {
  display: flex;
  gap: 12rpx;
  overflow-x: auto;
  padding-bottom: 4rpx;
  white-space: nowrap;
}

.activity-filter,
.order-filter {
  flex: 0 0 auto;
  padding: 14rpx 22rpx;
  border-radius: 999rpx;
  background: #fff;
  color: #94a3b8;
  font-size: 22rpx;
  font-weight: 900;
  box-shadow: 0 10rpx 24rpx rgba(15, 23, 42, 0.05);
}

.activity-filter--active,
.order-filter--active {
  background: #0f172a;
  color: #fff;
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
  justify-content: space-between;
}

.profile-card__title,
.order-card__title {
  flex: 1;
  min-width: 0;
  color: #111827;
  font-size: 27rpx;
  font-style: italic;
  font-weight: 900;
}

.profile-card__tags {
  display: flex;
  flex: 0 0 auto;
  gap: 8rpx;
  align-items: center;
}

.profile-card__badge,
.profile-card__status {
  padding: 5rpx 12rpx;
  border-radius: 999rpx;
  font-size: 18rpx;
  font-weight: 900;
}

.profile-card__badge {
  background: #e0e7ff;
  color: #4f46e5;
}

.profile-card__status--green {
  background: #dcfce7;
  color: #16a34a;
}

.profile-card__status--blue {
  background: #dbeafe;
  color: #2563eb;
}

.profile-card__status--amber {
  background: #fef3c7;
  color: #d97706;
}

.profile-card__status--gray {
  background: #f1f5f9;
  color: #64748b;
}

.profile-card__status--red {
  background: #fee2e2;
  color: #ef4444;
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

.order-card__badge {
  flex: 0 0 auto;
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: #fef3c7;
  color: #d97706;
  font-size: 20rpx;
  font-weight: 900;
}

.order-card__badge--paid {
  background: #dcfce7;
  color: #16a34a;
}

.order-card__badge--refunded {
  background: #e0e7ff;
  color: #4f46e5;
}

.order-card__badge--closed {
  background: #fee2e2;
  color: #ef4444;
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
