<template>
  <view v-if="isPageLoading" class="profile ref-page">
    <SuPageLoading :style="contentTopStyle" text="个人资料加载中..." />
  </view>
  <view v-else class="profile ref-page">
    <view class="profile__nav" :style="navStyle">
      <view class="profile__nav-row" :style="navRowStyle">
        <text class="profile__nav-title">我的</text>
        <view class="profile__nav-actions" :style="navActionsStyle">
          <view class="profile__nav-btn" @tap="goVerify">
            <uni-icons type="gear-filled" size="19" color="#102033" />
          </view>
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="profile__scroll" :style="contentTopStyle">
      <view class="profile__content">
        <view class="profile-hero-card">
          <view class="profile-hero-card__top">
            <view class="initial-avatar initial-avatar--large">
              <text>吴</text>
            </view>
            <view class="profile-hero-card__main">
              <text class="ref-pill ref-pill--green">天津大学 · 学生邮箱认证</text>
              <text class="profile-hero-card__name">吴同学</text>
              <text class="profile-hero-card__bio">周末看展 / 饭搭子雷达 / 羽毛球新手，不临时鸽。</text>
              <view class="account-icon-row">
                <view
                  v-for="account in socialAccounts"
                  :key="account.label"
                  class="account-icon"
                  :class="{ active: account.active }"
                >
                  <uni-icons :type="account.icon" size="18" :color="account.active ? '#2388ff' : '#a1a1aa'" />
                  <text>{{ account.label }}</text>
                </view>
              </view>
            </view>
          </view>
          <view class="trust-strip">
            <view><text>97.9%</text><text>到场率</text></view>
            <view><text>18</text><text>报名</text></view>
            <view><text>3</text><text>发起活动</text></view>
            <view><text>2</text><text>搭子</text></view>
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

          <scroll-view scroll-x class="filter-row" :show-scrollbar="false">
            <view class="filter-row__inner">
              <view
                v-for="item in profileTabs"
                :key="item.key"
                class="filter-row__button"
                :class="{ active: activeTab === item.key }"
                @tap="activeTab = item.key"
              >
                <text>{{ item.label }}</text>
              </view>
            </view>
          </scroll-view>

          <view v-if="activeTab === 'overview'" class="task-list">
            <view class="task-card" @tap="openFirstJoinedActivity">
              <uni-icons type="calendar" size="20" color="#2388ff" />
              <view>
                <text>我的报名</text>
                <text>2 个活动已报名，1 个申请待审核。</text>
              </view>
              <uni-icons type="right" size="18" color="#94a3b8" />
            </view>
            <view class="task-card" @tap="openNextActivity">
              <uni-icons type="scan" size="20" color="#2388ff" />
              <view>
                <text>我的到场 / 待核销</text>
                <text>剧本杀局今晚 19:20 集合，凭证已准备好。</text>
              </view>
              <uni-icons type="right" size="18" color="#94a3b8" />
            </view>
            <view class="task-card" @tap="openHostingActivity">
              <uni-icons type="checkmarkempty" size="20" color="#2388ff" />
              <view>
                <text>我发起的活动</text>
                <text>3 个申请待审核，2 个候补等待处理。</text>
              </view>
              <uni-icons type="right" size="18" color="#94a3b8" />
            </view>
            <view class="task-card" @tap="openPrimaryPartnerPost">
              <uni-icons type="staff" size="20" color="#2388ff" />
              <view>
                <text>我发布的搭子</text>
                <text>羽毛球长期搭子收到 4 个申请。</text>
              </view>
              <uni-icons type="right" size="18" color="#94a3b8" />
            </view>
            <view class="task-card" @tap="openIntentPartnerPost">
              <uni-icons type="paperplane-filled" size="20" color="#2388ff" />
              <view>
                <text>我的意向</text>
                <text>AI 黑客松组队意向等待队长确认。</text>
              </view>
              <uni-icons type="right" size="18" color="#94a3b8" />
            </view>
            <view class="task-card" @tap="goMessages">
              <uni-icons type="chat" size="20" color="#2388ff" />
              <view>
                <text>私聊 / 群聊</text>
                <text>2 个私聊、1 个临时群聊有新消息。</text>
              </view>
              <uni-icons type="right" size="18" color="#94a3b8" />
            </view>
            <view class="task-card" @tap="goVerify">
              <uni-icons type="auth-filled" size="20" color="#2388ff" />
              <view>
                <text>关注 / 认证 / 资料</text>
                <text>学生认证已完成，可继续维护搭子名片。</text>
              </view>
              <uni-icons type="right" size="18" color="#94a3b8" />
            </view>
          </view>

          <view v-if="activeTab === 'activities'" class="profile-stack">
            <view class="section-title">
              <text>我的报名</text>
            </view>
            <view v-if="joinedActivities.length === 0" class="empty-card">暂无报名活动</view>
            <view v-for="item in joinedActivities" :key="item.id" class="profile-card" @tap="openActivity(item)">
              <image class="profile-card__cover" :src="item.image" mode="aspectFill" />
              <view class="profile-card__body">
                <view class="profile-card__row">
                  <text class="profile-card__title su-line-1">{{ item.title }}</text>
                  <text class="profile-card__status" :class="`profile-card__status--${getActivityStatusMeta(item).tone}`">{{ getActivityStatusMeta(item).label }}</text>
                </view>
                <text class="profile-card__meta">{{ item.date }} {{ item.time }}</text>
              </view>
            </view>

            <view class="section-title">
              <text>我发起的活动</text>
            </view>
            <view v-if="hostingActivities.length === 0" class="empty-card">暂无发起活动</view>
            <view v-for="item in hostingActivities" :key="item.id" class="profile-card" @tap="openActivity(item)">
              <image class="profile-card__cover" :src="item.image" mode="aspectFill" />
              <view class="profile-card__body">
                <view class="profile-card__row">
                  <text class="profile-card__title su-line-1">{{ item.title }}</text>
                  <text class="profile-card__status" :class="`profile-card__status--${getActivityStatusMeta(item).tone}`">{{ getActivityStatusMeta(item).label }}</text>
                </view>
                <text class="profile-card__meta">{{ item.date }} {{ item.time }}</text>
              </view>
            </view>
            <view class="primary-button" @tap="goActivityCreate">继续发活动</view>
          </view>

          <view v-if="activeTab === 'partners'" class="profile-stack">
            <view class="section-title">
              <text>我发布的搭子</text>
            </view>
            <SuPartnerCard v-if="postedPartnerPost" :partner="postedPartnerPost" />
            <view v-else class="empty-card">暂无发布的搭子</view>
            <view class="primary-button" @tap="openPrimaryPartnerPost">管理申请</view>
            <view class="section-title">
              <text>我的意向</text>
            </view>
            <SuPartnerCard v-if="intentPartnerPost" :partner="intentPartnerPost" />
          </view>

          <view v-if="activeTab === 'messages'" class="profile-stack">
            <view class="task-card" @tap="goMessages">
              <uni-icons type="chat" size="20" color="#2388ff" />
              <view>
                <text>私聊</text>
                <text>南门饭搭子：今晚 18:10 二食堂门口见？</text>
              </view>
              <uni-icons type="right" size="18" color="#94a3b8" />
            </view>
            <view class="task-card" @tap="goMessages">
              <uni-icons type="staff" size="20" color="#2388ff" />
              <view>
                <text>群聊</text>
                <text>Switch 派对群：还差 1 人就能约起来。</text>
              </view>
              <uni-icons type="right" size="18" color="#94a3b8" />
            </view>
            <view class="order-card" @tap="openFirstOrder">
              <uni-icons type="wallet-filled" size="22" color="#2388ff" />
              <view>
                <text>微醺局诚意金</text>
                <text>{{ firstOrder ? getOrderStatusText(firstOrder.status) : '已核销，退款处理中' }}</text>
              </view>
              <text>￥{{ firstOrder ? firstOrder.amount : 29 }}</text>
            </view>
          </view>

          <view v-if="activeTab === 'profile'" class="profile-stack">
            <view class="info-card">
              <view class="section-title">
                <text>标签与印象</text>
              </view>
              <view class="question-list">
                <text>饭搭子雷达</text>
                <text>羽毛球新手</text>
                <text>周末看展</text>
                <text>不临时鸽</text>
                <text>准时</text>
                <text>好沟通</text>
                <text>活动真实</text>
              </view>
            </view>
            <view class="info-card">
              <view class="section-title">
                <text>关注与认证资料</text>
              </view>
              <view class="question-list">
                <text>关注 12 人</text>
                <text>粉丝 18 人</text>
                <text>学生邮箱认证</text>
                <text>学信网增强认证</text>
                <text>资料完整度 86%</text>
              </view>
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
import SuPartnerCard from '@/components/surego/SuPartnerCard.vue'
import { ACTIVITY_STATUS_FILTERS, filterActivitiesByStatusGroup, getActivityStatusMeta, listMyActivities, sortActivitiesByStatusPriority } from '@/common/api/activity.js'
import { listMyPartnerPosts, listPartnerPosts } from '@/common/api/partner.js'
import { getUnreadMessageCount } from '@/common/api/message.js'
import { getOrderStatusText, listOrders } from '@/common/api/order.js'
import { getCurrentUser } from '@/common/api/user.js'
import { getCurrentUserProfile, hasOpsRole, isLoggedIn, isSuregoProfileComplete } from '@/common/api/auth.js'
import { makeRefreshHandler } from '@/common/utils/refresh.js'
import { getMiniProgramNavActionsStyle, getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goActivityCreate, goActivityDetail, goAuthLogin, goManageDashboard, goMessages, goOpsDashboard, goOrderDetail, goParticipantDashboard, goPartnerDetail, goPartnerWorkbench, goVerify } from '@/common/utils/route.js'

