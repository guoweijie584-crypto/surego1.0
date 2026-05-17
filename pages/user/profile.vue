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
            <SuIcon name="settings" size="44" glyph-size="19" variant="soft" />
          </view>
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="profile__scroll" :style="contentTopStyle">
      <view class="profile__content">
        <view class="profile-hero-card">
          <view class="profile-hero-card__top">
            <image class="profile-avatar" :src="displayProfile.avatar" mode="aspectFill" />
            <view class="profile-hero-card__main">
              <text class="ref-pill ref-pill--green">{{ displayProfile.badge }}</text>
              <text class="profile-hero-card__name">{{ displayProfile.nickname }}</text>
              <text class="profile-hero-card__bio">{{ displayProfile.bio }}</text>
              <view class="account-icon-row">
                <view
                  v-for="account in socialAccounts"
                  :key="account.label"
                  class="account-icon"
                  :class="[`account-icon--${account.key}`, { active: account.active }]"
                >
                  <SuIcon :name="account.icon" size="52" glyph-size="28" variant="brand" :disabled="!account.active" />
                  <text>{{ account.label }}</text>
                </view>
              </view>
            </view>
          </view>
          <view class="trust-strip">
            <view v-for="stat in profileStats" :key="stat.key">
              <text>{{ stat.value }}</text>
              <text>{{ stat.label }}</text>
            </view>
          </view>
        </view>

        <view v-if="!loggedIn" class="login-card">
          <view class="login-card__icon">
            <SuIcon name="login" size="54" glyph-size="28" variant="inline" color="#fff" />
          </view>
          <view class="login-card__copy">
            <text class="login-card__title">你还没有登录</text>
          </view>
          <button class="login-card__button" @tap.stop="goLogin">微信登录</button>
        </view>

        <view v-else>
          <view v-if="!profileComplete" class="complete-card">
            <view class="complete-card__copy">
              <text class="complete-card__title">完善微信资料</text>
            </view>
            <button class="complete-card__button" @tap="profileSheetVisible = true">去完善</button>
          </view>

          <view v-if="canUseOps" class="ops-entry" @tap="goOpsDashboard">
            <view class="ops-entry__icon">
              <SuIcon name="settings" size="48" glyph-size="22" variant="inline" color="#fff" />
            </view>
            <view class="ops-entry__copy">
              <text class="ops-entry__title">运营控制台</text>
            </view>
            <SuIcon name="arrowRight" size="34" glyph-size="18" variant="inline" color="#94a3b8" />
          </view>

          <scroll-view scroll-x class="filter-row" :show-scrollbar="false">
            <view class="filter-row__inner">
              <view
                v-for="item in profileTabs"
                :key="item.key"
                class="filter-row__button"
                :class="{ active: activeTab === item.key }"
                @tap="switchProfileTab(item.key)"
              >
                <text>{{ item.label }}</text>
              </view>
            </view>
          </scroll-view>

          <view v-if="activeTab === 'overview'" class="task-list">
            <view class="task-card" @tap="showActivityScope('joined')">
              <SuIcon name="calendar" size="46" glyph-size="20" variant="soft" />
              <view>
                <text>我的报名</text>
              </view>
              <SuIcon name="arrowRight" size="34" glyph-size="18" variant="inline" color="#94a3b8" />
            </view>
            <view class="task-card" @tap="showActivityScope('checkin')">
              <SuIcon name="scan" size="46" glyph-size="20" variant="soft" />
              <view>
                <text>我的到场 / 待核销</text>
              </view>
              <SuIcon name="arrowRight" size="34" glyph-size="18" variant="inline" color="#94a3b8" />
            </view>
            <view class="task-card" @tap="showActivityScope('hosting')">
              <SuIcon name="check" size="46" glyph-size="20" variant="soft" />
              <view>
                <text>我发起的活动</text>
              </view>
              <SuIcon name="arrowRight" size="34" glyph-size="18" variant="inline" color="#94a3b8" />
            </view>
            <view class="task-card" @tap="showPartnerScope('posted')">
              <SuIcon name="people" size="46" glyph-size="20" variant="soft" />
              <view>
                <text>我发布的搭子</text>
              </view>
              <SuIcon name="arrowRight" size="34" glyph-size="18" variant="inline" color="#94a3b8" />
            </view>
            <view class="task-card" @tap="showPartnerScope('intents')">
              <SuIcon name="send" size="46" glyph-size="20" variant="soft" />
              <view>
                <text>我的意向</text>
              </view>
              <SuIcon name="arrowRight" size="34" glyph-size="18" variant="inline" color="#94a3b8" />
            </view>
            <view class="task-card" @tap="goMessages">
              <SuIcon name="chat" size="46" glyph-size="20" variant="soft" />
              <view>
                <text>私聊 / 群聊</text>
              </view>
              <SuIcon name="arrowRight" size="34" glyph-size="18" variant="inline" color="#94a3b8" />
            </view>
            <view class="task-card" @tap="goVerify">
              <SuIcon name="shield" size="46" glyph-size="20" variant="soft" />
              <view>
                <text>关注 / 认证 / 资料</text>
              </view>
              <SuIcon name="arrowRight" size="34" glyph-size="18" variant="inline" color="#94a3b8" />
            </view>
          </view>

          <view v-if="activeTab === 'activities'" class="profile-stack">
            <view class="sub-filter-row">
              <view
                v-for="item in activityScopeTabs"
                :key="item.key"
                class="sub-filter-row__item"
                :class="{ active: activeActivityScope === item.key }"
                @tap="activeActivityScope = item.key"
              >
                <text>{{ item.label }}</text>
              </view>
            </view>
            <view class="section-title">
              <text>{{ currentActivityScope.label }}</text>
            </view>
            <view v-if="currentActivityList.length === 0" class="empty-card">{{ currentActivityScope.empty }}</view>
            <view v-for="item in currentActivityList" :key="item.id" class="profile-card" @tap="openActivity(item)">
              <image class="profile-card__cover" :src="item.image" mode="aspectFill" />
              <view class="profile-card__body">
                <view class="profile-card__row">
                  <text class="profile-card__title su-line-1">{{ item.title }}</text>
                  <text class="profile-card__status" :class="`profile-card__status--${getActivityStatusMeta(item).tone}`">{{ getActivityStatusMeta(item).label }}</text>
                </view>
                <text class="profile-card__meta">{{ item.date }} {{ item.time }}</text>
              </view>
            </view>
            <view v-if="activeActivityScope === 'hosting'" class="primary-button" @tap="goActivityCreate">继续发活动</view>
          </view>

          <view v-if="activeTab === 'partners'" class="profile-stack">
            <view class="sub-filter-row">
              <view
                v-for="item in partnerScopeTabs"
                :key="item.key"
                class="sub-filter-row__item"
                :class="{ active: activePartnerScope === item.key }"
                @tap="activePartnerScope = item.key"
              >
                <text>{{ item.label }}</text>
              </view>
            </view>
            <view class="section-title">
              <text>{{ currentPartnerScope.label }}</text>
            </view>
            <view v-if="currentPartnerList.length" class="partner-list">
              <view v-for="item in currentPartnerList" :key="item.id" class="partner-list__item">
                <SuPartnerCard :partner="item" />
                <view v-if="activePartnerScope === 'posted'" class="partner-list__manage" @tap.stop="goPartnerWorkbench(item.id)">管理申请</view>
              </view>
            </view>
            <view v-else class="empty-card">{{ currentPartnerScope.empty }}</view>
          </view>

          <view v-if="activeTab === 'messages'" class="profile-stack">
            <view class="task-card" @tap="goMessages">
              <SuIcon name="chat" size="46" glyph-size="20" variant="soft" />
              <view>
                <text>私聊</text>
                <text>南门饭搭子：今晚 18:10 二食堂门口见？</text>
              </view>
              <SuIcon name="arrowRight" size="34" glyph-size="18" variant="inline" color="#94a3b8" />
            </view>
            <view class="task-card" @tap="goMessages">
              <SuIcon name="people" size="46" glyph-size="20" variant="soft" />
              <view>
                <text>群聊</text>
                <text>Switch 派对群：还差 1 人就能约起来。</text>
              </view>
              <SuIcon name="arrowRight" size="34" glyph-size="18" variant="inline" color="#94a3b8" />
            </view>
            <view class="order-card" @tap="openFirstOrder">
              <SuIcon name="wallet" size="48" glyph-size="22" variant="soft" />
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
import SuIcon from '@/components/surego/SuIcon.vue'
import SuPartnerCard from '@/components/surego/SuPartnerCard.vue'
import { getActivityStatusMeta, listMyActivities, sortActivitiesByStatusPriority } from '@/common/api/activity.js'
import { listMyPartnerPosts, listPartnerPosts } from '@/common/api/partner.js'
import { getUnreadMessageCount } from '@/common/api/message.js'
import { getOrderStatusText, listOrders } from '@/common/api/order.js'
import { getCurrentUser } from '@/common/api/user.js'
import { DEFAULT_USER_AVATAR, DEFAULT_USER_NICKNAME, getCurrentUserProfile, hasOpsRole, isLoggedIn, isSuregoProfileComplete } from '@/common/api/auth.js'
import { makeRefreshHandler } from '@/common/utils/refresh.js'
import { getMiniProgramNavActionsStyle, getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goActivityCreate, goActivityDetail, goAuthLogin, goManageDashboard, goMessages, goOpsDashboard, goOrderDetail, goParticipantDashboard, goPartnerWorkbench, goVerify } from '@/common/utils/route.js'

