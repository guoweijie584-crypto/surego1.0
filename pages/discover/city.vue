<template>
  <view class="city su-page">
    <view class="city__nav" :style="navStyle">
      <view class="city__nav-row" :style="navRowStyle">
        <view class="city__back" @tap="goBackOrFallback">
          <uni-icons type="left" size="24" color="#111827" />
        </view>
        <view>
          <text class="city__eyebrow">CITY</text>
          <text class="city__title">选择城市</text>
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="city__scroll" :style="contentTopStyle">
      <view class="city__current">
        <view>
          <text class="city__label">当前城市</text>
          <text class="city__current-name">{{ selectedCity }}</text>
          <text class="city__located">手动选择，暂不使用实时定位</text>
        </view>
        <view class="city__locate" @tap="openCitySelector">
          <uni-icons type="location-filled" size="18" color="#fff" />
          <text>选择</text>
        </view>
      </view>

      <view class="city__section">
        <view class="city__section-head">
          <text>热门城市</text>
          <text>LOCAL PICKS</text>
        </view>
        <view class="city__grid">
          <view
            v-for="item in cities"
            :key="item.name"
            class="city-card"
            :class="{ 'city-card--active': selectedCity === item.name }"
            @tap="selectCity(item.name, item.code)"
          >
            <view>
              <text class="city-card__name">{{ item.name }}</text>
              <text class="city-card__desc">{{ item.desc }}</text>
            </view>
            <text class="city-card__count">{{ item.count }} 个局</text>
          </view>
        </view>
      </view>
    </scroll-view>
    <unicloud-city-select ref="citySelectRef" :location="false" :hot-city="hotCities" @select="handlePluginSelect" />
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getCityActivityStats } from '@/common/api/activity.js'
import { getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goBackOrFallback } from '@/common/utils/route.js'

const CITY_KEY = 'surego_selected_city'
const CITY_CODE_KEY = 'surego_selected_city_code'
const selectedCity = ref('杭州')
const selectedCityCode = ref('330100')
const cities = ref([])
const citySelectRef = ref(null)
const navStyle = getMiniProgramNavStyle()
const navRowStyle = getMiniProgramNavRowStyle({ leftPaddingRpx: 40, minRightPaddingRpx: 24 })
const contentTopStyle = getMiniProgramNavContentStyle({ gapRpx: 18 })
const hotCities = [
  { code: '330100', name: '杭州市' },
  { code: '310100', name: '上海市' },
  { code: '320100', name: '南京市' },
  { code: '110100', name: '北京市' }
]

onShow(async () => {
  selectedCity.value = uni.getStorageSync(CITY_KEY) || '杭州'
  selectedCityCode.value = uni.getStorageSync(CITY_CODE_KEY) || '330100'
  cities.value = await getCityActivityStats()
})

function normalizeCityName(name = '') {
  return String(name || '').replace(/市$/, '')
}

function selectCity(city, code = '') {
  const cityName = normalizeCityName(city)
  selectedCity.value = cityName
  selectedCityCode.value = String(code || '')
  uni.setStorageSync(CITY_KEY, cityName)
  uni.setStorageSync(CITY_CODE_KEY, selectedCityCode.value)
  uni.showToast({ title: `已切换到${cityName}`, icon: 'none' })
  setTimeout(() => {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      uni.navigateBack()
    } else {
      uni.redirectTo({ url: '/pages/home/index' })
    }
  }, 260)
}

function openCitySelector() {
  citySelectRef.value?.open()
}

function handlePluginSelect(city = {}) {
  selectCity(city.name || selectedCity.value, city.code || '')
}
</script>

<style scoped>
.city {
  min-height: 100vh;
  background: #f8f9f9;
}

.city__nav {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 20;
  background: rgba(248, 249, 249, 0.9);
  backdrop-filter: blur(18px);
}

.city__nav-row {
  display: flex;
  align-items: center;
  gap: 22rpx;
}

.city__back {
  display: flex;
  width: 78rpx;
  height: 78rpx;
  flex: 0 0 78rpx;
  align-items: center;
  justify-content: center;
  border: 1rpx solid #f1f5f9;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 14rpx 34rpx rgba(15, 23, 42, 0.06);
}

.city__eyebrow,
.city__label,
.city__section-head text:last-child {
  color: #94a3b8;
  font-size: 20rpx;
  font-weight: 900;
}

.city__title {
  display: block;
  margin-top: 4rpx;
  color: #111827;
  font-size: 48rpx;
  font-style: italic;
  font-weight: 900;
}

.city__scroll {
  height: 100vh;
  box-sizing: border-box;
}

.city__current {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 10rpx 40rpx 36rpx;
  padding: 32rpx;
  border-radius: 38rpx;
  background: #111827;
  color: #fff;
  box-shadow: 0 22rpx 52rpx rgba(15, 23, 42, 0.16);
}

.city__current-name {
  display: block;
  margin-top: 8rpx;
  color: #fff;
  font-size: 42rpx;
  font-style: italic;
  font-weight: 900;
}

.city__located {
  display: block;
  margin-top: 8rpx;
  color: rgba(255, 255, 255, 0.56);
  font-size: 20rpx;
  font-weight: 900;
}

.city__locate {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 18rpx 24rpx;
  border-radius: 999rpx;
  background: #ff6b6b;
  color: #fff;
  font-size: 22rpx;
  font-weight: 900;
}

.city__section {
  padding: 0 40rpx 70rpx;
}

.city__section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 22rpx;
}

.city__section-head text:first-child {
  color: #111827;
  font-size: 34rpx;
  font-style: italic;
  font-weight: 900;
}

.city__grid {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.city-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  padding: 28rpx;
  border: 1rpx solid #eef2f7;
  border-radius: 34rpx;
  background: #fff;
  box-shadow: 0 14rpx 36rpx rgba(15, 23, 42, 0.05);
}

.city-card--active {
  border-color: rgba(255, 107, 107, 0.45);
  background: #fff5f5;
}

.city-card__name {
  display: block;
  color: #111827;
  font-size: 32rpx;
  font-style: italic;
  font-weight: 900;
}

.city-card__desc {
  display: block;
  margin-top: 10rpx;
  color: #94a3b8;
  font-size: 22rpx;
  font-weight: 800;
}

.city-card__count {
  flex: 0 0 auto;
  color: #ff6b6b;
  font-size: 24rpx;
  font-weight: 900;
}
</style>