const profileTabs = [
  { key: 'overview', label: '总览' },
  { key: 'activities', label: '活动' },
  { key: 'partners', label: '搭子' },
  { key: 'messages', label: '消息' },
  { key: 'profile', label: '资料' }
]
const socialAccounts = [
  { label: '小红书', icon: 'image', active: true },
  { label: '抖音', icon: 'mic-filled', active: true },
  { label: 'GitHub', icon: 'link', active: true },
  { label: '微信', icon: 'weixin', active: false }
]
const activeTab = ref('overview')
const activeActivityFilter = ref('all')
const activeOrderFilter = ref('all')
const loggedIn = ref(false)
const canUseOps = ref(false)
const unreadCount = ref(0)
const myActivities = ref({ hosting: [], joined: [], pending: [] })
const partnerPosts = ref([])
const allPartnerPosts = ref([])
const orders = ref([])
const user = ref(getCurrentUserProfile())
const profileSheetVisible = ref(false)
const isPageLoading = ref(true)
const navStyle = getMiniProgramNavStyle()
const navRowStyle = getMiniProgramNavRowStyle({ leftPaddingRpx: 40, minRightPaddingRpx: 24 })
const navActionsStyle = getMiniProgramNavActionsStyle({ leftReserveRpx: 500 })
const contentTopStyle = getMiniProgramNavContentStyle({ gapRpx: 18 })
const activityFilters = ACTIVITY_STATUS_FILTERS

