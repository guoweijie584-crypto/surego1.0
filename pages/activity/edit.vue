<template>
  <view class="edit-activity su-page">
    <view class="edit-activity__nav" :style="navStyle">
      <view class="edit-activity__nav-row" :style="navRowStyle">
        <view class="edit-activity__nav-btn" @tap="goBackOrFallback">
          <uni-icons type="left" size="24" color="#0f172a" />
        </view>
        <text>编辑活动</text>
        <view class="edit-activity__nav-btn" />
      </view>
    </view>

    <scroll-view scroll-y class="edit-activity__scroll" :style="contentTopStyle">
      <view v-if="!isEditable" class="readonly">
        <uni-icons type="info-filled" size="20" color="#d97706" />
        <text>这是参考示例活动，当前保持只读。你创建的新活动可以在这里保存修改。</text>
      </view>

      <view class="form-card">
        <view class="cover" @tap="chooseCover">
          <image class="cover__image" :src="form.image" mode="aspectFill" />
          <view class="cover__mask">
            <uni-icons type="image" size="26" color="#fff" />
            <text>更换封面</text>
          </view>
        </view>

        <view class="field">
          <text class="label">活动标题 *</text>
          <input class="input" v-model="form.title" adjust-position="false" cursor-spacing="80" always-embed="true" placeholder="活动标题" placeholder-class="placeholder" />
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
            <input class="input" type="number" v-model="form.maxParticipants" adjust-position="false" cursor-spacing="80" always-embed="true" />
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
          <text class="label">活动城市</text>
          <picker :range="cityNames" :value="cityIndex" @change="handleCityChange">
            <view class="input input--picker">{{ form.city }}</view>
          </picker>
        </view>

        <view class="field">
          <text class="label">地点 *</text>
          <input class="input" v-model="form.location" adjust-position="false" cursor-spacing="80" always-embed="true" placeholder="活动地点" placeholder-class="placeholder" />
          <view class="field-helper" @tap="chooseLocation">
            <uni-icons type="location" size="16" color="#3b82f6" />
            <text>{{ form.latitude ? '已选择地图定位，可重新选择' : '从地图选择地点' }}</text>
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
              <uni-icons :type="item.icon" size="22" :color="form.partyMode === item.value ? '#fff' : item.color" />
              <text>{{ item.label }}</text>
              <text>{{ item.desc }}</text>
            </view>
          </view>
        </view>

        <view v-if="form.partyMode !== 'free'" class="field">
          <text class="label">{{ form.partyMode === 'sincerity' ? '诚意金金额' : '门票金额' }}</text>
          <input class="input" type="digit" v-model="form.amount" adjust-position="false" cursor-spacing="80" always-embed="true" placeholder="0" placeholder-class="placeholder" />
        </view>

        <view class="field">
          <text class="label">活动介绍 *</text>
          <textarea class="textarea" v-model="form.description" maxlength="300" auto-height adjust-position="false" cursor-spacing="80" always-embed="true" placeholder="写清楚怎么玩、适合谁、需要带什么..." placeholder-class="placeholder" />
        </view>

        <view class="field">
          <view class="label-row">
            <text class="label">局长问题</text>
            <view class="add-question" @tap="addQuestion">
              <uni-icons type="plusempty" size="16" color="#3b82f6" />
              <text>添加</text>
            </view>
          </view>
          <view v-for="(question, index) in form.questions" :key="index" class="question-row">
            <input class="input question-row__input" v-model="form.questions[index]" adjust-position="false" cursor-spacing="80" always-embed="true" placeholder="给申请者的问题" placeholder-class="placeholder" />
            <view class="question-row__remove" @tap="removeQuestion(index)">
              <uni-icons type="trash" size="18" color="#ef4444" />
            </view>
          </view>
        </view>

        <button class="save-btn" :disabled="!canSave || isSaving" :class="{ 'save-btn--disabled': !canSave || isSaving }" @tap="handleSave">
          {{ saveButtonText }}
        </button>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getActivityDetail, updateActivity } from '@/common/api/activity.js'
import { chooseAndUploadImage } from '@/common/api/upload.js'
import { getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goActivityDetail, goBackOrFallback, goManageDashboard } from '@/common/utils/route.js'

const categories = ['户外', '美食', '运动', '学习', '展览', '夜生活']
const CITY_KEY = 'surego_selected_city'
const CITY_CODE_KEY = 'surego_selected_city_code'
const cityOptions = [
  { name: '杭州', code: '330100' },
  { name: '上海', code: '310100' },
  { name: '南京', code: '320100' },
  { name: '北京', code: '110100' }
]
const cityNames = cityOptions.map((item) => item.name)
const partyModes = [
  { value: 'free', label: '免费局', desc: '直接报名', icon: 'checkmarkempty', color: '#22c55e' },
  { value: 'sincerity', label: '诚意金', desc: '签到退回', icon: 'wallet', color: '#ef4444' },
  { value: 'ticket', label: '门票局', desc: '支付锁位', icon: 'paperplane-filled', color: '#8b5cf6' }
]

const activityId = ref('')
const sourceActivity = ref(null)
const categoryIndex = ref(0)
const cityIndex = ref(Math.max(0, cityOptions.findIndex((item) => item.code === (uni.getStorageSync(CITY_CODE_KEY) || '330100'))))
const isSaving = ref(false)
const isEditable = computed(() => Boolean(sourceActivity.value?.isCreator))
const initialCity = cityOptions[cityIndex.value] || cityOptions[0]
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
  city: uni.getStorageSync(CITY_KEY) || initialCity.name,
  cityCode: uni.getStorageSync(CITY_CODE_KEY) || initialCity.code,
  district: '',
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
    city: activity.city || uni.getStorageSync(CITY_KEY) || initialCity.name,
    cityCode: activity.cityCode || activity.city_code || uni.getStorageSync(CITY_CODE_KEY) || initialCity.code,
    district: activity.district || '',
    maxParticipants: String(activity.maxParticipants || 10),
    hasParticipantLimit: Boolean(activity.hasParticipantLimit),
    requireApproval: Boolean(activity.requireApproval),
    partyMode: activity.partyMode || 'free',
    amount: String(activity.amount || ''),
    description: activity.description || '',
    questions: [...(activity.questions || [])],
    image: activity.image || ''
  })
  categoryIndex.value = Math.max(0, categories.indexOf(form.category))
  cityIndex.value = Math.max(0, cityOptions.findIndex((item) => item.code === form.cityCode || item.name === form.city))
})

function handleCategoryChange(event) {
  categoryIndex.value = Number(event.detail.value)
  form.category = categories[categoryIndex.value]
}

function handleCityChange(event) {
  cityIndex.value = Number(event.detail.value)
  const city = cityOptions[cityIndex.value] || cityOptions[0]
  form.city = city.name
  form.cityCode = city.code
}

function handleDateChange(event) {
  form.dateValue = event.detail.value
  const parts = form.dateValue.split('-')
  form.date = `${Number(parts[1])}月${Number(parts[2])}日`
}

async function chooseCover() {
  if (!isEditable.value) {
    uni.showToast({ title: '示例活动暂不支持修改', icon: 'none' })
    return
  }

  const uploaded = await chooseAndUploadImage({
    prefix: 'surego/activity-covers'
  })
  if (!uploaded) return
  form.image = uploaded.url
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

.input {
  line-height: 82rpx;
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
