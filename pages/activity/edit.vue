<template>
  <view class="edit-activity su-page">
    <view class="edit-activity__nav" :style="navStyle">
      <view class="edit-activity__nav-row" :style="navRowStyle">
        <view class="edit-activity__nav-btn" @tap="goBackOrFallback">
          <SuIcon name="left" size="48" glyph-size="24" variant="inline" color="#0f172a" />
        </view>
        <text>编辑活动</text>
        <view class="edit-activity__nav-btn" />
      </view>
    </view>

    <scroll-view scroll-y class="edit-activity__scroll" :style="contentTopStyle">
      <view v-if="!isEditable" class="readonly">
        <SuIcon name="info-filled" size="40" glyph-size="20" variant="inline" color="#d97706" />
        <text>只读活动</text>
      </view>

      <view class="form-card">
        <view class="cover" @tap="openCoverPicker">
          <image class="cover__image" :src="form.image" mode="aspectFill" @error="handleCoverImageError" />
          <view class="cover__mask">
            <SuIcon name="image" size="52" glyph-size="26" variant="inline" color="#fff" />
            <text>更换封面</text>
          </view>
        </view>

        <view class="field">
          <text class="label">活动标题 *</text>
          <input class="input" v-model="form.title" adjust-position="false" cursor-spacing="80" placeholder="活动标题" placeholder-class="placeholder" />
        </view>

        <view class="grid">
          <view class="field">
            <text class="label">分类</text>
            <picker :range="categories" :value="categoryIndex" @change="handleCategoryChange">
              <view class="input input--picker">{{ form.category }}</view>
            </picker>
          </view>
          <view class="field">
            <text class="label">人数上限</text>
            <input class="input" type="number" v-model="form.maxParticipants" adjust-position="false" cursor-spacing="80" />
          </view>
        </view>

        <view class="grid">
          <view class="field">
            <text class="label">日期</text>
            <picker mode="date" :value="form.dateValue" @change="handleDateChange">
              <view class="input input--picker">{{ form.date }}</view>
            </picker>
          </view>
          <view class="field">
            <text class="label">开始时间</text>
            <picker mode="time" :value="form.time" @change="form.time = $event.detail.value">
              <view class="input input--picker">{{ form.time }}</view>
            </picker>
          </view>
        </view>

        <view class="grid">
          <view class="field">
            <text class="label">结束时间</text>
            <picker mode="time" :value="form.endTime" @change="form.endTime = $event.detail.value">
              <view class="input input--picker">{{ form.endTime }}</view>
            </picker>
          </view>
          <view class="field">
            <text class="label">报名方式</text>
            <view class="switch-pill" @tap="form.requireApproval = !form.requireApproval">
              <text>{{ form.requireApproval ? '审核制' : '自由报名' }}</text>
              <view :class="['switch-pill__dot', { 'switch-pill__dot--on': form.requireApproval }]" />
            </view>
          </view>
        </view>

        <view class="field">
          <text class="label">地点 *</text>
          <input class="input" v-model="form.location" adjust-position="false" cursor-spacing="80" placeholder="活动地点" placeholder-class="placeholder" />
          <view class="field-helper" @tap="chooseLocation">
            <SuIcon name="location" size="32" glyph-size="16" variant="inline" color="#3b82f6" />
            <text>地图选点</text>
          </view>
        </view>

        <view class="field">
          <text class="label">组局模式</text>
          <view class="mode-grid">
            <view
              v-for="item in partyModes"
              :key="item.value"
              class="mode"
              :class="{ 'mode--active': form.partyMode === item.value }"
              @tap="form.partyMode = item.value"
            >
              <SuIcon :name="item.icon" size="44" glyph-size="22" variant="inline" :color="form.partyMode === item.value ? '#fff' : item.color" />
              <text>{{ item.label }}</text>
            </view>
          </view>
        </view>

        <view v-if="form.partyMode !== 'free'" class="field">
          <text class="label">{{ form.partyMode === 'sincerity' ? '诚意金金额' : '门票金额' }}</text>
          <input class="input" type="digit" v-model="form.amount" adjust-position="false" cursor-spacing="80" placeholder="0" placeholder-class="placeholder" />
        </view>

        <view class="field">
          <text class="label">活动介绍 *</text>
          <textarea class="textarea" v-model="form.description" maxlength="300" adjust-position="false" cursor-spacing="80" disable-default-padding="true" placeholder="写清楚怎么玩、适合谁、需要带什么..." placeholder-class="placeholder" />
        </view>

        <view class="field">
          <view class="label-row">
            <text class="label">局长问题</text>
            <view class="add-question" @tap="addQuestion">
              <SuIcon name="navPublish" size="32" glyph-size="16" variant="inline" color="#3b82f6" />
              <text>添加</text>
            </view>
          </view>
          <view v-for="(question, index) in form.questions" :key="index" class="question-row">
            <input class="input question-row__input" v-model="form.questions[index]" adjust-position="false" cursor-spacing="80" placeholder="给申请者的问题" placeholder-class="placeholder" />
            <view class="question-row__remove" @tap="removeQuestion(index)">
              <SuIcon name="trash" size="36" glyph-size="18" variant="inline" color="#ef4444" />
            </view>
          </view>
        </view>

        <button class="save-btn" :disabled="!canSave || isSaving" :class="{ 'save-btn--disabled': !canSave || isSaving }" @tap="handleSave">
          {{ saveButtonText }}
        </button>
      </view>
    </scroll-view>

    <SuActionSheet v-model="showCoverPicker" title="选择封面 / COVER">
      <view class="cover-picker">
        <view class="cover-picker__toolbar">
          <scroll-view scroll-x class="cover-picker__tabs" :show-scrollbar="false">
            <view class="cover-picker__tab-list">
              <view
                v-for="item in categories"
                :key="item"
                class="cover-picker__tab"
                :class="{ 'cover-picker__tab--active': coverCategory === item }"
                @tap.stop="coverCategory = item"
              >
                {{ item }}
              </view>
            </view>
          </scroll-view>
          <view class="cover-picker__random" @tap.stop="useRandomCover">
            <SuIcon name="refresh" size="32" glyph-size="16" variant="inline" color="#0f172a" />
            <text>换一张</text>
          </view>
        </view>

        <view class="cover-picker__grid">
          <view
            v-for="item in coverPresets"
            :key="item.id"
            class="cover-option"
            :class="{ 'cover-option--active': form.image === item.image }"
            @tap.stop="selectCoverPreset(item)"
          >
            <image class="cover-option__image" :src="item.image" mode="aspectFill" />
            <view class="cover-option__shade" />
            <text>{{ item.title }}</text>
          </view>
        </view>

        <button class="cover-picker__upload" @tap.stop="uploadCoverFromAlbum">
          从相册上传
        </button>
      </view>
    </SuActionSheet>
  </view>