const activityList = computed(() => sortActivitiesByStatusPriority([
  ...myActivities.value.hosting,
  ...myActivities.value.joined,
  ...myActivities.value.pending
]))
const filteredActivityList = computed(() => filterActivitiesByStatusGroup(activityList.value, activeActivityFilter.value))
const hostingActivities = computed(() => myActivities.value.hosting.slice(0, 2))
const joinedActivities = computed(() => filteredActivityList.value.filter((item) => !item.isCreator).slice(0, 2))
const partnerPostList = computed(() => partnerPosts.value)
const postedPartnerPost = computed(() => (
  partnerPostList.value.find((item) => item.id === 'weekly-badminton') || partnerPostList.value[0] || null
))
const intentPartnerPost = computed(() => (
  allPartnerPosts.value.find((item) => item.id === 'hackathon-ai-front') || allPartnerPosts.value.find((item) => !item.isCreator) || null
))
const firstOrder = computed(() => orders.value[0] || null)
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
      allPartnerPosts.value = []
      orders.value = []
      unreadCount.value = 0
      return
    }

    user.value = await withTimeout(getCurrentUser(), getCurrentUserProfile(), 5000)
    canUseOps.value = hasOpsRole(user.value)
    const [activities, partnerItems, allPartners, orderItems, unread] = await Promise.all([
      listMyActivities(),
      listMyPartnerPosts(),
      listPartnerPosts(),
      listOrders(),
      getUnreadMessageCount()
    ])
    myActivities.value = Array.isArray(activities) ? activities : { hosting: [], joined: [], pending: [] }
    partnerPosts.value = Array.isArray(partnerItems) ? partnerItems : []
    allPartnerPosts.value = Array.isArray(allPartners) ? allPartners : []
    orders.value = Array.isArray(orderItems) ? orderItems : []
    unreadCount.value = Number(unread) || 0
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

function openFirstJoinedActivity() {
  const item = joinedActivities.value[0] || activityList.value[0]
  if (item) {
    openActivity(item)
    return
  }
  uni.showToast({ title: '暂无报名活动', icon: 'none' })
}

function openNextActivity() {
  const item = joinedActivities.value[0] || activityList.value[0]
  if (item) {
    openActivity(item)
    return
  }
  uni.showToast({ title: '暂无待核销活动', icon: 'none' })
}

function openHostingActivity() {
  const item = hostingActivities.value[0] || activityList.value.find((activity) => activity.isCreator)
  if (item) {
    goManageDashboard(item.id)
    return
  }
  uni.showToast({ title: '暂无发起活动', icon: 'none' })
}

