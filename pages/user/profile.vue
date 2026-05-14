<template>
  <view v-if="isPageLoading" class="profile su-page">
    <SuPageLoading :style="contentTopStyle" text="个人资料加载中..." />
  </view>
  <view v-else class="profile su-page">
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
            <view v-if="unreadCount > 0" class="profile__message-badge">
              <text>{{ unreadLabel }}</text>
            </view>
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

        <view v-if="activeTab === 'overview'" class="task-list">
          <view class="task-card" @tap="activeTab = 'activities'">
            <uni-icons type="calendar" size="20" color="#2388ff" />
            <view>
              <text>我的报名</text>
              <text>{{ activityList.length }} 个活动与你有关，申请、核销和管理都从这里进。</text>
            </view>
            <uni-icons type="right" size="18" color="#94a3b8" />
          </view>
          <view class="task-card" @tap="openNextActivity">
            <uni-icons type="paperplane-filled" size="20" color="#2388ff" />
            <view>
              <text>我的到场 / 待核销</text>
              <text>进入最近活动，查看凭证、集合信息和现场状态。</text>
            </view>
            <uni-icons type="right" size="18" color="#94a3b8" />
          </view>
          <view class="task-card" @tap="openFirstPartnerPost">
            <uni-icons type="personadd" size="20" color="#2388ff" />
            <view>
              <text>我发布的搭子</text>
              <text>{{ partnerPostList.length }} 个搭子帖，可处理意向、私聊或约成活动。</text>
            </view>
            <uni-icons type="right" size="18" color="#94a3b8" />
          </view>
          <view class="task-card" @tap="goMessages">
            <uni-icons type="chat" size="20" color="#2388ff" />
            <view>
              <text>私聊 / 群聊</text>
              <text>{{ unreadCount }} 条未读消息，活动提醒和搭子意向都在通知里。</text>
            </view>
            <uni-icons type="right" size="18" color="#94a3b8" />
          </view>
          <view class="task-card" @tap="goVerify">
            <uni-icons type="auth-filled" size="20" color="#2388ff" />
            <view>
              <text>关注 / 认证 / 资料</text>
              <text>维护校园名片、信用信息和搭子标签。</text>
            </view>
            <uni-icons type="right" size="18" color="#94a3b8" />
          </view>
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

        <view v-if="activeTab === 'partners'" class="profile__list">
          <view v-if="partnerPostList.length === 0" class="empty">
            <uni-icons type="personadd" size="42" color="#cbd5e1" />
            <text>暂无搭子帖</text>
          </view>
          <view v-for="item in partnerPostList" :key="item.id" class="partner-profile-card" @tap="goPartnerWorkbench(item.id)">
            <view>
              <text class="partner-profile-card__type">{{ item.typeLabel }}</text>
              <text class="partner-profile-card__title su-line-2">{{ item.title }}</text>
              <text class="partner-profile-card__meta">{{ item.intentCount }} 个意向 · {{ item.followCount }} 人关注</text>
            </view>
            <text class="partner-profile-card__status">{{ item.status === 'open' ? '招募中' : '已处理' }}</text>
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
          <view v-for="item in filteredOrders" :key="item.id" class="order-card" @tap="goOrderDetail(item.id, { activityId: item.activityId })">
            <view>
              <text class="order-card__title">{{ item.type === 'ticket' ? '门票订单' : '诚意金订单' }}</text>
              <text class="order-card__meta">{{ item.activityTitle || 'SureGo 活动' }}</text>
              <text class="order-card__meta">￥{{ item.amount }} · {{ getOrderStatusText(item.status) }}</text>
            </view>
            <text class="order-card__badge" :class="`order-card__badge--${item.status}`">{{ getOrderStatusText(item.status) }}</text>
          </view>
        </view>

        <view v-if="activeTab === 'messages'" class="task-list">
          <view class="task-card" @tap="goMessages">
            <uni-icons type="notification-filled" size="20" color="#2388ff" />
            <view>
              <text>通知中心</text>
              <text>报名审核、搭子意向、聊天和等待状态都在这里。</text>
            </view>
            <uni-icons type="right" size="18" color="#94a3b8" />
          </view>
          <view class="task-card" @tap="goMessages">
            <uni-icons type="staff" size="20" color="#2388ff" />
            <view>
              <text>私聊 / 群聊</text>
              <text>通过搭子意向后，会在这里继续确认时间和地点。</text>
            </view>
            <uni-icons type="right" size="18" color="#94a3b8" />
          </view>
        </view>

        <view v-if="activeTab === 'profile'" class="profile-info">
          <view class="profile-info__card">
            <text>标签与印象</text>
            <view class="question-list">
              <text>饭搭子雷达</text>
              <text>羽毛球新手</text>
              <text>周末看展</text>
              <text>不临时鸽</text>
              <text>准时</text>
              <text>好沟通</text>
            </view>
          </view>
          <view class="profile-info__card">
            <text>关注与认证资料</text>
            <view class="question-list">
              <text>关注 {{ partnerPostList.length + 12 }} 人</text>
              <text>信用 {{ user.credit }}</text>
              <text>{{ profileComplete ? '资料已完善' : '资料待完善' }}</text>
              <text>{{ canUseOps ? '运营身份' : '普通用户' }}</text>
            </view>
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
    <SuBottomDock active="profile" />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onPullDownRefresh, onShow } from '@dcloudio/uni-app'
