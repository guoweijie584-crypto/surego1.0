<template>
  <view class="team-page su-page">
    <view class="subpage-topbar" :style="navStyle">
      <view class="subpage-topbar__row" :style="navRowStyle">
        <view class="floating-back" @tap="goBackOrFallback('/pages/hackathon/index')">
          <SuIcon name="left" size="44" glyph-size="22" variant="inline" color="#102033" />
          <text>返回</text>
        </view>
        <text>队伍详情</text>
      </view>
    </view>

    <scroll-view scroll-y class="team-page__scroll" :style="contentTopStyle">
      <view v-if="loading" class="state-card">
        <SuIcon name="sceneProject" size="82" glyph-size="40" variant="soft" color="#94a3b8" />
        <text>正在同步队伍详情</text>
      </view>

      <view v-else-if="!partner.id" class="state-card">
        <SuIcon name="emptyPartner" size="88" glyph-size="42" variant="soft" color="#94a3b8" />
        <text>{{ emptyText }}</text>
      </view>

      <view v-else>
        <view class="hackathon-hero">
          <text class="pill pill--blue">{{ roleLabel }}</text>
          <text class="hero-title">{{ partner.title }}</text>
          <text class="hero-desc">{{ partner.description || partner.detail }}</text>
          <view class="question-list">
            <text v-for="tag in displayTags" :key="tag">{{ tag }}</text>
          </view>
        </view>

        <view class="info-card info-card--grid">
          <view>
            <text>协作节奏</text>
            <text>{{ partner.available || partner.schedule || '时间待定' }}</text>
          </view>
          <view>
            <text>协作地点</text>
            <text>{{ partner.locationRange || partner.location || '地点待定' }}</text>
          </view>
          <view v-if="partner.connectionRule || partner.connectionMode">
            <text>申请规则</text>
            <text>{{ partner.connectionRule || partner.connectionMode || '' }}</text>
          </view>
        </view>

        <view v-if="viewerIntent" class="info-card intent-state-card">
          <text class="card-title">{{ intentStatusTitle }}</text>
        </view>

        <view class="info-card wechat-contact-card" :class="{ 'wechat-contact-card--locked': !canViewWechat }">
          <view class="wechat-contact-card__head">
            <view>
              <text>微信联系</text>
            </view>
            <SuIcon :name="canViewWechat ? 'wechat' : 'locked-filled'" size="44" glyph-size="21" variant="inline" :color="canViewWechat ? '#22c55e' : '#94a3b8'" />
          </view>
          <view v-if="canViewWechat && hasWechatContact" class="wechat-contact-card__body">
            <view v-if="wechatId" class="wechat-contact-row">
              <view>
                <text>微信号</text>
                <text>{{ wechatId }}</text>
              </view>
              <text @tap="copyWechatId">复制</text>
            </view>
            <view v-if="wechatQrUrl" class="wechat-contact-row">
              <view>
                <text>微信二维码</text>
              </view>
              <image :src="wechatQrUrl" mode="aspectFill" @tap="previewWechatQr" />
            </view>
          </view>
          <text v-else-if="canViewWechat" class="wechat-contact-empty">发起人未填写微信</text>
          <text v-else class="wechat-contact-empty">未解锁</text>
        </view>

        <view v-if="!viewerIntent" class="form-card">
          <text class="card-title">提交组队意向</text>
          <label>
            <text>我能补的角色</text>
            <input v-model="role" placeholder="例如：前端 / 算法 / 设计 / 路演" adjust-position="false" cursor-spacing="80" />
          </label>
          <label>
            <text>可投入时间</text>
            <input v-model="time" placeholder="例如：周五晚 + 周末两天" adjust-position="false" cursor-spacing="80" />
          </label>
          <label>
            <text>一句话介绍</text>
            <textarea v-model="intro" placeholder="说说你的技能、作品或想做的方向" adjust-position="false" cursor-spacing="80" disable-default-padding="true" />
          </label>
        </view>

        <view class="bottom-cta">
          <view
            class="primary-button"
            :class="{ 'primary-button--disabled': submitting }"
            @tap="handlePrimaryAction"
          >
            {{ actionText }}
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import SuIcon from '@/components/surego/SuIcon.vue'
import { computed, ref } from 'vue'
import { onLoad, onPullDownRefresh } from '@dcloudio/uni-app'
import { isLoggedIn } from '@/common/api/auth.js'
import { createPartnerIntent, getPartnerPostDetail } from '@/common/api/partner.js'
import { makeRefreshHandler } from '@/common/utils/refresh.js'
import { getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goBackOrFallback, goPartnerConversation, goPartnerWorkbench, guardLoginAction } from '@/common/utils/route.js'