function openPrimaryPartnerPost() {
  if (postedPartnerPost.value?.id) {
    goPartnerWorkbench(postedPartnerPost.value.id)
    return
  }
  uni.showToast({ title: '暂无搭子帖', icon: 'none' })
}

function openIntentPartnerPost() {
  if (intentPartnerPost.value?.id) {
    goPartnerDetail(intentPartnerPost.value.id)
    return
  }
  uni.showToast({ title: '暂无搭子意向', icon: 'none' })
}

function openFirstOrder() {
  if (firstOrder.value?.id) {
    goOrderDetail(firstOrder.value.id, { activityId: firstOrder.value.activityId })
    return
  }
  goMessages()
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
}

.profile__nav {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 30;
  background: rgba(247, 251, 255, 0.9);
  backdrop-filter: blur(18px);
}

.profile__nav-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 20rpx;
}

.profile__nav-title {
  color: #102033;
  font-size: 34rpx;
  font-weight: 950;
  line-height: 1.2;
}

.profile__nav-actions {
  display: flex;
  min-width: 0;
  gap: 14rpx;
}

.profile__nav-btn {
  position: relative;
  display: flex;
  width: 76rpx;
  height: 76rpx;
  align-items: center;
  justify-content: center;
  border: 1rpx solid rgba(24, 24, 27, 0.08);
  border-radius: 28rpx;
  background: #fff;
  box-shadow: 0 12rpx 28rpx rgba(30, 88, 156, 0.06);
}

.profile__scroll {
  height: 100vh;
  box-sizing: border-box;
}

.profile__content {
  display: grid;
  gap: 24rpx;
  padding: 0 36rpx 190rpx;
}

.profile-hero-card {
  display: grid;
  gap: 32rpx;
  padding: 36rpx;
  border: 1rpx solid rgba(24, 24, 27, 0.08);
  border-radius: 56rpx;
  background: linear-gradient(135deg, #ffffff, #edf6ff);
  box-shadow: 0 16rpx 34rpx rgba(30, 88, 156, 0.07);
}

.profile-hero-card__top {
  display: grid;
  grid-template-columns: 156rpx minmax(0, 1fr);
  gap: 28rpx;
}

.initial-avatar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 50%;
  background: #e8f3ff;
  color: #2388ff;
  font-size: 56rpx;
  font-weight: 950;
}

.initial-avatar--large {
  width: 156rpx;
  height: 156rpx;
}

.initial-avatar text {
  position: relative;
  z-index: 1;
}

.profile-hero-card__main {
  min-width: 0;
}

.ref-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999rpx;
  padding: 10rpx 16rpx;
  font-size: 21rpx;
  font-weight: 950;
  line-height: 1;
}

.ref-pill--green {
  background: rgba(16, 185, 129, 0.12);
  color: #047857;
}

.profile-hero-card__name {
  display: block;
  margin-top: 16rpx;
  color: #102033;
  font-size: 56rpx;
  font-weight: 950;
  line-height: 1.05;
}

.profile-hero-card__bio {
  display: block;
  margin-top: 12rpx;
  color: #64748b;
  font-size: 26rpx;
  font-weight: 850;
  line-height: 1.45;
}

.account-icon-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 24rpx;
}

.account-icon {
  position: relative;
  display: flex;
  width: 76rpx;
  height: 76rpx;
  align-items: center;
  justify-content: center;
  border: 1rpx solid rgba(24, 24, 27, 0.08);
  border-radius: 30rpx;
  background: #fff;
  color: #a1a1aa;
}

.account-icon.active {
  border-color: rgba(35, 136, 255, 0.22);
  background: #e8f3ff;
  color: #2388ff;
  box-shadow: 0 8rpx 18rpx rgba(35, 136, 255, 0.1);
}

.account-icon text {
  position: absolute;
  width: 1rpx;
  height: 1rpx;
  overflow: hidden;
}

.trust-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16rpx;
}

.trust-strip view {
  min-width: 0;
  padding: 22rpx 16rpx;
  border-radius: 36rpx;
  background: #fff;
}

.trust-strip text {
  display: block;
  text-align: center;
}

.trust-strip text:first-child {
  overflow: hidden;
  color: #102033;
  font-size: 34rpx;
  font-weight: 950;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.trust-strip text:last-child {
  margin-top: 8rpx;
  color: #64748b;
  font-size: 20rpx;
  font-weight: 850;
  line-height: 1.25;
}

.filter-row {
  margin: -2rpx -36rpx 0;
  white-space: nowrap;
}

.filter-row__inner {
  display: inline-flex;
  gap: 16rpx;
  padding: 0 36rpx 8rpx;
}

.filter-row__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 20rpx 28rpx;
  border: 1rpx solid rgba(24, 24, 27, 0.08);
  border-radius: 999rpx;
  background: #fff;
  color: #64748b;
  font-size: 24rpx;
  font-weight: 950;
}

