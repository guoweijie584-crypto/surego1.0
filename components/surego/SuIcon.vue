<template>
  <view
    class="su-icon"
    :class="[
      `su-icon--${variant}`,
      `su-icon--tone-${tone}`,
      { 'su-icon--active': active, 'su-icon--disabled': disabled }
    ]"
    :style="rootStyle"
  >
    <image v-if="icon.src" class="su-icon__image" :src="icon.src" mode="aspectFit" />
    <uni-icons v-else :type="icon.uni" :size="resolvedGlyphSize" :color="resolvedColor" />
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { getSuregoIcon, SUREGO_ICON_TONES } from '@/common/constants/icons.js'

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  size: {
    type: [Number, String],
    default: 44
  },
  glyphSize: {
    type: [Number, String],
    default: 0
  },
  variant: {
    type: String,
    default: 'soft'
  },
  color: {
    type: String,
    default: ''
  },
  active: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const icon = computed(() => getSuregoIcon(props.name))
const tone = computed(() => icon.value.tone || 'blue')
const toneColor = computed(() => SUREGO_ICON_TONES[tone.value] || SUREGO_ICON_TONES.blue)
const numericSize = computed(() => Number(props.size) || 44)
const resolvedGlyphSize = computed(() => Number(props.glyphSize) || Math.max(14, Math.round(numericSize.value * 0.5)))

const rootStyle = computed(() => {
  const size = `${numericSize.value}rpx`
  return {
    width: size,
    height: size,
    borderRadius: `${Math.max(16, Math.round(numericSize.value * 0.36))}rpx`
  }
})

const resolvedColor = computed(() => {
  if (props.color) return props.color
  if (['solid', 'create', 'dockActive'].includes(props.variant)) return '#ffffff'
  if (props.active && props.variant !== 'plain') return '#ffffff'
  return toneColor.value
})
</script>

<style scoped>
.su-icon {
  position: relative;
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1rpx solid rgba(35, 136, 255, 0.16);
  background: #fff;
  box-shadow: 0 10rpx 22rpx rgba(30, 88, 156, 0.08);
}

.su-icon::after {
  position: absolute;
  top: 9rpx;
  right: 9rpx;
  width: 11rpx;
  height: 11rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.7);
  content: "";
}

.su-icon--plain,
.su-icon--inline {
  border-color: transparent;
  background: transparent;
  box-shadow: none;
}

.su-icon--plain::after,
.su-icon--inline::after {
  display: none;
}

.su-icon--soft {
  background: linear-gradient(145deg, #ffffff, #eef7ff);
}

.su-icon--solid,
.su-icon--dockActive,
.su-icon--create,
.su-icon--active {
  border-color: rgba(255, 255, 255, 0.48);
  background: linear-gradient(135deg, #2388ff, #52a8ff);
  box-shadow: 0 14rpx 30rpx rgba(35, 136, 255, 0.28);
}

.su-icon--create {
  border-radius: 50% !important;
}

.su-icon--dock {
  border-color: transparent;
  background: transparent;
  box-shadow: none;
}

.su-icon--dock::after {
  display: none;
}

.su-icon--brand {
  border-color: rgba(24, 24, 27, 0.06);
  background: #fff;
}

.su-icon--tone-blue.su-icon--soft { background: linear-gradient(145deg, #ffffff, #eaf4ff); }
.su-icon--tone-cyan.su-icon--soft { background: linear-gradient(145deg, #ffffff, #e9fbff); }
.su-icon--tone-violet.su-icon--soft { background: linear-gradient(145deg, #ffffff, #f1ecff); }
.su-icon--tone-green.su-icon--soft { background: linear-gradient(145deg, #ffffff, #ecfdf5); }
.su-icon--tone-amber.su-icon--soft { background: linear-gradient(145deg, #ffffff, #fff7e6); }
.su-icon--tone-rose.su-icon--soft { background: linear-gradient(145deg, #ffffff, #fff1f4); }
.su-icon--tone-slate.su-icon--soft { background: linear-gradient(145deg, #ffffff, #f3f6fa); }

.su-icon--tone-cyan.su-icon--solid,
.su-icon--tone-cyan.su-icon--active { background: linear-gradient(135deg, #0ea5e9, #38bdf8); }
.su-icon--tone-violet.su-icon--solid,
.su-icon--tone-violet.su-icon--active { background: linear-gradient(135deg, #7c3aed, #a78bfa); }
.su-icon--tone-green.su-icon--solid,
.su-icon--tone-green.su-icon--active { background: linear-gradient(135deg, #10b981, #34d399); }
.su-icon--tone-amber.su-icon--solid,
.su-icon--tone-amber.su-icon--active { background: linear-gradient(135deg, #f59e0b, #fbbf24); }
.su-icon--tone-rose.su-icon--solid,
.su-icon--tone-rose.su-icon--active { background: linear-gradient(135deg, #f43f5e, #fb7185); }
.su-icon--tone-slate.su-icon--solid,
.su-icon--tone-slate.su-icon--active { background: linear-gradient(135deg, #334155, #64748b); }

.su-icon--disabled {
  opacity: 0.42;
}

.su-icon__image {
  width: 54%;
  height: 54%;
  position: relative;
  z-index: 1;
}
</style>
