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
  for (const pattern of bannedPatterns) {
    if (pattern.test(source)) {
      errors.push(`${page}.vue contains banned pattern: ${pattern}`)
    }
  }
}

const routeSource = read('common/utils/route.js')
for (const helper of ['goActivityCreate', 'goActivityRegister', 'goManageDashboard', 'goManageCheckin', 'goOpsDashboard', 'goOpsReports', 'goOpsUsers', 'goSharePoster', 'goOrderDetail']) {
  if (!routeSource.includes(helper)) {
    errors.push(`common/utils/route.js is missing release helper: ${helper}`)
  }
}

const detailSource = read('pages/activity/detail.vue')
for (const token of ['open-type="share"', 'createReport', 'goSharePoster']) {
  if (!detailSource.includes(token)) {
    errors.push(`pages/activity/detail.vue is missing release entry: ${token}`)
  }
}

const profileSource = read('pages/user/profile.vue')
if (!profileSource.includes('goOpsDashboard') || !profileSource.includes('isOpsUser')) {
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
for (const token of ['loginWithWeixin', 'persistUniIdSession', 'uni.login', 'uni-id-co', 'user-center']) {
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
if (!createSource.includes('adjust-position="false"') || !createSource.includes('cursor-spacing')) {
  errors.push('pages/activity/create.vue must include keyboard compatibility attributes')
}

const activityDetailSource = read('pages/activity/detail.vue')
for (const token of ['uni.openLocation', 'onShareTimeline', 'listActivityMembers', 'getMiniProgramNavStyle', 'getMiniProgramNavRowStyle']) {
  if (!activityDetailSource.includes(token)) {
    errors.push(`pages/activity/detail.vue is missing operation capability: ${token}`)
  }
}

const activitySource = read('common/api/activity.js')
for (const token of ['isCurrentUserActivityCreator', 'applicationStatus']) {
  if (!activitySource.includes(token)) {
    errors.push(`common/api/activity.js is missing ownership release token: ${token}`)
  }
}
if (activitySource.includes('isCreator: form.isCreator') || activitySource.includes('item.isCreator)')) {
  errors.push('common/api/activity.js must not trust stored isCreator in release mode')
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
for (const token of ['getMiniProgramNavMetrics', 'getWindowInfo', 'getMenuButtonBoundingClientRect', 'getMiniProgramNavStyle', 'getMiniProgramNavRowStyle', 'getMiniProgramNavActionsStyle']) {
  if (!navRouteSource.includes(token)) {
    errors.push(`common/utils/route.js is missing release mini-program capsule token: ${token}`)
  }
}

for (const page of ['pages/home/index.vue', 'pages/discover/index.vue', 'pages/activity/detail.vue', 'pages/manage/dashboard.vue', 'pages/manage/checkin.vue', 'pages/participant/dashboard.vue', 'pages/order/detail.vue', 'pages/share/poster.vue', 'pages/messages/index.vue']) {
  const source = read(page)
  for (const token of ['getMiniProgramNavStyle', 'getMiniProgramNavRowStyle']) {
    if (!source.includes(token)) {
      errors.push(`${page} must avoid the WeChat capsule with ${token}`)
    }
  }
  if (source.includes('topSafeStyle') || source.includes('getCapsuleSafeAreaStyle')) {
    errors.push(`${page} must not rely on padding-only capsule safe-area helpers`)
  }
  if (source.includes('height: 132rpx') || source.includes('height: 136rpx')) {
    errors.push(`${page} must not hard-code custom nav height in release mode`)
  }
}

const registerSource = read('pages/activity/register.vue')
for (const token of ['validateJoinEligibility', 'adjust-position="false"', 'cursor-spacing']) {
  if (!registerSource.includes(token)) {
    errors.push(`pages/activity/register.vue is missing release join/keyboard token: ${token}`)
  }
}

const manageSource = read('pages/manage/dashboard.vue')
if (!manageSource.includes('ensureOwnerAccess') || !manageSource.includes('goActivityDetail')) {
  errors.push('pages/manage/dashboard.vue must guard owner-only access')
}

const checkinSource = read('pages/manage/checkin.vue')
if (!checkinSource.includes('ensureOwnerAccess')) {
  errors.push('pages/manage/checkin.vue must guard owner-only access')
}

const editActivitySource = read('pages/activity/edit.vue')
if (!editActivitySource.includes('ensureOwnerAccess')) {
  errors.push('pages/activity/edit.vue must guard owner-only access')
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

if (errors.length > 0) {
  console.error(errors.join('\n'))
  process.exit(1)
}

console.log('SureGo release readiness check passed.')