const partner = ref({})
const currentId = ref('')
const role = ref('')
const time = ref('')
const intro = ref('')
const loading = ref(false)
const submitting = ref(false)
const loadError = ref('')
const navStyle = getMiniProgramNavStyle()
const navRowStyle = getMiniProgramNavRowStyle({ leftPaddingRpx: 34, minRightPaddingRpx: 24 })
const contentTopStyle = getMiniProgramNavContentStyle({ gapRpx: 22 })

const displayTags = computed(() => {
  const tags = Array.isArray(partner.value.fitTags) && partner.value.fitTags.length
    ? partner.value.fitTags
    : partner.value.tags || []
  return (Array.isArray(tags) ? tags : []).filter(Boolean).slice(0, 5)
})
const roleLabel = computed(() => {
  const wants = Array.isArray(partner.value.wants) ? partner.value.wants.filter(Boolean).slice(0, 2) : []
  if (wants.length > 0) return `缺 ${wants.join(' / ')}`
  return partner.value.typeLabel || '项目组队'
})
const viewerIntent = computed(() => partner.value.viewerIntent || partner.value.viewer_intent || null)
const intentStatus = computed(() => partner.value.viewerIntentStatus || partner.value.viewer_intent_status || viewerIntent.value?.status || '')
const viewerConversationId = computed(() => partner.value.viewerConversationId || partner.value.viewer_conversation_id || viewerIntent.value?.conversationId || viewerIntent.value?.conversation_id || '')
const canViewWechat = computed(() => Boolean(partner.value.canViewWechat || partner.value.can_view_wechat))
const wechatId = computed(() => partner.value.wechatId || partner.value.wechat_id || '')
const wechatQrUrl = computed(() => partner.value.wechatQrUrl || partner.value.wechat_qr_url || partner.value.wechatQr?.url || partner.value.wechat_qr?.url || '')
const hasWechatContact = computed(() => Boolean(wechatId.value || wechatQrUrl.value))
const emptyText = computed(() => loadError.value || '队伍不存在或已下线')
const actionText = computed(() => {
  if (partner.value.isCreator) return '进入工作台'
  if (intentStatus.value === 'accepted' && viewerConversationId.value) return '进入队伍会话'
  if (intentStatus.value === 'accepted') return '已通过，等待会话'
  if (intentStatus.value === 'pending') return '已提交，等待队长确认'
  if (intentStatus.value === 'rejected') return '申请未通过'
  if (submitting.value) return '提交中...'
  return '提交组队意向'
})
const intentStatusTitle = computed(() => {
  if (intentStatus.value === 'accepted') return '队长已通过'
  if (intentStatus.value === 'rejected') return '申请未通过'
  return '已提交，等待队长确认'
})
async function loadData() {
  if (!currentId.value) {
    partner.value = {}
    return
  }
  loading.value = true
  loadError.value = ''
  try {
    partner.value = await getPartnerPostDetail(currentId.value, { allowFallback: false }) || {}
  } catch (error) {
    partner.value = {}
    loadError.value = error?.message || '云端队伍详情暂不可用'
  } finally {
    loading.value = false
  }
}

function validateIntent() {
  if (!role.value.trim()) return '请填写你能补的角色'
  if (!time.value.trim()) return '请填写可投入时间'
  if (!intro.value.trim()) return '请填写一句话介绍'
  return ''
}

