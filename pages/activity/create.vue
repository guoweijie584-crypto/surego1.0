<template>
  <view class="create su-page">
    <view class="create__nav" :style="navStyle">
      <view class="create__nav-row" :style="navRowStyle">
        <view class="create__nav-btn" @tap="goBackOrFallback">
          <uni-icons type="left" size="24" color="#0f172a" />
        </view>
        <text>发起新局</text>
        <view class="create__nav-btn" @tap="showPreview = true">
          <uni-icons type="eye" size="22" color="#0f172a" />
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="create__scroll" :style="contentTopStyle">
      <view class="create__hero">
        <text class="create__eyebrow">CREATE A SPOT</text>
        <text class="create__title">把想法开成一局</text>
        <text class="create__desc">设置时间、地点和报名方式，提交后等待运营审核。</text>
      </view>

      <view class="form-card">
        <view class="cover" @tap="chooseCover">
          <image class="cover__image" :src="form.image" mode="aspectFill" />
          <view class="cover__mask">
            <uni-icons type="image" size="26" color="#fff" />
            <text>选择封面</text>
          </view>
        </view>

        <view class="field">
          <text class="label">活动标题 *</text>
          <input class="input" v-model="form.title" adjust-position="false" cursor-spacing="80" placeholder="例如：周六下午草坪野餐局" placeholder-class="placeholder" />
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
          <text class="label">活动城市</text>
          <picker :range="cityNames" :value="cityIndex" @change="handleCityChange">
            <view class="input input--picker">{{ form.city }}</view>
          </picker>
          <view class="field-helper field-helper--muted">
            <text>选择地图地点后自动同步，可手动修正</text>
          </view>
        </view>

        <view class="field">
          <text class="label">地点 *</text>
          <input class="input" v-model="form.location" adjust-position="false" cursor-spacing="80" placeholder="例如：西湖风景区 路 太子湾公园" placeholder-class="placeholder" />
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
              <uni-icons type="plusempty" size="16" color="#3b82f6" />
              <text>添加</text>
            </view>
          </view>
          <view v-for="(question, index) in form.questions" :key="index" class="question-row">
            <input class="input question-row__input" v-model="form.questions[index]" adjust-position="false" cursor-spacing="80" placeholder="例如：你会带乐器吗？" placeholder-class="placeholder" />
            <view class="question-row__remove" @tap="removeQuestion(index)">
              <uni-icons type="trash" size="18" color="#ef4444" />
            </view>
          </view>
        </view>

        <view class="form-actions">
          <view class="preview-btn" @tap="showPreview = true">预览活动</view>
          <button class="publish-btn" :disabled="!canSubmit || isSubmitting" :class="{ 'publish-btn--disabled': !canSubmit || isSubmitting }" @tap="handleSubmit">
            {{ isSubmitting ? '发布中...' : '发布活动' }}
          </button>
        </view>
      </view>
    </scroll-view>

    <SuActionSheet v-model="showPreview" title="活动预览 / PREVIEW">
      <view class="preview">
        <image class="preview__image" :src="form.image" mode="aspectFill" />
        <view class="preview__body">
          <text class="preview__tag">{{ currentMode.label }}</text>
          <text class="preview__title">{{ form.title || '还没填写活动标题' }}</text>
          <text class="preview__meta">{{ form.date }} {{ form.time }} - {{ form.endTime }}</text>
          <text class="preview__meta">{{ form.location || '待填写地点' }}</text>
          <text class="preview__desc">{{ form.description || '活动介绍会显示在这里。' }}</text>
        </view>
      </view>
    </SuActionSheet>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import SuActionSheet from '@/components/surego/SuActionSheet.vue'
import { createActivity } from '@/common/api/activity.js'
import { chooseAndUploadImage } from '@/common/api/upload.js'
import { CITY_OPTIONS, inferCityFromLocation } from '@/common/utils/city.js'
import { getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goBackOrFallback, goSuccess } from '@/common/utils/route.js'

const categories = ['户外', '美食', '运动', '学习', '展览', '夜生活']
const CITY_KEY = 'surego_selected_city'
const CITY_CODE_KEY = 'surego_selected_city_code'
const cityOptions = CITY_OPTIONS
const cityNames = cityOptions.map((item) => item.name)
const partyModes = [
  { value: 'free', label: '免费局', desc: '直接报名', icon: 'checkmarkempty', color: '#22c55e' },
  { value: 'sincerity', label: '诚意金', desc: '签到退回', icon: 'wallet', color: '#ef4444' },
  { value: 'ticket', label: '门票局', desc: '支付锁位', icon: 'paperplane-filled', color: '#8b5cf6' }
]

const categoryIndex = ref(0)
const cityIndex = ref(Math.max(0, cityOptions.findIndex((item) => item.code === (uni.getStorageSync(CITY_CODE_KEY) || '330100'))))
const showPreview = ref(false)
const isSubmitting = ref(false)
const navStyle = getMiniProgramNavStyle()
const navRowStyle = getMiniProgramNavRowStyle({ leftPaddingRpx: 34, minRightPaddingRpx: 24 })
const contentTopStyle = getMiniProgramNavContentStyle({ gapRpx: 18 })
const initialCity = cityOptions[cityIndex.value] || cityOptions[0]

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
  questions: ['你为什么想参加这局？'],
  image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=900'
})

