<template>
  <view>
    <view v-if="showPublishSheet" class="publish-sheet">
      <view class="publish-sheet__mask" @tap="closePublishSheet" />
      <view class="publish-sheet__panel" @tap.stop="noop">
        <view class="publish-sheet__grid">
          <view class="publish-card publish-card--partner publish-card--aligned" @tap="openPartnerCreate">
            <view class="publish-card__copy">
              <text>发布搭子</text>
            </view>
            <view class="publish-card__icon">
              <SuIcon name="people" size="48" glyph-size="24" variant="inline" color="#2388ff" />
            </view>
          </view>
          <view class="publish-card publish-card--activity publish-card--aligned" @tap="openActivityCreate">
            <view class="publish-card__copy">
              <text>发布活动</text>
            </view>
            <view class="publish-card__icon">
              <SuIcon name="location" size="48" glyph-size="24" variant="inline" color="#2388ff" />
            </view>
          </view>
        </view>
        <view class="publish-sheet__close" @tap="closePublishSheet">
          <SuIcon name="closeempty" size="62" glyph-size="30" variant="inline" color="#777" />
        </view>
      </view>
    </view>

    <view class="su-dock su-safe-bottom">
      <view
        v-for="item in navItems"
        :key="item.key"
        class="su-dock__item"
        :class="{ 'su-dock__item--active': active === item.key }"
        @tap="handleTap(item)"
      >
        <view v-if="item.key === 'publish'" class="su-dock__create">
          <SuIcon name="navPublish" size="82" glyph-size="34" variant="create" />
        </view>
        <template v-else>
          <SuIcon
            :name="item.icon"
            size="48"
            glyph-size="23"
            :variant="active === item.key ? 'dockActive' : 'dock'"
            :color="active === item.key ? '' : '#94a3b8'"
          />
          <text>{{ item.label }}</text>
        </template>
      </view>
    </view>
  </view>
</template>

<script setup>
import SuIcon from '@/components/surego/SuIcon.vue'
import { ref } from 'vue'
import { goActivityCreate, goHomeRoot, goMessages, goPartnerCreate, goPartnersRoot, goUserProfile } from '@/common/utils/route.js'

const props = defineProps({
  active: {
    type: String,
    default: 'home'
  }
})

const navItems = [
  { key: 'partners', label: '搭子', icon: 'navPartners', action: goPartnersRoot },
  { key: 'home', label: '成行', icon: 'navJourney', action: goHomeRoot },
  { key: 'publish', label: '发布', icon: 'navPublish' },
  { key: 'messages', label: '通知', icon: 'navMessages', action: () => goMessages({ root: true }) },
  { key: 'profile', label: '我的', icon: 'navProfile', action: () => goUserProfile({ root: true }) }
]

const showPublishSheet = ref(false)

function handleTap(item) {
  if (item.key === 'publish') {
    showPublishSheet.value = true
    return
  }
  if (props.active === item.key && item.key !== 'publish') return
  item.action()
}

function closePublishSheet() {
  showPublishSheet.value = false
}

function openPartnerCreate() {
  closePublishSheet()
  goPartnerCreate()
}

function openActivityCreate() {
  closePublishSheet()
  goActivityCreate()
}

function noop() {}
</script>

<style scoped>
.publish-sheet {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 70;
}

.publish-sheet__mask {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: rgba(15, 23, 42, 0.44);
}

.publish-sheet__panel {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  box-sizing: border-box;
  padding: 26rpx 28rpx calc(18rpx + env(safe-area-inset-bottom));
  border-radius: 34rpx 34rpx 0 0;
  background: #fff;
  animation: publish-sheet-up 0.2s ease both;
}

.publish-sheet__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
}

.publish-card {
  position: relative;
  display: flex;
  min-width: 0;
  min-height: 116rpx;
  box-sizing: border-box;
  align-items: center;
  justify-content: space-between;
  overflow: hidden;
  padding: 22rpx 24rpx;
  border: 1rpx solid rgba(219, 234, 254, 0.85);
  border-radius: 24rpx;
  background: #fff;
  box-shadow: 0 10rpx 26rpx rgba(35, 136, 255, 0.08);
}

.publish-card--aligned {
  align-self: stretch;
}

.publish-card--partner {
  background: linear-gradient(135deg, #ffffff, #eef7ff);
}

.publish-card--activity {
  background: linear-gradient(135deg, #ffffff, #f4f9ff);
}

.publish-card__copy {
  position: relative;
  z-index: 2;
  min-width: 0;
  padding: 0;
}

.publish-card text {
  display: block;
  position: relative;
  z-index: 2;
}

.publish-card text:first-child {
  color: #102033;
  font-size: 31rpx;
  font-weight: 950;
  line-height: 1.2;
}

.publish-card__icon {
  position: relative;
  z-index: 2;
  display: flex;
  width: 64rpx;
  height: 64rpx;
  flex: 0 0 64rpx;
  align-items: center;
  justify-content: center;
  border: 1rpx solid rgba(219, 234, 254, 0.95);
  border-radius: 22rpx;
  background: #eef7ff;
}

.publish-sheet__close {
  display: flex;
  width: 72rpx;
  height: 72rpx;
  align-items: center;
  justify-content: center;
  margin: 18rpx auto 0;
  border-radius: 50%;
  background: #f3f6fa;
}

@keyframes publish-sheet-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.su-dock {
  position: fixed;
  bottom: 30rpx;
  left: 50%;
  z-index: 50;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  align-items: center;
  width: 92%;
  max-width: 720rpx;
  min-height: 112rpx;
  padding: 12rpx 18rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.72);
  border-radius: 48rpx;
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 24rpx 64rpx rgba(15, 23, 42, 0.16);
  backdrop-filter: blur(18px);
  transform: translateX(-50%);
}

.su-dock__item {
  position: relative;
  display: flex;
  min-width: 0;
  height: 88rpx;
  align-items: center;
  justify-content: center;
  gap: 5rpx;
  flex-direction: column;
  color: #94a3b8;
  font-size: 18rpx;
  font-weight: 900;
}

.su-dock__item--active {
  color: #111827;
}

.su-dock__create {
  display: flex;
  width: 104rpx;
  height: 104rpx;
  align-items: center;
  justify-content: center;
  margin-top: -46rpx;
  border: 10rpx solid #f8f9f9;
  border-radius: 50%;
  background: #2388ff;
  box-shadow: 0 18rpx 42rpx rgba(35, 136, 255, 0.34);
}
</style>
