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

.ref-page {
  min-height: 100vh;
  background:
    linear-gradient(90deg, rgba(35, 136, 255, 0.055) 1rpx, transparent 1rpx),
    linear-gradient(180deg, rgba(35, 136, 255, 0.055) 1rpx, transparent 1rpx),
    linear-gradient(135deg, #ecf7ff, #fbfdff 48%, #f2fbff);
  background-size: 56rpx 56rpx, 56rpx 56rpx, auto;
  color: #102033;
}

.ref-scroll {
  height: 100vh;
  box-sizing: border-box;
  padding: 0 36rpx 150rpx;
}

.ref-scroll--no-tab {
  padding-bottom: 48rpx;
}

.ref-topbar {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 30;
  background: rgba(247, 248, 245, 0.9);
  backdrop-filter: blur(18px);
}

.ref-topbar__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.ref-back,
.ref-icon-button {
  display: flex;
  width: 78rpx;
  height: 78rpx;
  flex: 0 0 78rpx;
  align-items: center;
  justify-content: center;
  border: 1rpx solid rgba(24, 24, 27, 0.08);
  border-radius: 28rpx;
  background: #fff;
}

.ref-topbar__title {
  min-width: 0;
  flex: 1;
  color: #102033;
  font-size: 30rpx;
  font-weight: 950;
  line-height: 1.2;
  text-align: center;
}

.ref-top-action {
  display: inline-flex;
  min-width: 120rpx;
  height: 68rpx;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 0 22rpx;
  border: 1rpx solid #dbeafe;
  border-radius: 999rpx;
  background: #fff;
  color: #2388ff;
  font-size: 22rpx;
  font-weight: 950;
}

.ref-page-head {
  margin-bottom: 36rpx;
}

.ref-page-head__eyebrow {
  display: block;
  color: #64748b;
  font-size: 22rpx;
  font-weight: 950;
}

.ref-page-head__title {
  display: block;
  margin-top: 12rpx;
  color: #102033;
  font-size: 54rpx;
  font-weight: 950;
  line-height: 1.12;
}

.ref-section-title {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20rpx;
  margin: 36rpx 0 20rpx;
}

.ref-section-title text:first-child {
  color: #102033;
  font-size: 32rpx;
  font-weight: 950;
  line-height: 1.2;
}

.ref-section-title text:last-child {
  color: #2388ff;
  font-size: 22rpx;
  font-weight: 950;
}

.ref-card {
  border: 1rpx solid rgba(24, 24, 27, 0.08);
  border-radius: 38rpx;
  background: #fff;
  box-shadow: 0 14rpx 36rpx rgba(30, 88, 156, 0.055);
}

.ref-card--pad {
  padding: 34rpx;
}

.ref-stack {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.ref-summary-card {
  display: flex;
  align-items: center;
  gap: 22rpx;
  padding: 18rpx;
}

.ref-summary-card image {
  width: 128rpx;
  height: 128rpx;
  flex: 0 0 128rpx;
  border-radius: 24rpx;
  background: #e2e8f0;
}

.ref-summary-card view {
  min-width: 0;
  flex: 1;
}

.ref-summary-card text:first-child {
  display: block;
  color: #102033;
  font-size: 28rpx;
  font-weight: 950;
  line-height: 1.35;
}

.ref-summary-card text:last-child {
  display: block;
  margin-top: 8rpx;
  color: #64748b;
  font-size: 22rpx;
  font-weight: 850;
}

.ref-form-card,
.ref-info-card,
.ref-payment-card,
.ref-qr-card {
  padding: 34rpx;
}

.ref-form-card__title,
.ref-info-card__title {
  display: block;
  margin-bottom: 22rpx;
  color: #102033;
  font-size: 32rpx;
  font-weight: 950;
}

.ref-form-card label {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-top: 22rpx;
  color: #64748b;
  font-size: 22rpx;
  font-weight: 900;
}

.ref-input,
.ref-textarea {
  width: 100%;
  box-sizing: border-box;
  border: 0;
  border-radius: 26rpx;
  background: #edf6ff;
  color: #102033;
  font-size: 24rpx;
  font-weight: 850;
}

.ref-input {
  height: 88rpx;
  padding: 0 26rpx;
}

.ref-textarea {
  min-height: 164rpx;
  padding: 24rpx 26rpx;
  line-height: 1.55;
}

.ref-info-card__text {
  display: block;
  color: #64748b;
  font-size: 24rpx;
  font-weight: 800;
  line-height: 1.6;
}

.ref-pill {
  display: inline-flex;
  width: fit-content;
  max-width: 100%;
  align-items: center;
  gap: 8rpx;
  border-radius: 999rpx;
  padding: 11rpx 18rpx;
  background: #f4f4f5;
  color: #52525b;
  font-size: 21rpx;
  font-weight: 950;
  line-height: 1;
}

.ref-pill--blue {
  background: rgba(59, 130, 246, 0.12);
  color: #1d4ed8;
}

.ref-pill--green {
  background: rgba(16, 185, 129, 0.12);
  color: #047857;
}

.ref-pill--amber {
  background: rgba(245, 158, 11, 0.14);
  color: #b45309;
}

.ref-pill--purple {
  background: rgba(139, 92, 246, 0.12);
  color: #6d28d9;
}

.ref-check-line {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin-top: 24rpx;
  padding: 22rpx 24rpx;
  border: 1rpx solid #dbeafe;
  border-radius: 26rpx;
  background: #fff;
  color: #64748b;
  font-size: 23rpx;
  font-weight: 900;
  line-height: 1.45;
}

.ref-check-line--active {
  border-color: rgba(18, 163, 127, 0.28);
  background: rgba(18, 163, 127, 0.08);
  color: #047857;
}

.ref-primary,
.ref-secondary {
  display: flex;
  min-height: 88rpx;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  border-radius: 30rpx;
  padding: 0 28rpx;
  font-size: 26rpx;
  font-weight: 950;
  line-height: 1.15;
}

.ref-primary {
  background: #2388ff;
  color: #fff;
  box-shadow: 0 16rpx 34rpx rgba(35, 136, 255, 0.25);
}

.ref-primary--dark {
  background: #102033;
  box-shadow: 0 16rpx 34rpx rgba(16, 32, 51, 0.18);
}

.ref-primary--disabled {
  background: #94a3b8;
  box-shadow: none;
  opacity: 0.75;
}

.ref-secondary {
  border: 1rpx solid #dbeafe;
  background: #fff;
  color: #102033;
}

.ref-bottom-cta {
  display: flex;
  gap: 18rpx;
  margin-top: 32rpx;
}

.ref-bottom-cta--fixed {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 40;
  padding: 22rpx 34rpx calc(22rpx + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 -12rpx 36rpx rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(18px);
}

.ref-bottom-cta > view,
.ref-bottom-cta > button {
  flex: 1;
}

.ref-filter-row {
  display: flex;
  gap: 16rpx;
  overflow-x: auto;
  margin: 0 -36rpx 24rpx;
  padding: 0 36rpx 8rpx;
  white-space: nowrap;
}

.ref-filter-row text {
  display: inline-flex;
  min-width: fit-content;
  align-items: center;
  justify-content: center;
  border: 1rpx solid #dbeafe;
  border-radius: 999rpx;
  background: #fff;
  padding: 18rpx 26rpx;
  color: #64748b;
  font-size: 22rpx;
  font-weight: 950;
}

.ref-filter-row text.active {
  border-color: #102033;
  background: #102033;
  color: #fff;
}

.ref-stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14rpx;
}

.ref-stat-card {
  min-width: 0;
  border: 1rpx solid rgba(24, 24, 27, 0.07);
  border-radius: 30rpx;
  background: #fff;
  padding: 24rpx 18rpx;
}

.ref-stat-card text:first-child {
  display: block;
  color: #102033;
  font-size: 32rpx;
  font-weight: 950;
}

.ref-stat-card text:last-child {
  display: block;
  margin-top: 8rpx;
  color: #64748b;
  font-size: 20rpx;
  font-weight: 850;
}

.ref-task-card {
  display: grid;
  grid-template-columns: 48rpx minmax(0, 1fr) 34rpx;
  align-items: center;
  gap: 20rpx;
  width: 100%;
  border: 1rpx solid rgba(24, 24, 27, 0.07);
  border-radius: 34rpx;
  background: #fff;
  padding: 28rpx;
  color: #102033;
  box-shadow: 0 12rpx 28rpx rgba(30, 88, 156, 0.055);
}

.ref-task-card__body {
  min-width: 0;
}

.ref-task-card__body text:first-child {
  display: block;
  color: #102033;
  font-size: 27rpx;
  font-weight: 950;
  line-height: 1.3;
}

.ref-task-card__body text:last-child {
  display: block;
  margin-top: 8rpx;
  color: #64748b;
  font-size: 22rpx;
  font-weight: 800;
  line-height: 1.45;
}

.ref-action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18rpx;
}

.ref-action-grid__item {
  display: flex;
  min-height: 156rpx;
  align-items: flex-start;
  flex-direction: column;
  justify-content: center;
  gap: 10rpx;
  border: 1rpx solid #dbeafe;
  border-radius: 32rpx;
  background: #fff;
  padding: 24rpx;
  color: #102033;
}

.ref-action-grid__item text:nth-child(2) {
  font-size: 26rpx;
  font-weight: 950;
}

.ref-action-grid__item text:nth-child(3) {
  color: #64748b;
  font-size: 21rpx;
  font-weight: 800;
  line-height: 1.4;
}

.ref-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 16rpx;
  padding: 92rpx 0;
  color: #94a3b8;
  font-size: 24rpx;
  font-weight: 900;
}

