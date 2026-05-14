<template>
  <view class="hackathon su-page">
    <view class="subpage-topbar" :style="navStyle">
      <view class="subpage-topbar__row" :style="navRowStyle">
        <view class="floating-back" @tap="goBackOrFallback('/pages/partners/index')">
          <uni-icons type="left" size="22" color="#102033" />
          <text>返回</text>
        </view>
        <text>黑客松组队</text>
      </view>
    </view>

    <scroll-view scroll-y class="hackathon__scroll" :style="contentTopStyle">
      <view class="hackathon-hero">
        <text class="pill pill--purple">精选推送</text>
        <text class="hero-title">AI 黑客松选手组队专区</text>
        <text class="hero-desc">按项目方向、还缺什么人和比赛时间找队友。先提交意向，队长确认后再继续准备参赛。</text>
        <view class="hackathon-stats">
          <view><text>{{ teams.length }}</text><text>招募队伍</text></view>
          <view><text>{{ roleCount }}</text><text>还缺队友</text></view>
          <view><text>48h</text><text>比赛周期</text></view>
        </view>
      </view>

      <view class="section-title">
        <text>正在找队友</text>
      </view>

      <view class="team-list">
        <view v-for="team in teams" :key="team.id" class="team-card" @tap="goHackathonTeam(team.id)">
          <view>
            <text class="team-card__role">{{ team.role }}</text>
            <text class="team-card__title">{{ team.name }}</text>
            <text class="team-card__intro">{{ team.intro }}</text>
            <view class="question-list">
              <text v-for="tag in team.tags" :key="tag">{{ tag }}</text>
            </view>
          </view>
          <uni-icons type="right" size="20" color="#94a3b8" />
        </view>
      </view>

      <view class="section-title">
        <text>我想找队友</text>
      </view>

      <view class="voice-card" @tap="showComingSoon('黑客松语音组队正在接入')">
        <view class="voice-card__button">
          <uni-icons type="mic-filled" size="28" color="#fff" />
        </view>
        <view>
          <text>说：“我想做 AI 校园项目，缺一个前端和设计”</text>
          <text>说完后会整理出组队说明、还缺的角色和报名问题。</text>
        </view>
      </view>

      <view class="bottom-cta">
        <view class="primary-button" @tap="goPartnerCreate">发布组队需求</view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goBackOrFallback, goHackathonTeam, goPartnerCreate, showComingSoon } from '@/common/utils/route.js'

const teams = [
  { id: 'surego-labs', name: 'SureGo Labs', role: '缺算法/后端', tags: ['组队搭子', '推荐算法', '可远程协作'], intro: '想做活动匹配和到场信用模型，需要能快速搭接口的人。' },
  { id: 'campus-ai', name: 'Campus AI Toolkit', role: '缺前端/设计', tags: ['AI 工具', '小程序', '路演'], intro: '做一个校园 AI 助手 Demo，需要能把交互和页面快速做出来的队友。' },
  { id: 'creator-map', name: 'Creator Map', role: '缺产品/运营', tags: ['校园地图', '内容运营', '增长'], intro: '想把校园活动和创作者做成地图，需要能拆需求和做冷启动的人。' }
]

const navStyle = getMiniProgramNavStyle()
const navRowStyle = getMiniProgramNavRowStyle({ leftPaddingRpx: 34, minRightPaddingRpx: 24 })
const contentTopStyle = getMiniProgramNavContentStyle({ gapRpx: 22 })
const roleCount = computed(() => teams.reduce((sum, team) => sum + Math.max(1, team.tags.length - 1), 0))
</script>