</template>

<script setup>
import SuIcon from '@/components/surego/SuIcon.vue'
import { computed, reactive, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import SuActionSheet from '@/components/surego/SuActionSheet.vue'
import { getActivityDetail, updateActivity } from '@/common/api/activity.js'
import { chooseAndUploadImage } from '@/common/api/upload.js'
import { FALLBACK_COVER_IMAGE, getDefaultCoverPreset, isPresetCover, listCoverPresets, pickRandomCoverPreset } from '@/common/utils/cover-presets.js'
import { getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goActivityDetail, goBackOrFallback, goManageDashboard } from '@/common/utils/route.js'

const categories = ['户外', '美食', '运动', '学习', '展览', '夜生活']
const CAMPUS_NAME = '天津大学'
const CAMPUS_CITY_CODE = 'tju'
const partyModes = [
  { value: 'free', label: '免费局', icon: 'checkmarkempty', color: '#22c55e' },
  { value: 'sincerity', label: '诚意金', icon: 'wallet', color: '#ef4444' },
  { value: 'ticket', label: '门票局', icon: 'paperplane-filled', color: '#8b5cf6' }
]

const activityId = ref('')
const sourceActivity = ref(null)
const categoryIndex = ref(0)
const showCoverPicker = ref(false)
const coverCategory = ref(categories[0])
const isSaving = ref(false)
const isEditable = computed(() => Boolean(sourceActivity.value?.isCreator))
const navStyle = getMiniProgramNavStyle()
const navRowStyle = getMiniProgramNavRowStyle({ leftPaddingRpx: 34, minRightPaddingRpx: 24 })
const contentTopStyle = getMiniProgramNavContentStyle({ gapRpx: 18 })
const form = reactive({
  title: '',
  category: categories[0],
  dateValue: '2026-05-01',
  date: '5月1日',
  time: '14:00',
  endTime: '18:00',
  location: '',
  address: '',
  latitude: '',
  longitude: '',
  city: CAMPUS_NAME,
  cityCode: CAMPUS_CITY_CODE,
  district: '北洋园',
  maxParticipants: '10',
  hasParticipantLimit: true,
  requireApproval: true,
  partyMode: 'free',
  amount: '',
  description: '',
  questions: [],
  image: ''
})

const canSave = computed(() => isEditable.value && form.title.trim() && form.location.trim() && form.description.trim())
const coverPresets = computed(() => listCoverPresets(coverCategory.value))
const saveButtonText = computed(() => {
  if (!isEditable.value) return '示例活动不可保存'
  if (isSaving.value) return '保存中...'
  return '保存修改'
})

onLoad(async (query = {}) => {
  activityId.value = query.id || ''
  const activity = await getActivityDetail(activityId.value)
  sourceActivity.value = activity
  ensureOwnerAccess()
  Object.assign(form, {
    title: activity.title || '',
    category: activity.category || categories[0],
    dateValue: activity.dateValue || '2026-05-01',
    date: activity.date || '5月1日',
    time: activity.time || '14:00',
    endTime: activity.endTime || '18:00',
    location: activity.location || '',
    address: activity.address || activity.location || '',
    latitude: activity.latitude || '',
    longitude: activity.longitude || '',
    city: CAMPUS_NAME,
    cityCode: CAMPUS_CITY_CODE,
    district: activity.district || '北洋园',
    maxParticipants: String(activity.maxParticipants || 10),
    hasParticipantLimit: Boolean(activity.hasParticipantLimit),
    requireApproval: Boolean(activity.requireApproval),
    partyMode: activity.partyMode || 'free',
    amount: String(activity.amount || ''),
    description: activity.description || '',
    questions: [...(activity.questions || [])],
    image: activity.image || getDefaultCoverPreset(activity.category || categories[0]).image
  })
  categoryIndex.value = Math.max(0, categories.indexOf(form.category))
  coverCategory.value = form.category
})

function handleCategoryChange(event) {
  const previousImage = form.image
  categoryIndex.value = Number(event.detail.value)
  form.category = categories[categoryIndex.value]
  coverCategory.value = form.category
  if (isPresetCover(previousImage)) {
    selectCoverPreset(getDefaultCoverPreset(form.category), { keepSheetOpen: true })
  }
}

function handleDateChange(event) {
  form.dateValue = event.detail.value
  const parts = form.dateValue.split('-')
  form.date = `${Number(parts[1])}月${Number(parts[2])}日`
}

function openCoverPicker() {
  if (!isEditable.value) {
    uni.showToast({ title: '示例活动暂不支持修改', icon: 'none' })
    return
  }
  coverCategory.value = form.category
  showCoverPicker.value = true
}

function selectCoverPreset(preset, options = {}) {
  if (!preset?.image) return
  form.image = preset.image
  if (!options.keepSheetOpen) showCoverPicker.value = false
}

function useRandomCover() {
  if (!isEditable.value) return
  selectCoverPreset(pickRandomCoverPreset(coverCategory.value), { keepSheetOpen: true })
}

async function uploadCoverFromAlbum() {
  if (!isEditable.value) return
  const uploaded = await chooseAndUploadImage({
    prefix: 'surego/activity-covers'
  })
  if (!uploaded) return
  form.image = uploaded.url
  showCoverPicker.value = false
}

function handleCoverImageError() {
  if (form.image !== FALLBACK_COVER_IMAGE) {
    form.image = FALLBACK_COVER_IMAGE
  }
}

function ensureOwnerAccess() {
  if (sourceActivity.value?.isCreator) return true
  uni.showToast({ title: '只有局长可以编辑活动', icon: 'none' })
  setTimeout(() => {
    goActivityDetail(activityId.value, { replace: true })
  }, 500)
  return false
}

function chooseLocation() {
  if (!isEditable.value) {
    uni.showToast({ title: '示例活动暂不支持修改', icon: 'none' })
    return
  }

  uni.chooseLocation({
    success(result) {
      form.location = result.name || result.address || form.location
      form.address = result.address || result.name || form.location
      form.latitude = result.latitude
      form.longitude = result.longitude
      form.city = CAMPUS_NAME
      form.cityCode = CAMPUS_CITY_CODE
      form.district = '北洋园'
    },
    fail() {
      uni.showToast({ title: '未选择地图地点，可继续手动填写', icon: 'none' })
    }
  })
}

function addQuestion() {
  form.questions.push('')
}

function removeQuestion(index) {
  form.questions.splice(index, 1)
}

async function handleSave() {
  if (!canSave.value || isSaving.value) return
  isSaving.value = true
  const updated = await updateActivity(activityId.value, {
    ...form,
    amount: Number(form.amount) || 0,
    questions: form.questions.filter((item) => item.trim())
  })
  if (!updated) {
    isSaving.value = false
    uni.showToast({ title: '示例活动不可保存', icon: 'none' })
    return
  }

  uni.showToast({ title: '活动已更新', icon: 'none' })
  setTimeout(() => {
    goManageDashboard(activityId.value, { replace: true })
  }, 260)
}
</script>

<style scoped>
.edit-activity {
  min-height: 100vh;
  background: #f3f7fb;
}

.edit-activity__nav {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 20;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(18px);
}

.edit-activity__nav-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #0f172a;
  font-size: 28rpx;
  font-weight: 900;
}

