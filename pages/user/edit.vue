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

        <view class="profile-card profile-card--form">
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

        <view class="profile-card profile-card--tags">
          <view class="section-head">
            <text>标签与印象</text>
          </view>
          <view class="question-list">
            <text v-for="item in profileTags" :key="item" @tap="removeProfileTag(item)">{{ item }}</text>
          </view>
          <view class="tag-editor">
            <input class="input" v-model="tagInput" maxlength="12" adjust-position="false" cursor-spacing="28" placeholder="新增标签，例如 准时" placeholder-class="placeholder" />
            <view @tap="addProfileTag">添加</view>
          </view>
        </view>

        <view class="profile-card profile-card--account">
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
            <view v-for="account in socialAccounts" :key="account.key" class="account-row" @tap="handleSocialAccount(account)">
              <view>
                <SuIcon :name="account.icon" size="48" glyph-size="24" variant="brand" :disabled="!account.active" />
                <text>{{ account.label }}</text>
              </view>
              <text :class="{ active: account.active }">{{ account.active ? '已展示' : '待接入' }}</text>
            </view>
          </view>
          <view class="verify-row" @tap="openVerify">
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
const avatarTempPath = ref('')
const navStyle = getMiniProgramNavStyle()
const navRowStyle = getMiniProgramNavRowStyle({ leftPaddingRpx: 34, minRightPaddingRpx: 24 })
const contentTopStyle = getMiniProgramNavContentStyle({ gapRpx: 18 })
const isPageLoading = ref(true)
const DRAFT_KEY = 'surego_user_edit_draft'
const form = reactive({
  nickname: '',
  avatar: '',
  avatarFileId: '',
  mbti: '',
  bio: '',
  quote: '',
  profileTags: [],
  profile_tags: [],
  followingCount: 0,
  following_count: 0,
  followerCount: 0,
  follower_count: 0
})
const tagInput = ref('')
const tagsTouched = ref(false)

const canSave = computed(() => form.nickname.trim() && form.bio.trim())
const socialAccounts = [
  { key: 'xiaohongshu', label: '小红书', icon: 'xiaohongshu', active: false },
  { key: 'douyin', label: '抖音', icon: 'douyin', active: false },
  { key: 'github', label: 'GitHub', icon: 'github', active: false },
  { key: 'wechat', label: '微信', icon: 'wechat', active: false }
]
const profileTags = computed(() => {
  const saved = Array.isArray(form.profileTags)
    ? form.profileTags
    : (Array.isArray(form.profile_tags) ? form.profile_tags : [])
  if (tagsTouched.value || saved.length) {
    return Array.from(new Set(saved.map((item) => String(item || '').trim()).filter(Boolean))).slice(0, 8)
  }
  const defaults = [form.mbti || '同频玩家', '饭搭子雷达', '准时', '好沟通']
  return Array.from(new Set(defaults.map((item) => String(item || '').trim()).filter(Boolean))).slice(0, 8)
})
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
    const draft = getProfileDraft()
    const nextProfile = draft && typeof draft === 'object' ? { ...user, ...draft } : user
    Object.assign(form, nextProfile)
    const tags = nextProfile.profileTags || nextProfile.profile_tags || nextProfile.impressionTags || nextProfile.impression_tags || []
    form.profileTags = Array.isArray(tags) ? [...tags] : []
    form.profile_tags = form.profileTags
    tagsTouched.value = Boolean(draft?.tagsTouched)
    avatarTempPath.value = ''
    mbtiIndex.value = Math.max(0, mbtiOptions.indexOf(form.mbti))
  } finally {
    isPageLoading.value = false
  }
})

function handleMbtiChange(event) {
  mbtiIndex.value = Number(event.detail.value)
  form.mbti = mbtiOptions[mbtiIndex.value]
}

function addProfileTag() {
  const text = tagInput.value.trim()
  if (!text) return
  const next = Array.from(new Set([...(form.profileTags || []), text])).slice(0, 8)
  form.profileTags = next
  form.profile_tags = next
  tagsTouched.value = true
  tagInput.value = ''
}

function removeProfileTag(tag) {
  const next = profileTags.value.filter((item) => item !== tag)
  form.profileTags = next
  form.profile_tags = next
  tagsTouched.value = true
}

function handleSocialAccount(account) {
  uni.showToast({
    title: `${account.label}认证暂未接入`,
    icon: 'none'
  })
}

function getProfileDraft() {
  try {
    return uni.getStorageSync(DRAFT_KEY) || null
  } catch (error) {
    return null
  }
}

function persistProfileDraft() {
  try {
    uni.setStorageSync(DRAFT_KEY, {
      ...form,
      profileTags: profileTags.value,
      profile_tags: profileTags.value,
      tagsTouched: tagsTouched.value
    })
  } catch (error) {
    // local storage may be unavailable in some runtimes; navigation should still continue.
  }
}

function clearProfileDraft() {
  try {
    uni.removeStorageSync(DRAFT_KEY)
  } catch (error) {
    // ignore local cleanup failures
  }
}

function openVerify() {
  persistProfileDraft()
  goVerify()
}

function handleChooseAvatar(event) {
  const avatarUrl = event?.detail?.avatarUrl || ''
  if (!avatarUrl) return
  avatarTempPath.value = avatarUrl
  form.avatar = avatarUrl
}