function buildIntentMessage() {
  return [
    `角色：${role.value.trim()}`,
    `可投入时间：${time.value.trim()}`,
    `介绍：${intro.value.trim()}`,
    '来源：黑客松组队专区'
  ].join('\n')
}

function handlePrimaryAction() {
  if (!partner.value.id || submitting.value) return
  if (partner.value.isCreator) {
    goPartnerWorkbench(partner.value.id)
    return
  }
  if (intentStatus.value === 'accepted' && viewerConversationId.value) {
    goPartnerConversation(viewerConversationId.value)
    return
  }
  if (intentStatus.value === 'accepted') {
    uni.showToast({ title: '会话入口同步中', icon: 'none' })
    return
  }
  if (intentStatus.value === 'pending') {
    uni.showToast({ title: '已提交，等待队长确认', icon: 'none' })
    return
  }
  if (intentStatus.value === 'rejected') {
    uni.showToast({ title: '申请未通过，可查看其他队伍', icon: 'none' })
    return
  }
  handleSubmit()
}

async function handleSubmit() {
  if (!partner.value.id || submitting.value) return
  if (!isLoggedIn()) {
    guardLoginAction(`/pages/hackathon/team?id=${encodeURIComponent(partner.value.id)}`, { replace: true })
    return
  }

  const message = validateIntent()
  if (message) {
    uni.showToast({ title: message, icon: 'none' })
    return
  }

  submitting.value = true
  try {
    await createPartnerIntent({
      partnerPostId: partner.value.id,
      creatorId: partner.value.creatorId,
      source: 'hackathon',
      message: buildIntentMessage(),
      allowFallback: false
    })
    uni.showToast({ title: '意向已提交，等待队长确认', icon: 'success' })
    await loadData()
  } finally {
    submitting.value = false
  }
}

function copyWechatId() {
  if (!wechatId.value) return
  uni.setClipboardData({
    data: wechatId.value,
    success() {
      uni.showToast({ title: '微信号已复制', icon: 'success' })
    }
  })
}

function previewWechatQr() {
  if (!wechatQrUrl.value) return
  uni.previewImage({
    current: wechatQrUrl.value,
    urls: [wechatQrUrl.value]
  })
}

onLoad((options = {}) => {
  currentId.value = options.id || ''
  loadData()
})

onPullDownRefresh(makeRefreshHandler(loadData))
</script>

