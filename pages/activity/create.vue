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
        <text class="create__eyebrow">发活动</text>
        <text class="create__title">填清楚时间、地点、人数和费用</text>
        <text class="create__desc">普通同学也能发起明确活动，规则说清楚，大家才敢放心加入。</text>
      </view>

      <view class="voice-launch-button" @tap="showComingSoon('语音发布正在接入')">
        <uni-icons type="mic-filled" size="22" color="#2388ff" />
        <view>
          <text>语音发布</text>
          <text>说一句出初稿</text>
        </view>
      </view>

      <view class="voice-card">
        <view class="voice-card__button">
          <uni-icons type="mic-filled" size="28" color="#fff" />
        </view>
        <view>
          <text>试着说：“今晚北洋园火锅，6 人 AA，差 3 个饭搭子”</text>
          <text>说完后先给你一版标题、时间地点、人数、费用和报名问题，你再确认细节。</text>
        </view>
      </view>

      <view class="composer-strip">
        <view class="composer-block">
          <text class="composer-block__label">活动成行方式</text>
          <view class="compact-segmented">
            <view
              v-for="item in intentModes"
              :key="item.key"
              class="compact-segmented__item"
              :class="{ 'compact-segmented__item--active': intentMode === item.key }"
              @tap="handleIntentModeChange(item.key)"
            >
              <text>{{ item.label }}</text>
            </view>
          </view>
        </view>

        <view class="composer-block">
          <text class="composer-block__label">场景</text>
          <scroll-view scroll-x class="scene-scroll-row" :show-scrollbar="false">
            <view class="scene-scroll-row__inner">
              <view
                v-for="(item, index) in categories"
                :key="item"
                class="scene-filter-chip"
                :class="{ 'scene-filter-chip--active': form.category === item }"
                @tap="selectCategory(index)"
              >
                <text>{{ item }}</text>
              </view>
            </view>
          </scroll-view>
        </view>
      </view>

      <view class="form-card">
        <view class="cover" @tap="openCoverPicker">
          <image class="cover__image" :src="form.image" mode="aspectFill" @error="handleCoverImageError" />
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
            <picker mode="date" :value="form.dateValue" :start="minDateValue" @change="handleDateChange">
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
          <view class="input input--picker city-select" @tap="openCitySelector">
            <text>{{ form.city }}</text>
            <uni-icons type="right" size="16" color="#94a3b8" />
          </view>
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
        <text v-if="fieldErrorText" class="form-error">{{ fieldErrorText }}</text>
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
            <uni-icons type="refresh" size="16" color="#0f172a" />
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

    <unicloud-city-select ref="citySelectRef" :location="false" :hot-city="hotCities" @select="handleCitySelect" />
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import SuActionSheet from '@/components/surego/SuActionSheet.vue'
import { createActivity } from '@/common/api/activity.js'
import { chooseAndUploadImage } from '@/common/api/upload.js'
import { FALLBACK_COVER_IMAGE, getDefaultCoverPreset, isPresetCover, listCoverPresets, pickRandomCoverPreset } from '@/common/utils/cover-presets.js'
import { DEFAULT_CITY, DEFAULT_CITY_CODE, HOT_CITY_OPTIONS, findCityOption, inferCityFromLocation, normalizeCityCode, normalizeCityName } from '@/common/utils/city.js'
import { buildFieldHint, collectMissingFields, isFutureDate, normalizeTimeValue } from '@/common/utils/form.js'
import { getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goBackOrFallback, goSuccess, showComingSoon } from '@/common/utils/route.js'

const categories = ['户外', '美食', '运动', '学习', '展览', '夜生活']
const CITY_KEY = 'surego_selected_city'
const CITY_CODE_KEY = 'surego_selected_city_code'
const hotCities = HOT_CITY_OPTIONS
const partyModes = [
  { value: 'free', label: '免费局', desc: '直接报名', icon: 'checkmarkempty', color: '#22c55e' },
  { value: 'sincerity', label: '诚意金', desc: '签到退回', icon: 'wallet', color: '#ef4444' },
  { value: 'ticket', label: '门票局', desc: '支付锁位', icon: 'paperplane-filled', color: '#8b5cf6' }
]
const intentModes = [
  { key: 'now', label: '马上成行' },
  { key: 'plan', label: '先约时间' },
  { key: 'longterm', label: '长期固定' }
]