.edit-activity__nav-btn {
  display: flex;
  width: 62rpx;
  height: 62rpx;
  align-items: center;
  justify-content: center;
}

.edit-activity__scroll {
  height: 100vh;
  box-sizing: border-box;
}

.readonly {
  display: flex;
  gap: 12rpx;
  margin: 0 28rpx 24rpx;
  padding: 22rpx;
  border-radius: 28rpx;
  background: #fef3c7;
  color: #92400e;
  font-size: 22rpx;
  font-weight: 800;
  line-height: 1.45;
}

.form-card {
  margin: 0 28rpx 60rpx;
  padding: 28rpx;
  border-radius: 44rpx;
  background: #fff;
  box-shadow: 0 24rpx 70rpx rgba(15, 23, 42, 0.08);
}

.readonly + .form-card {
  margin-top: 0;
}

.cover {
  position: relative;
  height: 340rpx;
  overflow: hidden;
  border-radius: 34rpx;
  background: #e2e8f0;
}

.cover__image {
  width: 100%;
  height: 100%;
}

.cover__mask {
  position: absolute;
  right: 22rpx;
  bottom: 22rpx;
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 16rpx 22rpx;
  border-radius: 999rpx;
  background: rgba(15, 23, 42, 0.58);
  color: #fff;
  font-size: 22rpx;
  font-weight: 900;
}