.filter-row__button.active {
  border-color: #102033;
  background: #102033;
  color: #fff;
}

.task-list,
.profile-stack {
  display: grid;
  gap: 24rpx;
}

.task-card,
.order-card {
  display: grid;
  align-items: center;
  gap: 24rpx;
  padding: 32rpx;
  border: 1rpx solid rgba(24, 24, 27, 0.07);
  border-radius: 40rpx;
  background: #fff;
  color: #102033;
  box-shadow: 0 12rpx 28rpx rgba(30, 88, 156, 0.055);
}

.task-card {
  grid-template-columns: 48rpx minmax(0, 1fr) 36rpx;
}

.task-card view,
.order-card view {
  min-width: 0;
}

.task-card view text:first-child,
.order-card view text:first-child {
  display: block;
  color: #102033;
  font-size: 27rpx;
  font-weight: 950;
  line-height: 1.25;
}

.task-card view text:last-child,
.order-card view text:last-child {
  display: block;
  margin-top: 8rpx;
  color: #64748b;
  font-size: 22rpx;
  font-weight: 750;
  line-height: 1.35;
}

.order-card {
  grid-template-columns: 56rpx minmax(0, 1fr) auto;
}

.order-card > text {
  color: #102033;
  font-size: 40rpx;
  font-weight: 950;
}

.section-title {
  margin-top: 6rpx;
}

.section-title text {
  display: block;
  color: #102033;
  font-size: 32rpx;
  font-weight: 950;
}

.profile-card {
  display: grid;
  grid-template-columns: 116rpx minmax(0, 1fr);
  gap: 20rpx;
  padding: 20rpx;
  border: 1rpx solid rgba(24, 24, 27, 0.08);
  border-radius: 36rpx;
  background: #fff;
  box-shadow: 0 12rpx 28rpx rgba(30, 88, 156, 0.055);
}

.profile-card__cover {
  width: 116rpx;
  height: 116rpx;
  border-radius: 28rpx;
  background: #e2e8f0;
}

.profile-card__body {
  min-width: 0;
}

.profile-card__row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12rpx;
}

.profile-card__title {
  flex: 1;
  min-width: 0;
  color: #102033;
  font-size: 27rpx;
  font-weight: 950;
}

.profile-card__status {
  flex: 0 0 auto;
  padding: 7rpx 14rpx;
  border-radius: 999rpx;
  font-size: 18rpx;
  font-weight: 950;
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

.profile-card__meta {
  display: block;
  margin-top: 16rpx;
  color: #94a3b8;
  font-size: 22rpx;
  font-weight: 800;
}

.primary-button {
  display: flex;
  min-height: 96rpx;
  align-items: center;
  justify-content: center;
  border-radius: 34rpx;
  background: #2388ff;
  color: #fff;
  font-size: 26rpx;
  font-weight: 950;
  box-shadow: 0 12rpx 24rpx rgba(35, 136, 255, 0.22);
}

.info-card,
.empty-card,
.login-card,
.ops-entry,
.complete-card {
  border: 1rpx solid rgba(24, 24, 27, 0.08);
  border-radius: 40rpx;
  background: #fff;
  box-shadow: 0 12rpx 28rpx rgba(30, 88, 156, 0.055);
}

.info-card {
  padding: 32rpx;
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

.empty-card {
  padding: 56rpx 36rpx;
  color: #64748b;
  font-size: 24rpx;
  font-weight: 900;
  text-align: center;
}

.login-card,
.ops-entry,
.complete-card {
  display: grid;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx;
}

.login-card,
.ops-entry {
  grid-template-columns: 70rpx minmax(0, 1fr) auto;
}

.complete-card {
  grid-template-columns: minmax(0, 1fr) auto;
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
  background: #2388ff;
}

.ops-entry__icon {
  background: #22c55e;
}

.login-card__copy,
.ops-entry__copy,
.complete-card__copy {
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
  color: #102033;
  font-size: 27rpx;
  font-weight: 950;
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

.login-card__button,
.complete-card__button {
  height: 64rpx;
  padding: 0 24rpx;
  border-radius: 999rpx;
  color: #fff;
  font-size: 22rpx;
  font-weight: 900;
  line-height: 64rpx;
}

.login-card__button {
  background: #2388ff;
}

.complete-card__button {
  background: #ff6b6b;
}
</style>
