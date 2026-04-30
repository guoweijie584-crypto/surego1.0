<template>
  <view
    class="su-qrcode"
    :style="{ width: `${renderSize}rpx`, height: `${renderSize}rpx` }"
    aria-label="check-in QR code"
  >
    <view
      v-for="cell in cells"
      :key="cell.key"
      class="su-qrcode__module"
      :class="{ 'su-qrcode__module--dark': cell.dark }"
      :style="{ width: `${moduleSize}rpx`, height: `${moduleSize}rpx` }"
    />
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { buildQrMatrix } from '@/common/utils/qrcode.js'

const props = defineProps({
  value: {
    type: String,
    default: ''
  },
  size: {
    type: Number,
    default: 320
  }
})

const matrix = computed(() => {
  if (!props.value) return []
  try {
    return buildQrMatrix(props.value)
  } catch (error) {
    console.warn('[SuQrCode] QR generation failed', error)
    return []
  }
})

const moduleSize = computed(() => {
  const count = matrix.value.length || 1
  return Math.max(4, Math.floor(props.size / count))
})

const renderSize = computed(() => moduleSize.value * (matrix.value.length || 0))

const cells = computed(() => matrix.value.flatMap((row, rowIndex) => (
  row.map((dark, colIndex) => ({
    key: `${rowIndex}-${colIndex}`,
    dark: Boolean(dark)
  }))
)))
</script>

<style scoped>
.su-qrcode {
  display: flex;
  overflow: hidden;
  flex-wrap: wrap;
  box-sizing: content-box;
  padding: 14rpx;
  border: 1rpx solid rgba(15, 23, 42, 0.08);
  border-radius: 28rpx;
  background: #fff;
  box-shadow: 0 20rpx 44rpx rgba(15, 23, 42, 0.08);
}

.su-qrcode__module {
  flex: 0 0 auto;
  background: #fff;
}

.su-qrcode__module--dark {
  background: #0f172a;
}
</style>