import SuWechatProfileSheet from '@/components/surego/SuWechatProfileSheet.vue'
import SuPageLoading from '@/components/surego/SuPageLoading.vue'
import SuBottomDock from '@/components/surego/SuBottomDock.vue'
import { ACTIVITY_STATUS_FILTERS, filterActivitiesByStatusGroup, getActivityStatusMeta, listMyActivities, sortActivitiesByStatusPriority } from '@/common/api/activity.js'
import { listMyPartnerPosts } from '@/common/api/partner.js'
import { getUnreadMessageCount } from '@/common/api/message.js'
import { getOrderStatusText, listOrders } from '@/common/api/order.js'
import { getCurrentUser } from '@/common/api/user.js'
import { getCurrentUserProfile, hasOpsRole, isLoggedIn, isSuregoProfileComplete } from '@/common/api/auth.js'
import { makeRefreshHandler } from '@/common/utils/refresh.js'
import { getMiniProgramNavActionsStyle, getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goActivityDetail, goAuthLogin, goBackOrFallback, goCalendar, goManageDashboard, goMessages, goOpsDashboard, goOrderDetail, goParticipantDashboard, goPartnerWorkbench, goUserEdit, goVerify } from '@/common/utils/route.js'

const activeTab = ref('overview')
const activeActivityFilter = ref('all')
const activeOrderFilter = ref('all')
const loggedIn = ref(false)
const canUseOps = ref(false)
const unreadCount = ref(0)
const myActivities = ref({ hosting: [], joined: [], pending: [] })
const partnerPosts = ref([])
const orders = ref([])
const reviews = ref([])
const user = ref(getCurrentUserProfile())
const profileSheetVisible = ref(false)
const isPageLoading = ref(true)
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
const partnerPostList = computed(() => partnerPosts.value)
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
const unreadLabel = computed(() => (unreadCount.value > 99 ? '99+' : String(unreadCount.value)))
const tabs = computed(() => [
  { key: 'overview', label: '总览', count: 'ME' },
  { key: 'activities', label: '活动', count: activityList.value.length },
  { key: 'partners', label: '搭子帖', count: partnerPostList.value.length },
  { key: 'messages', label: '消息', count: unreadCount.value },
  { key: 'profile', label: '资料', count: user.value.credit || 0 }
])

function withTimeout(promise, fallback, timeout = 5000) {
  return Promise.race([
    promise,
    new Promise((resolve) => {
      setTimeout(() => resolve(fallback), timeout)
    })
  ])
}

async function loadData() {
  isPageLoading.value = true
  try {
    loggedIn.value = isLoggedIn()
    if (!loggedIn.value) {
      user.value = getCurrentUserProfile()
      canUseOps.value = false
      myActivities.value = { hosting: [], joined: [], pending: [] }
      partnerPosts.value = []
      orders.value = []
      reviews.value = []
      unreadCount.value = 0
      return
    }

    user.value = await withTimeout(getCurrentUser(), getCurrentUserProfile(), 5000)
    canUseOps.value = hasOpsRole(user.value)
    const [activities, partnerItems, orderItems, unread] = await Promise.all([
      listMyActivities(),
      listMyPartnerPosts(),
      listOrders(),
      getUnreadMessageCount()
    ])
    myActivities.value = Array.isArray(activities) ? activities : { hosting: [], joined: [], pending: [] }
    partnerPosts.value = Array.isArray(partnerItems) ? partnerItems : []
    orders.value = Array.isArray(orderItems) ? orderItems : []
    unreadCount.value = Number(unread) || 0
    reviews.value = []
  } finally {
    isPageLoading.value = false
  }
}

