<template>
  <view class="partner-create su-page">
    <view class="create__nav" :style="navStyle">
      <view class="create__nav-row" :style="navRowStyle">
        <view class="create__back" @tap="goBackOrFallback('/pages/publish/index')">
          <SuIcon name="left" size="48" glyph-size="24" variant="inline" color="#102033" />
        </view>
        <text>搭子</text>
      </view>
    </view>

    <scroll-view scroll-y class="create__scroll" :style="contentTopStyle">
      <view class="create__hero">
        <text class="create__eyebrow">找搭子</text>
        <text class="create__title">说清楚你的搭子需求</text>
      </view>

      <view v-if="form.topicKey === 'hackathon'" class="topic-notice">
        <SuIcon name="sceneProject" size="38" glyph-size="18" variant="inline" color="#2388ff" />
        <view>
          <text>将发布到黑客松组队专区</text>
          <text>系统会自动归入黑客松主题，标签只用于展示和搜索。</text>
        </view>
      </view>

      <view class="create-composer">
        <view class="composer-block">
          <text class="composer-label">你想怎么找</text>
          <view class="type-option-grid">
            <view
              v-for="item in typeOptions"
              :key="item.key"
              class="intent-card"
              :class="{ 'intent-card--active': form.type === item.key }"
              @tap="selectType(item.key)"
            >
              <text>{{ item.label }}</text>
              <text>{{ item.short }}</text>
            </view>
          </view>
        </view>

        <view class="composer-block">
          <text class="composer-label">兴趣 / 场景</text>
          <scroll-view scroll-x class="scene-scroll-row" :show-scrollbar="false">
            <view class="scene-scroll-row__inner">
              <view
                v-for="item in sceneFilters"
                :key="item.key"
                class="scene-filter-chip"
                :class="{ 'scene-filter-chip--active': selectedScene === item.key }"
                @tap="selectScene(item.key)"
              >
                <text>{{ item.label }}</text>
              </view>
            </view>
          </scroll-view>
        </view>

        <view v-if="form.type === 'project'" class="composer-block">
          <text class="composer-label">主题 / 赛事</text>
          <view class="topic-option-grid">
            <view
              v-for="item in topicOptions"
              :key="item.key || 'default'"
              class="topic-card"
              :class="{ 'topic-card--active': form.topicKey === item.key }"
              @tap="selectTopic(item.key)"
            >
              <text>{{ item.label }}</text>
              <text>{{ item.description }}</text>
            </view>
          </view>
          <view v-if="topicSuggestionVisible" class="topic-suggestion" @tap="selectTopic('hackathon')">
            <text>看起来像黑客松组队，可以点这里发布到黑客松/赛事。</text>
          </view>
        </view>

        <view class="composer-block">
          <text class="composer-label">确认方式</text>
          <view class="compact-segmented">
            <view
              v-for="item in connectionModes"
              :key="item.key"
              class="compact-segmented__item"
              :class="{ 'compact-segmented__item--active': connectionModeKey === item.key }"
              @tap="selectConnectionMode(item)"
            >
              <text>{{ item.label }}</text>
            </view>
          </view>
        </view>

        <view class="composer-fields">
          <label>
            <text>标题</text>
            <input
              v-model="form.title"
              placeholder="一句话讲清楚你想找什么搭子"
              adjust-position="false"
              cursor-spacing="80"
            />
          </label>
          <label>
            <text>{{ fieldLabels.time }}</text>
            <input
              v-model="form.schedule"
              placeholder="例如：今天 18:30 / 每周二"
              adjust-position="false"
              cursor-spacing="80"
            />
          </label>
          <label>
            <text>{{ fieldLabels.place }}</text>
            <input
              v-model="form.location"
              placeholder="例如：北洋园校区 / 线上"
              adjust-position="false"
              cursor-spacing="80"
            />
          </label>
          <label>
            <text>{{ fieldLabels.rule }}</text>
            <input
              v-model="form.connectionMode"
              placeholder="例如：发出意向后拉临时群确认"
              adjust-position="false"
              cursor-spacing="80"
            />
          </label>
        </view>

        <label class="composer-textarea">
          <text>需求详情</text>
          <textarea
            v-model="form.description"
            placeholder="写清楚你想找什么样的人、适合谁、怎么确认意向，以及不接受什么情况。"
            adjust-position="false"
            cursor-spacing="80"
            fixed="true"
            disable-default-padding="true"
          />
        </label>

        <label class="composer-textarea">
          <text>希望对方</text>
          <textarea
            v-model="form.expectation"
            placeholder="例如：能准时、接受 AA、不强行社交"
            adjust-position="false"
            cursor-spacing="80"
            fixed="true"
            disable-default-padding="true"
          />
        </label>

        <view class="composer-block">
          <text class="composer-label">希望对方</text>
          <view class="question-list">
            <text v-for="item in wantTags" :key="item" @tap="appendTag(item)">{{ item }}</text>
          </view>
        </view>

        <label class="composer-textarea composer-textarea--short">
          <text>标签</text>
          <input
            v-model="tagText"
            placeholder="用空格或逗号分隔，例如 羽毛球 下班后 稳定"
            adjust-position="false"
            cursor-spacing="80"
          />
        </label>

        <view class="composer-preview">
          <SuIcon name="sceneAll" size="52" glyph-size="26" variant="inline" color="#2388ff" />
          <view>
            <text>{{ selectedType.label }} · 等合适的人来</text>
            <text>私聊或拉群沟通</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="create__bar su-safe-bottom">
      <button class="create__button" :disabled="submitting" @tap="handleSubmit">
        {{ submitting ? '发布中...' : '发布并管理申请' }}
      </button>
    </view>
  </view>
