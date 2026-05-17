<template>
  <view v-if="isPageLoading" class="edit-profile su-page">
    <SuPageLoading :style="contentTopStyle" text="资料加载中..." />
  </view>
  <view v-else class="edit-profile su-page">
    <view class="edit-profile__nav" :style="navStyle">
      <view class="edit-profile__nav-row" :style="navRowStyle">
        <view class="edit-profile__back" @tap="goBackOrFallback">
          <SuIcon name="left" size="48" glyph-size="24" variant="inline" color="#111827" />
        </view>
        <text>编辑资料</text>
        <view class="edit-profile__back" />
      </view>
    </view>

    <scroll-view scroll-y class="edit-profile__scroll" :style="contentTopStyle">
      <view class="edit-profile__content">
        <view class="edit-hero">
          <button class="avatar-box" open-type="chooseAvatar" @chooseavatar="handleChooseAvatar">
            <image class="avatar-box__image" :src="form.avatar" mode="aspectFill" />
            <view class="avatar-box__mask">
              <SuIcon name="camera-filled" size="44" glyph-size="22" variant="inline" color="#fff" />
            </view>
          </button>
          <view class="edit-hero__body">
            <text>{{ form.nickname || '微信用户' }}</text>
            <text>{{ profileMetaText }}</text>
          </view>
        </view>

        <view class="profile-card">
          <view class="section-head">
            <text>基础资料</text>
          </view>

          <view class="field">
            <text class="label">昵称</text>
            <input class="input" type="nickname" v-model="form.nickname" adjust-position="false" cursor-spacing="28" placeholder="请输入昵称" placeholder-class="placeholder" />
          </view>

          <view class="field">
            <text class="label">MBTI</text>
            <picker :range="mbtiOptions" :value="mbtiIndex" @change="handleMbtiChange">
              <view class="input input--picker">{{ form.mbti || '选择 MBTI' }}</view>
            </picker>
          </view>

          <view class="field">
            <text class="label">一句话介绍</text>
            <input class="input" v-model="form.bio" adjust-position="false" cursor-spacing="28" placeholder="例如：周末看展、饭搭子雷达" placeholder-class="placeholder" />
          </view>

          <view class="field">
            <text class="label">个人签名</text>
            <textarea class="textarea" v-model="form.quote" maxlength="120" auto-height adjust-position="false" cursor-spacing="28" placeholder="写一句你想让同频朋友看到的话" placeholder-class="placeholder" />
          </view>
        </view>

        <view class="profile-card">
          <view class="section-head">
            <text>标签与印象</text>
          </view>
          <view class="question-list">
            <text v-for="item in profileTags" :key="item">{{ item }}</text>
          </view>
        </view>

        <view class="profile-card">
          <view class="section-head">
            <text>账号与认证</text>
          </view>
          <view class="relation-strip">
            <view v-for="item in relationStats" :key="item.key">
              <text>{{ item.value }}</text>
              <text>{{ item.label }}</text>
            </view>
          </view>
          <view class="account-list">
            <view v-for="account in socialAccounts" :key="account.key" class="account-row">
              <view>
                <SuIcon :name="account.icon" size="48" glyph-size="24" variant="brand" :disabled="!account.active" />
                <text>{{ account.label }}</text>
              </view>
              <text :class="{ active: account.active }">{{ account.active ? '已展示' : '未绑定' }}</text>
            </view>
          </view>
          <view class="verify-row" @tap="goVerify">
            <view>
              <SuIcon name="shield" size="48" glyph-size="24" variant="soft" />
              <text>学生认证</text>
            </view>
            <text>{{ verifyText }}</text>
          </view>
          <view class="completion-row">
            <view>
              <text>资料完整度</text>
              <text>{{ profileCompletion }}%</text>
            </view>
            <view>
              <view :style="{ width: `${profileCompletion}%` }" />
            </view>
          </view>
        </view>

        <button class="save-btn" :disabled="isSaving || !canSave" :class="{ 'save-btn--disabled': isSaving || !canSave }" @tap="handleSave">
          {{ isSaving ? '保存中...' : '保存资料' }}
        </button>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import SuIcon from '@/components/surego/SuIcon.vue'
import { computed, reactive, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getCurrentUser, updateCurrentUser } from '@/common/api/user.js'
import { uploadImageFile } from '@/common/api/upload.js'
import SuPageLoading from '@/components/surego/SuPageLoading.vue'
import { getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goBackOrFallback, goVerify } from '@/common/utils/route.js'

