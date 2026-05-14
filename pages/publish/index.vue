<template>
  <view class="publish su-page">
    <view class="publish__nav" :style="navStyle">
      <view class="publish__nav-row" :style="navRowStyle">
        <view class="publish__back" @tap="goBackOrFallback('/pages/home/index')">
          <uni-icons type="left" size="24" color="#102033" />
        </view>
        <text>发布</text>
        <view class="publish__profile" @tap="goUserProfile">
          <uni-icons type="person-filled" size="19" color="#102033" />
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="publish__scroll" :style="contentTopStyle">
      <view class="create-hub-hero">
        <text class="pill">发布</text>
        <text class="create-hub-hero__title">今天想约什么？</text>
        <text class="create-hub-hero__desc">时间地点已经定了，就发活动；还想先找合适的人，就发搭子需求。</text>
      </view>

      <view class="create-choice-grid">
        <view class="create-choice-card" @tap="goActivityCreate">
          <view class="create-choice-card__icon create-choice-card__icon--activity">
            <uni-icons type="calendar" size="29" color="#2388ff" />
          </view>
          <view>
            <text>发活动</text>
            <text>时间、地点、人数和费用已经说得清。</text>
          </view>
          <text class="choice-pill choice-pill--green">马上约</text>
        </view>

        <view class="create-choice-card" @tap="goPartnerCreate">
          <view class="create-choice-card__icon create-choice-card__icon--partner">
            <uni-icons type="staff" size="29" color="#6d28d9" />
          </view>
          <view>
            <text>发搭子帖</text>
            <text>先看看谁合适，再私聊、拉群或一起约时间。</text>
          </view>
          <text class="choice-pill choice-pill--purple">先认识</text>
        </view>
      </view>

      <view class="info-card">
        <view class="info-card__head">
          <text>还没定下来？</text>
          <text>先发搭子需求，收到申请后再约时间、定地点。</text>
        </view>
        <view class="info-card__action" @tap="goPartnerCreate">
          <text>先找人</text>
          <uni-icons type="right" size="16" color="#2388ff" />
        </view>
      </view>
    </scroll-view>

    <SuBottomDock active="publish" />
  </view>
</template>

<script setup>
import SuBottomDock from '@/components/surego/SuBottomDock.vue'
import { getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goActivityCreate, goBackOrFallback, goPartnerCreate, goUserProfile } from '@/common/utils/route.js'

const navStyle = getMiniProgramNavStyle()
const navRowStyle = getMiniProgramNavRowStyle({ leftPaddingRpx: 34, minRightPaddingRpx: 24 })
const contentTopStyle = getMiniProgramNavContentStyle({ gapRpx: 24 })
</script>

<style scoped>
.publish {
  min-height: 100vh;
  padding-bottom: 180rpx;
  background: #f6fbff;
}

.publish__nav {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 30;
  background: rgba(247, 251, 255, 0.9);
  backdrop-filter: blur(18px);
}

.publish__nav-row {
  display: grid;
  grid-template-columns: 76rpx minmax(0, 1fr) 76rpx;
  align-items: center;
  gap: 16rpx;
  color: #102033;
  font-size: 34rpx;
  font-weight: 950;
}

.publish__back,
.publish__profile {
  display: flex;
  width: 76rpx;
  height: 76rpx;
  align-items: center;
  justify-content: center;
  border: 1rpx solid rgba(24, 24, 27, 0.08);
  border-radius: 28rpx;
  background: #fff;
  box-shadow: 0 12rpx 28rpx rgba(30, 88, 156, 0.06);
}

.publish__nav-row > text {
  text-align: center;
}

.publish__scroll {
  height: 100vh;
  padding-right: 34rpx;
  padding-bottom: 188rpx;
  padding-left: 34rpx;
}

.create-hub-hero,
.create-choice-card,
.info-card {
  border: 1rpx solid rgba(24, 24, 27, 0.08);
  border-radius: 42rpx;
  background: #fff;
  box-shadow: 0 18rpx 46rpx rgba(30, 88, 156, 0.08);
}

.create-hub-hero {
  display: grid;
  gap: 20rpx;
  padding: 36rpx;
  background: linear-gradient(135deg, #f8fbff, #ffffff);
}

.pill,
.choice-pill {
  display: inline-flex;
  width: fit-content;
  border-radius: 999rpx;
  font-size: 21rpx;
  font-weight: 950;
  line-height: 1;
}

.pill {
  padding: 12rpx 18rpx;
  background: rgba(35, 136, 255, 0.12);
  color: #1d4ed8;
}

.create-hub-hero__title {
  color: #102033;
  font-size: 56rpx;
  font-weight: 950;
  line-height: 1.08;
}

.create-hub-hero__desc {
  color: #64748b;
  font-size: 25rpx;
  font-weight: 850;
  line-height: 1.55;
}

.create-choice-grid {
  display: grid;
  gap: 22rpx;
  margin-top: 24rpx;
}

.create-choice-card {
  display: grid;
  grid-template-columns: 70rpx minmax(0, 1fr);
  align-items: start;
  gap: 20rpx;
  padding: 30rpx;
}

.create-choice-card__icon {
  display: flex;
  width: 70rpx;
  height: 70rpx;
  align-items: center;
  justify-content: center;
  border-radius: 24rpx;
}

.create-choice-card__icon--activity {
  background: #edf6ff;
}

.create-choice-card__icon--partner {
  background: rgba(139, 92, 246, 0.12);
}

.create-choice-card view:nth-child(2) text {
  display: block;
}

.create-choice-card view:nth-child(2) text:first-child {
  color: #102033;
  font-size: 33rpx;
  font-weight: 950;
}

.create-choice-card view:nth-child(2) text:last-child {
  margin-top: 9rpx;
  color: #64748b;
  font-size: 24rpx;
  font-weight: 850;
  line-height: 1.45;
}

.choice-pill {
  grid-column: 2;
  padding: 12rpx 18rpx;
}

.choice-pill--green {
  background: rgba(16, 185, 129, 0.12);
  color: #047857;
}

.choice-pill--purple {
  background: rgba(139, 92, 246, 0.12);
  color: #6d28d9;
}

.info-card {
  display: grid;
  gap: 18rpx;
  margin-top: 24rpx;
  padding: 30rpx;
}

.info-card__head text {
  display: block;
}

.info-card__head text:first-child {
  color: #102033;
  font-size: 31rpx;
  font-weight: 950;
}

.info-card__head text:last-child {
  margin-top: 12rpx;
  color: #64748b;
  font-size: 24rpx;
  font-weight: 850;
  line-height: 1.5;
}

.info-card__action {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 8rpx;
  color: #2388ff;
  font-size: 24rpx;
  font-weight: 950;
}
</style>
