<template>
  <view v-if="visible" class="profile-sheet">
    <view class="profile-sheet__mask" @tap="handleClose" />
    <view class="profile-sheet__panel">
      <view class="profile-sheet__handle" />
      <text class="profile-sheet__eyebrow">WECHAT PROFILE</text>
      <text class="profile-sheet__title">完善微信资料</text>

      <button class="profile-sheet__avatar-btn" open-type="chooseAvatar" @chooseavatar="handleChooseAvatar">
        <image class="profile-sheet__avatar" :src="form.avatar" mode="aspectFill" />
        <view class="profile-sheet__camera">
          <SuIcon name="camera-filled" size="36" glyph-size="18" variant="inline" color="#fff" />
        </view>
      </button>

      <view class="profile-sheet__field">
        <text class="profile-sheet__label">昵称</text>
        <input
          class="profile-sheet__input"
          type="nickname"
          v-model="form.nickname"
          adjust-position="false"
          cursor-spacing="28"
          placeholder="填写或选择微信昵称"
          placeholder-class="profile-sheet__placeholder"
        />
      </view>

      <button
        class="profile-sheet__save"
        :disabled="isSaving"
        :class="{ 'profile-sheet__save--disabled': isSaving }"
        @tap="handleSave"
      >
        {{ isSaving ? '保存中...' : '保存并继续' }}
      </button>
      <view class="profile-sheet__skip" @tap="handleClose">稍后完善</view>
    </view>
  </view>
</template>

<script setup>
import SuIcon from '@/components/surego/SuIcon.vue'
import { reactive, watch, ref } from 'vue'
import { syncCurrentUserProfile } from '@/common/api/user.js'
import { uploadImageFile } from '@/common/api/upload.js'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  initialProfile: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['saved', 'close'])

const isSaving = ref(false)
const avatarTempPath = ref('')
const form = reactive({
  nickname: '',
  avatar: '/static/userImg/user.png',
  avatarFileId: ''
})

watch(
  () => props.initialProfile,
  (profile = {}) => {
    form.nickname = profile.nickname === '未登录' || profile.nickname === '微信用户' ? '' : (profile.nickname || '')
    form.avatar = profile.avatar || '/static/userImg/user.png'
    form.avatarFileId = profile.avatarFileId || profile.avatar_file_id || ''
    avatarTempPath.value = ''
  },
  { immediate: true, deep: true }
)

function handleChooseAvatar(event) {
  const avatarUrl = event?.detail?.avatarUrl || ''
  if (!avatarUrl) return
  avatarTempPath.value = avatarUrl
  form.avatar = avatarUrl
}

async function handleSave() {
  const nickname = form.nickname.trim()
  if (!nickname) {
    uni.showToast({ title: '请输入昵称', icon: 'none' })
    return
  }
  if (isSaving.value) return

  isSaving.value = true
  let avatar = form.avatar
  let avatarFileId = form.avatarFileId

  if (avatarTempPath.value) {
    try {
      const uploaded = await uploadImageFile(avatarTempPath.value, { prefix: 'surego/avatars' })
      avatar = uploaded.url
      avatarFileId = uploaded.fileID || uploaded.url
    } catch (error) {
      uni.showToast({ title: '头像上传失败，可稍后重试', icon: 'none' })
      avatar = props.initialProfile?.avatar || '/static/userImg/user.png'
      avatarFileId = props.initialProfile?.avatarFileId || props.initialProfile?.avatar_file_id || ''
    }
  }

  try {
    const saved = await syncCurrentUserProfile({
      ...props.initialProfile,
      nickname,
      avatar,
      avatarFileId,
      profileCompletedAt: Date.now()
    })
    emit('saved', saved)
  } catch (error) {
    uni.showToast({ title: '资料保存失败，请稍后重试', icon: 'none' })
  } finally {
    isSaving.value = false
  }
}

function handleClose() {
  if (isSaving.value) return
  emit('close')
}
</script>

<style scoped>
.profile-sheet {
  position: fixed;
  z-index: 99;
  inset: 0;
}

.profile-sheet__mask {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.46);
}

.profile-sheet__panel {
  position: absolute;
  right: 24rpx;
  bottom: 24rpx;
  left: 24rpx;
  padding: 22rpx 30rpx 34rpx;
  border-radius: 38rpx;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 32rpx 90rpx rgba(15, 23, 42, 0.22);
}

.profile-sheet__handle {
  width: 76rpx;
  height: 8rpx;
  margin: 0 auto 24rpx;
  border-radius: 999rpx;
  background: #e2e8f0;
}

.profile-sheet__eyebrow,
.profile-sheet__title,
.profile-sheet__desc,
.profile-sheet__label {
  display: block;
}

.profile-sheet__eyebrow {
  color: #ff6b6b;
  font-size: 20rpx;
  font-weight: 900;
}

.profile-sheet__title {
  margin-top: 8rpx;
  color: #111827;
  font-size: 38rpx; font-weight: 900;
}

.profile-sheet__desc {
  margin-top: 12rpx;
  color: #64748b;
  font-size: 24rpx;
  font-weight: 800;
  line-height: 1.55;
}

.profile-sheet__avatar-btn {
  position: relative;
  width: 154rpx;
  height: 154rpx;
  margin: 30rpx auto;
  padding: 0;
  border-radius: 50%;
  background: transparent;
  overflow: visible;
}

.profile-sheet__avatar-btn::after {
  border: 0;
}

.profile-sheet__avatar {
  width: 154rpx;
  height: 154rpx;
  border: 8rpx solid #fff;
  border-radius: 50%;
  background: #f1f5f9;
  box-shadow: 0 18rpx 44rpx rgba(15, 23, 42, 0.14);
}

.profile-sheet__camera {
  position: absolute;
  right: 0;
  bottom: 6rpx;
  display: flex;
  width: 54rpx;
  height: 54rpx;
  align-items: center;
  justify-content: center;
  border: 4rpx solid #fff;
  border-radius: 50%;
  background: #22c55e;
}

.profile-sheet__field {
  margin-top: 10rpx;
}

.profile-sheet__label {
  color: #94a3b8;
  font-size: 22rpx;
  font-weight: 900;
}

.profile-sheet__input {
  height: 88rpx;
  margin-top: 14rpx;
  padding: 0 24rpx;
  border: 1rpx solid #eef2f7;
  border-radius: 26rpx;
  background: #f8fafc;
  color: #0f172a;
  font-size: 28rpx;
  font-weight: 900;
}

.profile-sheet__placeholder {
  color: #cbd5e1;
}

.profile-sheet__save {
  display: flex;
  height: 94rpx;
  align-items: center;
  justify-content: center;
  margin-top: 28rpx;
  border-radius: 30rpx;
  background: #ff6b6b;
  color: #fff;
  font-size: 28rpx;
  font-weight: 900;
  box-shadow: 0 18rpx 40rpx rgba(255, 107, 107, 0.28);
}

.profile-sheet__save--disabled {
  opacity: 0.6;
}

.profile-sheet__skip {
  height: 76rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 24rpx;
  font-weight: 900;
}
</style>