.ref-qr-card {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 16rpx;
  text-align: center;
}

.ref-qr-card__code {
  color: #102033;
  font-size: 34rpx;
  font-weight: 950;
  letter-spacing: 1rpx;
}

.ref-qr-card__hint {
  color: #64748b;
  font-size: 22rpx;
  font-weight: 850;
  line-height: 1.45;
}

.ref-success-card {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 20rpx;
  padding: 56rpx 36rpx;
  text-align: center;
}

.ref-success-card__mark {
  display: flex;
  width: 108rpx;
  height: 108rpx;
  align-items: center;
  justify-content: center;
  border-radius: 38rpx;
  background: #12a37f;
  color: #fff;
  box-shadow: 0 20rpx 44rpx rgba(18, 163, 127, 0.25);
}

.ref-success-card__title {
  color: #102033;
  font-size: 46rpx;
  font-weight: 950;
  line-height: 1.16;
}

.ref-success-card__text {
  color: #64748b;
  font-size: 24rpx;
  font-weight: 800;
  line-height: 1.6;
}

.ref-profile-card {
  padding: 34rpx;
}

.ref-profile-card__top {
  display: flex;
  gap: 24rpx;
  align-items: flex-start;
}

.ref-profile-card__avatar {
  width: 136rpx;
  height: 136rpx;
  flex: 0 0 136rpx;
  border: 8rpx solid rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  background: #edf2f7;
  box-shadow: 0 18rpx 44rpx rgba(15, 23, 42, 0.12);
}

