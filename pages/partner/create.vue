<template>
  <view class="partner-create su-page">
    <view class="create__nav" :style="navStyle">
      <view class="create__nav-row" :style="navRowStyle">
        <view class="create__back" @tap="goBackOrFallback('/pages/publish/index')">
          <SuIcon name="left" size="48" glyph-size="24" variant="inline" color="#102033" />
        </view>
        <text>找个搭子</text>
      </view>
    </view>

    <scroll-view scroll-y class="create__scroll" :style="contentTopStyle">
      <view v-if="isHackathonLocked" class="topic-notice">
        <SuIcon name="sceneProject" size="38" glyph-size="18" variant="inline" color="#2388ff" />
        <view>
          <text>黑客松组队已锁定</text>
        </view>
      </view>

      <view class="composer">
        <label class="title-field">
          <text>标题 *</text>
          <input
            v-model="form.title"
            maxlength="30"
            placeholder="一句话讲清楚你想找什么搭子"
            adjust-position="false"
            cursor-spacing="80"
          />
        </label>

        <label class="detail-field">
          <textarea
            v-model="form.description"
            maxlength="300"
            placeholder="写清楚你的需求、适合谁、怎么一起推进。"
            adjust-position="false"
            cursor-spacing="80"
            fixed="true"
            disable-default-padding="true"
          />
          <text>{{ descriptionCount }}/300</text>
        </label>

        <view class="image-section">
          <text class="image-section__label">图片：{{ form.images.length }}/9</text>
          <view class="image-grid">
            <view v-for="(image, index) in form.images" :key="`${image.url}-${index}`" class="image-tile" @tap="previewImage(index)">
              <image :src="image.url" mode="aspectFill" />
              <view class="image-tile__remove" @tap.stop="removeImage(index)">
                <SuIcon name="closeempty" size="30" glyph-size="14" variant="inline" color="#fff" />
              </view>
            </view>
            <view v-if="form.images.length < 9" class="image-add" @tap="addImages">
              <SuIcon name="navPublish" size="72" glyph-size="36" variant="inline" color="#2388ff" />
            </view>
          </view>
        </view>

        <view class="field-row">
          <view class="field-row__label">
            <SuIcon name="sceneAll" size="42" glyph-size="20" variant="inline" color="#2388ff" />
            <text>兴趣场景 *</text>
          </view>
          <scroll-view v-if="!isHackathonLocked" scroll-x class="scene-scroll" :show-scrollbar="false">
            <view class="scene-scroll__inner">
              <view
                v-for="item in sceneFilters"
                :key="item.key"
                class="scene-chip"
                :class="{ 'scene-chip--active': selectedScene === item.key }"
                @tap="selectScene(item.key)"
              >
                <text>{{ item.label }}</text>
              </view>
            </view>
          </scroll-view>
          <text v-else class="locked-value">项目组队</text>
        </view>

        <view v-if="isHackathonLocked" class="field-row">
          <view class="field-row__label">
            <SuIcon name="sceneProject" size="42" glyph-size="20" variant="inline" color="#2388ff" />
            <text>主题</text>
          </view>
          <text class="locked-value">黑客松</text>
        </view>

        <view class="field-row" @tap="openTimePicker">
          <view class="field-row__label">
            <SuIcon name="calendar" size="42" glyph-size="20" variant="inline" color="#2388ff" />
            <text>时间</text>
          </view>
          <view class="field-value" :class="{ 'field-value--placeholder': !form.schedule }">
            <text>{{ form.schedule || '可不填，点击选择' }}</text>
            <SuIcon v-if="!isHackathonLocked" name="arrowRight" size="32" glyph-size="16" variant="inline" color="#cbd5e1" />
          </view>
        </view>

        <label class="field-row">
          <view class="field-row__label">
            <SuIcon name="location" size="42" glyph-size="20" variant="inline" color="#0ea5e9" />
            <text>地点</text>
          </view>
          <view class="location-field">
            <input
              v-model="form.location"
              :disabled="isHackathonLocked"
              placeholder="可手填，或地图选点"
              adjust-position="false"
              cursor-spacing="80"
            />
            <view v-if="!isHackathonLocked" class="map-pick" @tap.stop="chooseLocation">
              <SuIcon name="location" size="30" glyph-size="14" variant="inline" color="#2388ff" />
              <text>地图</text>
            </view>
          </view>
        </label>

        <view class="wechat-card">
          <view class="wechat-card__head">
          <view>
            <text>微信联系</text>
          </view>
            <SuIcon name="wechat" size="42" glyph-size="20" variant="inline" color="#22c55e" />
          </view>
          <label class="wechat-field">
            <text>微信号</text>
            <input
              v-model="form.wechatId"
              placeholder="选填，填写你的微信号"
              adjust-position="false"
              cursor-spacing="80"
            />
          </label>
          <view class="wechat-qr-row">
            <view>
              <text>微信二维码</text>
            </view>
            <view v-if="form.wechatQrUrl" class="wechat-qr" @tap="previewWechatQr">
              <image :src="form.wechatQrUrl" mode="aspectFill" />
              <view class="wechat-qr__remove" @tap.stop="removeWechatQr">
                <SuIcon name="closeempty" size="28" glyph-size="13" variant="inline" color="#fff" />
              </view>
            </view>
            <view v-else class="wechat-qr-add" @tap="addWechatQr">
              <SuIcon name="navPublish" size="52" glyph-size="26" variant="inline" color="#2388ff" />
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="create__bar su-safe-bottom">
      <button class="preview-button" :disabled="submitting" @tap="openPreview">预览</button>
      <button class="create__button" :disabled="submitting" @tap="handleSubmit">
        {{ submitting ? '发布中...' : '发起搭子' }}
      </button>
    </view>

    <SuActionSheet v-model="showTimePicker" title="具体时间">
      <view class="time-picker">
        <picker-view class="time-picker__wheel" :value="visibleTimePickerValue" @change="handleTimePickerChange">
          <picker-view-column>
            <view v-for="item in timePickerColumns[0]" :key="item.value" class="time-picker__item">{{ item.label }}</view>
          </picker-view-column>
          <picker-view-column v-if="!isTimePickerFlexible">
            <view v-for="item in timePickerColumns[1]" :key="item.value" class="time-picker__item">{{ item.label }}</view>
          </picker-view-column>
          <picker-view-column v-if="!isTimePickerFlexible">
            <view v-for="item in timePickerColumns[2]" :key="item.value" class="time-picker__item">{{ item.label }}</view>
          </picker-view-column>
        </picker-view>
        <button class="time-picker__confirm" @tap="confirmTimePicker">确认</button>
      </view>
    </SuActionSheet>

    <SuActionSheet v-model="showPreviewSheet" title="发布预览">
      <view class="preview-sheet">
        <image v-if="previewCover" class="preview-sheet__cover" :src="previewCover" mode="aspectFill" />
        <view v-else class="preview-sheet__cover preview-sheet__cover--empty">
          <SuIcon name="sceneAll" size="80" glyph-size="40" variant="inline" color="#94a3b8" />
        </view>
        <view class="preview-sheet__header">
          <text class="preview-sheet__title">{{ previewTitle }}</text>
          <text class="preview-sheet__badge">{{ previewSceneLabel }}</text>
        </view>
        <view class="preview-sheet__meta">
          <view>
            <SuIcon name="calendar" size="30" glyph-size="15" variant="inline" color="#2388ff" />
            <text>{{ form.schedule || '时间可商议' }}</text>
          </view>
          <view>
            <SuIcon name="location" size="30" glyph-size="15" variant="inline" color="#0ea5e9" />
            <text>{{ form.location || '地点待确认' }}</text>
          </view>
        </view>
        <text class="preview-sheet__desc">{{ previewDescription }}</text>
        <view v-if="form.wechatId || form.wechatQrUrl" class="preview-sheet__contact">
          <SuIcon name="wechat" size="34" glyph-size="17" variant="inline" color="#22c55e" />
          <text>{{ form.wechatId ? `微信号：${form.wechatId}` : '已上传微信二维码' }}</text>
        </view>
        <button class="preview-sheet__confirm" @tap="showPreviewSheet = false">继续编辑</button>
      </view>
    </SuActionSheet>
  </view>