const mbtiOptions = ['ENFP', 'INFP', 'INFJ', 'ENFJ', 'INTJ', 'ENTJ', 'ISFP', 'ESFP', 'ISTJ', 'ESTJ']
const mbtiIndex = ref(0)
const isSaving = ref(false)
const navStyle = getMiniProgramNavStyle()
const navRowStyle = getMiniProgramNavRowStyle({ leftPaddingRpx: 34, minRightPaddingRpx: 24 })
const contentTopStyle = getMiniProgramNavContentStyle({ gapRpx: 18 })
const isPageLoading = ref(true)
const form = reactive({
  nickname: '',
  avatar: '',
  avatarFileId: '',
  mbti: '',
  bio: '',
  quote: '',
  followingCount: 0,
  following_count: 0,
  followerCount: 0,
  follower_count: 0
})

const canSave = computed(() => form.nickname.trim() && form.bio.trim())
const socialAccounts = [
  { key: 'xiaohongshu', label: '小红书', icon: 'xiaohongshu', active: true },
  { key: 'douyin', label: '抖音', icon: 'douyin', active: true },
  { key: 'github', label: 'GitHub', icon: 'github', active: true },
  { key: 'wechat', label: '微信', icon: 'wechat', active: false }
]
const profileTags = computed(() => [
  form.mbti || '同频玩家',
  '饭搭子雷达',
  '羽毛球新手',
  '周末看展',
  '不临时鸽',
  '准时',
  '好沟通',
  '活动真实'
])
const profileCompletion = computed(() => {
  const checks = [form.avatar, form.nickname, form.mbti, form.bio, form.quote]
  const done = checks.filter((item) => String(item || '').trim()).length
  return Math.round((done / checks.length) * 100)
})
const profileMetaText = computed(() => [
  form.mbti,
  form.bio || '还没有填写个人简介'
].filter(Boolean).join(' · '))
const verifyText = computed(() => profileCompletion.value >= 80 ? '资料已完善' : '待完善')
const relationStats = computed(() => [
  {
    key: 'following',
    label: '关注',
    value: String(Number(form.followingCount ?? form.following_count ?? form.followCount ?? form.follow_count ?? 0) || 0)
  },
  {
    key: 'followers',
    label: '粉丝',
    value: String(Number(form.followerCount ?? form.follower_count ?? form.fansCount ?? form.fans_count ?? 0) || 0)
  }
])

onShow(async () => {
  isPageLoading.value = true
  try {
    const user = await getCurrentUser()
    Object.assign(form, user)
    mbtiIndex.value = Math.max(0, mbtiOptions.indexOf(form.mbti))
  } finally {
    isPageLoading.value = false
  }
})

function handleMbtiChange(event) {
  mbtiIndex.value = Number(event.detail.value)
  form.mbti = mbtiOptions[mbtiIndex.value]
}

async function handleChooseAvatar(event) {
  const avatarUrl = event?.detail?.avatarUrl || ''
  if (!avatarUrl) return
  try {
    const uploaded = await uploadImageFile(avatarUrl, { prefix: 'surego/avatars', compress: true })
    form.avatar = uploaded.url
    form.avatarFileId = uploaded.fileID || uploaded.url
  } catch (error) {
    uni.showToast({ title: '头像上传失败，可稍后重试', icon: 'none' })
  }
}

async function handleSave() {
  if (!canSave.value || isSaving.value) return
  isSaving.value = true
  await updateCurrentUser(form)
  uni.showToast({ title: '资料已保存', icon: 'none' })
  setTimeout(() => {
    goBackOrFallback()
  }, 260)
}
</script>

<style scoped>
.edit-profile {
  min-height: 100vh;
  background: #f8f9f9;
}

.edit-profile__nav {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 20;
  background: rgba(248, 249, 249, 0.9);
  backdrop-filter: blur(18px);
  color: #111827;
  font-size: 28rpx;
  font-weight: 900;
}

.edit-profile__nav-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.edit-profile__back {
  display: flex;
  width: 68rpx;
  height: 68rpx;
  align-items: center;
  justify-content: center;
}

.edit-profile__scroll {
  height: 100vh;
  box-sizing: border-box;
}

.edit-profile__content {
  display: grid;
  gap: 22rpx;
  padding: 24rpx 28rpx 80rpx;
}