<style scoped>
.team-page { min-height: 100vh; background: #f8f9f9; }
.subpage-topbar { position: fixed; top: 0; right: 0; left: 0; z-index: 30; background: rgba(248, 249, 249, 0.9); backdrop-filter: blur(18px); }
.subpage-topbar__row { display: grid; grid-template-columns: 150rpx 1fr 150rpx; align-items: center; color: #102033; font-size: 30rpx; font-weight: 950; text-align: center; }
.floating-back { display: inline-flex; align-items: center; gap: 6rpx; color: #102033; font-size: 23rpx; font-weight: 900; }
.team-page__scroll { height: 100vh; box-sizing: border-box; padding: 0 34rpx 120rpx; }
.hackathon-hero, .info-card, .form-card, .state-card { padding: 34rpx; border: 1rpx solid rgba(24, 24, 27, 0.08); border-radius: 38rpx; background: #fff; box-shadow: 0 14rpx 36rpx rgba(15, 23, 42, 0.05); }
.hackathon-hero { display: flex; flex-direction: column; gap: 18rpx; background: linear-gradient(135deg, #ffffff, #edf6ff); }
.pill { align-self: flex-start; padding: 12rpx 18rpx; border-radius: 999rpx; font-size: 21rpx; font-weight: 950; }
.pill--blue { background: #dbeafe; color: #2563eb; }
.hero-title { color: #102033; font-size: 52rpx; font-weight: 950; line-height: 1.1; }
.hero-desc, .card-copy { color: #64748b; font-size: 25rpx; font-weight: 850; line-height: 1.55; }
.question-list { display: flex; flex-wrap: wrap; gap: 10rpx; }
.question-list text { padding: 10rpx 16rpx; border-radius: 999rpx; background: #f3f6fa; color: #64748b; font-size: 20rpx; font-weight: 900; }
.info-card, .form-card { margin-top: 24rpx; }
.intent-state-card { border-color: rgba(35, 136, 255, 0.18); background: #eef7ff; }
.wechat-contact-card { border-color: rgba(34, 197, 94, 0.2); background: #f0fdf4; }
.wechat-contact-card--locked { border-color: rgba(24, 24, 27, 0.08); background: #fff; }
.wechat-contact-card__head { display: flex; align-items: center; justify-content: space-between; gap: 18rpx; }
.wechat-contact-card__head view { display: grid; gap: 8rpx; }
.wechat-contact-card__head view text:first-child { color: #102033; font-size: 31rpx; font-weight: 950; }
.wechat-contact-card__head view text:last-child { color: #64748b; font-size: 22rpx; font-weight: 850; line-height: 1.35; }
.wechat-contact-card__body { display: grid; gap: 16rpx; margin-top: 22rpx; }
.wechat-contact-row { display: flex; min-height: 88rpx; align-items: center; justify-content: space-between; gap: 20rpx; padding: 18rpx 20rpx; border-radius: 24rpx; background: #fff; }
.wechat-contact-row view { display: grid; gap: 6rpx; min-width: 0; }
.wechat-contact-row view text:first-child { color: #94a3b8; font-size: 20rpx; font-weight: 900; }
.wechat-contact-row view text:last-child { min-width: 0; color: #102033; font-size: 25rpx; font-weight: 950; word-break: break-all; }
.wechat-contact-row > text { flex-shrink: 0; padding: 12rpx 20rpx; border-radius: 999rpx; background: #dcfce7; color: #15803d; font-size: 22rpx; font-weight: 950; }
.wechat-contact-row image { width: 96rpx; height: 96rpx; flex: 0 0 96rpx; border-radius: 18rpx; background: #f8fafc; }
.wechat-contact-empty { display: block; margin-top: 20rpx; color: #94a3b8; font-size: 23rpx; font-weight: 850; line-height: 1.45; }
.info-card--grid { display: grid; gap: 18rpx; }
.info-card--grid view { display: grid; gap: 8rpx; padding-bottom: 18rpx; border-bottom: 1rpx solid #f1f5f9; }
.info-card--grid view:last-child { padding-bottom: 0; border-bottom: 0; }
.info-card--grid text:first-child { color: #94a3b8; font-size: 21rpx; font-weight: 900; }
.info-card--grid text:last-child { color: #102033; font-size: 25rpx; font-weight: 900; line-height: 1.45; }
.card-title { display: block; color: #102033; font-size: 31rpx; font-weight: 950; }
.card-copy { display: block; margin-top: 14rpx; }
.form-card label { display: flex; flex-direction: column; gap: 12rpx; margin-top: 22rpx; color: #94a3b8; font-size: 21rpx; font-weight: 900; }
.form-card input, .form-card textarea { width: 100%; box-sizing: border-box; border: 0; border-radius: 24rpx; background: #f3f6fa; color: #102033; font-size: 24rpx; font-weight: 850; }
.form-card input { height: 82rpx; padding: 0 24rpx; }
.form-card textarea { height: 160rpx; padding: 24rpx; line-height: 1.55; }
.state-card { display: flex; min-height: 320rpx; flex-direction: column; align-items: center; justify-content: center; gap: 16rpx; color: #94a3b8; font-size: 24rpx; font-weight: 900; text-align: center; }
.bottom-cta { margin-top: 28rpx; }
.primary-button { display: flex; height: 88rpx; align-items: center; justify-content: center; border-radius: 999rpx; background: #2388ff; color: #fff; font-size: 26rpx; font-weight: 950; box-shadow: 0 16rpx 34rpx rgba(35, 136, 255, 0.28); }
.primary-button--disabled { opacity: 0.58; }
</style>
