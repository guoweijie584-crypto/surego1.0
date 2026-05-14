<template>
  <view class="topic su-page">
    <view class="subpage-topbar" :style="navStyle">
      <view class="subpage-topbar__row" :style="navRowStyle">
        <view class="floating-back" @tap="goBackOrFallback('/pages/home/index')">
          <SuIcon name="left" size="44" glyph-size="22" variant="inline" color="#102033" />
          <text>返回</text>
        </view>
        <text>天大毕业季</text>
      </view>
    </view>

    <scroll-view scroll-y class="topic__scroll" :style="contentTopStyle">
      <view class="hackathon-hero graduation-topic-hero">
        <text class="pill pill--blue">天大毕业季</text>
        <text class="hero-title">毕业前，再和同校同学约一次</text>
        <text class="hero-desc">约拍、散伙饭、自习收尾和小聚都放在这里。看到合适的活动，可以直接报名或加入候补。</text>
        <view class="hackathon-stats">
          <view><text>{{ graduationActivities.length }}</text><text>毕业活动</text></view>
          <view><text>{{ soonCount }}</text><text>最近开始</text></view>
          <view><text>{{ openCount }}</text><text>仍可加入</text></view>
        </view>
      </view>

      <view class="section-title">
        <text>毕业季正在约</text>
      </view>

      <view class="stack">
        <SuActivityCard v-for="item in graduationActivities" :key="item.id" :activity="item" />
        <view v-if="graduationActivities.length === 0" class="empty-card">暂无毕业季活动</view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import SuIcon from '@/components/surego/SuIcon.vue'
import { computed, ref } from 'vue'
import { onPullDownRefresh, onShow } from '@dcloudio/uni-app'
import SuActivityCard from '@/components/surego/SuActivityCard.vue'
import { listActivities } from '@/common/api/activity.js'
import { makeRefreshHandler } from '@/common/utils/refresh.js'
import { getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goBackOrFallback } from '@/common/utils/route.js'

const activities = ref([])
const navStyle = getMiniProgramNavStyle()
const navRowStyle = getMiniProgramNavRowStyle({ leftPaddingRpx: 34, minRightPaddingRpx: 24 })
const contentTopStyle = getMiniProgramNavContentStyle({ gapRpx: 22 })

const graduationActivities = computed(() => {
  const preferred = activities.value.filter((item) => ['约拍', '聚餐', '展览', '运动'].includes(item.category))
  return (preferred.length ? preferred : activities.value).slice(0, 4)
})

const soonCount = computed(() => {
  const count = graduationActivities.value.filter((item) => ['今天', '明天', '本周'].some((word) => `${item.date}${item.dayOfWeek}`.includes(word))).length
  return count || Math.min(2, graduationActivities.value.length)
})

const openCount = computed(() => graduationActivities.value.filter((item) => !item.hasParticipantLimit || Number(item.participantCount || 0) < Number(item.maxParticipants || 0)).length)

async function loadData() {
  activities.value = await listActivities()
}

onShow(loadData)
onPullDownRefresh(makeRefreshHandler(loadData))
</script>

<style scoped>
.topic { min-height: 100vh; background: #f8f9f9; }
.subpage-topbar { position: fixed; top: 0; right: 0; left: 0; z-index: 30; background: rgba(248, 249, 249, 0.9); backdrop-filter: blur(18px); }
.subpage-topbar__row { display: grid; grid-template-columns: 130rpx 1fr 130rpx; align-items: center; color: #102033; font-size: 30rpx; font-weight: 950; text-align: center; }
.floating-back { display: inline-flex; align-items: center; gap: 6rpx; color: #102033; font-size: 23rpx; font-weight: 900; }
.topic__scroll { height: 100vh; box-sizing: border-box; padding: 0 34rpx 80rpx; }
.hackathon-hero { display: flex; flex-direction: column; gap: 18rpx; padding: 38rpx; border-radius: 42rpx; background: #fff; box-shadow: 0 18rpx 46rpx rgba(30, 88, 156, 0.08); }
.graduation-topic-hero { background: linear-gradient(135deg, #ffffff, #edf6ff); }
.pill { align-self: flex-start; padding: 12rpx 18rpx; border-radius: 999rpx; font-size: 21rpx; font-weight: 950; }
.pill--blue { background: rgba(35, 136, 255, 0.12); color: #1d4ed8; }
.hero-title { color: #102033; font-size: 54rpx; font-weight: 950; line-height: 1.1; }
.hero-desc { color: #64748b; font-size: 25rpx; font-weight: 850; line-height: 1.55; }
.hackathon-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14rpx; margin-top: 8rpx; }
.hackathon-stats view { padding: 20rpx 16rpx; border-radius: 24rpx; background: #f3f6fa; }
.hackathon-stats text { display: block; }
.hackathon-stats text:first-child { color: #102033; font-size: 36rpx; font-weight: 950; }
.hackathon-stats text:last-child { margin-top: 4rpx; color: #94a3b8; font-size: 19rpx; font-weight: 900; }
.section-title { margin: 40rpx 0 22rpx; color: #102033; font-size: 34rpx; font-weight: 950; }
.stack { display: flex; flex-direction: column; gap: 24rpx; padding-bottom: 60rpx; }
.empty-card { padding: 70rpx 0; border-radius: 32rpx; background: #fff; color: #94a3b8; text-align: center; font-size: 24rpx; font-weight: 900; }
</style>