.edit-hero {
  display: grid;
  grid-template-columns: 172rpx minmax(0, 1fr);
  align-items: center;
  gap: 26rpx;
  padding: 34rpx;
  border: 1rpx solid rgba(24, 24, 27, 0.08);
  border-radius: 42rpx;
  background: linear-gradient(145deg, #ffffff 0%, #f4fbff 100%);
  box-shadow: 0 18rpx 42rpx rgba(30, 88, 156, 0.08);
}

.edit-hero__body {
  min-width: 0;
}

.edit-hero__body text {
  display: block;
}

.edit-hero__body text:first-child {
  overflow: hidden;
  color: #102033;
  font-size: 44rpx;
  font-weight: 950;
  line-height: 1.15;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.edit-hero__body text:last-child {
  margin-top: 12rpx;
  color: #64748b;
  font-size: 24rpx;
  font-weight: 850;
  line-height: 1.45;
}

.profile-card {
  padding: 34rpx;
  border: 1rpx solid rgba(24, 24, 27, 0.08);
  border-radius: 36rpx;
  background: #fff;
  box-shadow: 0 12rpx 30rpx rgba(15, 23, 42, 0.055);
}

.avatar-box {
  position: relative;
  width: 172rpx;
  height: 172rpx;
  padding: 0;
  border-radius: 50%;
  background: transparent;
}

.avatar-box::after {
  border: 0;
}

.avatar-box__image {
  width: 172rpx;
  height: 172rpx;
  border: 8rpx solid #fff;
  border-radius: 50%;
  background: #f1f5f9;
  box-shadow: 0 18rpx 44rpx rgba(15, 23, 42, 0.14);
}

.avatar-box__mask {
  position: absolute;
  right: 4rpx;
  bottom: 8rpx;
  display: flex;
  width: 54rpx;
  height: 54rpx;
  align-items: center;
  justify-content: center;
  border: 4rpx solid #fff;
  border-radius: 50%;
  background: #22c55e;
}

.section-head text {
  display: block;
  color: #102033;
  font-size: 31rpx;
  font-weight: 950;
  line-height: 1.25;
}

.field {
  margin-top: 28rpx;
}

.label {
  color: #94a3b8;
  font-size: 21rpx;
  font-weight: 900;
}

.input,
.textarea {
  width: 100%;
  margin-top: 14rpx;
  padding: 0 24rpx;
  border: 1rpx solid #eef2f7;
  border-radius: 24rpx;
  background: #f8fafc;
  color: #0f172a;
  font-size: 26rpx;
  font-weight: 800;
}

.input {
  height: 82rpx;
}

.input--picker {
  display: flex;
  align-items: center;
}

.textarea {
  min-height: 170rpx;
  padding: 24rpx;
  line-height: 1.55;
}

.placeholder {
  color: #cbd5e1;
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

.relation-strip {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
  margin-top: 20rpx;
}

.relation-strip view {
  padding: 22rpx 18rpx;
  border-radius: 28rpx;
  background: #f8fafc;
  text-align: center;
}

.relation-strip text {
  display: block;
}

.relation-strip text:first-child {
  color: #102033;
  font-size: 34rpx;
  font-weight: 950;
}

.relation-strip text:last-child {
  margin-top: 6rpx;
  color: #64748b;
  font-size: 21rpx;
  font-weight: 900;
}

.account-list {
  display: grid;
  gap: 14rpx;
  margin-top: 20rpx;
}

.account-row,
.verify-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #eef2f7;
}

.account-row view,
.verify-row view {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 16rpx;
}

.account-row view text,
.verify-row view text {
  color: #102033;
  font-size: 25rpx;
  font-weight: 950;
}

.account-row > text,
.verify-row > text {
  flex: 0 0 auto;
  color: #94a3b8;
  font-size: 22rpx;
  font-weight: 900;
}

.account-row > text.active {
  color: #2388ff;
}

.verify-row {
  margin-top: 8rpx;
}

.completion-row {
  margin-top: 24rpx;
}

.completion-row > view:first-child {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #102033;
  font-size: 24rpx;
  font-weight: 950;
}

.completion-row > view:last-child {
  overflow: hidden;
  height: 14rpx;
  margin-top: 14rpx;
  border-radius: 999rpx;
  background: #e2e8f0;
}

.completion-row > view:last-child view {
  height: 100%;
  border-radius: 999rpx;
  background: linear-gradient(90deg, #2388ff, #10b981);
}

.save-btn {
  display: flex;
  height: 94rpx;
  align-items: center;
  justify-content: center;
  margin-top: 2rpx;
  border-radius: 30rpx;
  background: #0f172a;
  color: #fff;
  font-size: 28rpx;
  font-weight: 900;
}

.save-btn--disabled {
  opacity: 0.45;
}
</style>