const profileTabs = [
  { key: 'overview', label: '总览' },
  { key: 'activities', label: '活动' },
  { key: 'partners', label: '搭子' },
  { key: 'messages', label: '消息' },
  { key: 'profile', label: '资料' }
]
const socialAccounts = [
  { key: 'xiaohongshu', label: '小红书', icon: 'xiaohongshu', active: true },
  { key: 'douyin', label: '抖音', icon: 'douyin', active: true },
  { key: 'github', label: 'GitHub', icon: 'github', active: true },
  { key: 'wechat', label: '微信', icon: 'wechat', active: false }
]
const activeTab = ref('overview')
const activeActivityScope = ref('joined')
const activePartnerScope = ref('posted')
const activeOrderFilter = ref('all')
const loggedIn = ref(false)
const canUseOps = ref(false)
const unreadCount = ref(0)
const myActivities = ref({ hosting: [], joined: [], invited: [], pending: [] })
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
const activityScopeTabs = [
  { key: 'joined', label: '我的报名', empty: '暂无报名活动' },
  { key: 'checkin', label: '待到场 / 核销', empty: '暂无待到场活动' },
  { key: 'hosting', label: '我发起的活动', empty: '暂无发起活动' },
  { key: 'invited', label: '邀请待确认', empty: '暂无待确认邀请' },
  { key: 'pending', label: '申请中', empty: '暂无申请中的活动' }
]
const partnerScopeTabs = [
  { key: 'posted', label: '我发布的搭子', empty: '暂无发布的搭子' },
  { key: 'intents', label: '我的意向', empty: '暂无搭子意向' }
]

