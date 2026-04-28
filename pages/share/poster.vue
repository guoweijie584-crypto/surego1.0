<template>
  <view class="poster su-page">
    <view class="poster__nav">
      <view class="poster__nav-btn" @tap="goActivityDetail(activity.id)">
        <uni-icons type="left" size="24" color="#0f172a" />
      </view>
      <text class="poster__nav-title">活动海报</text>
      <view class="poster__nav-btn" @tap="copySharePath">
        <uni-icons type="link" size="20" color="#0f172a" />
      </view>
    </view>

    <scroll-view scroll-y class="poster__scroll">
      <view class="poster-card">
        <view class="poster-card__cover-wrap">
          <image class="poster-card__cover" :src="activity.image" mode="aspectFill" />
          <view class="poster-card__shade" />
          <view class="poster-card__brand">
            <text>SUREGO</text>
            <text>一起成行</text>
          </view>
          <view class="poster-card__mode" :class="`poster-card__mode--${activity.partyMode}`">
            <text>{{ modeLabel }}</text>
          </view>
        </view>

        <view class="poster-card__body">
          <text class="poster-card__title">{{ activity.title }}</text>
          <view class="poster-card__meta">
            <uni-icons type="calendar" size="17" color="#94a3b8" />
            <text>{{ activity.date }} {{ activity.time }} - {{ activity.endTime }}</text>
          </view>
          <view class="poster-card__meta">
            <uni-icons type="location" size="17" color="#94a3b8" />
            <text class="su-line-1">{{ activity.location }}</text>
          </view>

          <view class="poster-card__stats">
            <view>
              <text>{{ activity.participantCount }}</text>
              <text>已上车</text>
            </view>
            <view>
              <text>{{ seatsLeftText }}</text>
              <text>剩余名额</text>
            </view>
            <view>
              <text>{{ activity.likeCount }}</text>
              <text>心动</text>
            </view>
          </view>

          <view class="poster-card__desc">
            <text>{{ activity.description }}</text>
          </view>

          <view class="poster-card__footer">
            <view class="poster-card__qr">
              <uni-icons type="weixin" size="34" color="#0f172a" />
            </view>
            <view class="poster-card__footer-copy">
              <text>微信扫码或搜索 SureGo</text>
              <text>{{ sharePath }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="action-panel">
        <button class="action-panel__button action-panel__button--primary" open-type="share">
          <uni-icons type="weixin" size="20" color="#fff" />
          <text>转发给微信好友</text>
        </button>
        <view class="action-panel__button" @tap="copySharePath">
          <uni-icons type="link" size="20" color="#0f172a" />
          <text>复制分享路径</text>
        </view>
        <view class="action-panel__button" @tap="savePosterPreview">
          <uni-icons type="download" size="20" color="#0f172a" />
          <text>{{ isGenerating ? '生成中...' : '保存海报图片' }}</text>
        </view>
      </view>
    </scroll-view>

    <canvas canvas-id="posterCanvas" id="posterCanvas" class="poster-canvas" />
  </view>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import { onLoad, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'
import { getActivityDetail } from '@/common/api/activity.js'
import { createEmptyActivity } from '@/common/utils/activity-default.js'
import { goActivityDetail } from '@/common/utils/route.js'
import { buildActivityPosterCopy, buildActivitySharePath, buildActivitySharePayload } from '@/common/utils/share.js'

const activityId = ref('101')
const activity = ref(createEmptyActivity('101'))
const posterImage = ref('')
const isGenerating = ref(false)

const posterWidth = 750
const posterHeight = 1180

const sharePath = computed(() => buildActivitySharePath(activity.value))
const posterCopy = computed(() => buildActivityPosterCopy(activity.value))

const modeLabel = computed(() => {
  if (activity.value.partyMode === 'sincerity') return `诚意金 ¥${activity.value.amount}`
  if (activity.value.partyMode === 'ticket') return `门票 ¥${activity.value.amount}`
  return '免费局'
})

const seatsLeftText = computed(() => {
  if (!activity.value.hasParticipantLimit) return '不限'
  return String(Math.max(0, activity.value.maxParticipants - activity.value.participantCount))
})

onLoad(async (query) => {
  activityId.value = (query && query.id) || '101'
  activity.value = await getActivityDetail(activityId.value)
  await nextTick()
  generatePosterImage()
})

onShareAppMessage(() => buildActivitySharePayload(activity.value, posterImage.value || activity.value.image))
onShareTimeline(() => buildActivitySharePayload(activity.value, posterImage.value || activity.value.image))

function copySharePath() {
  uni.setClipboardData({
    data: sharePath.value,
    success() {
      uni.showToast({ title: '分享路径已复制', icon: 'none' })
    }
  })
}

function getCanvasCoverPath() {
  return new Promise((resolve) => {
    if (!activity.value.image) {
      resolve('')
      return
    }
    uni.getImageInfo({
      src: activity.value.image,
      success: (result) => resolve(result.path || ''),
      fail: () => resolve('')
    })
  })
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 2) {
  const chars = String(text || '').split('')
  let line = ''
  let lineCount = 0
  for (let i = 0; i < chars.length; i += 1) {
    const testLine = `${line}${chars[i]}`
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, y + lineCount * lineHeight)
      line = chars[i]
      lineCount += 1
      if (lineCount >= maxLines) return
    } else {
      line = testLine
    }
  }
  if (line && lineCount < maxLines) {
    ctx.fillText(line, x, y + lineCount * lineHeight)
  }
}

