<script>
export default {
  onLaunch() {
    console.log('SureGo Launch')
    // #ifdef MP-WEIXIN
    if (typeof uniCloud !== 'undefined' && uniCloud.initSecureNetworkByWeixin) {
      uniCloud.initSecureNetworkByWeixin()
    }
    // #endif
  },
  onShow() {
    console.log('SureGo Show')
  },
  onHide() {
    console.log('SureGo Hide')
  }
}
</script>

<style>
/* #ifndef APP-NVUE */
page {
  min-height: 100%;
  background: #f8f9f9;
  color: #1f2937;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
}

view,
scroll-view,
swiper,
button,
input,
textarea,
image,
text {
  box-sizing: border-box;
}

button {
  padding: 0;
  margin: 0;
  border: 0;
  line-height: 1;
  background: transparent;
}

button::after {
  border: 0;
}

.su-page {
  min-height: 100vh;
  background: #f8f9f9;
}

.su-safe-bottom {
  padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
}

.su-line-1 {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.su-line-2 {
  display: -webkit-box;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
/* #endif */
</style>