<style scoped>
.hackathon { min-height: 100vh; background: #f8f9f9; }
.subpage-topbar { position: fixed; top: 0; right: 0; left: 0; z-index: 30; background: rgba(248, 249, 249, 0.9); backdrop-filter: blur(18px); }
.subpage-topbar__row { display: grid; grid-template-columns: 150rpx 1fr 150rpx; align-items: center; color: #102033; font-size: 30rpx; font-weight: 950; text-align: center; }
.floating-back { display: inline-flex; align-items: center; gap: 6rpx; color: #102033; font-size: 23rpx; font-weight: 900; }
.hackathon__scroll { height: 100vh; box-sizing: border-box; padding: 0 34rpx 120rpx; }
.hackathon-hero { display: flex; flex-direction: column; gap: 18rpx; padding: 38rpx; border-radius: 42rpx; background: linear-gradient(135deg, #2563eb, #6d5bd0); color: #fff; box-shadow: 0 22rpx 54rpx rgba(37, 99, 235, 0.22); }
.pill { align-self: flex-start; padding: 12rpx 18rpx; border-radius: 999rpx; font-size: 21rpx; font-weight: 950; }
.pill--purple { background: rgba(255, 255, 255, 0.18); color: #fff; }
.hero-title { font-size: 54rpx; font-weight: 950; line-height: 1.08; }
.hero-desc { color: rgba(255, 255, 255, 0.82); font-size: 25rpx; font-weight: 850; line-height: 1.55; }
.hackathon-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14rpx; margin-top: 8rpx; }
.hackathon-stats view { padding: 20rpx 16rpx; border-radius: 24rpx; background: rgba(255, 255, 255, 0.16); }
.hackathon-stats text { display: block; }
.hackathon-stats text:first-child { font-size: 36rpx; font-style: italic; font-weight: 950; }
.hackathon-stats text:last-child { margin-top: 4rpx; color: rgba(255, 255, 255, 0.74); font-size: 19rpx; font-weight: 900; }
.section-title { margin: 40rpx 0 22rpx; color: #102033; font-size: 34rpx; font-weight: 950; }
.team-list { display: flex; flex-direction: column; gap: 22rpx; }
.team-card { display: grid; grid-template-columns: 1fr 32rpx; align-items: center; gap: 20rpx; padding: 30rpx; border: 1rpx solid rgba(24, 24, 27, 0.08); border-radius: 34rpx; background: #fff; box-shadow: 0 14rpx 36rpx rgba(15, 23, 42, 0.05); }
.team-card__role { display: inline-flex; align-self: flex-start; padding: 9rpx 16rpx; border-radius: 999rpx; background: #dbeafe; color: #2563eb; font-size: 20rpx; font-weight: 900; }
.team-card__title { display: block; margin-top: 16rpx; color: #102033; font-size: 34rpx; font-style: italic; font-weight: 950; line-height: 1.25; }
.team-card__intro { display: block; margin-top: 12rpx; color: #64748b; font-size: 24rpx; font-weight: 800; line-height: 1.5; }
.question-list { display: flex; flex-wrap: wrap; gap: 10rpx; margin-top: 16rpx; }
.question-list text { padding: 10rpx 16rpx; border-radius: 999rpx; background: #f3f6fa; color: #64748b; font-size: 20rpx; font-weight: 900; }
.voice-card { display: flex; gap: 22rpx; padding: 30rpx; border-radius: 34rpx; background: #fff; box-shadow: 0 14rpx 36rpx rgba(15, 23, 42, 0.05); }
.voice-card__button { display: flex; width: 82rpx; height: 82rpx; flex: 0 0 82rpx; align-items: center; justify-content: center; border-radius: 28rpx; background: #2388ff; }
.voice-card text { display: block; }
.voice-card text:first-child { color: #102033; font-size: 27rpx; font-weight: 900; line-height: 1.35; }
.voice-card text:last-child { margin-top: 8rpx; color: #64748b; font-size: 22rpx; font-weight: 800; line-height: 1.45; }
.bottom-cta { margin-top: 28rpx; }
.primary-button { display: flex; height: 88rpx; align-items: center; justify-content: center; border-radius: 999rpx; background: #2388ff; color: #fff; font-size: 26rpx; font-weight: 950; box-shadow: 0 16rpx 34rpx rgba(35, 136, 255, 0.28); }
</style>