.cover-picker {
  padding: 4rpx 2rpx 18rpx;
}

.cover-picker__toolbar {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.cover-picker__tabs {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
}

.cover-picker__tab-list {
  display: flex;
  gap: 12rpx;
}

.cover-picker__tab,
.cover-picker__random {
  display: flex;
  height: 64rpx;
  box-sizing: border-box;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  font-size: 22rpx;
  font-weight: 900;
}

.cover-picker__tab {
  padding: 0 24rpx;
  background: #f8fafc;
  color: #64748b;
}

.cover-picker__tab--active {
  background: #0f172a;
  color: #fff;
}

.cover-picker__random {
  flex-shrink: 0;
  gap: 6rpx;
  padding: 0 20rpx;
  background: #eef2ff;
  color: #0f172a;
}

.cover-picker__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18rpx;
  margin-top: 22rpx;
}

.cover-option {
  position: relative;
  height: 180rpx;
  overflow: hidden;
  border: 4rpx solid transparent;
  border-radius: 26rpx;
  background: #e2e8f0;
}

.cover-option--active {
  border-color: #ff6b6b;
}

.cover-option__image,
.cover-option__shade {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.cover-option__shade {
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.05), rgba(15, 23, 42, 0.62));
}

.cover-option text {
  position: absolute;
  right: 18rpx;
  bottom: 16rpx;
  left: 18rpx;
  color: #fff;
  font-size: 22rpx;
  font-weight: 900;
}