async function generatePosterImage() {
  if (isGenerating.value) return posterImage.value
  isGenerating.value = true
  try {
    const ctx = uni.createCanvasContext('posterCanvas')
    const copy = posterCopy.value
    const coverPath = await getCanvasCoverPath()

    ctx.setFillStyle('#f0f4f8')
    ctx.fillRect(0, 0, posterWidth, posterHeight)
    ctx.setFillStyle('#ffffff')
    ctx.fillRect(38, 34, 674, 1112)

    ctx.setFillStyle('#0f172a')
    ctx.fillRect(38, 34, 674, 470)
    if (coverPath) {
      ctx.drawImage(coverPath, 38, 34, 674, 470)
      ctx.setFillStyle('rgba(15, 23, 42, 0.42)')
      ctx.fillRect(38, 34, 674, 470)
    }

    ctx.setFillStyle('#ffffff')
    ctx.setFontSize(28)
    ctx.fillText(copy.brand, 74, 92)
    ctx.setFontSize(22)
    ctx.fillText(copy.slogan, 74, 126)

    ctx.setFillStyle(activity.value.partyMode === 'ticket' ? '#8b5cf6' : activity.value.partyMode === 'sincerity' ? '#ef4444' : '#22c55e')
    ctx.fillRect(496, 420, 176, 46)
    ctx.setFillStyle('#ffffff')
    ctx.setFontSize(22)
    ctx.fillText(copy.mode, 514, 451)

    ctx.setFillStyle('#0f172a')
    ctx.setFontSize(42)
    drawWrappedText(ctx, activity.value.title, 74, 580, 602, 56, 3)

    ctx.setFillStyle('#64748b')
    ctx.setFontSize(26)
    ctx.fillText(copy.time, 74, 772)
    drawWrappedText(ctx, copy.location, 74, 820, 600, 34, 1)

    ctx.setFillStyle('#f8fafc')
    ctx.fillRect(74, 878, 602, 112)
    ctx.setFillStyle('#0f172a')
    ctx.setFontSize(32)
    ctx.fillText(String(activity.value.participantCount || 0), 118, 932)
    ctx.fillText(seatsLeftText.value, 314, 932)
    ctx.fillText(String(activity.value.likeCount || 0), 510, 932)
    ctx.setFillStyle('#94a3b8')
    ctx.setFontSize(18)
    ctx.fillText('已上车', 112, 966)
    ctx.fillText('剩余名额', 296, 966)
    ctx.fillText('心动', 510, 966)

    ctx.setFillStyle('#f1f5f9')
    ctx.fillRect(74, 1026, 104, 104)
    ctx.setFillStyle('#0f172a')
    ctx.setFontSize(26)
    ctx.fillText('SG', 110, 1088)
    ctx.setFontSize(24)
    ctx.fillText(copy.qrHint, 202, 1066)
    ctx.setFillStyle('#94a3b8')
    ctx.setFontSize(20)
    drawWrappedText(ctx, copy.path, 202, 1102, 450, 26, 1)

    return await new Promise((resolve, reject) => {
      ctx.draw(false, () => {
        uni.canvasToTempFilePath({
          canvasId: 'posterCanvas',
          width: posterWidth,
          height: posterHeight,
          destWidth: posterWidth,
          destHeight: posterHeight,
          success: (result) => {
            posterImage.value = result.tempFilePath
            resolve(result.tempFilePath)
          },
          fail: reject
        })
      })
    })
  } catch (error) {
    uni.showToast({ title: '海报生成失败，可先转发或复制路径', icon: 'none' })
    return ''
  } finally {
    isGenerating.value = false
  }
}

async function savePosterPreview() {
  const filePath = posterImage.value || await generatePosterImage()
  if (!filePath) return
  uni.saveImageToPhotosAlbum({
    filePath,
    success() {
      uni.showToast({ title: '海报已保存', icon: 'none' })
    },
    fail() {
      uni.showToast({ title: '保存失败，可先转发或复制路径', icon: 'none' })
    }
  })
}
</script>

