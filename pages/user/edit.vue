<template>
  <view v-if="isPageLoading" class="edit-profile su-page">
    <SuPageLoading :style="contentTopStyle" text="?????..." />
  </view>
  <view v-else class="edit-profile su-page">
    <view class="edit-profile__nav" :style="navStyle">
      <view class="edit-profile__nav-row" :style="navRowStyle">
        <view class="edit-profile__back" @tap="goBackOrFallback">
          <uni-icons type="left" size="24" color="#111827" />
        </view>
        <text>编辑资料</text>
        <view class="edit-profile__back" />
      </view>
    </view>

    <scroll-view scroll-y class="edit-profile__scroll" :style="contentTopStyle">
      <view class="profile-card">
        <button class="avatar-box" open-type="chooseAvatar" @chooseavatar="handleChooseAvatar">
          <image class="avatar-box__image" :src="form.avatar" mode="aspectFill" />
          <view class="avatar-box__mask">
            <uni-icons type="camera-filled" size="22" color="#fff" />
          </view>
        </button>

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
          <input class="input" v-model="form.bio" adjust-position="false" cursor-spacing="28" placeholder="例如：爱摄影、爱生活的斜杠青年" placeholder-class="placeholder" />
        </view>

        <view class="field">
          <text class="label">个人签名</text>
          <textarea class="textarea" v-model="form.quote" maxlength="120" auto-height adjust-position="false" cursor-spacing="28" placeholder="写一句你想让同频朋友看到的话" placeholder-class="placeholder" />
        </view>

        <button class="save-btn" :disabled="isSaving || !canSave" :class="{ 'save-btn--disabled': isSaving || !canSave }" @tap="handleSave">
          {{ isSaving ? '保存中...' : '保存资料' }}
        </button>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getCurrentUser, updateCurrentUser } from '@/common/api/user.js'
import { uploadImageFile } from '@/common/api/upload.js'
import SuPageLoading from '@/components/surego/SuPageLoading.vue'
import { getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goBackOrFallback } from '@/common/utils/route.js'

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
  quote: ''
})

const canSave = computed(() => form.nickname.trim() && form.bio.trim())

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
    const uploaded = await uploadImageFile(avatarUrl, { prefix: 'surego/avatars' })
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

.profile-card {
  margin: 24rpx 28rpx 70rpx;
  padding: 34rpx;
  border-radius: 42rpx;
  background: #fff;
  box-shadow: 0 24rpx 70rpx rgba(15, 23, 42, 0.07);
}

.avatar-box {
  position: relative;
  width: 172rpx;
  height: 172rpx;
  margin: 0 auto 34rpx;
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

.save-btn {
  display: flex;
  height: 94rpx;
  align-items: center;
  justify-content: center;
  margin-top: 38rpx;
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