async function handleSave() {
  if (!canSave.value || isSaving.value) return
  isSaving.value = true
  try {
    const payload = { ...form }
    payload.profileTags = profileTags.value
    payload.profile_tags = profileTags.value
    let avatarUploadFailed = false
    if (avatarTempPath.value) {
      try {
        const uploaded = await uploadImageFile(avatarTempPath.value, { prefix: 'surego/avatars', compress: true })
        payload.avatar = uploaded.url
        payload.avatarFileId = uploaded.fileID || uploaded.url
      } catch (error) {
        avatarUploadFailed = true
        payload.avatar = ''
        payload.avatarFileId = ''
        uni.showToast({ title: '头像暂未上传，已保存其他资料', icon: 'none' })
      }
    }
    const saved = await updateCurrentUser(payload)
    Object.assign(form, saved)
    avatarTempPath.value = ''
    if (!avatarUploadFailed) {
      uni.showToast({ title: '资料已保存', icon: 'none' })
    }
    clearProfileDraft()
    setTimeout(() => {
      goBackOrFallback()
    }, 260)
  } finally {
    isSaving.value = false
  }
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
  gap: 18rpx;
  padding: 22rpx 30rpx 90rpx;
}

.edit-hero {
  display: grid;
  grid-template-columns: 148rpx minmax(0, 1fr);
  align-items: center;
  gap: 24rpx;
  padding: 30rpx;
  border: 1rpx solid rgba(24, 24, 27, 0.08);
  border-radius: 38rpx;
  background: linear-gradient(145deg, #ffffff 0%, #f4fbff 100%);
  box-shadow: 0 16rpx 38rpx rgba(30, 88, 156, 0.075);
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
  font-size: 40rpx;
  font-weight: 950;
  line-height: 1.15;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.edit-hero__body text:last-child {
  margin-top: 10rpx;
  color: #64748b;
  font-size: 24rpx;
  font-weight: 850;
  line-height: 1.45;
}

.profile-card {
  padding: 28rpx;
  border: 1rpx solid rgba(24, 24, 27, 0.08);
  border-radius: 32rpx;
  background: #fff;
  box-shadow: 0 12rpx 30rpx rgba(15, 23, 42, 0.055);
}

.profile-card--form {
  display: grid;
  gap: 22rpx;
}

.avatar-box {
  position: relative;
  width: 148rpx;
  height: 148rpx;
  padding: 0;
  border-radius: 50%;
  background: transparent;
}

.avatar-box::after {
  border: 0;
}

.avatar-box__image {
  width: 148rpx;
  height: 148rpx;
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
  width: 50rpx;
  height: 50rpx;
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
  display: grid;
  gap: 12rpx;
}

.section-head + .field {
  margin-top: 4rpx;
}

.label {
  color: #94a3b8;
  font-size: 21rpx;
  font-weight: 900;
}

.input,
.textarea {
  width: 100%;
  padding: 0 24rpx;
  border: 1rpx solid #eef2f7;
  border-radius: 22rpx;
  background: #f8fafc;
  color: #0f172a;
  font-size: 26rpx;
  font-weight: 800;
}

.input {
  height: 78rpx;
}

.input--picker {
  display: flex;
  align-items: center;
}

.textarea {
  min-height: 154rpx;
  padding: 22rpx 24rpx;
  line-height: 1.55;
}

.placeholder {
  color: #cbd5e1;
}

.question-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-top: 18rpx;
}

.question-list text {
  min-height: 50rpx;
  padding: 0 18rpx;
  border-radius: 999rpx;
  background: #f3f6fa;
  color: #64748b;
  font-size: 22rpx;
  font-weight: 900;
  line-height: 50rpx;
}

.tag-editor {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 116rpx;
  gap: 12rpx;
  margin-top: 18rpx;
}

.tag-editor .input {
  margin: 0;
}

.tag-editor > view {
  display: flex;
  height: 78rpx;
  align-items: center;
  justify-content: center;
  border-radius: 22rpx;
  background: #2388ff;
  color: #fff;
  font-size: 24rpx;
  font-weight: 950;
}

.relation-strip {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12rpx;
  margin-top: 20rpx;
}

.relation-strip view {
  padding: 20rpx 18rpx;
  border: 1rpx solid rgba(35, 136, 255, 0.08);
  border-radius: 24rpx;
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
  gap: 0;
  margin-top: 18rpx;
  border: 1rpx solid #eef2f7;
  border-radius: 26rpx;
  overflow: hidden;
}

.account-row,
.verify-row {
  display: flex;
  min-height: 82rpx;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  padding: 0 22rpx;
  border-bottom: 1rpx solid #eef2f7;
}

.account-row:last-child {
  border-bottom: 0;
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
  margin-top: 16rpx;
  border: 1rpx solid #eef2f7;
  border-radius: 26rpx;
}

.verify-row > text {
  color: #2388ff;
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
  margin-top: 6rpx;
  border-radius: 28rpx;
  background: #2388ff;
  color: #fff;
  font-size: 28rpx;
  font-weight: 900;
}

.save-btn--disabled {
  opacity: 0.45;
}
</style>
