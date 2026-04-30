import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(process.cwd())

const businessPages = [
  'pages/home/index',
  'pages/discover/index',
  'pages/discover/search',
  'pages/discover/city',
  'pages/calendar/index',
  'pages/activity/detail',
  'pages/activity/members',
  'pages/activity/register',
  'pages/activity/create',
  'pages/activity/edit',
  'pages/manage/dashboard',
  'pages/manage/checkin',
  'pages/participant/dashboard',
  'pages/order/detail',
  'pages/share/poster',
  'pages/my/activities',
  'pages/messages/index',
  'pages/auth/login',
  'pages/user/profile',
  'pages/user/edit',
  'pages/ops/dashboard',
  'pages/ops/reports',
  'pages/ops/users',
  'pages/payment/index',
  'pages/status/success'
]

const pluginPages = [
  'uni_modules/unicloud-city-select/pages/uni-city-list/uni-city-list'
]

const staleDemoRoutes = [
  'pages/cloudFunction/cloudFunction',
  'pages/cloudObject/cloudObject',
  'pages/storage/storage',
  'pages/clientDB/clientDB',
  'pages/schema2code/schema2code',
  'uni_modules/uni-id-pages/pages/login/login-withoutpwd'
]

const requiredApiFiles = [
  'common/api/activity.js',
  'common/api/application.js',
  'common/api/order.js',
  'common/api/message.js',
  'common/api/checkin.js',
  'common/api/user.js',
  'common/api/upload.js',
  'common/api/location.js',
  'common/api/member.js',
  'common/api/moderation.js'
]

const requiredUtilityFiles = [
  'common/utils/city.js',
  'common/utils/cover-presets.js',
  'common/utils/route.js',
  'common/utils/share.js'
]

const requiredComponents = [
  'components/surego/SuWechatProfileSheet.vue',
  'uni_modules/unicloud-city-select/components/unicloud-city-select/unicloud-city-select.vue'
]

const requiredCloudFunctions = [
  'surego-activity',
  'surego-application',
  'surego-order',
  'surego-message',
  'surego-checkin',
  'surego-user',
  'surego-moderation'
]