.cover-picker__upload {
  height: 84rpx;
  margin-top: 24rpx;
  border-radius: 28rpx;
  background: #0f172a;
  color: #fff;
  font-size: 25rpx;
  font-weight: 900;
  line-height: 84rpx;
}

.field {
  margin-top: 30rpx;
}

.field-helper {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 14rpx;
  color: #3b82f6;
  font-size: 22rpx;
  font-weight: 900;
}

.field-helper--muted {
  color: #94a3b8;
  font-size: 20rpx;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 22rpx;
}

.label,
.label-row {
  color: #94a3b8;
  font-size: 21rpx;
  font-weight: 900;
}

.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.input,
.textarea,
.switch-pill {
  width: 100%;
  box-sizing: border-box;
  margin-top: 14rpx;
  padding: 0 24rpx;
  border: 1rpx solid #eef2f7;
  border-radius: 24rpx;
  background: #f8fafc;
  color: #0f172a;
  font-size: 26rpx;
  font-weight: 800;
}

.input,
.switch-pill {
  height: 82rpx;
}

.input--picker,
.switch-pill {
  display: flex;
  align-items: center;
}

.switch-pill {
  justify-content: space-between;
}

.switch-pill__dot {
  width: 38rpx;
  height: 38rpx;
  border-radius: 50%;
  background: #cbd5e1;
}

.switch-pill__dot--on {
  background: #4f46e5;
}

.placeholder {
  color: #cbd5e1;
}

.textarea {
  height: 170rpx;
  min-height: 170rpx;
  padding: 24rpx;
  line-height: 40rpx;
}

.mode-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
  margin-top: 14rpx;
}

.mode {
  display: flex;
  min-height: 150rpx;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 8rpx;
  border: 1rpx solid #eef2f7;
  border-radius: 28rpx;
  background: #f8fafc;
}

.mode text:nth-child(2) {
  color: #0f172a;
  font-size: 23rpx;
  font-weight: 900;
}

.mode text:nth-child(3) {
  color: #94a3b8;
  font-size: 19rpx;
  font-weight: 800;
}

.mode--active {
  border-color: #4f46e5;
  background: #4f46e5;
}

.mode--active text {
  color: #fff !important;
}

.add-question {
  display: flex;
  align-items: center;
  gap: 6rpx;
  color: #3b82f6;
  font-size: 22rpx;
}

.question-row {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.question-row__input {
  flex: 1;
}

.question-row__remove {
  display: flex;
  width: 70rpx;
  height: 70rpx;
  align-items: center;
  justify-content: center;
  margin-top: 14rpx;
  border-radius: 22rpx;
  background: #fff1f2;
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