</template>

<script setup>
import SuIcon from '@/components/surego/SuIcon.vue'
import SuActionSheet from '@/components/surego/SuActionSheet.vue'
import { computed, reactive, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { createPartnerPost, HACKATHON_TOPIC_KEY } from '@/common/api/partner.js'
import { uploadImageFile } from '@/common/api/upload.js'
import { getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goBackOrFallback, goPartnerDetail } from '@/common/utils/route.js'

const CAMPUS_NAME = '天津大学'
const HACKATHON_LOCKED_TIME = '2026年5月22日'
const HACKATHON_LOCKED_LOCATION = '天津大学科技园'
const CAMPUS_CITY_CODE = 'tju'
const sceneFilters = [
  { key: 'food', label: '饭搭子', type: 'time_box' },
  { key: 'sport', label: '运动', type: 'time_box' },
  { key: 'study', label: '学习', type: 'time_box' },
  { key: 'game', label: '游戏', type: 'time_box' },
  { key: 'fun', label: '看展/玩乐', type: 'time_box' },
  { key: 'project', label: '项目组队', type: 'project' },
  { key: 'longterm', label: '长期搭子', type: 'long_term' }
]
const timeModeOptions = [
  { label: '可商议', value: 'flexible' },
  { label: '具体时间', value: 'fixed' }
]
const timeSlotOptions = ['上午', '中午', '下午', '晚上', '全天'].map((item) => ({ label: item, value: item }))

const form = reactive({
  type: 'time_box',
  topicKey: '',
  city: CAMPUS_NAME,
  cityCode: CAMPUS_CITY_CODE,
  title: '',
  schedule: '',
  location: '',
  address: '',
  latitude: '',
  longitude: '',
  connectionMode: '',
  description: '',
  images: [],
  wechatId: '',
  wechatQr: null,
  wechatQrUrl: ''
})
const selectedScene = ref('')
const isHackathonLocked = ref(false)
const submitting = ref(false)
const uploadingImages = ref(false)
const showTimePicker = ref(false)
const showPreviewSheet = ref(false)
const timePickerValue = ref([0, 0, 0])
const navStyle = getMiniProgramNavStyle()
const navRowStyle = getMiniProgramNavRowStyle({ leftPaddingRpx: 34, minRightPaddingRpx: 24 })
const contentTopStyle = getMiniProgramNavContentStyle({ gapRpx: 18 })

const descriptionCount = computed(() => String(form.description || '').length)
const dateOptions = computed(() => buildDateOptions())
const timePickerColumns = computed(() => [
  timeModeOptions,
  dateOptions.value,
  timeSlotOptions
])
const isTimePickerFlexible = computed(() => {
  const mode = timeModeOptions[timePickerValue.value[0]] || timeModeOptions[0]
  return mode.value === 'flexible'
})
const visibleTimePickerValue = computed(() => (
  isTimePickerFlexible.value ? [timePickerValue.value[0]] : timePickerValue.value
))
const primaryImage = computed(() => form.images[0]?.url || '')
const previewCover = computed(() => primaryImage.value || form.wechatQrUrl || '')
const previewTitle = computed(() => form.title.trim() || '一句话讲清楚你想找什么搭子')
const previewDescription = computed(() => form.description.trim() || '这里会展示你填写的搭子需求、适合谁、怎么一起推进。')
const previewSceneLabel = computed(() => getSceneOption(selectedScene.value)?.label || '未选择场景')

function buildDateOptions() {
  const today = new Date()
  return Array.from({ length: 60 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + index)
    const month = date.getMonth() + 1
    const day = date.getDate()
    return {
      label: `${month}月${day}日`,
      value: `${date.getFullYear()}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }
  })
}

function readQueryText(value = '') {
  const text = String(value || '').trim()
  if (!text) return ''
  try {
    return decodeURIComponent(text)
  } catch (error) {
    return text
  }
}

function getSceneOption(key = '') {
  return sceneFilters.find((item) => item.key === key) || null
}

function selectScene(key = '') {
  if (isHackathonLocked.value) return
  const option = getSceneOption(key)
  if (!option) return
  selectedScene.value = option.key
  form.type = option.type
}

function lockHackathonDefaults() {
  isHackathonLocked.value = true
  selectedScene.value = 'project'
  form.type = 'project'
  form.topicKey = HACKATHON_TOPIC_KEY
  form.schedule = HACKATHON_LOCKED_TIME
  form.location = HACKATHON_LOCKED_LOCATION
  form.address = HACKATHON_LOCKED_LOCATION
}

function applyEntryDefaults(options = {}) {
  const topicKey = readQueryText(options.topicKey || options.topic_key)
  if (topicKey === HACKATHON_TOPIC_KEY) {
    lockHackathonDefaults()
    return
  }

  const scene = readQueryText(options.scene)
  if (scene) selectScene(scene)
}

function buildFitTags() {
  const sceneLabel = getSceneOption(selectedScene.value)?.label || ''
  const tags = sceneLabel ? [sceneLabel] : []
  if (isHackathonLocked.value) {
    return ['黑客松', '项目组队', 'AI', '48h']
  }
  return tags
}

function isChooseImageCancel(error = {}) {
  const message = String(error.errMsg || error.message || '').toLowerCase()
  return message.includes('cancel') || message.includes('取消')
}

function chooseLocalImageFiles(options = {}) {
  return new Promise((resolve, reject) => {
    uni.chooseImage({
      count: options.count || 1,
      sizeType: options.sizeType || ['compressed'],
      sourceType: options.sourceType || ['album', 'camera'],
      success(result = {}) {
        resolve((result.tempFilePaths || []).filter(Boolean))
      },
      fail(error = {}) {
        if (isChooseImageCancel(error)) {
          resolve([])
          return
        }
        reject(error)
      }
    })
  })
}

async function uploadSelectedImages(options = {}) {
  const filePaths = await chooseLocalImageFiles(options)
  const uploaded = []
  for (const filePath of filePaths) {
    uploaded.push(await uploadImageFile(filePath, options))
  }
  return uploaded
}

function showImageUploadError(error = {}) {
  if (isChooseImageCancel(error)) return
  uni.showToast({
    title: error?.message || '图片上传失败，请稍后重试',
    icon: 'none'
  })
}

async function addImages() {
  if (uploadingImages.value) return
  const remaining = Math.max(0, 9 - form.images.length)
  if (!remaining) return

  uploadingImages.value = true
  try {
    const uploaded = await uploadSelectedImages({
      count: remaining,
      prefix: 'surego/partner-images'
    })
    if (!uploaded.length) return
    const nextImages = uploaded
      .map((item) => ({ url: item.url, fileID: item.fileID || item.url }))
      .filter((item) => item.url)
    form.images = [...form.images, ...nextImages].slice(0, 9)
  } catch (error) {
    showImageUploadError(error)
  } finally {
    uploadingImages.value = false
  }
}

function removeImage(index) {
  form.images.splice(index, 1)
}

function previewImage(index) {
  const urls = form.images.map((item) => item.url).filter(Boolean)
  if (!urls.length) return
  uni.previewImage({
    current: urls[index],
    urls
  })
}

async function addWechatQr() {
  try {
    const [uploaded] = await uploadSelectedImages({
      count: 1,
      prefix: 'surego/wechat-qr'
    })
    if (!uploaded?.url) return
    form.wechatQr = {
      url: uploaded.url,
      fileID: uploaded.fileID || uploaded.url
    }
    form.wechatQrUrl = uploaded.url
  } catch (error) {
    showImageUploadError(error)
  }
}

function previewWechatQr() {
  if (!form.wechatQrUrl) return
  uni.previewImage({
    current: form.wechatQrUrl,
    urls: [form.wechatQrUrl]
  })
}

function removeWechatQr() {
  form.wechatQr = null
  form.wechatQrUrl = ''
}

function openTimePicker() {
  if (isHackathonLocked.value) return
  showTimePicker.value = true
}

function handleTimePickerChange(event) {
  const previous = timePickerValue.value
  const value = event.detail.value || []
  timePickerValue.value = [
    Number(value[0]) || 0,
    value[1] === undefined ? previous[1] || 0 : Number(value[1]) || 0,
    value[2] === undefined ? previous[2] || 0 : Number(value[2]) || 0
  ]
}

function confirmTimePicker() {
  const [modeIndex, dateIndex, slotIndex] = timePickerValue.value
  const mode = timeModeOptions[modeIndex] || timeModeOptions[0]
  if (mode.value === 'flexible') {
    form.schedule = '可商议'
  } else {
    const date = dateOptions.value[dateIndex] || dateOptions.value[0]
    const slot = timeSlotOptions[slotIndex] || timeSlotOptions[0]
    form.schedule = `${date.label} ${slot.label}`
  }
  showTimePicker.value = false
}

function chooseLocation() {
  if (isHackathonLocked.value) return
  uni.chooseLocation({
    success(result = {}) {
      form.location = result.name || result.address || form.location
      form.address = result.address || result.name || form.location
      form.latitude = result.latitude || ''
      form.longitude = result.longitude || ''
      form.city = CAMPUS_NAME
      form.cityCode = CAMPUS_CITY_CODE
    },
    fail() {
      uni.showToast({ title: '未选择地图地点，可继续手动填写', icon: 'none' })
    }
  })
}

function validateForm() {
  if (!form.title.trim()) return '请填写标题'
  if (form.title.trim().length > 30) return '标题最多 30 个字'
  if (!form.description.trim()) return '请填写需求详情'
  if (!selectedScene.value) return '请选择兴趣场景'
  return ''
}

function openPreview() {
  showPreviewSheet.value = true
}

async function handleSubmit() {
  const message = validateForm()
  if (message) {
    uni.showToast({ title: message, icon: 'none' })
    return
  }

  submitting.value = true
  try {
    const post = await createPartnerPost({
      ...form,
      topicKey: form.topicKey,
      topic_key: form.topicKey,
      scene: selectedScene.value,
      fitTags: buildFitTags(),
      images: form.images,
      image: primaryImage.value,
      cover: primaryImage.value,
      address: form.address,
      latitude: form.latitude,
      longitude: form.longitude,
      wechatId: form.wechatId.trim(),
      wechat_id: form.wechatId.trim(),
      wechatQr: form.wechatQr,
      wechat_qr: form.wechatQr,
      wechatQrUrl: form.wechatQrUrl,
      wechat_qr_url: form.wechatQrUrl
    })
    uni.showToast({ title: '已发布', icon: 'success' })
    goPartnerDetail(post.id, { replace: true })
  } finally {
    submitting.value = false
  }
}

onLoad((options = {}) => {
  applyEntryDefaults(options)
})
</script>

<style scoped>
.partner-create {
  min-height: 100vh;
  background: #f8f9f9;
}

.create__nav {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 30;
  background: rgba(248, 249, 249, 0.92);
  backdrop-filter: blur(18px);
}

.create__nav-row {
  display: grid;
  grid-template-columns: 72rpx 1fr 72rpx;
  align-items: center;
  color: #102033;
  font-size: 34rpx;
  font-weight: 950;
  text-align: center;
}

.create__back {
  display: flex;
  width: 72rpx;
  height: 72rpx;
  align-items: center;
  justify-content: center;
}

.create__scroll {
  height: 100vh;
  padding: 0 34rpx 180rpx;
  box-sizing: border-box;
}

.topic-notice {
  display: grid;
  grid-template-columns: 38rpx 1fr;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 22rpx;
  padding: 22rpx 24rpx;
  border: 1rpx solid rgba(35, 136, 255, 0.18);
  border-radius: 30rpx;
  background: #eef7ff;
}

.topic-notice view {
  display: grid;
  gap: 6rpx;
}

.topic-notice text:first-child {
  color: #102033;
  font-size: 25rpx;
  font-weight: 950;
}

.topic-notice text:last-child {
  color: #64748b;
  font-size: 21rpx;
  font-weight: 850;
  line-height: 1.4;
}

.composer {
  display: flex;
  flex-direction: column;
  gap: 26rpx;
}

.title-field,
.detail-field {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.title-field text {
  color: #102033;
  font-size: 26rpx;
  font-weight: 900;
}

.title-field input {
  height: 88rpx;
  padding: 0 26rpx;
  border-radius: 26rpx;
  background: #fff;
  color: #102033;
  font-size: 28rpx;
  font-weight: 850;
}

.detail-field {
  min-height: 300rpx;
  padding: 40rpx 34rpx 28rpx;
  border-radius: 34rpx;
  background: #fff;
  box-shadow: 0 12rpx 30rpx rgba(15, 23, 42, 0.04);
}

.detail-field textarea {
  width: 100%;
  height: 230rpx;
  color: #102033;
  font-size: 30rpx;
  font-weight: 850;
  line-height: 1.55;
}

.detail-field > text {
  align-self: center;
  color: #a3aab5;
  font-size: 22rpx;
  font-weight: 800;
}

.image-section {
  display: grid;
  gap: 14rpx;
}

.image-section__label {
  color: #a3aab5;
  font-size: 22rpx;
  font-weight: 850;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(3, 168rpx);
  gap: 18rpx;
}

.image-tile,
.image-add {
  position: relative;
  overflow: hidden;
  width: 168rpx;
  height: 168rpx;
  border-radius: 18rpx;
  background: #fff;
}

.image-tile image {
  width: 100%;
  height: 100%;
}

.image-tile__remove {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  display: flex;
  width: 38rpx;
  height: 38rpx;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.58);
}

.image-add {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid #dbeafe;
  background: #eef7ff;
}

.field-row {
  display: grid;
  grid-template-columns: 210rpx minmax(0, 1fr);
  align-items: center;
  gap: 18rpx;
  min-height: 84rpx;
}

.field-row__label {
  display: flex;
  align-items: center;
  gap: 14rpx;
  color: #102033;
  font-size: 27rpx;
  font-weight: 900;
}

.field-row input {
  width: 100%;
  height: 76rpx;
  padding: 0 22rpx;
  box-sizing: border-box;
  border-radius: 22rpx;
  background: #fff;
  color: #102033;
  font-size: 24rpx;
  font-weight: 850;
  text-align: right;
}

.field-row input[disabled] {
  color: #64748b;
}

.field-value,
.location-field {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: flex-end;
  gap: 8rpx;
}

.field-value text {
  min-width: 0;
  color: #102033;
  font-size: 24rpx;
  font-weight: 850;
  text-align: right;
}

.field-value--placeholder text {
  color: #a3aab5;
}

.location-field input {
  min-width: 0;
  flex: 1;
}

.map-pick {
  display: inline-flex;
  height: 58rpx;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  padding: 0 14rpx;
  border-radius: 999rpx;
  background: #eef7ff;
  color: #2388ff;
  font-size: 20rpx;
  font-weight: 900;
}

.wechat-card {
  display: grid;
  gap: 22rpx;
  padding: 28rpx;
  border: 1rpx solid #eef2f7;
  border-radius: 32rpx;
  background: #fff;
  box-shadow: 0 12rpx 30rpx rgba(15, 23, 42, 0.04);
}

.wechat-card__head,
.wechat-qr-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.wechat-card__head view,
.wechat-qr-row > view:first-child {
  display: grid;
  gap: 7rpx;
}

.wechat-card__head view text:first-child,
.wechat-qr-row > view:first-child text:first-child,
.wechat-field text {
  color: #102033;
  font-size: 25rpx;
  font-weight: 950;
}

.wechat-card__head view text:last-child,
.wechat-qr-row > view:first-child text:last-child {
  color: #94a3b8;
  font-size: 20rpx;
  font-weight: 850;
  line-height: 1.35;
}

.wechat-field {
  display: grid;
  gap: 12rpx;
}

.wechat-field input {
  height: 78rpx;
  padding: 0 22rpx;
  border-radius: 22rpx;
  background: #f8fafc;
  color: #102033;
  font-size: 24rpx;
  font-weight: 850;
}

.wechat-qr,
.wechat-qr-add {
  position: relative;
  width: 132rpx;
  height: 132rpx;
  flex: 0 0 132rpx;
  overflow: hidden;
  border-radius: 22rpx;
  background: #f8fafc;
}

.wechat-qr image {
  width: 100%;
  height: 100%;
}

.wechat-qr-add {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid #d8e0ea;
}

.wechat-qr__remove {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  display: flex;
  width: 34rpx;
  height: 34rpx;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.62);
}

.scene-scroll {
  width: 100%;
  white-space: nowrap;
}

.scene-scroll__inner {
  display: flex;
  gap: 12rpx;
}

.scene-chip {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  min-height: 58rpx;
  padding: 0 22rpx;
  border-radius: 999rpx;
  background: #fff;
  color: #64748b;
  font-size: 22rpx;
  font-weight: 900;
}

.scene-chip--active {
  background: #dbeafe;
  color: #2388ff;
}

.locked-value {
  justify-self: end;
  color: #64748b;
  font-size: 24rpx;
  font-weight: 900;
}

.create__bar {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 40;
  display: grid;
  grid-template-columns: 0.8fr 1.25fr;
  gap: 22rpx;
  padding: 22rpx 34rpx;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(18px);
}

.preview-button,
.create__button {
  height: 90rpx;
  border-radius: 999rpx;
  font-size: 27rpx;
  font-weight: 950;
  line-height: 90rpx;
}

.preview-button {
  background: #f1f1f1;
  color: #102033;
}

.create__button,
.time-picker__confirm {
  background: #2388ff;
  color: #fff;
  box-shadow: 0 16rpx 34rpx rgba(35, 136, 255, 0.25);
}

.time-picker {
  display: grid;
  gap: 28rpx;
}

.time-picker__wheel {
  width: 100%;
  height: 420rpx;
}

.time-picker__item {
  display: flex;
  height: 84rpx;
  align-items: center;
  justify-content: center;
  color: #102033;
  font-size: 28rpx;
  font-weight: 900;
}

.time-picker__confirm {
  height: 88rpx;
  border-radius: 999rpx;
  font-size: 28rpx;
  font-weight: 950;
  line-height: 88rpx;
}

.preview-sheet {
  display: grid;
  gap: 22rpx;
}

.preview-sheet__cover {
  width: 100%;
  height: 320rpx;
  overflow: hidden;
  border-radius: 28rpx;
  background: #e2e8f0;
}

.preview-sheet__cover--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx dashed #d8e0ea;
  background: #f8fafc;
}

.preview-sheet__header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 16rpx;
}

.preview-sheet__title {
  color: #102033;
  font-size: 32rpx;
  font-weight: 950;
  line-height: 1.32;
}

.preview-sheet__badge {
  display: inline-flex;
  min-height: 46rpx;
  align-items: center;
  padding: 0 18rpx;
  border-radius: 999rpx;
  background: #dbeafe;
  color: #2388ff;
  font-size: 21rpx;
  font-weight: 950;
  white-space: nowrap;
}

.preview-sheet__meta {
  display: grid;
  gap: 12rpx;
}

.preview-sheet__meta view,
.preview-sheet__contact {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10rpx;
  padding: 18rpx 20rpx;
  border-radius: 22rpx;
  background: #f8fafc;
}

.preview-sheet__meta text,
.preview-sheet__contact text {
  min-width: 0;
  color: #52657a;
  font-size: 23rpx;
  font-weight: 850;
  line-height: 1.35;
}

.preview-sheet__desc {
  display: block;
  color: #102033;
  font-size: 25rpx;
  font-weight: 850;
  line-height: 1.6;
}

.preview-sheet__confirm {
  height: 88rpx;
  border-radius: 999rpx;
  background: #102033;
  color: #fff;
  font-size: 26rpx;
  font-weight: 950;
  line-height: 88rpx;
}
</style>
