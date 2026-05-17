<template>
  <view class="publish su-page">
    <view class="publish__nav" :style="navStyle">
      <view class="publish__nav-row" :style="navRowStyle">
        <view class="publish__title-group">
          <text>发布</text>
        </view>
        <view class="publish__profile" @tap="goUserProfile">
          <SuIcon name="navProfile" size="38" glyph-size="19" variant="inline" color="#102033" />
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="publish__scroll" :style="contentTopStyle">
      <view class="create-hub-hero">
        <text class="pill">发布</text>
      </view>

      <view class="create-choice-grid">
        <view class="create-choice-card" @tap="goActivityCreate">
          <view class="create-choice-card__icon create-choice-card__icon--activity">
            <SuIcon name="calendar" size="58" glyph-size="29" variant="inline" color="#2388ff" />
          </view>
          <view>
            <text>发布活动</text>
          </view>
        </view>

        <view class="create-choice-card" @tap="goPartnerCreate">
          <view class="create-choice-card__icon create-choice-card__icon--partner">
            <SuIcon name="people" size="58" glyph-size="29" variant="inline" color="#6d28d9" />
          </view>
          <view>
            <text>发布搭子</text>
          </view>
        </view>
      </view>

    </scroll-view>

    <SuBottomDock active="publish" />
  </view>
</template>

<script setup>
import SuIcon from '@/components/surego/SuIcon.vue'
import SuBottomDock from '@/components/surego/SuBottomDock.vue'
import { getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goActivityCreate, goPartnerCreate, goUserProfile } from '@/common/utils/route.js'

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
  grid-template-columns: minmax(0, 1fr) 76rpx;
  align-items: center;
  gap: 16rpx;
  color: #102033;
  font-size: 34rpx;
  font-weight: 950;
}

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

.publish__title-group text {
  display: block;
}

.publish__title-group text:first-child {
  color: #102033;
  font-size: 34rpx;
  font-weight: 950;
  line-height: 1.1;
}

.publish__title-group text:nth-child(2) {
  margin-top: 6rpx;
  color: #64748b;
  font-size: 21rpx;
  font-weight: 900;
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
  border-radius: 48rpx;
  background: #fff;
  box-shadow: 0 12rpx 28rpx rgba(30, 88, 156, 0.055);
}

.create-hub-hero {
  display: grid;
  gap: 26rpx;
  padding: 40rpx;
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
  gap: 24rpx;
  margin-top: 24rpx;
}

.create-choice-card {
  display: grid;
  grid-template-columns: 68rpx minmax(0, 1fr);
  align-items: start;
  gap: 24rpx;
  padding: 32rpx;
}

.create-choice-card__icon {
  display: flex;
  width: 68rpx;
  height: 68rpx;
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

.create-choice-card view:nth-child(2) text:nth-child(2) {
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

</style>
