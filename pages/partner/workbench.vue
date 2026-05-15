<template>
  <view class="partner-workbench ref-page">
    <view class="manager-topbar" :style="navStyle">
      <view class="manager-topbar__row" :style="navRowStyle">
        <view class="exit-button" @tap="goBackOrFallback('/pages/user/profile')">
          <SuIcon name="left" size="36" glyph-size="18" variant="inline" color="#102033" />
          <text>返回</text>
        </view>
        <view class="manager-topbar__title">
          <text>申请管理</text>
          <text class="su-line-1">{{ partner.title || '当前搭子需求' }}</text>
        </view>
        <view class="ref-icon-button" @tap="goPartnerDetail(currentId)">
          <SuIcon name="arrowRight" size="38" glyph-size="19" variant="inline" color="#102033" />
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="ref-scroll ref-scroll--no-tab" :style="contentTopStyle">
      <view class="manager-summary ref-card">
        <view>
          <text>{{ partner.intentCount || intents.length }}</text>
          <text>感兴趣</text>
        </view>
        <view>
          <text>{{ pendingCount }}</text>
          <text>待处理</text>
        </view>
        <view>
          <text>{{ acceptedCount }}</text>
          <text>已通过</text>
        </view>
        <view>
          <text>{{ partner.followCount || 0 }}</text>
          <text>关注</text>
        </view>
      </view>

      <scroll-view scroll-x class="ref-filter-row sticky-tabs" :show-scrollbar="false">
        <text v-for="item in tabs" :key="item.key" :class="{ active: activeTab === item.key }" @tap="activeTab = item.key">
          {{ item.label }}
        </text>
      </scroll-view>

      <view v-if="activeTab === 'intent'" class="ref-stack">
        <view v-if="intents.length === 0" class="ref-empty ref-card">
          <SuIcon name="people" size="84" glyph-size="42" variant="inline" color="#cbd5e1" />
          <text>暂无意向申请</text>
        </view>
        <view v-for="item in intents" :key="item.id" class="applicant-card ref-card">
          <view class="organizer-line">
            <image class="intent-avatar" :src="item.avatar" mode="aspectFill" />
            <view>
              <text>{{ item.nickname || '意向同学' }}</text>
              <text>天津大学 · 成行记录 {{ item.joinedCount || 12 }} 次</text>
            </view>
            <text class="ref-pill" :class="intentPillClass(item.status)">{{ getIntentStatusLabel(item.status) }}</text>
          </view>
          <text class="applicant-card__msg">{{ item.message || '对方想进一步确认时间、地点和加入节奏。' }}</text>
          <view v-if="item.status === 'pending'" class="button-row">
            <view class="ref-secondary" @tap="reviewIntent(item, 'rejected')">拒绝</view>
            <view class="ref-primary" @tap="reviewIntent(item, 'accepted')">通过</view>
          </view>
        </view>
      </view>

      <view v-if="activeTab === 'chat'" class="ref-stack">
        <view v-if="acceptedIntents.length === 0" class="ref-empty ref-card">
          <SuIcon name="chat" size="84" glyph-size="42" variant="inline" color="#cbd5e1" />
          <text>先通过意向，再开始沟通</text>
        </view>
        <view
          v-for="item in acceptedIntents"
          :key="`chat-${item.id}`"
          class="ref-task-card"
          @tap="openConversation(item)"
        >
          <SuIcon name="chat" size="44" glyph-size="22" variant="inline" color="#2388ff" />
          <view class="ref-task-card__body">
            <text>和 {{ item.nickname || '已通过同学' }} 私聊</text>
            <text>{{ item.message || '继续确认时间、地点和加入节奏。' }}</text>
          </view>
          <SuIcon name="arrowRight" size="36" glyph-size="18" variant="inline" color="#94a3b8" />
        </view>
        <view v-if="acceptedIntents.length > 1" class="ref-task-card" @tap="openGroupConversation">
          <SuIcon name="people" size="44" glyph-size="22" variant="inline" color="#2388ff" />
          <view class="ref-task-card__body">
            <text>创建临时群聊</text>
            <text>把已通过的同学拉到一起，统一确认时间、地点和注意事项。</text>
          </view>
          <SuIcon name="arrowRight" size="36" glyph-size="18" variant="inline" color="#94a3b8" />
        </view>
      </view>

      <view v-if="activeTab === 'convert'" class="ref-stack">
        <view v-if="acceptedIntents.length === 0" class="ref-empty ref-card">
          <SuIcon name="people" size="84" glyph-size="42" variant="inline" color="#cbd5e1" />
          <text>通过意向后才能邀请成行</text>
        </view>
        <view v-else class="convert-panel ref-card">
          <view class="convert-panel__head">
            <text>选择成行方式</text>
            <text>{{ acceptedCount }} 位已通过同学可邀请</text>
          </view>
          <view class="convert-choice" @tap="openConvertSheet('public')">
            <SuIcon name="send" size="48" glyph-size="24" variant="soft" color="#2388ff" />
            <view>
              <text>公开约人</text>
              <text>生成公开活动，继续在成行首页招人。</text>
            </view>
            <SuIcon name="arrowRight" size="36" glyph-size="18" variant="inline" color="#94a3b8" />
          </view>
          <view class="convert-choice" @tap="openConvertSheet('members_only')">
            <SuIcon name="shield" size="48" glyph-size="24" variant="soft" color="#2388ff" />
            <view>
              <text>只约已通过的人</text>
              <text>生成私密活动，只给你选择的同学发送邀请。</text>
            </view>
            <SuIcon name="arrowRight" size="36" glyph-size="18" variant="inline" color="#94a3b8" />
          </view>
        </view>
      </view>
    </scroll-view>

    <view v-if="convertSheetVisible" class="convert-mask" @tap="closeConvertSheet">
      <view class="convert-sheet" @tap.stop>
        <view class="convert-sheet__bar"></view>
        <view class="convert-sheet__head">
          <view>
            <text>{{ conversionForm.visibility === 'public' ? '公开约人' : '只约已通过的人' }}</text>
            <text>已选择 {{ selectedInviteCount }} 人，发送邀请后对方确认才加入活动。</text>
          </view>
          <view class="sheet-close" @tap="closeConvertSheet">
              <SuIcon name="closeempty" size="34" glyph-size="17" variant="inline" color="#64748b" />
          </view>
        </view>

        <scroll-view scroll-y class="convert-sheet__body">
          <view class="form-grid">
            <view class="field field--full">
              <text>标题</text>
              <input :value="conversionForm.title" placeholder="活动标题" @input="conversionForm.title = $event.detail.value" />
            </view>
            <view class="field">
              <text>时间</text>
              <input :value="conversionForm.time" placeholder="如 周五 19:00" @input="conversionForm.time = $event.detail.value" />
            </view>
            <view class="field">
              <text>人数</text>
              <input type="number" :value="conversionForm.maxParticipants" placeholder="人数上限" @input="conversionForm.maxParticipants = $event.detail.value" />
            </view>
            <view class="field field--full">
              <text>地点</text>
              <input :value="conversionForm.location" placeholder="活动地点" @input="conversionForm.location = $event.detail.value" />
            </view>
            <view class="field">
              <text>费用</text>
              <input type="number" :value="conversionForm.amount" placeholder="0" @input="conversionForm.amount = $event.detail.value" />
            </view>
            <view class="field">
              <text>日期</text>
              <input :value="conversionForm.date" placeholder="本周待定" @input="conversionForm.date = $event.detail.value" />
            </view>
            <view class="field field--full">
              <text>说明</text>
              <textarea :value="conversionForm.description" placeholder="补充给被邀请同学看的说明" @input="conversionForm.description = $event.detail.value" />
            </view>
          </view>

          <view class="invite-list">
            <text class="invite-list__title">邀请对象</text>
            <view
              v-for="item in acceptedIntents"
              :key="`invite-${item.id}`"
              class="invite-row"
              :class="{ selected: selectedIntentIds.includes(item.id) }"
              @tap="toggleInvite(item.id)"
            >
              <image class="intent-avatar" :src="item.avatar" mode="aspectFill" />
              <view>
                <text>{{ item.nickname || '已通过同学' }}</text>
                <text>{{ item.message || '已通过意向' }}</text>
              </view>
              <SuIcon :name="selectedIntentIds.includes(item.id) ? 'check' : 'people'" size="36" glyph-size="18" variant="inline" :color="selectedIntentIds.includes(item.id) ? '#2388ff' : '#94a3b8'" />
            </view>
          </view>
        </scroll-view>

        <view class="convert-sheet__footer">
          <view class="ref-secondary" @tap="closeConvertSheet">取消</view>
          <view class="ref-primary" @tap="handleConvert">发送邀请并创建活动</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import SuIcon from '@/components/surego/SuIcon.vue'
