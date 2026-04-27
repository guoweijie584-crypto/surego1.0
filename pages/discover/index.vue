<template>
  <view class="discover su-page">
    <view class="discover__top">
      <view class="discover__avatar" @tap="goUserProfile">
        <image src="https://api.dicebear.com/7.x/avataaars/png?seed=Lucky" mode="aspectFill" />
      </view>
      <view class="discover__tools">
        <view class="discover__city" @tap="showComingSoon('城市选择后续迁移')">
          <uni-icons type="location-filled" size="18" color="#111827" />
          <text>杭州</text>
        </view>
        <view class="discover__tool" @tap="showComingSoon('日历页后续迁移')">
          <uni-icons type="calendar" size="21" color="#111827" />
        </view>
        <view class="discover__tool" @tap="goMessages">
          <uni-icons type="notification-filled" size="21" color="#111827" />
          <view class="discover__dot" />
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="discover__scroll">
      <view class="discover__hero">
        <text class="discover__kicker">DISCOVER</text>
        <text class="discover__title">发现好局</text>
        <text class="discover__desc">按城市、分类和热度探索附近正在成行的活动。</text>
      </view>

      <scroll-view scroll-x class="discover__chips" :show-scrollbar="false">
        <view class="discover__chip-list">
          <view
            v-for="item in categories"
            :key="item"
            class="discover__chip"
            :class="{ 'discover__chip--active': activeCategory === item }"
            @tap="activeCategory = item"
          >
            <text>{{ item }}</text>
          </view>
        </view>
      </scroll-view>

      <view class="discover__list">
        <SuActivityCard
          v-for="item in filteredActivities"
          :key="item.id"
          :activity="item"
        />
      </view>
    </scroll-view>

    <SuBottomDock active="discover" />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import SuActivityCard from '@/components/surego/SuActivityCard.vue'
import SuBottomDock from '@/components/surego/SuBottomDock.vue'
import { listActivities } from '@/common/api/activity.js'
import { goMessages, goUserProfile, showComingSoon } from '@/common/utils/route.js'

const categories = ['全部', '户外', '美食', '运动', '学习', '展览', '夜生活']
const activeCategory = ref('全部')
const activities = ref([])

const filteredActivities = computed(() => {
  if (activeCategory.value === '全部') return activities.value
  return activities.value.filter((item) => item.category === activeCategory.value)
})

onShow(async () => {
  activities.value = await listActivities()
})
</script>

<style scoped>
.discover {
  min-height: 100vh;
  padding-bottom: 180rpx;
  background: #f8f9f9;
}

.discover__top {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 30;
  display: flex;
  height: 132rpx;
  align-items: flex-end;
  justify-content: space-between;
  padding: 0 40rpx 18rpx;
  background: rgba(255, 255, 255, 0.42);
  backdrop-filter: blur(18px);
}

.discover__avatar,
.discover__avatar image {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
}

.discover__avatar {
  border: 6rpx solid #fff;
  background: #f1f5f9;
  box-shadow: 0 16rpx 36rpx rgba(15, 23, 42, 0.12);
}

.discover__tools {
  display: flex;
  align-items: center;
  gap: 14rpx;
  padding: 10rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.84);
  box-shadow: 0 16rpx 38rpx rgba(15, 23, 42, 0.08);
}

.discover__city,
.discover__tool {
  position: relative;
  display: flex;
  height: 62rpx;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
}

.discover__city {
  gap: 6rpx;
  padding: 0 18rpx;
  color: #111827;
  font-size: 24rpx;
  font-weight: 900;
}

.discover__tool {
  width: 62rpx;
}

.discover__dot {
  position: absolute;
  top: 13rpx;
  right: 12rpx;
  width: 12rpx;
  height: 12rpx;
  border: 4rpx solid #fff;
  border-radius: 50%;
  background: #ff5e7e;
}

.discover__scroll {
  height: 100vh;
}

.discover__hero {
  padding: 174rpx 40rpx 34rpx;
}

.discover__kicker {
  color: #94a3b8;
  font-size: 20rpx;
  font-weight: 900;
}

.discover__title {
  display: block;
  margin-top: 8rpx;
  color: #111827;
  font-size: 56rpx;
  font-style: italic;
  font-weight: 900;
}

.discover__desc {
  display: block;
  margin-top: 18rpx;
  color: #64748b;
  font-size: 25rpx;
  font-weight: 800;
  line-height: 1.55;
}

.discover__chips {
  white-space: nowrap;
}

.discover__chip-list {
  display: flex;
  gap: 16rpx;
  padding: 0 40rpx 30rpx;
}

.discover__chip {
  padding: 18rpx 30rpx;
  border: 1rpx solid #eef2f7;
  border-radius: 999rpx;
  background: #fff;
  color: #94a3b8;
  font-size: 23rpx;
  font-weight: 900;
}

.discover__chip--active {
  border-color: #111827;
  background: #111827;
  color: #fff;
}

.discover__list {
  display: flex;
  flex-direction: column;
  gap: 28rpx;
  padding: 0 34rpx 180rpx;
}
</style>