const hostingActivities = computed(() => sortActivitiesByStatusPriority(myActivities.value.hosting || []))
const joinedActivities = computed(() => sortActivitiesByStatusPriority(myActivities.value.joined || []))
const checkinActivities = computed(() => joinedActivities.value.filter((item) => item.applicationStatus === 'approved'))
const invitedActivities = computed(() => sortActivitiesByStatusPriority(myActivities.value.invited || []))
const pendingActivities = computed(() => sortActivitiesByStatusPriority(myActivities.value.pending || []))
const currentActivityScope = computed(() => activityScopeTabs.find((item) => item.key === activeActivityScope.value) || activityScopeTabs[0])
const currentActivityList = computed(() => {
  const map = {
    joined: joinedActivities.value,
    checkin: checkinActivities.value,
    hosting: hostingActivities.value,
    invited: invitedActivities.value,
    pending: pendingActivities.value
  }
  return map[activeActivityScope.value] || joinedActivities.value
})
const partnerPostList = computed(() => partnerPosts.value)
const postedPartnerPosts = computed(() => partnerPostList.value)
const intentPartnerPost = computed(() => (
  allPartnerPosts.value.find((item) => item.id === 'hackathon-ai-front') || allPartnerPosts.value.find((item) => !item.isCreator) || null
))
const intentPartnerPosts = computed(() => (intentPartnerPost.value ? [intentPartnerPost.value] : []))
const currentPartnerScope = computed(() => partnerScopeTabs.find((item) => item.key === activePartnerScope.value) || partnerScopeTabs[0])
const currentPartnerList = computed(() => (
  activePartnerScope.value === 'intents' ? intentPartnerPosts.value : postedPartnerPosts.value
))
const firstOrder = computed(() => orders.value[0] || null)
const profileComplete = computed(() => isSuregoProfileComplete(user.value))
const displayProfile = computed(() => {
  const profile = user.value || {}
  if (!loggedIn.value) {
    return {
      avatar: DEFAULT_USER_AVATAR,
      nickname: DEFAULT_USER_NICKNAME,
      bio: profile.bio || '登录后同步你的活动、订单和搭子状态。',
      badge: '未登录'
    }
  }
  return {
    avatar: getDisplayText(profile.avatar, DEFAULT_USER_AVATAR),
    nickname: getDisplayText(profile.nickname, DEFAULT_USER_NICKNAME),
    bio: getDisplayText(profile.bio || profile.quote, '还没有填写个人简介'),
    badge: getProfileBadge(profile)
  }
})
const profileStats = computed(() => {
  const profile = user.value || {}
  const registeredCount = getCountFromListOrProfile(
    [...joinedActivities.value, ...pendingActivities.value],
    profile.joinedCount ?? profile.joined_count ?? profile.applicationCount ?? profile.application_count
  )
  const hostedCount = getCountFromListOrProfile(
    hostingActivities.value,
    profile.hostedCount ?? profile.hosted_count
  )
  const partnerCount = getCountFromListOrProfile(
    postedPartnerPosts.value,
    profile.partnerPostCount ?? profile.partner_post_count ?? profile.partnerCount ?? profile.partner_count
  )
  return [
    { key: 'credit', label: '信用分', value: loggedIn.value ? formatStatNumber(profile.credit, 0) : '0' },
    { key: 'registered', label: '报名', value: String(loggedIn.value ? registeredCount : 0) },
    { key: 'hosted', label: '发起活动', value: String(loggedIn.value ? hostedCount : 0) },
    { key: 'partners', label: '搭子', value: String(loggedIn.value ? partnerCount : 0) }
  ]
})
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