import { computed, reactive, ref } from 'vue'
import { onLoad, onPullDownRefresh } from '@dcloudio/uni-app'
import { PARTNER_INTENT_STATUS_META, convertPartnerPostToActivity, ensurePartnerGroupConversation, getPartnerPostDetail, listPartnerIntents, updatePartnerIntentStatus } from '@/common/api/partner.js'
import { makeRefreshHandler } from '@/common/utils/refresh.js'
import { getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goBackOrFallback, goManageDashboard, goPartnerConversation, goPartnerDetail } from '@/common/utils/route.js'

const currentId = ref('')
const partner = ref({})
const intents = ref([])
const activeTab = ref('intent')
const convertSheetVisible = ref(false)
const selectedIntentIds = ref([])
const conversionForm = reactive({
  visibility: 'public',
  title: '',
  date: '',
  time: '',
  location: '',
  maxParticipants: '',
  amount: '',
  description: ''
})

const navStyle = getMiniProgramNavStyle()
const navRowStyle = getMiniProgramNavRowStyle({ leftPaddingRpx: 34, minRightPaddingRpx: 24 })
const contentTopStyle = getMiniProgramNavContentStyle({ gapRpx: 20 })
const tabs = [
  { key: 'intent', label: '意向申请' },
  { key: 'chat', label: '私聊/群聊' },
  { key: 'convert', label: '约成活动' }
]
const pendingCount = computed(() => intents.value.filter((item) => item.status === 'pending').length)
const acceptedCount = computed(() => intents.value.filter((item) => item.status === 'accepted').length)
const acceptedIntents = computed(() => intents.value.filter((item) => item.status === 'accepted'))
const selectedInviteIntents = computed(() => acceptedIntents.value.filter((item) => selectedIntentIds.value.includes(item.id)))
const sourcePartnerIntentIds = computed(() => selectedInviteIntents.value.map((item) => item.id).filter(Boolean))
const invitedUserIds = computed(() => selectedInviteIntents.value.map((item) => item.userId || item.user_id).filter(Boolean))
const selectedInviteCount = computed(() => invitedUserIds.value.length)

