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
  'common/api/member.js',
  'common/api/moderation.js'
]

const requiredComponents = [
  'components/surego/SuWechatProfileSheet.vue'
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

for (const route of staleDemoRoutes) {
  if (pagePathSet.has(route)) {
    errors.push(`pages.json must not register demo route: ${route}`)
  }
}

for (const route of pagePaths) {
  if (!businessPages.includes(route)) {
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
  if (apiFile !== 'common/api/upload.js' && (!source.includes('USE_UNICLOUD') || !source.includes('callSuregoFunction'))) {
    errors.push(`${apiFile} must keep mock/uniCloud facade mode`)
  }
  if (apiFile !== 'common/api/upload.js' && !source.includes('@/common/api/auth.js')) {
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
for (const token of ['uni_id_token', 'uniIdToken', 'getCurrentUserId', 'handleSuregoCloudError', 'shouldUseCloudFallback']) {
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

const activityDetailSource = read('pages/activity/detail.vue')
for (const token of ['uni.openLocation', 'onShareTimeline', 'listActivityMembers']) {
  if (!activityDetailSource.includes(token)) {
    errors.push(`pages/activity/detail.vue is missing operation capability: ${token}`)
  }
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
}

const userCloudSource = read('uniCloud-aliyun/cloudfunctions/surego-user/index.js')
for (const token of ['ensureDefaultRole', "action === 'listUsers'", "action === 'updateUserRoles'", 'uni-id-users', 'role_updated_at', 'role_updated_by', 'LAST_ADMIN_REQUIRED']) {
  if (!userCloudSource.includes(token)) {
    errors.push(`surego-user cloud function is missing release role token: ${token}`)
  }
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
