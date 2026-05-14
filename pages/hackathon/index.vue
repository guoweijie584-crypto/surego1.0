<template>
  <view class="hackathon su-page">
    <view class="subpage-topbar" :style="navStyle">
      <view class="subpage-topbar__row" :style="navRowStyle">
        <view class="floating-back" @tap="goBackOrFallback('/pages/partners/index')">
          <SuIcon name="left" size="44" glyph-size="22" variant="inline" color="#102033" />
          <text>返回</text>
        </view>
        <text>黑客松组队</text>
      </view>
    </view>

    <scroll-view scroll-y class="hackathon__scroll" :style="contentTopStyle">
      <view class="hackathon-hero">
        <image
          class="hackathon-hero__image"
          src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=82&w=900"
          mode="aspectFill"
        />
        <view class="hackathon-hero__shade" />
        <view class="hackathon-hero__content">
          <view>
            <text class="hackathon-hero__pill">精选推荐</text>
            <view class="hackathon-hero__title-group">
              <text class="hackathon-hero__title-line">AI 黑客松选手</text>
              <text class="hackathon-hero__title-line hackathon-hero__title-line--strong">组队专区</text>
            </view>
            <text class="hackathon-hero__desc">找产品、前端、算法、设计和路演队友。</text>
          </view>
          <view class="hackathon-stats">
            <view><text class="hackathon-stats__label"><text class="hackathon-stats__num">{{ teams.length }}</text> 招募队伍</text></view>
            <view><text class="hackathon-stats__label"><text class="hackathon-stats__num">{{ roleCount }}</text> 缺队友</text></view>
            <view><text class="hackathon-stats__label">48h 比赛周期</text></view>
          </view>
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
          <SuIcon name="arrowRight" size="40" glyph-size="20" variant="inline" color="#94a3b8" />
        </view>
      </view>

      <view class="section-title">
        <text>我想找队友</text>
      </view>

      <view class="voice-card" @tap="showComingSoon('黑客松语音组队正在接入')">
        <view class="voice-card__button">
          <SuIcon name="mic" size="56" glyph-size="28" variant="inline" color="#fff" />
        </view>
        <view>
          <text>说：“我想做 AI 校园项目，缺一个前端和设计”</text>
        </view>
      </view>

      <view class="bottom-cta">
        <view class="primary-button" @tap="goPartnerCreate">发布组队需求</view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import SuIcon from '@/components/surego/SuIcon.vue'
import { computed } from 'vue'
import { getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goBackOrFallback, goHackathonTeam, goPartnerCreate, showComingSoon } from '@/common/utils/route.js'