async function loadData() {
  const [detail, items] = await Promise.all([
    getPartnerPostDetail(currentId.value),
    listPartnerIntents(currentId.value)
  ])
  partner.value = detail || {}
  intents.value = items
}

onLoad((options = {}) => {
  currentId.value = options.id || ''
  loadData()
})

onPullDownRefresh(makeRefreshHandler(loadData))

function getIntentStatusLabel(status) {
  return PARTNER_INTENT_STATUS_META[status]?.label || '待确认'
}

function intentPillClass(status) {
  if (status === 'accepted') return 'ref-pill--green'
  if (status === 'rejected') return 'ref-pill--amber'
  return 'ref-pill--blue'
}

async function reviewIntent(item, status) {
  await updatePartnerIntentStatus(item.id, status)
  uni.showToast({ title: '已处理', icon: 'success' })
  loadData()
}

function openConversation(item) {
  if (!item?.conversationId) {
    uni.showToast({ title: '私聊入口准备中', icon: 'none' })
    return
  }
  goPartnerConversation(item.conversationId)
}

async function openGroupConversation() {
  const participantIds = acceptedIntents.value
    .map((item) => item.userId || item.user_id)
    .filter(Boolean)
  const conversation = await ensurePartnerGroupConversation(currentId.value, participantIds)
  if (!conversation?.id) {
    uni.showToast({ title: '暂时无法创建群聊', icon: 'none' })
    return
  }
  goPartnerConversation(conversation.id)
}

function openConvertSheet(visibility = 'public') {
  if (acceptedIntents.value.length === 0) {
    uni.showToast({ title: '先通过至少 1 个意向', icon: 'none' })
    return
  }
  conversionForm.visibility = visibility
  conversionForm.title = partner.value.title || ''
  conversionForm.date = visibility === 'public' ? '本周待定' : '待邀请确认'
  conversionForm.time = partner.value.available || partner.value.schedule || ''
  conversionForm.location = partner.value.locationRange || partner.value.location || ''
  conversionForm.maxParticipants = String(Math.max(acceptedIntents.value.length + 2, 4))
  conversionForm.amount = '0'
  conversionForm.description = partner.value.detail || partner.value.description || ''
  selectedIntentIds.value = acceptedIntents.value.map((item) => item.id).filter(Boolean)
  convertSheetVisible.value = true
}

