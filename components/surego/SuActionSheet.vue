<template>
  <view v-if="modelValue" class="su-sheet">
    <view class="su-sheet__mask" @tap="close" />
    <view class="su-sheet__panel su-safe-bottom" @tap.stop="noop">
      <view class="su-sheet__handle" />
      <view class="su-sheet__header">
        <text class="su-sheet__title">{{ title }}</text>
        <view class="su-sheet__close" @tap.stop="close">
          <uni-icons type="closeempty" size="24" color="#64748b" />
        </view>
      </view>
      <slot />
    </view>
  </view>
</template>

<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '更多'
  }
})

const emit = defineEmits(['update:modelValue'])

function close() {
  emit('update:modelValue', false)
}

function noop() {}
</script>

<style scoped>
.su-sheet {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 60;
}

.su-sheet__mask {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: rgba(15, 23, 42, 0.42);
}

.su-sheet__panel {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 16rpx 36rpx 40rpx;
  border-radius: 42rpx 42rpx 0 0;
  background: #fff;
  box-shadow: 0 -20rpx 80rpx rgba(15, 23, 42, 0.18);
  animation: su-sheet-up 0.2s ease both;
}

.su-sheet__handle {
  width: 72rpx;
  height: 8rpx;
  margin: 0 auto 24rpx;
  border-radius: 999rpx;
  background: #e2e8f0;
}

.su-sheet__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28rpx;
}

.su-sheet__title {
  color: #0f172a;
  font-size: 30rpx;
  font-weight: 900;
}

.su-sheet__close {
  display: flex;
  width: 58rpx;
  height: 58rpx;
  align-items: center;
  justify-content: center;
  border-radius: 22rpx;
  background: #f8fafc;
}

@keyframes su-sheet-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
</style>
