<template>
  <view class="ops-users su-page">
    <view class="ops-users__nav" :style="navStyle">
      <view class="ops-users__nav-row" :style="navRowStyle">
      <view class="ops-users__back" @tap="handleBack">
        <SuIcon name="left" size="48" glyph-size="24" variant="inline" color="#111827" />
      </view>
      <view>
        <text class="ops-users__title">用户与权限</text>
      </view>
      <view class="ops-users__refresh" @tap="loadUsers">
        <SuIcon name="refresh" size="40" glyph-size="20" variant="inline" color="#111827" />
      </view>
      </view>
    </view>

    <scroll-view scroll-y class="ops-users__scroll" :style="contentTopStyle">
      <view class="hero">
        <text class="hero__eyebrow">ADMIN ONLY</text>
        <text class="hero__title">设置用户角色，控制运营台访问权限</text>
      </view>

      <view v-if="!isAdmin" class="empty">
        <SuIcon name="locked-filled" size="84" glyph-size="42" variant="inline" color="#cbd5e1" />
        <text>只有管理员可以设置用户角色</text>
      </view>

      <view v-else class="user-list">
        <view v-if="users.length === 0" class="empty">
          <SuIcon name="navProfile" size="84" glyph-size="42" variant="inline" color="#cbd5e1" />
          <text>暂无用户</text>
        </view>

        <view v-for="item in users" :key="item.uid" class="user-card">
          <image class="user-card__avatar" :src="item.avatar" mode="aspectFill" />
          <view class="user-card__body">
            <view class="user-card__top">
              <text class="user-card__name su-line-1">{{ item.nickname }}</text>
              <text class="user-card__role">{{ item.roleText }}</text>
            </view>
            <text class="user-card__id su-line-1">UID {{ item.uid }}</text>
            <text class="user-card__meta">最近登录 {{ formatDate(item.lastLoginDate) }}</text>
            <view class="role-options">
              <view
                v-for="role in roleOptions"
                :key="role.value"
                class="role-option"
                :class="{ 'role-option--active': item.roles.includes(role.value), 'role-option--saving': savingId === item.uid }"
                @tap="handleRoleChange(item, role.value)"
              >
                {{ role.label }}
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import SuIcon from '@/components/surego/SuIcon.vue'
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getCurrentUser, getRoleLabel, isAdminUser, listUsers, updateUserRoles } from '@/common/api/user.js'
import { getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goBackOrFallback } from '@/common/utils/route.js'

const roleOptions = [
  { value: 'user', label: '普通用户' },
  { value: 'operator', label: '运营人员' },
  { value: 'admin', label: '管理员' }
]

const users = ref([])
const isAdmin = ref(false)
const savingId = ref('')
const navStyle = getMiniProgramNavStyle()
const navRowStyle = getMiniProgramNavRowStyle({ leftPaddingRpx: 34, minRightPaddingRpx: 24 })
const contentTopStyle = getMiniProgramNavContentStyle({ gapRpx: 18 })

onShow(async () => {
  const current = await getCurrentUser({ allowFallback: false })
  isAdmin.value = isAdminUser(current)
  if (!isAdmin.value) {
    uni.showToast({ title: '无权设置用户角色', icon: 'none' })
    return
  }
  await loadUsers()
})

function handleBack() {
  goBackOrFallback('/pages/ops/dashboard')
}

async function loadUsers() {
  if (!isAdmin.value) return
  users.value = await listUsers()
}

async function handleRoleChange(user, role) {
  if (!isAdmin.value || savingId.value || user.roles.includes(role)) return
  savingId.value = user.uid
  try {
    const updated = await updateUserRoles(user.uid, [role])
    users.value = users.value.map((item) => (
      item.uid === user.uid
        ? {
            ...item,
            ...updated,
            roles: updated.roles || [role],
            roleText: (updated.roles || [role]).map(getRoleLabel).join('、')
          }
        : item
    ))
    uni.showToast({ title: '角色已更新', icon: 'none' })
  } catch (error) {
    uni.showToast({ title: error?.message || '角色更新失败', icon: 'none' })
  } finally {
    savingId.value = ''
  }
}

function formatDate(value) {
  if (!value) return '暂无'
  const date = new Date(Number(value))
  if (Number.isNaN(date.getTime())) return '暂无'
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hour = `${date.getHours()}`.padStart(2, '0')
  const minute = `${date.getMinutes()}`.padStart(2, '0')
  return `${month}-${day} ${hour}:${minute}`
}
</script>

<style scoped>
.ops-users {
  min-height: 100vh;
  background: #f8fafc;
}

.ops-users__nav {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 20;
  background: rgba(248, 250, 252, 0.9);
  backdrop-filter: blur(18px);
}

.ops-users__nav-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ops-users__back,
.ops-users__refresh {
  display: flex;
  width: 72rpx;
  height: 72rpx;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 12rpx 30rpx rgba(15, 23, 42, 0.08);
}

.ops-users__title,
.ops-users__sub {
  display: block;
  text-align: center;
}

.ops-users__title {
  color: #0f172a;
  font-size: 32rpx;
  font-weight: 900;
}

.ops-users__sub {
  margin-top: 4rpx;
  color: #94a3b8;
  font-size: 18rpx;
  font-weight: 900;
}

.ops-users__scroll {
  height: 100vh;
  box-sizing: border-box;
}

.hero {
  margin: 10rpx 34rpx 28rpx;
  padding: 36rpx;
  border-radius: 36rpx;
  background: #0f172a;
  color: #fff;
}

.hero__eyebrow,
.hero__title,
.hero__desc {
  display: block;
}

.hero__eyebrow {
  color: #93c5fd;
  font-size: 20rpx;
  font-weight: 900;
}

.hero__title {
  margin-top: 14rpx;
  font-size: 36rpx;
  font-weight: 900;
  line-height: 1.35;
}

.hero__desc {
  margin-top: 14rpx;
  color: #cbd5e1;
  font-size: 23rpx;
  font-weight: 800;
  line-height: 1.55;
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  padding: 0 34rpx 70rpx;
}

.user-card {
  display: flex;
  gap: 20rpx;
  padding: 24rpx;
  border-radius: 30rpx;
  background: #fff;
  box-shadow: 0 12rpx 30rpx rgba(15, 23, 42, 0.05);
}

.user-card__avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: #f1f5f9;
}

.user-card__body {
  flex: 1;
  min-width: 0;
}

.user-card__top {
  display: flex;
  gap: 12rpx;
  align-items: center;
}

.user-card__name {
  flex: 1;
  color: #0f172a;
  font-size: 27rpx;
  font-weight: 900;
}

.user-card__role {
  flex: 0 0 auto;
  padding: 6rpx 12rpx;
  border-radius: 999rpx;
  background: #e0f2fe;
  color: #0284c7;
  font-size: 18rpx;
  font-weight: 900;
}

.user-card__id,
.user-card__meta {
  display: block;
  margin-top: 8rpx;
  color: #94a3b8;
  font-size: 20rpx;
  font-weight: 800;
}

.role-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-top: 16rpx;
}

.role-option {
  padding: 11rpx 18rpx;
  border-radius: 999rpx;
  background: #f1f5f9;
  color: #475569;
  font-size: 20rpx;
  font-weight: 900;
}

.role-option--active {
  background: #0f172a;
  color: #fff;
}

.role-option--saving {
  opacity: 0.6;
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 16rpx;
  padding: 120rpx 34rpx;
  color: #94a3b8;
  font-size: 24rpx;
  font-weight: 900;
}
</style>