onShow(loadData)
onPullDownRefresh(makeRefreshHandler(loadData))

function goLogin() {
  goAuthLogin({ redirect: '/pages/user/profile' })
}

function openActivity(item) {
  if (item.isCreator) {
    goManageDashboard(item.id)
    return
  }
  if (['approved', 'pending', 'rejected'].includes(item.applicationStatus)) {
    goParticipantDashboard(item.id)
    return
  }
  goActivityDetail(item.id)
}

function openNextActivity() {
  const item = activityList.value[0]
  if (item) {
    openActivity(item)
    return
  }
  uni.showToast({ title: '暂无待处理活动', icon: 'none' })
}

function openFirstPartnerPost() {
  const item = partnerPostList.value[0]
  if (item?.id) {
    goPartnerWorkbench(item.id)
    return
  }
  uni.showToast({ title: '暂无搭子帖', icon: 'none' })
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
  padding-bottom: 180rpx;
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
  position: relative;
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

.profile__message-badge {
  position: absolute;
  top: 9rpx;
  right: 8rpx;
  display: flex;
  min-width: 30rpx;
  height: 30rpx;
  align-items: center;
  justify-content: center;
  padding: 0 8rpx;
  border: 4rpx solid #fff;
  border-radius: 999rpx;
  background: #ef4444;
  color: #fff;
  font-size: 18rpx;
  font-weight: 900;
  line-height: 1;
  box-sizing: border-box;
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
  grid-template-columns: repeat(5, minmax(0, 1fr));
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
  grid-column: 1 / -1;
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

.task-list,
.profile-info {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding: 12rpx 34rpx 70rpx;
}

.task-card,
.profile-info__card {
  border: 1rpx solid #eef2f7;
  border-radius: 32rpx;
  background: #fff;
  box-shadow: 0 14rpx 36rpx rgba(15, 23, 42, 0.05);
}

.task-card {
  display: grid;
  grid-template-columns: 48rpx 1fr 30rpx;
  align-items: center;
  gap: 18rpx;
  padding: 26rpx;
}

.task-card view {
  min-width: 0;
}

.task-card view text:first-child {
  display: block;
  color: #102033;
  font-size: 27rpx;
  font-weight: 900;
}

.task-card view text:last-child {
  display: block;
  margin-top: 8rpx;
  color: #64748b;
  font-size: 22rpx;
  font-weight: 800;
  line-height: 1.45;
}

.profile-info__card {
  padding: 30rpx;
}

.profile-info__card > text {
  display: block;
  color: #102033;
  font-size: 30rpx;
  font-style: italic;
  font-weight: 900;
}

.question-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 18rpx;
}

.question-list text {
  padding: 12rpx 18rpx;
  border-radius: 999rpx;
  background: #f3f6fa;
  color: #64748b;
  font-size: 22rpx;
  font-weight: 900;
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
.partner-profile-card,
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

.partner-profile-card {
  align-items: center;
  justify-content: space-between;
}

.partner-profile-card__type {
  display: inline-flex;
  padding: 7rpx 14rpx;
  border-radius: 999rpx;
  background: #fee2e2;
  color: #ef4444;
  font-size: 18rpx;
  font-weight: 900;
}

.partner-profile-card__title {
  display: block;
  margin-top: 14rpx;
  color: #111827;
  font-size: 29rpx;
  font-style: italic;
  font-weight: 900;
  line-height: 1.38;
}

.partner-profile-card__meta {
  display: block;
  margin-top: 12rpx;
  color: #94a3b8;
  font-size: 21rpx;
  font-weight: 800;
}

.partner-profile-card__status {
  flex: 0 0 auto;
  margin-left: 18rpx;
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: #dcfce7;
  color: #16a34a;
  font-size: 19rpx;
  font-weight: 900;
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