function getDisplayText(value, fallback = '') {
  const text = String(value || '').trim()
  return text || fallback
}

function getProfileBadge(profile = {}) {
  if (hasOpsRole(profile)) return '运营账号'
  return profileComplete.value ? '资料已完善' : '微信资料待完善'
}

function getItemIdentity(item = {}) {
  return String(item.id || item._id || item.activityId || item.activity_id || item.partnerPostId || item.partner_post_id || '')
}

function countUniqueItems(items = []) {
  const seen = new Set()
  return (Array.isArray(items) ? items : []).filter((item, index) => {
    const id = getItemIdentity(item) || `index_${index}`
    if (seen.has(id)) return false
    seen.add(id)
    return true
  }).length
}

function getCountFromListOrProfile(items = [], profileCount = 0) {
  const listCount = countUniqueItems(items)
  if (listCount > 0) return listCount
  return Math.max(0, Number(profileCount) || 0)
}

function formatStatNumber(value, fallback = 0) {
  const number = Number(value)
  if (!Number.isFinite(number)) return String(fallback)
  return Number.isInteger(number) ? String(number) : number.toFixed(1)
}

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
      myActivities.value = { hosting: [], joined: [], invited: [], pending: [] }
      partnerPosts.value = []
      allPartnerPosts.value = []
      orders.value = []
      unreadCount.value = 0
      return
    }

    user.value = await withTimeout(getCurrentUser(), getCurrentUserProfile(), 5000)
    try {
      const freshUser = await getCurrentUser({ allowFallback: false })
      user.value = freshUser
      canUseOps.value = hasOpsRole(freshUser)
    } catch (error) {
      canUseOps.value = false
    }
    const [activities, partnerItems, allPartners, orderItems, unread] = await Promise.all([
      listMyActivities(),
      listMyPartnerPosts(),
      listPartnerPosts(),
      listOrders(),
      getUnreadMessageCount()
    ])
    myActivities.value = Array.isArray(activities)
      ? { hosting: [], joined: activities, invited: [], pending: [] }
      : {
          hosting: activities.hosting || [],
          joined: activities.joined || [],
          invited: activities.invited || [],
          pending: activities.pending || []
        }
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