function closeConvertSheet() {
  convertSheetVisible.value = false
}

function toggleInvite(id) {
  if (!id) return
  selectedIntentIds.value = selectedIntentIds.value.includes(id)
    ? selectedIntentIds.value.filter((item) => item !== id)
    : [...selectedIntentIds.value, id]
}

async function handleConvert() {
  if (selectedInviteCount.value === 0) {
    uni.showToast({ title: '请选择邀请对象', icon: 'none' })
    return
  }
  const activity = await convertPartnerPostToActivity({
    partnerPostId: currentId.value,
    visibility: conversionForm.visibility,
    sourcePartnerIntentIds: sourcePartnerIntentIds.value,
    invitedUserIds: invitedUserIds.value,
    title: conversionForm.title,
    date: conversionForm.date,
    time: conversionForm.time,
    location: conversionForm.location,
    maxParticipants: Number(conversionForm.maxParticipants) || selectedInviteCount.value + 1,
    amount: Number(conversionForm.amount) || 0,
    description: conversionForm.description
  })
  if (!activity?.id) {
    uni.showToast({ title: '转活动失败', icon: 'none' })
    return
  }
  convertSheetVisible.value = false
  uni.showToast({ title: '已发送邀请', icon: 'success' })
  goManageDashboard(activity.id, { replace: true })
}
</script>

<style scoped>
.manager-topbar {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 30;
  background: rgba(247, 248, 245, 0.9);
  backdrop-filter: blur(18px);
}

.manager-topbar__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
}

.exit-button {
  display: inline-flex;
  height: 70rpx;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 0 18rpx;
  border: 1rpx solid rgba(24, 24, 27, 0.08);
  border-radius: 999rpx;
  background: #fff;
  color: #102033;
  font-size: 22rpx;
  font-weight: 950;
}

.manager-topbar__title {
  min-width: 0;
  flex: 1;
  text-align: center;
}

.manager-topbar__title text:first-child {
  display: block;
  color: #64748b;
  font-size: 20rpx;
  font-weight: 950;
}

.manager-topbar__title text:last-child {
  display: block;
  margin-top: 4rpx;
  color: #102033;
  font-size: 30rpx;
  font-weight: 950;
}

.manager-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12rpx;
  padding: 24rpx;
}

.manager-summary view {
  min-width: 0;
  border-radius: 28rpx;
  background: #edf6ff;
  padding: 22rpx 12rpx;
  text-align: center;
}

.manager-summary text:first-child,
.manager-summary text:last-child {
  display: block;
}

.manager-summary text:first-child {
  color: #102033;
  font-size: 30rpx;
  font-weight: 950;
  line-height: 1.1;
}

.manager-summary text:last-child {
  margin-top: 8rpx;
  color: #64748b;
  font-size: 19rpx;
  font-weight: 850;
}

.sticky-tabs {
  position: sticky;
  top: 0;
  z-index: 10;
  margin-top: 24rpx;
  padding-top: 8rpx;
  background: rgba(247, 251, 255, 0.92);
  backdrop-filter: blur(18px);
}

.applicant-card {
  padding: 30rpx;
}

.organizer-line {
  display: flex;
  align-items: center;
  gap: 18rpx;
}

.intent-avatar {
  width: 76rpx;
  height: 76rpx;
  flex: 0 0 76rpx;
  border-radius: 50%;
  background: #edf2f7;
}

.organizer-line > view {
  min-width: 0;
  flex: 1;
}

.organizer-line > view text:first-child,
.organizer-line > view text:last-child {
  display: block;
}

.organizer-line > view text:first-child {
  color: #102033;
  font-size: 26rpx;
  font-weight: 950;
}

.organizer-line > view text:last-child {
  margin-top: 6rpx;
  color: #64748b;
  font-size: 21rpx;
  font-weight: 850;
}

.applicant-card__msg {
  display: block;
  margin-top: 22rpx;
  color: #64748b;
  font-size: 23rpx;
  font-weight: 800;
  line-height: 1.55;
}

.button-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18rpx;
  margin-top: 24rpx;
}