const currentMode = computed(() => partyModes.find((item) => item.value === form.partyMode) || partyModes[0])
const canSubmit = computed(() => form.title.trim() && form.location.trim() && form.description.trim())

function handleCategoryChange(event) {
  categoryIndex.value = Number(event.detail.value)
  form.category = categories[categoryIndex.value]
}

function handleCityChange(event) {
  cityIndex.value = Number(event.detail.value)
  const city = cityOptions[cityIndex.value] || cityOptions[0]
  form.city = city.name
  form.cityCode = city.code
  form.district = ''
}

function handleDateChange(event) {
  form.dateValue = event.detail.value
  const parts = form.dateValue.split('-')
  form.date = `${Number(parts[1])}月${Number(parts[2])}日`
}

async function chooseCover() {
  const uploaded = await chooseAndUploadImage({
    prefix: 'surego/activity-covers'
  })
  if (!uploaded) return
  form.image = uploaded.url
}

function chooseLocation() {
  uni.chooseLocation({
    success(result) {
      form.location = result.name || result.address || form.location
      form.address = result.address || result.name || form.location
      form.latitude = result.latitude
      form.longitude = result.longitude
      syncCityFromLocation(result)
    },
    fail() {
      uni.showToast({ title: '未选择地图地点，可继续手动填写', icon: 'none' })
    }
  })
}

function syncCityFromLocation(result = {}) {
  const inferred = inferCityFromLocation(`${result.address || ''} ${result.name || ''}`, {
    city: form.city,
    cityCode: form.cityCode,
    district: form.district
  })
  form.city = inferred.city
  form.cityCode = inferred.cityCode
  form.district = inferred.district
  const nextIndex = cityOptions.findIndex((item) => item.code === inferred.cityCode || item.name === inferred.city)
  if (nextIndex >= 0) cityIndex.value = nextIndex
}

function addQuestion() {
  form.questions.push('')
}

function removeQuestion(index) {
  form.questions.splice(index, 1)
}

async function handleSubmit() {
  if (!canSubmit.value || isSubmitting.value) return
  isSubmitting.value = true
  const created = await createActivity({
    ...form,
    amount: Number(form.amount) || 0,
    questions: form.questions.filter((item) => item.trim())
  })
  goSuccess({
    type: 'CREATE',
    activityId: created.id,
    coverImage: created.image
  })
}
</script>

<style scoped>
.create {
  min-height: 100vh;
  background: #f3f7fb;
}

.create__nav {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 20;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(18px);
  color: #0f172a;
  font-size: 28rpx;
  font-weight: 900;
}

.create__nav-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.create__nav-btn {
  display: flex;
  width: 62rpx;
  height: 62rpx;
  align-items: center;
  justify-content: center;
}

.create__scroll {
  height: 100vh;
  box-sizing: border-box;
}

.create__hero {
  padding: 18rpx 40rpx 36rpx;
}

.create__eyebrow {
  color: #94a3b8;
  font-size: 20rpx;
  font-weight: 900;
}

.create__title {
  display: block;
  margin-top: 10rpx;
  color: #0f172a;
  font-size: 54rpx;
  font-style: italic;
  font-weight: 900;
}

.create__desc {
  display: block;
  margin-top: 18rpx;
  color: #64748b;
  font-size: 25rpx;
  font-weight: 700;
  line-height: 1.55;
}

.form-card {
  margin: 0 28rpx 60rpx;
  padding: 28rpx;
  border-radius: 44rpx;
  background: #fff;
  box-shadow: 0 24rpx 70rpx rgba(15, 23, 42, 0.08);
}

.cover {
  position: relative;
  height: 360rpx;
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

.form-actions {
  display: grid;
  grid-template-columns: 190rpx 1fr;
  gap: 18rpx;
  margin-top: 36rpx;
}

.preview-btn,
.publish-btn {
  display: flex;
  height: 92rpx;
  align-items: center;
  justify-content: center;
  border-radius: 28rpx;
  font-size: 26rpx;
  font-weight: 900;
}

.preview-btn {
  background: #eef2ff;
  color: #4f46e5;
}

.publish-btn {
  background: #0f172a;
  color: #fff;
}

.publish-btn--disabled {
  opacity: 0.45;
}

.preview__image {
  width: 100%;
  height: 320rpx;
  border-radius: 30rpx;
  background: #e2e8f0;
}

.preview__body {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  padding-top: 24rpx;
}

.preview__tag {
  align-self: flex-start;
  padding: 9rpx 18rpx;
  border-radius: 999rpx;
  background: #dcfce7;
  color: #16a34a;
  font-size: 20rpx;
  font-weight: 900;
}

.preview__title {
  color: #0f172a;
  font-size: 34rpx;
  font-weight: 900;
  line-height: 1.35;
}

.preview__meta {
  color: #64748b;
  font-size: 23rpx;
  font-weight: 800;
}

.preview__desc {
  color: #334155;
  font-size: 25rpx;
  font-weight: 700;
  line-height: 1.6;
}
</style>