function switchProfileTab(key) {
  activeTab.value = key
}

function showActivityScope(scope) {
  activeTab.value = 'activities'
  activeActivityScope.value = scope
}

function showPartnerScope(scope) {
  activeTab.value = 'partners'
  activePartnerScope.value = scope
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
  gap: 28rpx;
  padding: 34rpx;
  border: 1rpx solid rgba(24, 24, 27, 0.08);
  border-radius: 46rpx;
  background: linear-gradient(145deg, #ffffff 0%, #f6fbff 100%);
  box-shadow: 0 18rpx 42rpx rgba(30, 88, 156, 0.08);
}

.profile-hero-card__top {
  display: grid;
  grid-template-columns: 136rpx minmax(0, 1fr);
  align-items: center;
  gap: 26rpx;
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

.profile-avatar {
  width: 136rpx;
  height: 136rpx;
  box-sizing: border-box;
  border: 6rpx solid #fff;
  border-radius: 50%;
  background: #e8f3ff;
  box-shadow: 0 14rpx 32rpx rgba(15, 23, 42, 0.14);
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
  background: rgba(35, 136, 255, 0.12);
  color: #1d4ed8;
}

.profile-hero-card__name {
  display: block;
  margin-top: 14rpx;
  color: #102033;
  font-size: 50rpx;
  font-weight: 950;
  line-height: 1.05;
}

.profile-hero-card__bio {
  display: block;
  margin-top: 12rpx;
  color: #64748b;
  font-size: 25rpx;
  font-weight: 850;
  line-height: 1.45;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.account-icon-row {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
  margin-top: 20rpx;
}

.account-icon {
  position: relative;
  display: flex;
  width: 68rpx;
  height: 68rpx;
  align-items: center;
  justify-content: center;
  border: 1rpx solid rgba(24, 24, 27, 0.06);
  border-radius: 24rpx;
  background: #fff;
  color: #a1a1aa;
  box-shadow: 0 10rpx 22rpx rgba(30, 88, 156, 0.06);
}

.account-icon.active {
  border-color: rgba(35, 136, 255, 0.18);
}

.account-icon--xiaohongshu {
  background: #fff1f4;
}

.account-icon--douyin,
.account-icon--github {
  background: #f4f6f8;
}

.account-icon--wechat {
  background: #effdf5;
}

.account-icon__image {
  width: 34rpx;
  height: 34rpx;
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

.sub-filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.sub-filter-row__item {
  display: inline-flex;
  min-height: 58rpx;
  align-items: center;
  justify-content: center;
  padding: 0 22rpx;
  border: 1rpx solid rgba(24, 24, 27, 0.07);
  border-radius: 999rpx;
  background: #fff;
  color: #64748b;
  font-size: 22rpx;
  font-weight: 950;
  box-shadow: 0 8rpx 18rpx rgba(30, 88, 156, 0.045);
}

.sub-filter-row__item.active {
  border-color: #2388ff;
  background: #2388ff;
  color: #fff;
}

.task-list,
.profile-stack {
  display: grid;
  gap: 18rpx;
}

.task-card,
.order-card {
  display: grid;
  align-items: center;
  gap: 24rpx;
  padding: 26rpx 30rpx;
  border: 1rpx solid rgba(24, 24, 27, 0.07);
  border-radius: 40rpx;
  background: #fff;
  color: #102033;
  box-shadow: 0 12rpx 28rpx rgba(30, 88, 156, 0.055);
}

.task-card {
  grid-template-columns: 48rpx minmax(0, 1fr) 36rpx;
  min-height: 92rpx;
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

.task-card view text:nth-child(2),
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

.partner-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.partner-list__item {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.partner-list__manage {
  align-self: flex-end;
  padding: 12rpx 22rpx;
  border-radius: 999rpx;
  background: #edf6ff;
  color: #2388ff;
  font-size: 22rpx;
  font-weight: 950;
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
  margin-bottom: 12rpx;
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
  background: #2388ff;
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