</template>

<script setup>
import SuIcon from '@/components/surego/SuIcon.vue'
import { computed, reactive, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { createPartnerPost, HACKATHON_TOPIC_KEY, PARTNER_POST_TYPES, PARTNER_TOPIC_OPTIONS } from '@/common/api/partner.js'
import { getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goBackOrFallback, goPartnerDetail } from '@/common/utils/route.js'

const CAMPUS_NAME = '天津大学'
const sceneFilters = [
  { key: 'food', label: '饭搭子' },
  { key: 'sport', label: '运动' },
  { key: 'study', label: '学习' },
  { key: 'game', label: '游戏' },
  { key: 'fun', label: '看展/玩乐' },
  { key: 'project', label: '项目组队' },
  { key: 'longterm', label: '长期搭子' }
]
const connectionModes = [
  { key: 'intent', label: '收意向', value: '收集意向' },
  { key: 'private', label: '私聊', value: '一对一私聊' },
  { key: 'group', label: '临时群', value: '临时群沟通' }
]
const typeDescriptions = {
  time_box: '今晚/这周先见一次',
  long_term: '固定频率，慢慢稳定',
  project: '按角色和投入时间筛选'
}
const templates = {
  time_box: {
    scene: 'food',
    title: '今晚北洋园找饭搭子',
    schedule: '今天 18:30 / 周五晚',
    location: '北洋园校区 / 南门附近',
    connectionMode: connectionModes[2].value,
    description: '想找 1-2 个同校同学一起吃饭，AA 制，不强行社交。先确认时间和地点，合适就一起去。',
    expectation: '能准时，接受 AA，不临时鸽，聊天轻松一点就好。',
    tags: '饭搭子 今晚可约 低压力认识'
  },
  long_term: {
    scene: 'longterm',
    title: '找羽毛球长期搭子',
    schedule: '每周 1-2 次，晚间或周末',
    location: '学校体育馆 / 附近球馆',
    connectionMode: connectionModes[1].value,
    description: '想找能长期固定约球的搭子，新手友好，先试约一次，合适再稳定约。',
    expectation: '准时、AA、稳定，同校优先。',
    tags: '长期搭子 羽毛球 固定频率'
  },
  project: {
    scene: 'project',
    title: 'AI 黑客松缺前端 + 设计',
    schedule: '周五晚 + 周末两天',
    location: '线上协作 / 校内自习室',
    connectionMode: connectionModes[0].value,
    description: '想做一个 AI 校园工具 Demo，需要前端、设计或路演同学一起快速推进。',
    expectation: '能稳定投入，有作品或经验更好，愿意一起做 Demo 和路演。',
    tags: '项目组队 AI黑客松 前端 设计'
  }
}

const typeOptions = PARTNER_POST_TYPES.map((item) => ({
  ...item,
  short: typeDescriptions[item.key] || item.description
}))

const form = reactive({
  type: 'time_box',
  topicKey: '',
  city: CAMPUS_NAME,
  title: templates.time_box.title,
  schedule: templates.time_box.schedule,
  location: templates.time_box.location,
  connectionMode: templates.time_box.connectionMode,
  description: templates.time_box.description,
  expectation: templates.time_box.expectation
})
const selectedScene = ref(templates.time_box.scene)
const connectionModeKey = ref('group')
const tagText = ref(templates.time_box.tags)
const submitting = ref(false)
const navStyle = getMiniProgramNavStyle()
const navRowStyle = getMiniProgramNavRowStyle({ leftPaddingRpx: 34, minRightPaddingRpx: 24 })
const contentTopStyle = getMiniProgramNavContentStyle({ gapRpx: 18 })

const selectedType = computed(() => typeOptions.find((item) => item.key === form.type) || typeOptions[0])
const topicOptions = computed(() => PARTNER_TOPIC_OPTIONS.map((item) => ({
  ...item,
  label: item.key === HACKATHON_TOPIC_KEY ? '黑客松/赛事' : item.label
})))
const topicSuggestionVisible = computed(() => {
  if (form.type !== 'project' || form.topicKey) return false
  const text = `${form.title} ${form.description} ${form.expectation} ${tagText.value}`
  return /黑客松|赛事|AI|48h|比赛/.test(text)
})
const fieldLabels = computed(() => {
  if (form.type === 'project' && form.topicKey === HACKATHON_TOPIC_KEY) {
    return { time: '可投入时间', place: '协作地点', rule: '申请规则' }
  }
  if (form.type === 'project') {
    return { time: '协作节奏', place: '协作地点', rule: '申请规则' }
  }
  if (form.type === 'long_term') {
    return { time: '固定频率', place: '地点范围', rule: '试约规则' }
  }
  return { time: '可约时间', place: '地点范围', rule: '确认方式' }
})
const wantTags = computed(() => {
  if (form.type === 'project') return ['能稳定投入', '有作品或经验', '愿意一起路演']
  if (form.type === 'long_term') return ['能提前确认时间', '不临时鸽', '同校优先']
  return ['能准时', '接受 AA', '不强行社交']
})

function applyTemplate(key) {
  const template = templates[key] || templates.time_box
  selectedScene.value = template.scene
  form.title = template.title
  form.schedule = template.schedule
  form.location = template.location
  form.connectionMode = template.connectionMode
  form.description = template.description
  form.expectation = template.expectation
  tagText.value = template.tags
  const mode = connectionModes.find((item) => item.value === template.connectionMode)
  connectionModeKey.value = mode?.key || 'intent'
}

function selectType(key) {
  form.type = key
  if (key !== 'project') {
    form.topicKey = ''
  }
  applyTemplate(key)
}

function selectScene(key) {
  selectedScene.value = key
  if (key === 'project') selectType('project')
  if (key === 'longterm') selectType('long_term')
}

function selectTopic(key = '') {
  form.topicKey = PARTNER_TOPIC_OPTIONS.some((item) => item.key === key) ? key : ''
  if (form.topicKey === HACKATHON_TOPIC_KEY) {
    appendQueryTags('黑客松 AI 48h 项目组队')
  }
}

function selectConnectionMode(item) {
  connectionModeKey.value = item.key
  form.connectionMode = item.value
}

function appendTag(tag) {
  if (!tagText.value.includes(tag)) {
    tagText.value = `${tagText.value} ${tag}`.trim()
  }
  if (!form.expectation.includes(tag)) {
    form.expectation = `${form.expectation} ${tag}`.trim()
  }
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

function appendQueryTags(value = '') {
  const tags = readQueryText(value)
    .split(/[,\s，、]+/)
    .map((item) => item.trim())
    .filter(Boolean)
  tags.forEach(appendTag)
}

function applyEntryDefaults(options = {}) {
  const type = readQueryText(options.type)
  if (type && PARTNER_POST_TYPES.some((item) => item.key === type)) {
    selectType(type)
  }

  const scene = readQueryText(options.scene)
  if (scene) {
    selectScene(scene)
  }

  const topicKey = readQueryText(options.topicKey || options.topic_key)
  if (topicKey) {
    selectTopic(topicKey)
  }

  appendQueryTags(options.tags || options.fitTags || options.fit_tags)
}

function validateForm() {
  if (!form.title.trim()) return '请填写标题'
  if (!form.schedule.trim()) return '请填写时间'
  if (!form.location.trim()) return '请填写地点'
  if (!form.description.trim()) return '请填写搭子说明'
  return ''
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
      fitTags: tagText.value
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
  background: rgba(248, 249, 249, 0.9);
  backdrop-filter: blur(18px);
}

.create__nav-row {
  display: flex;
  align-items: center;
  gap: 22rpx;
  color: #102033;
  font-size: 32rpx; font-weight: 900;
}

.create__back {
  display: flex;
  width: 72rpx;
  height: 72rpx;
  align-items: center;
  justify-content: center;
  border: 1rpx solid #eef2f7;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 12rpx 28rpx rgba(15, 23, 42, 0.06);
}

.create__scroll {
  height: 100vh;
  padding-bottom: 170rpx;
  box-sizing: border-box;
}

.create__hero {
  padding: 12rpx 34rpx 26rpx;
}

.create__eyebrow {
  color: #94a3b8;
  font-size: 20rpx;
  font-weight: 900;
}

.create__title {
  display: block;
  margin-top: 10rpx;
  color: #102033;
  font-size: 50rpx; font-weight: 900;
  line-height: 1.12;
}

.create__desc {
  display: block;
  margin-top: 18rpx;
  color: #64748b;
  font-size: 24rpx;
  font-weight: 800;
  line-height: 1.55;
}

.topic-notice,
.create-composer {
  margin-right: 34rpx;
  margin-left: 34rpx;
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
  box-shadow: 0 14rpx 34rpx rgba(35, 136, 255, 0.08);
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

.create-composer {
  display: flex;
  flex-direction: column;
  gap: 26rpx;
  margin-bottom: 48rpx;
  padding: 30rpx;
  border: 1rpx solid rgba(24, 24, 27, 0.08);
  border-radius: 40rpx;
  background: #fff;
  box-shadow: 0 18rpx 44rpx rgba(30, 88, 156, 0.07);
}

.composer-label,
.composer-fields label text,
.composer-textarea > text {
  display: block;
  color: #94a3b8;
  font-size: 21rpx;
  font-weight: 900;
}

.type-option-grid {
  display: grid;
  gap: 16rpx;
  margin-top: 14rpx;
}

.intent-card {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  padding: 26rpx;
  border: 1rpx solid #eef2f7;
  border-radius: 30rpx;
  background: #fff;
}

.intent-card text:first-child {
  color: #102033;
  font-size: 28rpx;
  font-weight: 900;
}

.intent-card text:last-child {
  color: #64748b;
  font-size: 22rpx;
  font-weight: 800;
  line-height: 1.45;
}

.intent-card--active {
  border-color: rgba(35, 136, 255, 0.35);
  background: #edf6ff;
  box-shadow: 0 12rpx 28rpx rgba(35, 136, 255, 0.1);
}

.scene-scroll-row {
  width: 100%;
  margin-top: 14rpx;
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
  background: #f3f6fa;
  color: #64748b;
  font-size: 22rpx;
  font-weight: 900;
}

.scene-filter-chip--active {
  background: #2388ff;
  color: #fff;
}

.topic-option-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
  margin-top: 14rpx;
}

.topic-card {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 8rpx;
  padding: 22rpx;
  border: 1rpx solid #eef2f7;
  border-radius: 26rpx;
  background: #fff;
}

.topic-card text:first-child {
  color: #102033;
  font-size: 24rpx;
  font-weight: 950;
}

.topic-card text:last-child {
  color: #64748b;
  font-size: 20rpx;
  font-weight: 800;
  line-height: 1.4;
}

.topic-card--active {
  border-color: rgba(35, 136, 255, 0.36);
  background: #edf6ff;
  box-shadow: 0 10rpx 24rpx rgba(35, 136, 255, 0.1);
}

.topic-suggestion {
  margin-top: 14rpx;
  padding: 18rpx 22rpx;
  border-radius: 24rpx;
  background: #f8fafc;
  color: #2388ff;
  font-size: 22rpx;
  font-weight: 900;
  line-height: 1.45;
}

.compact-segmented {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10rpx;
  margin-top: 14rpx;
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

.composer-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18rpx;
}

.composer-fields label,
.composer-textarea {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 12rpx;
}

.composer-fields input,
.composer-textarea textarea,
.composer-textarea input {
  width: 100%;
  box-sizing: border-box;
  border: 0;
  border-radius: 24rpx;
  background: #f3f6fa;
  color: #102033;
  font-size: 24rpx;
  font-weight: 850;
}

.composer-fields input,
.composer-textarea input {
  height: 82rpx;
  padding: 0 24rpx;
}

.composer-textarea textarea {
  height: 170rpx;
  padding: 24rpx;
  line-height: 1.55;
}

.composer-textarea--short {
  gap: 12rpx;
}

.question-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 14rpx;
}

.question-list text {
  padding: 12rpx 18rpx;
  border-radius: 999rpx;
  background: #f3f6fa;
  color: #64748b;
  font-size: 22rpx;
  font-weight: 900;
}

.composer-preview {
  display: grid;
  grid-template-columns: 52rpx 1fr;
  align-items: center;
  gap: 18rpx;
  border-radius: 28rpx;
  background: #f3f6fa;
  padding: 24rpx;
}

.composer-preview text {
  display: block;
}

.composer-preview text:first-child {
  color: #102033;
  font-size: 25rpx;
  font-weight: 900;
}

.composer-preview text:last-child {
  margin-top: 6rpx;
  color: #64748b;
  font-size: 21rpx;
  font-weight: 800;
}

.create__bar {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 40;
  padding: 22rpx 34rpx;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(18px);
  box-shadow: 0 -12rpx 36rpx rgba(15, 23, 42, 0.08);
}

.create__button {
  height: 88rpx;
  border-radius: 999rpx;
  background: #2388ff;
  color: #fff;
  font-size: 27rpx;
  font-weight: 900;
  line-height: 88rpx;
  box-shadow: 0 16rpx 34rpx rgba(35, 136, 255, 0.28);
}
</style>