const categoryIndex = ref(0)
const intentMode = ref('now')
const citySelectRef = ref(null)
const showPreview = ref(false)
const showCoverPicker = ref(false)
const coverCategory = ref(categories[0])
const isSubmitting = ref(false)
const fieldErrorText = ref('')
const navStyle = getMiniProgramNavStyle()
const navRowStyle = getMiniProgramNavRowStyle({ leftPaddingRpx: 34, minRightPaddingRpx: 24 })
const contentTopStyle = getMiniProgramNavContentStyle({ gapRpx: 18 })
const initialCity = findCityOption(uni.getStorageSync(CITY_KEY), uni.getStorageSync(CITY_CODE_KEY)) || { name: DEFAULT_CITY, code: DEFAULT_CITY_CODE }

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
  city: normalizeCityName(uni.getStorageSync(CITY_KEY) || initialCity.name),
  cityCode: normalizeCityCode(uni.getStorageSync(CITY_CODE_KEY) || initialCity.code),
  district: '',
  maxParticipants: '10',
  hasParticipantLimit: true,
  requireApproval: true,
  partyMode: 'free',
  amount: '',
  description: '',
  questions: ['你为什么想参加这局？'],
  image: getDefaultCoverPreset(categories[0]).image
})

const currentMode = computed(() => partyModes.find((item) => item.value === form.partyMode) || partyModes[0])
const canSubmit = computed(() => form.title.trim() && form.location.trim() && form.description.trim())
const coverPresets = computed(() => listCoverPresets(coverCategory.value))
const minDateValue = computed(() => {
  const now = new Date()
  const month = `${now.getMonth() + 1}`.padStart(2, '0')
  const day = `${now.getDate()}`.padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
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

function selectCategory(index) {
  const event = {
    detail: {
      value: index
    }
  }
  handleCategoryChange(event)
}

function handleIntentModeChange(key) {
  intentMode.value = key
  if (key === 'now') {
    form.requireApproval = false
    if (!form.maxParticipants) form.maxParticipants = '6'
    return
  }
  form.requireApproval = true
  if (key === 'longterm') {
    form.partyMode = 'free'
    if (!form.maxParticipants) form.maxParticipants = '12'
  }
}

function openCitySelector() {
  citySelectRef.value?.open()
}

function handleCitySelect(city = {}) {
  const cityName = normalizeCityName(city.name || form.city)
  form.city = cityName || DEFAULT_CITY
  form.cityCode = normalizeCityCode(city.code || findCityOption(cityName)?.code || form.cityCode)
  form.district = ''
}

function handleDateChange(event) {
  const nextDate = event.detail.value
  if (!isFutureDate(nextDate)) {
    uni.showToast({ title: '仅可选择今天及未来日期', icon: 'none' })
    return
  }
  form.dateValue = nextDate
  const parts = form.dateValue.split('-')
  form.date = `${Number(parts[1])}月${Number(parts[2])}日`
  fieldErrorText.value = ''
}

function openCoverPicker() {
  coverCategory.value = form.category
  showCoverPicker.value = true
}

function selectCoverPreset(preset, options = {}) {
  if (!preset?.image) return
  form.image = preset.image
  fieldErrorText.value = ''
  if (!options.keepSheetOpen) showCoverPicker.value = false
}

function useRandomCover() {
  const nextPreset = pickRandomCoverPreset(coverCategory.value, `${Date.now()}-${Math.random()}`)
  if (!nextPreset?.image) return
  if (nextPreset.image === form.image) {
    const candidates = coverPresets.value.filter((item) => item.image !== form.image)
    if (candidates.length) {
      selectCoverPreset(candidates[Math.floor(Math.random() * candidates.length)], { keepSheetOpen: true })
      return
    }
  }
  selectCoverPreset(nextPreset, { keepSheetOpen: true })
}

async function uploadCoverFromAlbum() {
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
  if (!inferred.cityCode) {
    uni.showToast({ title: '已保留当前城市，可手动修正', icon: 'none' })
  }
}

function addQuestion() {
  form.questions.push('')
}

function removeQuestion(index) {
  form.questions.splice(index, 1)
}

function validateForm() {
  const missingFields = collectMissingFields([
    { label: '活动标题', required: true, value: form.title },
    { label: '活动日期', required: true, value: form.dateValue, validate: isFutureDate },
    { label: '开始时间', required: true, value: form.time, validate: (value) => Boolean(normalizeTimeValue(value)) },
    { label: '结束时间', required: true, value: form.endTime, validate: (value) => Boolean(normalizeTimeValue(value)) },
    { label: '地点', required: true, value: form.location },
    { label: '活动介绍', required: true, value: form.description },
    { label: '活动封面', required: true, value: form.image }
  ])

  if (!missingFields.length) {
    const startTime = normalizeTimeValue(form.time)
    const endTime = normalizeTimeValue(form.endTime)
    if (startTime && endTime && endTime <= startTime) {
      fieldErrorText.value = '结束时间需晚于开始时间'
      uni.showToast({ title: fieldErrorText.value, icon: 'none' })
      return false
    }
    if (form.partyMode !== 'free' && Number(form.amount || 0) <= 0) {
      fieldErrorText.value = form.partyMode === 'ticket' ? '请填写有效门票金额' : '请填写有效诚意金金额'
      uni.showToast({ title: fieldErrorText.value, icon: 'none' })
      return false
    }
    fieldErrorText.value = ''
    return true
  }

  fieldErrorText.value = buildFieldHint(missingFields)
  uni.showToast({ title: fieldErrorText.value, icon: 'none' })
  return false
}

async function handleSubmit() {
  if (isSubmitting.value) return
  if (!validateForm()) return
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

.voice-launch-button {
  display: flex;
  align-items: center;
  gap: 18rpx;
  margin: 0 34rpx 24rpx;
  padding: 24rpx 28rpx;
  border: 1rpx solid rgba(35, 136, 255, 0.16);
  border-radius: 34rpx;
  background: #fff;
  box-shadow: 0 18rpx 44rpx rgba(15, 23, 42, 0.06);
}

.voice-launch-button view {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6rpx;
}

.voice-launch-button text:first-child {
  color: #102033;
  font-size: 27rpx;
  font-weight: 900;
}

.voice-launch-button text:last-child {
  color: #64748b;
  font-size: 22rpx;
  font-weight: 800;
}

.voice-card {
  display: flex;
  gap: 22rpx;
  margin: 0 34rpx 24rpx;
  padding: 30rpx;
  border-radius: 38rpx;
  background: linear-gradient(135deg, #102033, #2340a4);
  color: #fff;
  box-shadow: 0 22rpx 60rpx rgba(35, 64, 164, 0.22);
}

.voice-card__button {
  display: flex;
  width: 82rpx;
  height: 82rpx;
  flex: 0 0 82rpx;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #2388ff;
  box-shadow: 0 12rpx 30rpx rgba(35, 136, 255, 0.42);
}

.voice-card view:last-child {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 10rpx;
}

.voice-card text:first-child {
  color: #fff;
  font-size: 27rpx;
  font-weight: 900;
  line-height: 1.42;
}

.voice-card text:last-child {
  color: rgba(255, 255, 255, 0.68);
  font-size: 22rpx;
  font-weight: 800;
  line-height: 1.5;
}

.composer-strip {
  display: flex;
  flex-direction: column;
  gap: 26rpx;
  margin: 0 34rpx 26rpx;
  padding: 30rpx;
  border: 1rpx solid #eef2f7;
  border-radius: 36rpx;
  background: #fff;
  box-shadow: 0 18rpx 44rpx rgba(15, 23, 42, 0.05);
}

.composer-block__label {
  display: block;
  margin-bottom: 16rpx;
  color: #94a3b8;
  font-size: 21rpx;
  font-weight: 900;
}

.compact-segmented {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10rpx;
  padding: 8rpx;
  border-radius: 28rpx;
  background: #f3f6fa;
}

.compact-segmented__item {
  display: flex;
  min-width: 0;
  height: 66rpx;
  align-items: center;
  justify-content: center;
  border-radius: 22rpx;
  color: #64748b;
  font-size: 22rpx;
  font-weight: 900;
}

.compact-segmented__item--active {
  background: #102033;
  color: #fff;
  box-shadow: 0 10rpx 24rpx rgba(16, 32, 51, 0.18);
}

.scene-scroll-row {
  width: 100%;
  white-space: nowrap;
}

.scene-scroll-row__inner {
  display: flex;
  gap: 14rpx;
}

.scene-filter-chip {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  padding: 15rpx 24rpx;
  border-radius: 999rpx;
  background: #f8fafc;
  color: #64748b;
  font-size: 22rpx;
  font-weight: 900;
}

.scene-filter-chip--active {
  background: #dbeafe;
  color: #2388ff;
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

.city-select {
  justify-content: space-between;
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

.form-error {
  display: block;
  margin-top: 18rpx;
  color: #ef4444;
  font-size: 22rpx;
  font-weight: 900;
  line-height: 1.5;
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