<style scoped>
.poster {
  min-height: 100vh;
  background: #f0f4f8;
}

.poster__nav {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 20;
  display: flex;
  height: 132rpx;
  align-items: flex-end;
  justify-content: space-between;
  padding: 0 34rpx 18rpx;
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(18px);
}

.poster__nav-title {
  color: #0f172a;
  font-size: 30rpx;
  font-weight: 900;
}

.poster__nav-btn {
  display: flex;
  width: 66rpx;
  height: 66rpx;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.poster__scroll {
  height: 100vh;
}

.poster-canvas {
  position: fixed;
  left: -9999rpx;
  top: -9999rpx;
  width: 750px;
  height: 1180px;
}

.poster-card {
  overflow: hidden;
  margin: 168rpx 38rpx 30rpx;
  border-radius: 48rpx;
  background: #fff;
  box-shadow: 0 28rpx 80rpx rgba(15, 23, 42, 0.13);
}

.poster-card__cover-wrap {
  position: relative;
  height: 520rpx;
  background: #e2e8f0;
}

.poster-card__cover,
.poster-card__shade {
  width: 100%;
  height: 100%;
}

.poster-card__shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.1), rgba(15, 23, 42, 0.48));
}

.poster-card__brand {
  position: absolute;
  top: 34rpx;
  left: 34rpx;
  display: flex;
  align-items: baseline;
  gap: 12rpx;
  color: #fff;
}

.poster-card__brand text:first-child {
  font-size: 25rpx;
  font-weight: 900;
}

.poster-card__brand text:last-child {
  opacity: 0.72;
  font-size: 20rpx;
  font-weight: 800;
}

.poster-card__mode {
  position: absolute;
  right: 34rpx;
  bottom: 34rpx;
  padding: 12rpx 22rpx;
  border-radius: 999rpx;
  background: #22c55e;
  color: #fff;
  font-size: 22rpx;
  font-weight: 900;
}

.poster-card__mode--sincerity {
  background: #ef4444;
}

.poster-card__mode--ticket {
  background: #8b5cf6;
}

.poster-card__body {
  padding: 38rpx;
}

.poster-card__title {
  display: block;
  color: #0f172a;
  font-size: 43rpx;
  font-weight: 900;
  line-height: 1.38;
}

.poster-card__meta {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 20rpx;
  color: #64748b;
  font-size: 25rpx;
  font-weight: 800;
}

.poster-card__stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14rpx;
  margin-top: 32rpx;
}

.poster-card__stats view {
  padding: 20rpx 10rpx;
  border-radius: 26rpx;
  background: #f8fafc;
  text-align: center;
}

.poster-card__stats text:first-child {
  display: block;
  color: #0f172a;
  font-size: 32rpx;
  font-style: italic;
  font-weight: 900;
}

.poster-card__stats text:last-child {
  display: block;
  margin-top: 6rpx;
  color: #94a3b8;
  font-size: 18rpx;
  font-weight: 900;
}

.poster-card__desc {
  margin-top: 30rpx;
  padding: 26rpx;
  border-left: 8rpx solid #22c55e;
  border-radius: 24rpx;
  background: #f8fafc;
  color: #475569;
  font-size: 25rpx;
  font-weight: 800;
  line-height: 1.68;
}

.poster-card__footer {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-top: 34rpx;
  padding-top: 28rpx;
  border-top: 1rpx solid #f1f5f9;
}

.poster-card__qr {
  display: flex;
  width: 104rpx;
  height: 104rpx;
  flex: 0 0 104rpx;
  align-items: center;
  justify-content: center;
  border-radius: 28rpx;
  background: #f1f5f9;
}

.poster-card__footer-copy {
  flex: 1;
  min-width: 0;
}

.poster-card__footer-copy text:first-child {
  display: block;
  color: #0f172a;
  font-size: 25rpx;
  font-weight: 900;
}

.poster-card__footer-copy text:last-child {
  display: block;
  margin-top: 8rpx;
  color: #94a3b8;
  font-size: 20rpx;
  font-weight: 800;
}

.action-panel {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  padding: 0 38rpx 70rpx;
}

.action-panel__button {
  display: flex;
  height: 92rpx;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  border: 1rpx solid #f1f5f9;
  border-radius: 30rpx;
  background: #fff;
  color: #0f172a;
  font-size: 26rpx;
  font-weight: 900;
}

.action-panel__button--primary {
  border-color: #0f172a;
  background: #0f172a;
  color: #fff;
}
</style>
