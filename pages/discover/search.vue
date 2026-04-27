<template>
  <view class="search su-page">
    <view class="search__nav">
      <view class="search__back" @tap="goBackHome">
        <uni-icons type="left" size="24" color="#111827" />
      </view>
      <view class="search__box">
        <uni-icons type="search" size="20" color="#94a3b8" />
        <input
          class="search__input"
          v-model="keyword"
          focus
          confirm-type="search"
          placeholder="搜索活动、兴趣、地点"
          placeholder-class="search__placeholder"
          @confirm="runSearch"
        />
      </view>
    </view>

    <scroll-view scroll-y class="search__scroll">
      <view v-if="!hasSearched" class="search__panel">
        <view class="section-head">
          <text class="section-title">热门搜索</text>
          <text class="section-sub">HOT</text>
        </view>
        <view class="keyword-grid">
          <view
            v-for="item in hotKeywords"
            :key="item"
            class="keyword-chip"
            @tap="pickKeyword(item)"
          >
            <text>{{ item }}</text>
          </view>
        </view>
      </view>

      <view v-if="recentKeywords.length && !hasSearched" class="search__panel">
        <view class="section-head">
          <text class="section-title">最近搜索</text>
          <text class="section-sub" @tap="clearRecent">清空</text>
        </view>
        <view class="recent-list">
          <view
            v-for="item in recentKeywords"
            :key="item"
            class="recent-item"
            @tap="pickKeyword(item)"
          >
            <uni-icons type="clock" size="17" color="#94a3b8" />
            <text>{{ item }}</text>
          </view>
        </view>
      </view>

      <view class="search__panel">
        <view class="section-head">
          <text class="section-title">{{ hasSearched ? '搜索结果' : '猜你喜欢' }}</text>
          <text class="section-sub">{{ results.length }} SPOTS</text>
        </view>
        <view class="result-list">
          <SuActivityCard
            v-for="item in results"
            :key="item.id"
            :activity="item"
          />
        </view>
        <view v-if="hasSearched && results.length === 0" class="empty">
          <uni-icons type="search" size="44" color="#cbd5e1" />
          <text>没有找到相关活动</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import SuActivityCard from '@/components/surego/SuActivityCard.vue'
import { listActivities, searchActivities } from '@/common/api/activity.js'
import { goBackHome } from '@/common/utils/route.js'

const RECENT_KEY = 'surego_recent_searches'
const hotKeywords = ['野餐', '饭搭子', '读书', '夜市', '展览', '诚意金']
const keyword = ref('')
const results = ref([])
const recentKeywords = ref([])
const hasSearched = ref(false)

onLoad(async (options = {}) => {
  recentKeywords.value = uni.getStorageSync(RECENT_KEY) || []
  keyword.value = options.keyword || ''
  if (keyword.value) {
    await runSearch()
  } else {
    results.value = (await listActivities()).slice(0, 4)
  }
})

async function runSearch() {
  const query = keyword.value.trim()
  hasSearched.value = Boolean(query)
  results.value = await searchActivities(query)
  if (query) writeRecent(query)
}

function pickKeyword(value) {
  keyword.value = value
  runSearch()
}

function writeRecent(value) {
  const next = [value, ...recentKeywords.value.filter((item) => item !== value)].slice(0, 6)
  recentKeywords.value = next
  uni.setStorageSync(RECENT_KEY, next)
}

function clearRecent() {
  recentKeywords.value = []
  uni.removeStorageSync(RECENT_KEY)
}
</script>

<style scoped>
.search {
  min-height: 100vh;
  background: #f8f9f9;
}

.search__nav {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 58rpx 40rpx 22rpx;
}

.search__back {
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

.search__box {
  display: flex;
  height: 78rpx;
  flex: 1;
  align-items: center;
  gap: 14rpx;
  padding: 0 24rpx;
  border: 1rpx solid #eef2f7;
  border-radius: 999rpx;
  background: #fff;
  box-shadow: 0 14rpx 34rpx rgba(15, 23, 42, 0.05);
}

.search__input {
  flex: 1;
  color: #111827;
  font-size: 26rpx;
  font-weight: 800;
}

.search__placeholder {
  color: #94a3b8;
}

.search__scroll {
  height: calc(100vh - 158rpx);
}

.search__panel {
  padding: 18rpx 40rpx 30rpx;
}

.section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 22rpx;
}

.section-title {
  color: #111827;
  font-size: 34rpx;
  font-style: italic;
  font-weight: 900;
}

.section-sub {
  color: #94a3b8;
  font-size: 20rpx;
  font-weight: 900;
}

.keyword-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.keyword-chip,
.recent-item {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 18rpx 26rpx;
  border: 1rpx solid #eef2f7;
  border-radius: 999rpx;
  background: #fff;
  color: #475569;
  font-size: 24rpx;
  font-weight: 900;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.recent-item {
  justify-content: flex-start;
  border-radius: 28rpx;
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 28rpx;
  padding-bottom: 70rpx;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  padding: 100rpx 0;
  color: #94a3b8;
  font-size: 24rpx;
  font-weight: 900;
}
</style>