const teams = [
  { id: 'surego-labs', name: 'SureGo Labs', role: '缺算法 / 后端', tags: ['组队搭子', '推荐算法', '可远程协作'], intro: '想做活动匹配和到场信用模型，需要能快速搭接口的人。' },
  { id: 'campus-ai', name: 'Campus AI Toolkit', role: '缺前端 / 设计', tags: ['AI 工具', '小程序', '路演'], intro: '做一个校园 AI 助手 Demo，需要能把交互和页面快速做出来的队友。' },
  { id: 'creator-map', name: 'Creator Map', role: '缺产品 / 运营', tags: ['校园地图', '内容运营', '增长'], intro: '想把校园活动和创作者做成地图，需要能拆需求和做冷启动的人。' }
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
.hackathon-hero { position: relative; min-height: 386rpx; overflow: hidden; border-radius: 44rpx; background: #dbeafe; color: #fff; box-shadow: 0 20rpx 44rpx rgba(35, 136, 255, 0.14); }
.hackathon-hero__image,
.hackathon-hero__shade { position: absolute; top: 0; right: 0; bottom: 0; left: 0; width: 100%; height: 100%; }
.hackathon-hero__shade {
  background:
    linear-gradient(180deg, rgba(12, 35, 72, 0.7), rgba(12, 35, 72, 0.35) 44%, rgba(12, 35, 72, 0.24) 100%),
    linear-gradient(135deg, rgba(35, 136, 255, 0.28), rgba(37, 99, 235, 0.08));
}
.hackathon-hero__content { position: relative; z-index: 2; display: flex; min-height: 386rpx; flex-direction: column; justify-content: space-between; box-sizing: border-box; padding: 32rpx 30rpx 28rpx; }
.hackathon-hero__pill { display: inline-flex; align-self: flex-start; padding: 10rpx 16rpx; border: 1rpx solid rgba(255, 255, 255, 0.14); border-radius: 999rpx; background: rgba(255, 255, 255, 0.14); font-size: 18rpx; font-weight: 950; backdrop-filter: blur(12px); }
.hackathon-hero__title-group { display: grid; gap: 2rpx; margin-top: 16rpx; max-width: 560rpx; }
.hackathon-hero__title-line { display: block; font-size: 38rpx; font-weight: 950; line-height: 1.08; text-shadow: 0 8rpx 20rpx rgba(7, 25, 59, 0.24); }
.hackathon-hero__title-line--strong { font-size: 48rpx; }
.hackathon-hero__desc { display: block; margin-top: 12rpx; max-width: 560rpx; color: rgba(255, 255, 255, 0.84); font-size: 20rpx; font-weight: 850; line-height: 1.45; text-shadow: 0 8rpx 20rpx rgba(7, 25, 59, 0.18); }
.hackathon-stats { display: flex; flex-wrap: wrap; gap: 10rpx; margin-top: 18rpx; }
.hackathon-stats view { display: inline-flex; min-height: 52rpx; align-items: center; justify-content: center; padding: 0 18rpx; border: 1rpx solid rgba(255, 255, 255, 0.22); border-radius: 999rpx; background: rgba(255, 255, 255, 0.96); box-shadow: 0 8rpx 20rpx rgba(11, 51, 122, 0.14); backdrop-filter: blur(12px); }
.hackathon-stats__label { color: #274d8f; font-size: 18rpx; font-weight: 900; line-height: 1; }
.hackathon-stats__num { color: #102033; font-size: 21rpx; font-weight: 950; line-height: 1; vertical-align: baseline; }
.section-title { margin: 40rpx 0 22rpx; color: #102033; font-size: 34rpx; font-weight: 950; }
.team-list { display: flex; flex-direction: column; gap: 22rpx; }
.team-card { display: grid; grid-template-columns: 1fr 32rpx; align-items: center; gap: 20rpx; padding: 30rpx; border: 1rpx solid rgba(24, 24, 27, 0.08); border-radius: 34rpx; background: #fff; box-shadow: 0 14rpx 36rpx rgba(15, 23, 42, 0.05); }
.team-card__role { display: inline-flex; align-self: flex-start; padding: 9rpx 16rpx; border-radius: 999rpx; background: #dbeafe; color: #2563eb; font-size: 20rpx; font-weight: 900; }
.team-card__title { display: block; margin-top: 16rpx; color: #102033; font-size: 34rpx; font-weight: 950; line-height: 1.25; }
.team-card__intro { display: block; margin-top: 12rpx; color: #64748b; font-size: 24rpx; font-weight: 800; line-height: 1.5; }
.question-list { display: flex; flex-wrap: wrap; gap: 10rpx; margin-top: 16rpx; }
.question-list text { padding: 10rpx 16rpx; border-radius: 999rpx; background: #f3f6fa; color: #64748b; font-size: 20rpx; font-weight: 900; }
.voice-card { display: flex; gap: 22rpx; padding: 30rpx; border-radius: 34rpx; background: #fff; box-shadow: 0 14rpx 36rpx rgba(15, 23, 42, 0.05); }
.voice-card__button { display: flex; width: 82rpx; height: 82rpx; flex: 0 0 82rpx; align-items: center; justify-content: center; border-radius: 28rpx; background: #2388ff; }
.voice-card text { display: block; }
.voice-card text:first-child { color: #102033; font-size: 27rpx; font-weight: 900; line-height: 1.35; }
.voice-card text:nth-child(2) { margin-top: 8rpx; color: #64748b; font-size: 22rpx; font-weight: 800; line-height: 1.45; }
.bottom-cta { margin-top: 28rpx; }
.primary-button { display: flex; height: 88rpx; align-items: center; justify-content: center; border-radius: 999rpx; background: #2388ff; color: #fff; font-size: 26rpx; font-weight: 950; box-shadow: 0 16rpx 34rpx rgba(35, 136, 255, 0.28); }
</style>