.ref-profile-card__body {
  min-width: 0;
  flex: 1;
}

.ref-profile-card__name {
  display: block;
  margin-top: 16rpx;
  color: #102033;
  font-size: 44rpx;
  font-weight: 950;
  line-height: 1.1;
}

.ref-profile-card__bio {
  display: block;
  margin-top: 14rpx;
  color: #64748b;
  font-size: 24rpx;
  font-weight: 800;
  line-height: 1.5;
}

.ref-account-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 18rpx;
}

.ref-account {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  border: 1rpx solid #dbeafe;
  border-radius: 999rpx;
  background: #fff;
  padding: 11rpx 16rpx;
  color: #64748b;
  font-size: 20rpx;
  font-weight: 950;
}

.ref-account--active {
  background: #edf6ff;
  color: #1d4ed8;
}

.ref-record-row {
  display: flex;
  gap: 20rpx;
  padding: 24rpx 0;
  border-top: 1rpx solid #edf2f7;
}

.ref-record-row image {
  width: 112rpx;
  height: 112rpx;
  flex: 0 0 112rpx;
  border-radius: 22rpx;
  background: #e2e8f0;
}

.ref-record-row view {
  min-width: 0;
  flex: 1;
}

.ref-record-row text:first-child {
  display: block;
  color: #102033;
  font-size: 26rpx;
  font-weight: 950;
  line-height: 1.35;
}

.ref-record-row text:last-child {
  display: block;
  margin-top: 10rpx;
  color: #64748b;
  font-size: 21rpx;
  font-weight: 850;
  line-height: 1.4;
}
/* #endif */
</style>