const bannedPatterns = [
  /\bwindow\b/,
  /\bdocument\b/,
  /\blocalStorage\b/,
  /from\s+['"]react['"]/,
  /from\s+['"]react-router/,
  /framer-motion/,
  /motion\/react/,
  /lucide-react/
]

const errors = []

const activityFormPages = ['pages/activity/create.vue', 'pages/activity/edit.vue']
const requiredKeyboardAttributes = ['adjust-position="false"', 'cursor-spacing="80"']

function getNativeFormControlTags(source) {
  return source.match(/<(?:input|textarea)\b[^>]*>/g) || []
}

function read(relativePath) {
  const absolute = path.join(root, relativePath)
  if (!fs.existsSync(absolute)) {
    errors.push(`Missing file: ${relativePath}`)
    return ''
  }
  return fs.readFileSync(absolute, 'utf8')
}

function readJson(relativePath) {
  const source = read(relativePath)
  if (!source) return {}
  try {
    return JSON.parse(source)
  } catch (error) {
    errors.push(`${relativePath} is not valid JSON: ${error.message}`)
    return {}
  }
}

const pagesConfig = readJson('pages.json')
const pagePaths = (pagesConfig.pages || []).map((item) => item.path)
const pagePathSet = new Set(pagePaths)

if (pagePaths[0] !== 'pages/home/index') {
  errors.push('pages.json first route must be pages/home/index')
}

for (const page of businessPages) {
  if (!pagePathSet.has(page)) {
    errors.push(`pages.json is missing business route: ${page}`)
  }
}

for (const page of pluginPages) {
  if (!pagePathSet.has(page)) {
    errors.push(`pages.json is missing plugin route: ${page}`)
  }
}

const citySelectPage = (pagesConfig.pages || []).find((item) => item.path === 'uni_modules/unicloud-city-select/pages/uni-city-list/uni-city-list')
if (citySelectPage?.style?.navigationBarTitleText !== '选择城市') {
  errors.push('unicloud-city-select route title must be Chinese: 选择城市')
}

for (const route of staleDemoRoutes) {
  if (pagePathSet.has(route)) {
    errors.push(`pages.json must not register demo route: ${route}`)
  }
}

for (const route of pagePaths) {
  if (![...businessPages, ...pluginPages].includes(route)) {
    errors.push(`pages.json contains non-release route: ${route}`)
  }
}

for (const pagePath of ['pages/activity/create', 'pages/activity/edit']) {
  const page = (pagesConfig.pages || []).find((item) => item.path === pagePath)
  if (page && page.style?.disableScroll !== true) {
    errors.push(`${pagePath} must set style.disableScroll to true`)
  }
}

const manifestSource = read('manifest.json')
for (const token of ['"vueVersion" : "3"', '"mp-weixin"', '"versionName"', '"versionCode"', '"SureGo"', '"releaseDescription"']) {
  if (!manifestSource.includes(token)) {
    errors.push(`manifest.json is missing release token: ${token}`)
  }
}

const runtimeSource = read('common/config/runtime.js')
if (!runtimeSource.includes("APP_MODE = 'trial'")) {
  errors.push("common/config/runtime.js must use APP_MODE = 'trial' for cloud trial release")
}
if (!runtimeSource.includes('USE_UNICLOUD = true')) {
  errors.push('common/config/runtime.js must use USE_UNICLOUD = true for cloud trial release')
}
for (const token of ['ALLOW_MOCK_FALLBACK', 'APP_MODE', 'isTrialMode', 'shouldUseCloudFallback']) {
  if (!runtimeSource.includes(token)) {
    errors.push(`common/config/runtime.js is missing operation runtime token: ${token}`)
  }
}

if (fs.existsSync(path.join(root, 'common/js/vconsole.min.js'))) {
  errors.push('common/js/vconsole.min.js must not be included in the trial release package')
}

for (const apiFile of requiredApiFiles) {
  const source = read(apiFile)
  const isLocalPlatformFacade = apiFile === 'common/api/upload.js' || apiFile === 'common/api/location.js'
  if (!isLocalPlatformFacade && (!source.includes('USE_UNICLOUD') || !source.includes('callSuregoFunction'))) {
    errors.push(`${apiFile} must keep mock/uniCloud facade mode`)
  }
  if (!isLocalPlatformFacade && !source.includes('@/common/api/auth.js')) {
    errors.push(`${apiFile} must use the auth facade`)
  }
}

for (const utilityFile of requiredUtilityFiles) {
  read(utilityFile)
}

for (const component of requiredComponents) {
  read(component)
}

for (const name of requiredCloudFunctions) {
  const source = read(`uniCloud-aliyun/cloudfunctions/${name}/index.js`)
  if (!source.includes('code: 0') || !source.includes('data:')) {
    errors.push(`${name} must return { code: 0, data } on successful actions`)
  }
}

for (const page of businessPages) {
  const source = read(`${page}.vue`)
  if (source.includes('uniCloud.callFunction')) {
    errors.push(`${page}.vue must call common/api facade instead of uniCloud.callFunction`)
  }
  if (source.includes('@/common/mock/activities.js')) {
    errors.push(`${page}.vue must not import common/mock/activities.js in release mode`)
  }
  if (source.includes('tempFilePaths[0]')) {
    errors.push(`${page}.vue must upload images through common/api/upload.js instead of storing tempFilePaths[0]`)
  }
  if (source.includes('goBackHome')) {
    errors.push(`${page}.vue must use goBackOrFallback instead of legacy goBackHome`)
  }
  for (const pattern of bannedPatterns) {
    if (pattern.test(source)) {
      errors.push(`${page}.vue contains banned pattern: ${pattern}`)
    }
  }
  for (const phrase of ['后续迁移', '闭环跑通', '前端闭环', '当前阶段不调用真实微信支付', '确认模拟支付', '继续模拟支付', '模拟退款']) {
    if (source.includes(phrase)) {
      errors.push(`${page}.vue contains internal release copy: ${phrase}`)
    }
  }
}

const routeSource = read('common/utils/route.js')
for (const helper of ['goActivityCreate', 'goActivityRegister', 'goManageDashboard', 'goManageCheckin', 'goOpsDashboard', 'goOpsReports', 'goOpsUsers', 'goSharePoster', 'goOrderDetail']) {
  if (!routeSource.includes(helper)) {
    errors.push(`common/utils/route.js is missing release helper: ${helper}`)
  }
}
for (const helper of ['goBackOrFallback', 'goHomeRoot', 'goDiscoverRoot']) {
  if (!routeSource.includes(helper)) {
    errors.push(`common/utils/route.js is missing stack navigation helper: ${helper}`)
  }
}

const dockSource = read('components/surego/SuBottomDock.vue')
for (const helper of ['goHomeRoot', 'goDiscoverRoot']) {
  if (!dockSource.includes(helper)) {
    errors.push(`SuBottomDock.vue must use root navigation helper: ${helper}`)
  }
}
for (const token of ['options.replace', 'options.root', "typeof fallbackUrl === 'string'", 'export function goPayment(params = {}, options = {})']) {
  if (!routeSource.includes(token)) {
    errors.push(`common/utils/route.js is missing stack-safe navigation token: ${token}`)
  }
}

const detailSource = read('pages/activity/detail.vue')
for (const token of ['open-type="share"', 'createReport', 'goSharePoster']) {
  if (!detailSource.includes(token)) {
    errors.push(`pages/activity/detail.vue is missing release entry: ${token}`)
  }
}

const profileSource = read('pages/user/profile.vue')
if (!profileSource.includes('goOpsDashboard') || !profileSource.includes('hasOpsRole') || !profileSource.includes('canUseOps.value = hasOpsRole(user.value)')) {
  errors.push('pages/user/profile.vue must expose the guarded ops dashboard entry')
}
if (profileSource.includes('count: loggedIn.value ? 2 : 0') || profileSource.includes('靠谱、准时') || profileSource.includes('活动组织清晰')) {
  errors.push('pages/user/profile.vue must not ship hard-coded mock reviews')
}

const loginSource = read('pages/auth/login.vue')
if (!loginSource.includes('loginWithWeixin') || loginSource.includes('setMockLogin')) {
  errors.push('pages/auth/login.vue must use loginWithWeixin facade instead of direct mock login')
}
if (!loginSource.includes('SuWechatProfileSheet') || !loginSource.includes('profileSheetVisible')) {
  errors.push('pages/auth/login.vue must collect WeChat avatar and nickname after first login')
}

const authSource = read('common/api/auth.js')
for (const token of ['loginWithWeixin', 'persistUniIdSession', 'uni.login', 'uni-id-co', 'user-center', 'hasOpsRole']) {
  if (!authSource.includes(token)) {
    errors.push(`common/api/auth.js is missing release login bridge token: ${token}`)
  }
}
if (authSource.includes("|| '吴哈哈'") || authSource.includes("nickname: '吴哈哈'")) {
  errors.push('common/api/auth.js must not use 吴哈哈 as a release login fallback')
}

const userSource = read('common/api/user.js')
if (userSource.includes("|| '吴哈哈'") || userSource.includes("nickname: '吴哈哈'")) {
  errors.push('common/api/user.js must not use 吴哈哈 as a release login fallback')
}

const wechatProfileSheetSource = read('components/surego/SuWechatProfileSheet.vue')
for (const token of ['open-type="chooseAvatar"', '@chooseavatar', 'type="nickname"', 'uploadImageFile', 'syncCurrentUserProfile']) {
  if (!wechatProfileSheetSource.includes(token)) {
    errors.push(`SuWechatProfileSheet.vue is missing release profile capability: ${token}`)
  }
}

for (const token of ['listUsers', 'updateUserRoles', 'getRoleLabel', 'isAdminUser']) {
  if (!userSource.includes(token)) {
    errors.push(`common/api/user.js is missing release role helper: ${token}`)
  }
}

const opsDashboardSource = read('pages/ops/dashboard.vue')
if (!opsDashboardSource.includes('goOpsUsers')) {
  errors.push('pages/ops/dashboard.vue must link to user role management')
}

const manageDashboardSourceForLifecycle = read('pages/manage/dashboard.vue')
for (const token of ['getAllowedActivityStatusTransitions', 'availableLifecycleActions', 'handleLifecycleAction', 'state-summary']) {
  if (!manageDashboardSourceForLifecycle.includes(token)) {
    errors.push(`pages/manage/dashboard.vue must guard lifecycle actions with ${token}`)
  }
}
if (manageDashboardSourceForLifecycle.includes('v-for="item in lifecycleActions"') || manageDashboardSourceForLifecycle.includes('@tap="setActivityLifecycle(item.key)"')) {
  errors.push('pages/manage/dashboard.vue must not expose arbitrary lifecycle status selection')
}

const opsUsersSource = read('pages/ops/users.vue')
for (const token of ['listUsers', 'updateUserRoles', 'roleOptions', 'isAdminUser']) {
  if (!opsUsersSource.includes(token)) {
    errors.push(`pages/ops/users.vue is missing release user management token: ${token}`)
  }
}

const cloudSource = read('common/api/cloud.js')
for (const token of ['uni_id_token', 'uniIdToken', 'getCurrentUserId', 'handleSuregoCloudError', 'shouldUseCloudFallback', 'AUTH_ERROR_CODES', 'logout']) {
  if (!cloudSource.includes(token)) {
    errors.push(`common/api/cloud.js is missing release cloud auth token: ${token}`)
  }
}

const createSource = read('pages/activity/create.vue')
for (const token of ['uni.chooseLocation', 'latitude', 'longitude', 'chooseAndUploadImage']) {
  if (!createSource.includes(token)) {
    errors.push(`pages/activity/create.vue is missing operation capability: ${token}`)
  }
}
if (!createSource.includes('adjust-position="false"') || !createSource.includes('cursor-spacing="80"')) {
  errors.push('pages/activity/create.vue must include keyboard compatibility attributes')
}

for (const page of ['pages/activity/create.vue', 'pages/activity/edit.vue']) {
  const source = read(page)
  for (const token of ['unicloud-city-select', ':location="false"', 'hotCities', 'openCitySelector', 'handleCitySelect', 'inferCityFromLocation', 'syncCityFromLocation', 'form.cityCode', 'form.district']) {
    if (!source.includes(token)) {
      errors.push(`${page} must sync selected map location to activity city with ${token}`)
    }
  }
  if (source.includes('<picker :range="cityNames"') || source.includes('cityNames =') || source.includes('cityIndex')) {
    errors.push(`${page} must use unicloud-city-select instead of a fixed city picker`)
  }
}

const cityUtilSource = read('common/utils/city.js')
for (const token of ['CITY_OPTIONS', 'HOT_CITY_OPTIONS', 'DEFAULT_CITY_CODE', 'normalizeCityName', 'inferCityFromLocation', 'inferDistrictFromLocation', 'stripAdministrativeSuffix']) {
  if (!cityUtilSource.includes(token)) {
    errors.push(`common/utils/city.js is missing release city helper token: ${token}`)
  }
}
for (const city of ['广州', '深圳', '成都', '重庆', '武汉', '西安', '苏州', '长沙']) {
  if (!cityUtilSource.includes(city)) {
    errors.push(`common/utils/city.js must include expanded release hot city: ${city}`)
  }
}

const coverPresetSource = read('common/utils/cover-presets.js')
for (const token of ['COVER_PRESETS', 'COVER_CATEGORIES', 'getDefaultCoverPreset', 'listCoverPresets', 'pickRandomCoverPreset', 'isPresetCover']) {
  if (!coverPresetSource.includes(token)) {
    errors.push(`common/utils/cover-presets.js is missing release cover preset token: ${token}`)
  }
}

for (const page of ['pages/activity/create.vue', 'pages/activity/edit.vue']) {
  const source = read(page)
  for (const token of ['showCoverPicker', 'coverPresets', 'listCoverPresets', 'pickRandomCoverPreset', 'uploadCoverFromAlbum', 'isPresetCover', 'handleCoverImageError']) {
    if (!source.includes(token)) {
      errors.push(`${page} must use the release cover picker token: ${token}`)
    }
  }
  if (source.includes("image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622")) {
    errors.push(`${page} must not ship a single hard-coded default cover image`)
  }
  if (source.includes('tempFilePaths[0]')) {
    errors.push(`${page} must upload custom covers through common/api/upload.js`)
  }
}

const homeSource = read('pages/home/index.vue')
for (const token of ['getMiniProgramNavContentStyle', 'contentTopStyle', 'position: fixed', 'backdrop-filter: blur']) {
  if (!homeSource.includes(token)) {
    errors.push(`pages/home/index.vue must use release floating header token: ${token}`)
  }
}
for (const token of ['isHomeVisibleMyActivity', 'sortActivitiesByStatusPriority']) {
  if (!homeSource.includes(token)) {
    errors.push(`pages/home/index.vue must filter terminal my-activity cards with ${token}`)
  }
}

const activityDetailSource = read('pages/activity/detail.vue')
for (const token of ['uni.openLocation', 'onShareTimeline', 'listActivityMembers', 'getMiniProgramNavStyle', 'getMiniProgramNavRowStyle']) {
  if (!activityDetailSource.includes(token)) {
    errors.push(`pages/activity/detail.vue is missing operation capability: ${token}`)
  }
}
for (const token of ['getActivityStatusMeta', 'isTerminalActivity']) {
  if (!activityDetailSource.includes(token)) {
    errors.push(`pages/activity/detail.vue must guard terminal activity actions with ${token}`)
  }
}

const activitySource = read('common/api/activity.js')
for (const token of ['isCurrentUserActivityCreator', 'applicationStatus', 'isPubliclyVisibleActivity', 'PUBLIC_ACTIVITY_MODERATION_STATUSES', "'surego-activity', 'listMine'"]) {
  if (!activitySource.includes(token)) {
    errors.push(`common/api/activity.js is missing ownership release token: ${token}`)
  }
}
for (const token of ['getActivityStatusMeta', 'sortActivitiesByStatusPriority', 'isHomeVisibleMyActivity', 'ACTIVITY_STATUS_FILTERS', 'filterActivitiesByStatusGroup']) {
  if (!activitySource.includes(token)) {
    errors.push(`common/api/activity.js is missing release activity status helper: ${token}`)
  }
}
for (const token of ["status: normalizeActivityStatus(form.status || 'reviewing')", "moderationStatus: 'pending'", "moderation_status: 'pending'"]) {
  if (!activitySource.includes(token)) {
    errors.push(`common/api/activity.js must create activities in review state: ${token}`)
  }
}
if (activitySource.includes('isCreator: form.isCreator') || activitySource.includes('item.isCreator)')) {
  errors.push('common/api/activity.js must not trust stored isCreator in release mode')
}

const profileActivitySource = read('pages/user/profile.vue')
for (const token of ['ACTIVITY_STATUS_FILTERS', 'filteredActivityList', 'getActivityStatusMeta', 'profile-card__status']) {
  if (!profileActivitySource.includes(token)) {
    errors.push(`pages/user/profile.vue must render release activity categories/status badge: ${token}`)
  }
}

const myActivitiesSource = read('pages/my/activities.vue')
for (const token of ['getActivityStatusMeta', 'sortActivitiesByStatusPriority', 'activity__status']) {
  if (!myActivitiesSource.includes(token)) {
    errors.push(`pages/my/activities.vue must render release activity status badge: ${token}`)
  }
}

const participantSource = read('pages/participant/dashboard.vue')
for (const token of ['getActivityStatusMeta', 'isTerminalActivity', 'goParticipantDashboard']) {
  if (!participantSource.includes(token)) {
    errors.push(`pages/participant/dashboard.vue must guard release terminal activity state: ${token}`)
  }
}

const homeSourceForParticipantEntry = read('pages/home/index.vue')
for (const token of ['openUserActivity', 'goParticipantDashboard', '...myGroups.value.pending']) {
  if (!homeSourceForParticipantEntry.includes(token)) {
    errors.push(`pages/home/index.vue must route applied/joined activities through participant dashboard with ${token}`)
  }
}

const manageSourceForReviewScroll = read('pages/manage/dashboard.vue')
for (const token of ['scrollTop', ':scroll-top="scrollTop"', 'scroll-with-animation']) {
  if (!manageSourceForReviewScroll.includes(token)) {
    errors.push(`pages/manage/dashboard.vue must use stable review section scrolling token ${token}`)
  }
}

const messageSource = read('common/api/message.js')
for (const staleToken of ['defaultMessages', 'getSeedMessages', 'msg_default']) {
  if (messageSource.includes(staleToken)) {
    errors.push(`common/api/message.js must not ship seeded mock messages: ${staleToken}`)
  }
}
if (!messageSource.includes('filter((item) => isCurrentUserMessage(item, userId))')) {
  errors.push('common/api/message.js must scope local messages to the current user')
}

const appMessageSource = read('common/api/application.js')
for (const token of ['notifyApplicationSubmitted', 'notifyApplicationReviewed', 'createMessage']) {
  if (!appMessageSource.includes(token)) {
    errors.push(`common/api/application.js must emit application lifecycle messages via ${token}`)
  }
}
for (const token of ['getApplicationForActivity', 'getMineByActivity', 'writeApplicationCache', 'adjustLocalActivityParticipantCount']) {
  if (!appMessageSource.includes(token)) {
    errors.push(`common/api/application.js must guard duplicate applications/member count with ${token}`)
  }
}

const memberApiSource = read('common/api/member.js')
for (const token of ['fallbackName', 'applicantName', 'applicantAvatar', "role: '参与者'"]) {
  if (!memberApiSource.includes(token)) {
    errors.push(`common/api/member.js must avoid generic applicant placeholders with ${token}`)
  }
}

const orderMessageSource = read('common/api/order.js')
if (!orderMessageSource.includes('notifyOrderStatus') || !orderMessageSource.includes('createMessage')) {
  errors.push('common/api/order.js must emit order status messages')
}

const checkinMessageSource = read('common/api/checkin.js')
if (!checkinMessageSource.includes('notifyCheckinConfirmed') || !checkinMessageSource.includes('createMessage')) {
  errors.push('common/api/checkin.js must emit checkin status messages')
}

const uploadSource = read('common/api/upload.js')
for (const token of ['USER_CANCEL_IMAGE_PICKER', 'isImagePickerCancel']) {
  if (!uploadSource.includes(token)) {
    errors.push(`common/api/upload.js is missing picker cancellation token: ${token}`)
  }
}

const locationSource = read('common/api/location.js')
for (const token of ['getCurrentLocation', 'refreshCurrentLocation', 'getStoredLocation', 'uni.getLocation', 'sortActivitiesByDistance']) {
  if (!locationSource.includes(token)) {
    errors.push(`common/api/location.js is missing release location token: ${token}`)
  }
}

const navRouteSource = read('common/utils/route.js')
for (const token of ['getMiniProgramNavMetrics', 'getWindowInfo', 'getMenuButtonBoundingClientRect', 'getMiniProgramNavStyle', 'getMiniProgramNavRowStyle', 'getMiniProgramNavActionsStyle', 'getMiniProgramNavContentStyle', 'boxSizing', 'rightReserveRpx', 'maxWidth']) {
  if (!navRouteSource.includes(token)) {
    errors.push(`common/utils/route.js is missing release mini-program capsule token: ${token}`)
  }
}

for (const page of [
  'pages/home/index.vue',
  'pages/discover/index.vue',
  'pages/discover/search.vue',
  'pages/discover/city.vue',
  'pages/calendar/index.vue',
  'pages/activity/detail.vue',
  'pages/activity/register.vue',
  'pages/activity/create.vue',
  'pages/activity/edit.vue',
  'pages/activity/members.vue',
  'pages/manage/dashboard.vue',
  'pages/manage/checkin.vue',
  'pages/messages/index.vue',
  'pages/my/activities.vue',
  'pages/order/detail.vue',
  'pages/payment/index.vue',
  'pages/participant/dashboard.vue',
  'pages/share/poster.vue',
  'pages/status/success.vue',
  'pages/user/profile.vue',
  'pages/user/edit.vue',
  'pages/auth/login.vue',
  'pages/ops/dashboard.vue',
  'pages/ops/reports.vue',
  'pages/ops/users.vue'
]) {
  const source = read(page)
  for (const token of ['getMiniProgramNavStyle', 'getMiniProgramNavRowStyle']) {
    if (!source.includes(token)) {
      errors.push(`${page} must avoid the WeChat capsule with ${token}`)
    }
  }
  if (source.includes('topSafeStyle') || source.includes('getCapsuleSafeAreaStyle')) {
    errors.push(`${page} must not rely on padding-only capsule safe-area helpers`)
  }
  if (source.includes('height: 132rpx')) {
    errors.push(`${page} must not hard-code custom nav height in release mode`)
  }
  for (const fixedToken of ['padding: 58rpx', 'height: calc(100vh - 154rpx)', 'height: calc(100vh - 158rpx)', 'height: calc(100vh - 280rpx)']) {
    if (source.includes(fixedToken)) {
      errors.push(`${page} must not use fixed custom nav spacing token: ${fixedToken}`)
    }
  }
}

for (const page of ['pages/home/index.vue', 'pages/discover/index.vue']) {
  const source = read(page)
  for (const token of ['currentAvatar', 'getCurrentUserProfile', 'isSuregoProfileComplete', '/static/userImg/user.png']) {
    if (!source.includes(token)) {
      errors.push(`${page} must render the logged-in SureGo profile avatar with ${token}`)
    }
  }
  for (const staleToken of ['api.dicebear.com', 'avataaars', 'DiceBear']) {
    if (source.includes(staleToken)) {
      errors.push(`${page} must not hard-code DiceBear avatars in the release top nav`)
    }
  }
}

const registerSource = read('pages/activity/register.vue')
for (const token of ['validateJoinEligibility', 'adjust-position="false"', 'cursor-spacing', 'register__scroll', 'disable-default-padding="true"']) {
  if (!registerSource.includes(token)) {
    errors.push(`pages/activity/register.vue is missing release join/keyboard token: ${token}`)
  }
}
if (registerSource.includes('overflow: hidden;')) {
  errors.push('pages/activity/register.vue must not hide overflow around keyboard form content')
}

const manageSource = read('pages/manage/dashboard.vue')
if (!manageSource.includes('ensureOwnerAccess') || !manageSource.includes('goActivityDetail')) {
  errors.push('pages/manage/dashboard.vue must guard owner-only access')
}
if (manageSource.includes('@tap="goActivityDetail(activity.id)"')) {
  errors.push('pages/manage/dashboard.vue back arrow must use goBackOrFallback/handleBack instead of pushing activity detail')
}

const checkinSource = read('pages/manage/checkin.vue')
if (!checkinSource.includes('ensureOwnerAccess')) {
  errors.push('pages/manage/checkin.vue must guard owner-only access')
}
if (checkinSource.includes('@tap="goManageDashboard(activity.id)"')) {
  errors.push('pages/manage/checkin.vue back arrow must use goBackOrFallback/handleBack instead of pushing manage dashboard')
}

for (const file of ['pages/ops/users.vue', 'pages/ops/reports.vue']) {
  const source = read(file)
  if (!source.includes('goBackOrFallback') || !source.includes('/pages/ops/dashboard')) {
    errors.push(`${file} back arrow must use goBackOrFallback('/pages/ops/dashboard')`)
  }
  if (source.includes('@tap="goOpsDashboard"') || source.includes('@tap="goOpsDashboard()"')) {
    errors.push(`${file} back arrow must not push a new ops dashboard page`)
  }
}

const editActivitySource = read('pages/activity/edit.vue')
if (!editActivitySource.includes('ensureOwnerAccess')) {
  errors.push('pages/activity/edit.vue must guard owner-only access')
}
if (!editActivitySource.includes('adjust-position="false"') || !editActivitySource.includes('cursor-spacing="80"')) {
  errors.push('pages/activity/edit.vue must include keyboard compatibility attributes')
}

for (const file of activityFormPages) {
  const source = read(file)
  const tags = getNativeFormControlTags(source)
  if (tags.length === 0) {
    errors.push(`${file} must contain native input/textarea controls`)
  }
  for (const tag of tags) {
    for (const token of requiredKeyboardAttributes) {
      if (!tag.includes(token)) {
        errors.push(`${file} native form control is missing ${token}: ${tag}`)
      }
    }
  }
  if (source.includes('always-embed="true"')) {
    errors.push(`${file} must not use always-embed on activity form inputs`)
  }
  if (source.includes('auto-height')) {
    errors.push(`${file} must not use auto-height on activity form textareas`)
  }
  if (source.includes('line-height: 82rpx')) {
    errors.push(`${file} must not vertically position input text with line-height: 82rpx`)
  }
}

const searchSource = read('pages/discover/search.vue')
if (searchSource.includes('\n            focus')) {
  errors.push('pages/discover/search.vue must not autofocus the input on page entry')
}

for (const file of ['pages/manage/dashboard.vue', 'pages/ops/reports.vue']) {
  const source = read(file)
  if (!source.includes('fixed="true"')) {
    errors.push(`${file} bottom sheet textarea must set fixed="true"`)
  }
}

const discoverSource = read('pages/discover/index.vue')
for (const token of ['CITY_CODE_KEY', 'selectedCityCode', 'listActivitiesByCity']) {
  if (!discoverSource.includes(token)) {
    errors.push(`pages/discover/index.vue is missing release manual-city token: ${token}`)
  }
}
if (discoverSource.includes('@/common/api/location.js') || discoverSource.includes('refreshCurrentLocation') || discoverSource.includes('sortActivitiesByDistance')) {
  errors.push('pages/discover/index.vue must not auto-refresh location in manual city mode')
}

const citySource = read('pages/discover/city.vue')
for (const token of ['unicloud-city-select', ':location="false"', 'surego_selected_city_code', 'openCitySelector', 'handlePluginSelect']) {
  if (!citySource.includes(token)) {
    errors.push(`pages/discover/city.vue is missing release city-select token: ${token}`)
  }
}
if (citySource.includes('refreshCurrentLocation') || citySource.includes("selectCity('杭州')")) {
  errors.push('pages/discover/city.vue must use manual unicloud-city-select instead of hard-coded or automatic location')
}

const checkinDeskSource = read('pages/manage/checkin.vue')
for (const token of ['uni.scanCode', 'listActivityMembers', 'confirmNextByScan']) {
  if (!checkinDeskSource.includes(token)) {
    errors.push(`pages/manage/checkin.vue is missing operation capability: ${token}`)
  }
}

for (const name of requiredCloudFunctions) {
  const source = read(`uniCloud-aliyun/cloudfunctions/${name}/index.js`)
  if (source.includes("|| 'mock_user'") || source.includes('|| "mock_user"')) {
    errors.push(`${name} must not default cloud writes to mock_user`)
  }
  if (!source.includes('resolveUserContext')) {
    errors.push(`${name} must include resolveUserContext auth helper`)
  }
  for (const token of ['uni-id-users', 'findUniIdUser', 'isTokenOwnedByUser', 'uniIdToken', 'exists']) {
    if (!source.includes(token)) {
      errors.push(`${name} must validate the current uid against uni-id-users before release operations`)
      break
    }
  }
  if (source.includes('event.roles || payload.roles')) {
    errors.push(`${name} must not trust frontend-provided roles for release permissions`)
  }
  if (!source.includes('!user.exists')) {
    errors.push(`${name} must reject deleted/stale uni-id users with !user.exists`)
  }
  if (name === 'surego-activity' && source.includes('isCreator')) {
    errors.push('surego-activity must not persist or return client-provided isCreator')
  }
}

const userCloudSource = read('uniCloud-aliyun/cloudfunctions/surego-user/index.js')
for (const token of ['ensureDefaultRole', "action === 'listUsers'", "action === 'updateUserRoles'", 'uni-id-users', 'role_updated_at', 'role_updated_by', 'LAST_ADMIN_REQUIRED']) {
  if (!userCloudSource.includes(token)) {
    errors.push(`surego-user cloud function is missing release role token: ${token}`)
  }
}
if (userCloudSource.includes('if (!user) return [DEFAULT_ROLE]')) {
  errors.push('surego-user must not silently grant default user role when uni-id user has been deleted')
}

const rolesInitSource = read('uniCloud-aliyun/database/uni-id-roles.init_data.json')
for (const role of ['"role_id": "user"', '"role_id": "operator"', '"role_id": "admin"']) {
  if (!rolesInitSource.includes(role)) {
    errors.push(`uni-id-roles.init_data.json is missing release role: ${role}`)
  }
}

const posterSource = read('pages/share/poster.vue')
for (const token of ['canvas-id="posterCanvas"', 'uni.saveImageToPhotosAlbum', 'open-type="share"']) {
  if (!posterSource.includes(token)) {
    errors.push(`pages/share/poster.vue is missing release poster capability: ${token}`)
  }
}
if (posterSource.includes('@tap="goActivityDetail(activity.id)"')) {
  errors.push('pages/share/poster.vue back arrow must use goBackOrFallback/handleBack instead of pushing activity detail')
}

const paymentSource = read('pages/payment/index.vue')
if (!paymentSource.includes('goParticipantDashboard(activity.value.id, { replace: true })')) {
  errors.push('pages/payment/index.vue must replace payment with participant dashboard after paid/payment success')
}

const orderDetailSourceForStack = read('pages/order/detail.vue')
if (!orderDetailSourceForStack.includes('goPayment({ activityId: order.activityId, type: order.type, amount: order.amount }, { replace: true })')) {
  errors.push('pages/order/detail.vue must replace order detail when continuing to payment')
}
if (!orderDetailSourceForStack.includes('goParticipantDashboard(order.activityId, { replace: true })')) {
  errors.push('pages/order/detail.vue must replace order detail when opening participant credential from paid order')
}

const successSource = read('pages/status/success.vue')
if (!successSource.includes('goHomeRoot')) {
  errors.push('pages/status/success.vue must use goHomeRoot for the home action')
}
if (!successSource.includes('活动已提交审核')) {
  errors.push('pages/status/success.vue must tell creators the new activity is under review')
}
if (!successSource.includes('goActivityDetail(activity.id, { replace: true })')) {
  errors.push('pages/status/success.vue terminal activity-detail actions must use replace navigation')
}

const activityCloudSource = read('uniCloud-aliyun/cloudfunctions/surego-activity/index.js')
for (const token of ["action === 'listMine'", 'isPubliclyVisibleActivity', "status: 'reviewing'", "activity.moderation_status = 'pending'"]) {
  if (!activityCloudSource.includes(token)) {
    errors.push(`surego-activity must enforce review-gated visibility: ${token}`)
  }
}
for (const token of ['creatorStatusTransitions', 'canTransitionStatus', 'INVALID_TRANSITION']) {
  if (!activityCloudSource.includes(token)) {
    errors.push(`surego-activity must guard creator lifecycle transitions with ${token}`)
  }
}

const applicationCloudSource = read('uniCloud-aliyun/cloudfunctions/surego-application/index.js')
for (const token of ["action === 'getMineByActivity'", 'getExistingApplication', 'dbCmd.inc(1)', 'Creator cannot apply to own activity']) {
  if (!applicationCloudSource.includes(token)) {
    errors.push(`surego-application must guard duplicate applications/member count with ${token}`)
  }
}

const messageCloudSource = read('uniCloud-aliyun/cloudfunctions/surego-message/index.js')
for (const token of ['event_key', 'eventKey', 'record.event_key']) {
  if (!messageCloudSource.includes(token)) {
    errors.push(`surego-message must support idempotent event keys with ${token}`)
  }
}

const messageApiSource = read('common/api/message.js')
if (!messageApiSource.includes('eventKey') || !messageApiSource.includes('existing')) {
  errors.push('common/api/message.js must dedupe local messages by eventKey')
}

const moderationSource = read('common/api/moderation.js')
for (const token of ['getModerationEventType', 'restored', 'previousModerationStatus', 'report:handled']) {
  if (!moderationSource.includes(token)) {
    errors.push(`common/api/moderation.js must guard release moderation notifications with ${token}`)
  }
}

const citySelectPluginPageSource = read('uni_modules/unicloud-city-select/pages/uni-city-list/uni-city-list.vue')
for (const token of ['confirm-type="search"', ':adjust-position="false"', 'height: 40px', 'line-height: 40px']) {
  if (!citySelectPluginPageSource.includes(token)) {
    errors.push(`unicloud-city-select city list page must keep readable release search input token: ${token}`)
  }
}

const moderationCloudSourceForReview = read('uniCloud-aliyun/cloudfunctions/surego-moderation/index.js')
if (!moderationCloudSourceForReview.includes("...(moderationStatus === 'approved' ? { status: 'recruiting' } : {})")) {
  errors.push('surego-moderation must move approved activities into recruiting status')
}

if (errors.length > 0) {
  console.error(errors.join('\n'))
  process.exit(1)
}

console.log('SureGo release readiness check passed.')