.convert-panel {
  padding: 30rpx;
}

.convert-panel__head text:first-child,
.convert-panel__head text:last-child {
  display: block;
}

.convert-panel__head text:first-child {
  color: #102033;
  font-size: 31rpx;
  font-weight: 950;
}

.convert-panel__head text:last-child {
  margin-top: 8rpx;
  color: #64748b;
  font-size: 22rpx;
  font-weight: 850;
}

.convert-choice {
  display: flex;
  align-items: center;
  gap: 18rpx;
  margin-top: 22rpx;
  padding: 24rpx;
  border: 1rpx solid #e5edf6;
  border-radius: 30rpx;
  background: #f8fbff;
}

.convert-choice > view {
  min-width: 0;
  flex: 1;
}

.convert-choice > view text:first-child,
.convert-choice > view text:last-child {
  display: block;
}

.convert-choice > view text:first-child {
  color: #102033;
  font-size: 27rpx;
  font-weight: 950;
}

.convert-choice > view text:last-child {
  margin-top: 8rpx;
  color: #64748b;
  font-size: 21rpx;
  font-weight: 850;
  line-height: 1.45;
}

.convert-mask {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 80;
  display: flex;
  align-items: flex-end;
  background: rgba(15, 23, 42, 0.34);
}

.convert-sheet {
  width: 100%;
  max-height: 88vh;
  border-radius: 34rpx 34rpx 0 0;
  background: #f8fbff;
  box-shadow: 0 -20rpx 60rpx rgba(15, 23, 42, 0.18);
}

.convert-sheet__bar {
  width: 72rpx;
  height: 8rpx;
  margin: 18rpx auto 12rpx;
  border-radius: 999rpx;
  background: #cbd5e1;
}

.convert-sheet__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
  padding: 0 30rpx 20rpx;
}

.convert-sheet__head > view:first-child {
  min-width: 0;
  flex: 1;
}

.convert-sheet__head text:first-child,
.convert-sheet__head text:last-child {
  display: block;
}

.convert-sheet__head text:first-child {
  color: #102033;
  font-size: 34rpx;
  font-weight: 950;
}

.convert-sheet__head text:last-child {
  margin-top: 8rpx;
  color: #64748b;
  font-size: 22rpx;
  font-weight: 850;
  line-height: 1.45;
}

.sheet-close {
  display: flex;
  width: 62rpx;
  height: 62rpx;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #fff;
}

.convert-sheet__body {
  max-height: 60vh;
  padding: 0 30rpx;
  box-sizing: border-box;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
}

.field {
  min-width: 0;
  padding: 18rpx;
  border: 1rpx solid #e5edf6;
  border-radius: 24rpx;
  background: #fff;
}

.field--full {
  grid-column: 1 / -1;
}

.field text {
  display: block;
  margin-bottom: 10rpx;
  color: #64748b;
  font-size: 20rpx;
  font-weight: 900;
}

.field input,
.field textarea {
  width: 100%;
  min-height: 44rpx;
  color: #102033;
  font-size: 24rpx;
  font-weight: 850;
}

.field textarea {
  height: 132rpx;
  line-height: 1.45;
}

.invite-list {
  margin-top: 24rpx;
  padding-bottom: 24rpx;
}

.invite-list__title {
  display: block;
  margin-bottom: 14rpx;
  color: #102033;
  font-size: 26rpx;
  font-weight: 950;
}

.invite-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 14rpx;
  padding: 18rpx;
  border: 1rpx solid #e5edf6;
  border-radius: 26rpx;
  background: #fff;
}

.invite-row.selected {
  border-color: rgba(35, 136, 255, 0.38);
  background: #edf6ff;
}

.invite-row > view {
  min-width: 0;
  flex: 1;
}

.invite-row > view text:first-child,
.invite-row > view text:last-child {
  display: block;
}

.invite-row > view text:first-child {
  color: #102033;
  font-size: 25rpx;
  font-weight: 950;
}

.invite-row > view text:last-child {
  margin-top: 6rpx;
  color: #64748b;
  font-size: 20rpx;
  font-weight: 800;
  line-height: 1.4;
}

.convert-sheet__footer {
  display: grid;
  grid-template-columns: 180rpx 1fr;
  gap: 16rpx;
  padding: 18rpx 30rpx calc(24rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -10rpx 26rpx rgba(15, 23, 42, 0.06);
}
</style>
