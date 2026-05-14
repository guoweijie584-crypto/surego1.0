<template>
  <view class="team-page su-page">
    <view class="subpage-topbar" :style="navStyle">
      <view class="subpage-topbar__row" :style="navRowStyle">
        <view class="floating-back" @tap="goBackOrFallback('/pages/hackathon/index')">
          <uni-icons type="left" size="22" color="#102033" />
          <text>返回</text>
        </view>
        <text>队伍详情</text>
      </view>
    </view>

    <scroll-view scroll-y class="team-page__scroll" :style="contentTopStyle">
      <view class="hackathon-hero">
        <text class="pill pill--blue">{{ team.role }}</text>
        <text class="hero-title">{{ team.name }}</text>
        <text class="hero-desc">{{ team.intro }}</text>
        <view class="question-list">
          <text v-for="tag in team.tags" :key="tag">{{ tag }}</text>
        </view>
      </view>

      <view class="info-card">
        <text class="card-title">组队节奏</text>
        <text class="card-copy">先提交你的角色、可投入时间和作品经验。队长确认后，会在通知里提醒你继续完善参赛准备。</text>
      </view>

      <view class="form-card">
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
        <view class="primary-button" @tap="handleSubmit">提交组队意向</view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goBackOrFallback, goMessages } from '@/common/utils/route.js'

const teams = [
  { id: 'surego-labs', name: 'SureGo Labs', role: '缺算法/后端', tags: ['组队搭子', '推荐算法', '可远程协作'], intro: '想做活动匹配和到场信用模型，需要能快速搭接口的人。' },
  { id: 'campus-ai', name: 'Campus AI Toolkit', role: '缺前端/设计', tags: ['AI 工具', '小程序', '路演'], intro: '做一个校园 AI 助手 Demo，需要能把交互和页面快速做出来的队友。' },
  { id: 'creator-map', name: 'Creator Map', role: '缺产品/运营', tags: ['校园地图', '内容运营', '增长'], intro: '想把校园活动和创作者做成地图，需要能拆需求和做冷启动的人。' }
]

const team = ref(teams[0])
const role = ref('')
const time = ref('')
const intro = ref('')
const navStyle = getMiniProgramNavStyle()
const navRowStyle = getMiniProgramNavRowStyle({ leftPaddingRpx: 34, minRightPaddingRpx: 24 })
const contentTopStyle = getMiniProgramNavContentStyle({ gapRpx: 22 })

onLoad((options = {}) => {
  team.value = teams.find((item) => item.id === options.id) || teams[0]
})

function handleSubmit() {
  uni.showToast({ title: '组队申请已提交', icon: 'success' })
  setTimeout(() => {
    goMessages({ replace: true })
  }, 260)
}
</script>

<style scoped>
.team-page { min-height: 100vh; background: #f8f9f9; }
.subpage-topbar { position: fixed; top: 0; right: 0; left: 0; z-index: 30; background: rgba(248, 249, 249, 0.9); backdrop-filter: blur(18px); }
.subpage-topbar__row { display: grid; grid-template-columns: 150rpx 1fr 150rpx; align-items: center; color: #102033; font-size: 30rpx; font-weight: 950; text-align: center; }
.floating-back { display: inline-flex; align-items: center; gap: 6rpx; color: #102033; font-size: 23rpx; font-weight: 900; }
.team-page__scroll { height: 100vh; box-sizing: border-box; padding: 0 34rpx 120rpx; }
.hackathon-hero, .info-card, .form-card { padding: 34rpx; border: 1rpx solid rgba(24, 24, 27, 0.08); border-radius: 38rpx; background: #fff; box-shadow: 0 14rpx 36rpx rgba(15, 23, 42, 0.05); }
.hackathon-hero { display: flex; flex-direction: column; gap: 18rpx; background: linear-gradient(135deg, #ffffff, #edf6ff); }
.pill { align-self: flex-start; padding: 12rpx 18rpx; border-radius: 999rpx; font-size: 21rpx; font-weight: 950; }
.pill--blue { background: #dbeafe; color: #2563eb; }
.hero-title { color: #102033; font-size: 52rpx; font-style: italic; font-weight: 950; line-height: 1.1; }
.hero-desc, .card-copy { color: #64748b; font-size: 25rpx; font-weight: 850; line-height: 1.55; }
.question-list { display: flex; flex-wrap: wrap; gap: 10rpx; }
.question-list text { padding: 10rpx 16rpx; border-radius: 999rpx; background: #f3f6fa; color: #64748b; font-size: 20rpx; font-weight: 900; }
.info-card, .form-card { margin-top: 24rpx; }
.card-title { display: block; color: #102033; font-size: 31rpx; font-style: italic; font-weight: 950; }
.card-copy { display: block; margin-top: 14rpx; }
.form-card label { display: flex; flex-direction: column; gap: 12rpx; margin-top: 22rpx; color: #94a3b8; font-size: 21rpx; font-weight: 900; }
.form-card input, .form-card textarea { width: 100%; box-sizing: border-box; border: 0; border-radius: 24rpx; background: #f3f6fa; color: #102033; font-size: 24rpx; font-weight: 850; }
.form-card input { height: 82rpx; padding: 0 24rpx; }
.form-card textarea { height: 160rpx; padding: 24rpx; line-height: 1.55; }
.bottom-cta { margin-top: 28rpx; }
.primary-button { display: flex; height: 88rpx; align-items: center; justify-content: center; border-radius: 999rpx; background: #2388ff; color: #fff; font-size: 26rpx; font-weight: 950; box-shadow: 0 16rpx 34rpx rgba(35, 136, 255, 0.28); }
</style>
