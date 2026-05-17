import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(process.cwd())

const businessPages = [
  'pages/home/index',
  'pages/discover/index',
  'pages/discover/search',
  'pages/discover/city',
  'pages/calendar/index',
  'pages/graduation/index',
  'pages/hackathon/index',
  'pages/hackathon/team',
  'pages/verify/index',
  'pages/partners/index',
  'pages/partner/detail',
  'pages/partner/create',
  'pages/partner/workbench',
  'pages/partner/conversation',
  'pages/publish/index',
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
  'pages/user/detail',
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
  'common/api/partner.js',
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

const requiredOpsFiles = [
  'docs/surego-cloud-trial-deployment.md',
  'scripts/surego-deployment-scope-check.mjs'
]

const requiredComponents = [
  'components/surego/SuWechatProfileSheet.vue',
  'uni_modules/unicloud-city-select/components/unicloud-city-select/unicloud-city-select.vue'
]

const requiredCloudFunctions = [
  'surego-activity',
  'surego-partner',
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
const mojibakePattern = /[\u93bc\u934f\u9366\u7ead\u93cd\u9353\u8e47\u5bf0\u6fb6\u9422\u6dc7\u7487\u95c2\u95b8\u95bb\u9420\u5a62\u7035\u5bb8\u97eb\u59a4\u6fde\u5a32\u59e9\u70ac\u60e7\u57d7\u9352\u55e4\u60b3\u7ef1\u2540\u7d91\u935a\u5d89\ue582]/
const questionRun = String.fromCharCode(63, 63, 63)
const replacementChar = String.fromCharCode(0xfffd)

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

function assertNoMojibake(relativePath, source) {
  const lines = source.split(/\r?\n/)
  lines.forEach((line, index) => {
    if (mojibakePattern.test(line) || line.includes(questionRun) || line.includes(replacementChar)) {
      errors.push(`${relativePath}:${index + 1} contains likely mojibake text`)
    }
  })
}

const pagesConfig = readJson('pages.json')
const pagePaths = (pagesConfig.pages || []).map((item) => item.path)
const pagePathSet = new Set(pagePaths)

if (pagePaths[0] !== 'pages/partners/index') {
  errors.push('pages.json first route must be pages/partners/index')
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
for (const token of ['ALLOW_MOCK_FALLBACK', 'TRIAL_STRICT_CLOUD_AUTH', 'APP_MODE', 'isTrialMode', 'isTrialStrictCloudAuthMode', 'shouldUseCloudFallback']) {
  if (!runtimeSource.includes(token)) {
    errors.push(`common/config/runtime.js is missing operation runtime token: ${token}`)
  }
}
if (!runtimeSource.includes('!isTrialStrictCloudAuthMode()')) {
  errors.push('common/config/runtime.js must disable local mock fallback when strict trial cloud auth is enabled')
}

const activitySchema = readJson('uniCloud-aliyun/database/surego-activities.schema.json')
for (const field of ['visibility', 'source', 'source_partner_post_id', 'invited_user_ids', 'source_partner_intent_ids']) {
  if (!activitySchema.properties?.[field]) {
    errors.push(`surego-activities schema is missing ${field}`)
  }
}

const requiredSeedDataFiles = [
  'uniCloud-aliyun/database/surego-activities.init_data.json',
  'uniCloud-aliyun/database/surego-partner-posts.init_data.json',
  'uniCloud-aliyun/database/surego-users.init_data.json'
]

for (const seedFile of requiredSeedDataFiles) {
  const items = readJson(seedFile)
  if (!Array.isArray(items) || items.length === 0) {
    errors.push(`${seedFile} must contain non-empty seed data for cloud trial mode`)
    continue
  }
  if (JSON.stringify(items).includes('"mock_user"')) {
    errors.push(`${seedFile} must map reference mock_user records to stable cloud seed users`)
  }
}

const seedUsers = readJson('uniCloud-aliyun/database/surego-users.init_data.json')
if (Array.isArray(seedUsers) && !seedUsers.some((item) => item.user_id === 'seed_owner_wu')) {
  errors.push('surego-users.init_data.json must include seed_owner_wu for migrated reference-owner records')
}

const partnerSeedItems = readJson('uniCloud-aliyun/database/surego-partner-posts.init_data.json')
if (Array.isArray(partnerSeedItems)) {
  for (const id of ['hackathon-ai-front', 'surego-labs', 'campus-ai', 'creator-map']) {
    const item = partnerSeedItems.find((entry) => entry._id === id || entry.id === id)
    if (!item || item.topic_key !== 'hackathon') {
      errors.push(`surego-partner-posts.init_data.json must mark ${id} with topic_key=hackathon`)
    }
  }
}

const requiredIndexFiles = [
  'uniCloud-aliyun/database/surego-activities.index.json',
  'uniCloud-aliyun/database/surego-applications.index.json',
  'uniCloud-aliyun/database/surego-orders.index.json',
  'uniCloud-aliyun/database/surego-partner-posts.index.json',
  'uniCloud-aliyun/database/surego-partner-intents.index.json',
  'uniCloud-aliyun/database/surego-follows.index.json',
  'uniCloud-aliyun/database/surego-conversations.index.json',
  'uniCloud-aliyun/database/surego-checkins.index.json',
  'uniCloud-aliyun/database/surego-reports.index.json',
  'uniCloud-aliyun/database/surego-audit-logs.index.json',
  'uniCloud-aliyun/database/surego-users.index.json'
]

for (const indexFile of requiredIndexFiles) {
  const indexes = readJson(indexFile)
  if (!Array.isArray(indexes) || indexes.length === 0) {
    errors.push(`${indexFile} must contain indexes for cloud trial query paths`)
  }
}

if (fs.existsSync(path.join(root, 'common/js/vconsole.min.js'))) {
  errors.push('common/js/vconsole.min.js must not be included in the trial release package')
}

for (const apiFile of requiredApiFiles) {
  const source = read(apiFile)
  assertNoMojibake(apiFile, source)
  const isLocalPlatformFacade = apiFile === 'common/api/upload.js' || apiFile === 'common/api/location.js'
  if (!isLocalPlatformFacade && (!source.includes('USE_UNICLOUD') || !source.includes('callSuregoFunction'))) {
    errors.push(`${apiFile} must keep mock/uniCloud facade mode`)
  }
  if (!isLocalPlatformFacade && !source.includes('@/common/api/auth.js')) {
    errors.push(`${apiFile} must use the auth facade`)
  }
}

for (const utilityFile of requiredUtilityFiles) {
  assertNoMojibake(utilityFile, read(utilityFile))
}

for (const opsFile of requiredOpsFiles) {
  assertNoMojibake(opsFile, read(opsFile))
}

for (const component of requiredComponents) {
  assertNoMojibake(component, read(component))
}

for (const name of requiredCloudFunctions) {
  const source = read(`uniCloud-aliyun/cloudfunctions/${name}/index.js`)
  if (!source.includes('code: 0') || !source.includes('data:')) {
    errors.push(`${name} must return { code: 0, data } on successful actions`)
  }
}

for (const page of businessPages) {
  const source = read(`${page}.vue`)
  assertNoMojibake(`${page}.vue`, source)
  const corruptedTag = source.match(/\?\/(?:text|view|button|scroll-view|template)>/)
  if (corruptedTag) {
    errors.push(`${page}.vue contains a corrupted template closing tag: ${corruptedTag[0]}`)
  }
  const interpolationPattern = /{{([\s\S]*?)}}/g
  let interpolationMatch
  while ((interpolationMatch = interpolationPattern.exec(source))) {
    const expression = interpolationMatch[1].trim()
    try {
      new Function(`return (${expression})`)
    } catch (error) {
      errors.push(`${page}.vue has invalid template expression "${expression}": ${error.message}`)
    }
  }
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
for (const helper of ['goBackOrFallback', 'goHomeRoot', 'goDiscoverRoot', 'goPartnersRoot', 'goPublishCenter', 'goPartnerDetail', 'goPartnerCreate', 'goPartnerWorkbench', 'goPartnerConversation']) {
  if (!routeSource.includes(helper)) {
    errors.push(`common/utils/route.js is missing stack navigation helper: ${helper}`)
  }
}

const dockSource = read('components/surego/SuBottomDock.vue')
for (const helper of ['goHomeRoot', 'goPartnersRoot', 'goMessages', 'goUserProfile', 'goPartnerCreate', 'goActivityCreate']) {
  if (!dockSource.includes(helper)) {
    errors.push(`SuBottomDock.vue must use root navigation helper: ${helper}`)
  }
}
for (const token of ['showPublishSheet', '发布搭子', '发布活动', 'publish-sheet__panel']) {
  if (!dockSource.includes(token)) {
    errors.push(`SuBottomDock.vue must expose publish sheet token: ${token}`)
  }
}
if (dockSource.includes('goPublishCenter')) {
  errors.push('SuBottomDock.vue must open the publish sheet instead of navigating to goPublishCenter')
}
for (const navKey of ["key: 'home'", "key: 'partners'", "key: 'publish'", "key: 'messages'", "key: 'profile'"]) {
  if (!dockSource.includes(navKey)) {
    errors.push(`SuBottomDock.vue must render dual-entry nav item ${navKey}`)
  }
}
if (!dockSource.includes("label: '搭子'")) {
  errors.push("SuBottomDock.vue must use '搭子' as the partner tab label")
}
if (dockSource.includes("label: '找搭子'")) {
  errors.push("SuBottomDock.vue must not render the stale '找搭子' tab label")
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
for (const token of ['priority-row', 'priority-row__content', 'priority-row__primary', 'priority-row__secondary']) {
  if (!detailSource.includes(token)) {
    errors.push(`pages/activity/detail.vue must use explicit flex priority rows to avoid narrow vertical text: ${token}`)
  }
}
if (detailSource.includes('.priority { display: grid') || detailSource.includes('grid-template-columns: 34rpx 1fr')) {
  errors.push('pages/activity/detail.vue priority summary must not rely on mini-program grid layout')
}

const profileSource = read('pages/user/profile.vue')
if (!profileSource.includes('goOpsDashboard') || !profileSource.includes('hasOpsRole') || !profileSource.includes('canUseOps.value = hasOpsRole(user.value)')) {
  errors.push('pages/user/profile.vue must expose the guarded ops dashboard entry')
}
for (const token of ['postedPartnerPosts', 'activeActivityScope', 'activePartnerScope', 'showActivityScope', 'showPartnerScope', 'currentActivityList', 'currentPartnerList']) {
  if (!profileSource.includes(token)) {
    errors.push(`pages/user/profile.vue must route profile task cards through list views with ${token}`)
  }
}
if (profileSource.includes("goMyActivities({ tab: 'hosting' })") || profileSource.includes('管理第一条申请')) {
  errors.push('pages/user/profile.vue overview cards must switch in-page categories instead of jumping to a separate list or first item')
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
for (const token of ['loginWithWeixin', 'persistUniIdSession', 'uni.login', 'uni-id-co', 'user-center', 'hasOpsRole', 'getLastLoginDiagnostic', 'recordLoginDiagnostic', 'LOGIN_DIAGNOSTIC_KEY', 'cloudFallbackAllowed']) {
  if (!authSource.includes(token)) {
    errors.push(`common/api/auth.js is missing release login bridge token: ${token}`)
  }
}
const loginWithWeixinBody = authSource.slice(
  authSource.indexOf('export async function loginWithWeixin'),
  authSource.indexOf('export function saveCurrentUserProfile')
)
if (loginWithWeixinBody.indexOf('await loginWithUniIdCo(code, profile)') > loginWithWeixinBody.lastIndexOf('return loginWithMockFallback(profile')) {
  errors.push('common/api/auth.js must try uni-id-co before falling back to mock login')
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
for (const token of ['试运行订单金额', '试运行订单状态']) {
  if (!manageDashboardSourceForLifecycle.includes(token)) {
    errors.push(`pages/manage/dashboard.vue must label trial-order funds with ${token}`)
  }
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
  for (const staleToken of ['unicloud-city-select', 'openCitySelector', 'handleCitySelect', 'inferCityFromLocation', 'syncCityFromLocation', 'city-select']) {
    if (source.includes(staleToken)) {
      errors.push(`${page} must not expose city selection in Tianjin University mode: ${staleToken}`)
    }
  }
  for (const token of ['CAMPUS_NAME', '天津大学', 'CAMPUS_CITY_CODE', 'form.cityCode', 'form.district']) {
    if (!source.includes(token)) {
      errors.push(`${page} must keep fixed Tianjin University campus metadata with ${token}`)
    }
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
  if (!source.includes('@tap.stop="useRandomCover"') || !source.includes('keepSheetOpen: true')) {
    errors.push(`${page} must keep the cover picker open when using random recommended covers`)
  }
}

const userDetailSource = read('pages/user/detail.vue')
for (const token of ['getUserProfileById', 'public-profile', 'goBackOrFallback']) {
  if (!userDetailSource.includes(token)) {
    errors.push(`pages/user/detail.vue is missing release public profile token: ${token}`)
  }
}
const userDetailRouteSource = read('common/utils/route.js')
if (!userDetailRouteSource.includes('goUserDetail')) {
  errors.push('common/utils/route.js must expose goUserDetail for member/leader avatars')
}
const activityApiSourceForInvites = read('common/api/activity.js')
for (const token of ['invited', 'isActivityInvitee', 'invitedUserIds', 'invited_user_ids', 'sourcePartnerIntentIds', 'source_partner_intent_ids']) {
  if (!activityApiSourceForInvites.includes(token)) {
    errors.push(`common/api/activity.js must support invited converted activity visibility with ${token}`)
  }
}
for (const page of ['pages/activity/detail.vue', 'pages/activity/members.vue', 'pages/manage/checkin.vue', 'pages/manage/dashboard.vue']) {
  const source = read(page)
  if (!source.includes('goUserDetail')) {
    errors.push(`${page} must open member/leader avatars through goUserDetail`)
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
for (const staleStat of ['{{ activities.length }}', '{{ visibleMyActivities.length }}', '{{ quickStartCount }}']) {
  if (homeSource.includes(staleStat)) {
    errors.push(`pages/home/index.vue must not bind topic stats to stale runtime count: ${staleStat}`)
  }
}
for (const bannedCopy of ['快成行', '我的进行中']) {
  if (homeSource.includes(bannedCopy)) {
    errors.push(`pages/home/index.vue must not expose stale topic stat copy: ${bannedCopy}`)
  }
}
if (!homeSource.includes(':activity="item" compact')) {
  errors.push('pages/home/index.vue home activity list must render SuActivityCard in compact mode')
}
const normalizedHomeSource = homeSource.replace(/\r\n/g, '\n')
for (const token of ['.scene-row {\n  margin-top: 14rpx;', '.sort-tabs {\n  display: flex;\n  gap: 12rpx;\n  margin-top: 14rpx;', 'margin: 24rpx 0 14rpx;']) {
  if (!normalizedHomeSource.includes(token)) {
    errors.push(`pages/home/index.vue must keep compact spacing below the feature card with ${token}`)
  }
}

const activityCardSource = read('components/surego/SuActivityCard.vue')
for (const token of ['.activity-card--compact .activity-card__cover', 'height: 200rpx;', '.activity-card--compact .activity-card__body', 'activity-card__meta-row', '.activity-card--compact .activity-card__meta-row', 'activity-card__footer--compact', 'activity-card__status-chip', 'v-if="!compact"']) {
  if (!activityCardSource.includes(token)) {
    errors.push(`SuActivityCard.vue must define compact home-card style token: ${token}`)
  }
}
const compactCoverBlock = activityCardSource.match(/\.activity-card--compact\s+\.activity-card__cover\s*\{[\s\S]*?\}/)
if (compactCoverBlock?.[0].includes('height: 308rpx')) {
  errors.push('SuActivityCard.vue compact cover must not keep the default 308rpx height')
}

for (const file of ['pages/home/index.vue', 'pages/discover/index.vue', 'pages/user/profile.vue', 'pages/participant/dashboard.vue']) {
  const source = read(file)
  for (const token of ['unreadCount', 'getUnreadMessageCount']) {
    if (!source.includes(token)) {
      errors.push(`${file} must render release message badge from unread count with ${token}`)
    }
  }
  if (source.includes('__notice-dot') || source.includes('discover__dot')) {
    errors.push(`${file} must not ship hard-coded message red dot`)
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
for (const token of ['报名并确认订单']) {
  if (!activityDetailSource.includes(token)) {
    errors.push(`pages/activity/detail.vue must use trial-order activity wording token: ${token}`)
  }
}

const activitySource = read('common/api/activity.js')
for (const token of ['isCurrentUserActivityCreator', 'REFERENCE_PREVIEW_OWNER_IDS', 'isReferencePreviewActivityOwner', 'applicationStatus', 'isPubliclyVisibleActivity', 'PUBLIC_ACTIVITY_MODERATION_STATUSES', "'surego-activity', 'listMine'"]) {
  if (!activitySource.includes(token)) {
    errors.push(`common/api/activity.js is missing ownership release token: ${token}`)
  }
}
for (const token of ['getActivityStatusMeta', 'sortActivitiesByStatusPriority', 'isHomeVisibleMyActivity', 'ACTIVITY_STATUS_FILTERS', 'filterActivitiesByStatusGroup']) {
  if (!activitySource.includes(token)) {
    errors.push(`common/api/activity.js is missing release activity status helper: ${token}`)
  }
}
for (const helper of ['listCurrentUserApplications', 'buildActivityWithApplication', 'listAppliedLocalActivities']) {
  if (!activitySource.includes(helper)) {
    errors.push(`common/api/activity.js must sync my joined/pending activities through applications with ${helper}`)
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

const mockActivitiesSource = read('common/mock/activities.js')
for (const token of ['graduation-photo-walk-owner', "creatorId: 'mock_user'", '毕业季草坪约拍']) {
  if (!mockActivitiesSource.includes(token)) {
    errors.push(`common/mock/activities.js must include my published activity mock with ${token}`)
  }
}

const profileActivitySource = read('pages/user/profile.vue')
for (const token of ['listMyPartnerPosts', 'partnerPostList', "activeTab === 'partners'", 'goPartnerWorkbench']) {
  if (!profileActivitySource.includes(token)) {
    errors.push(`pages/user/profile.vue must manage my partner posts with ${token}`)
  }
}
for (const token of ['activityScopeTabs', 'partnerScopeTabs', 'currentActivityList', 'currentPartnerList', 'getActivityStatusMeta', 'profile-card__status']) {
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
for (const token of ['partnerPostId', 'partner_post_id', 'conversationId', 'conversation_id']) {
  if (!messageSource.includes(token)) {
    errors.push(`common/api/message.js must carry partner message links with ${token}`)
  }
}
const messagesPageSource = read('pages/messages/index.vue')
if (!messagesPageSource.includes('goPartnerConversation') || !messagesPageSource.includes('item.conversationId')) {
  errors.push('pages/messages/index.vue must route partner conversation messages to goPartnerConversation')
}
for (const staleToken of ['defaultMessages', 'getSeedMessages', 'msg_default']) {
  if (messageSource.includes(staleToken)) {
    errors.push(`common/api/message.js must not ship seeded mock messages: ${staleToken}`)
  }
}
if (!messageSource.includes('filter((item) => isCurrentUserMessage(item, userId))')) {
  errors.push('common/api/message.js must scope local messages to the current user')
}

const partnerApiSource = read('common/api/partner.js')
for (const token of ['PARTNER_POST_TYPES', 'PARTNER_POST_STATUS_META', 'PARTNER_TOPIC_OPTIONS', 'HACKATHON_TOPIC_KEY', 'listPartnerPosts', 'listHackathonPartnerPosts', 'getPartnerPostDetail', 'createPartnerPost', 'listMyPartnerPosts', 'createPartnerIntent', 'listPartnerIntents', 'updatePartnerIntentStatus', 'followPartnerPost']) {
  if (!partnerApiSource.includes(token)) {
    errors.push(`common/api/partner.js is missing release partner token: ${token}`)
  }
}
for (const token of ['viewerIntent', 'viewerIntentStatus', 'viewerConversationId', 'findViewerIntentForPost']) {
  if (!partnerApiSource.includes(token)) {
    errors.push(`common/api/partner.js must normalize current viewer intent state with ${token}`)
  }
}
for (const token of ['USE_UNICLOUD', 'callSuregoFunction', '@/common/api/auth.js', 'createMessage']) {
  if (!partnerApiSource.includes(token)) {
    errors.push(`common/api/partner.js must use release facade/message dependency ${token}`)
  }
}
for (const token of ['getPartnerConversation', 'listPartnerConversations', 'CONVERSATIONS_KEY']) {
  if (!partnerApiSource.includes(token)) {
    errors.push(`common/api/partner.js must align conversation flow with ${token}`)
  }
}
for (const token of ['convertPartnerPostToActivity', 'kind', 'converted', 'visibility', 'sourcePartnerPostId', 'sourcePartnerIntentIds', 'invitedUserIds', 'invited_user_ids', 'source_partner_intent_ids']) {
  if (!partnerApiSource.includes(token)) {
    errors.push(`common/api/partner.js must expose document-aligned partner conversion token: ${token}`)
  }
}
for (const staleToken of ['writeApprovedApplications(activity', 'writeApprovedApplications(activity,', 'APPLICATIONS_KEY']) {
  if (partnerApiSource.includes(staleToken)) {
    errors.push(`common/api/partner.js must not auto-create approved applications during partner conversion: ${staleToken}`)
  }
}
const followHelperStart = partnerApiSource.indexOf('export async function followPartnerPost')
const followHelperEnd = partnerApiSource.indexOf('\nfunction ', followHelperStart + 1)
const followHelperSource = partnerApiSource.slice(followHelperStart, followHelperEnd === -1 ? partnerApiSource.length : followHelperEnd)
if (followHelperSource.indexOf('if (USE_UNICLOUD)') > followHelperSource.indexOf('readFollows()')) {
  errors.push('common/api/partner.js followPartnerPost must call cloud before local follow cache in USE_UNICLOUD mode')
}

const partnerPageSource = read('pages/partners/index.vue')
for (const token of ['SuPartnerCard', 'listPartnerPosts', 'goPartnerCreate', 'getUnreadMessageCount', 'activeType']) {
  if (!partnerPageSource.includes(token)) {
    errors.push(`pages/partners/index.vue is missing release partner feed token: ${token}`)
  }
}
for (const token of ['searchKeyword', 'matchesKeyword', 'v-model="searchKeyword"']) {
  if (!partnerPageSource.includes(token)) {
    errors.push(`pages/partners/index.vue must implement real local partner search with ${token}`)
  }
}
if (partnerPageSource.includes('showComingSoon')) {
  errors.push('pages/partners/index.vue search must not be a placeholder toast')
}

const hackathonIndexSource = read('pages/hackathon/index.vue')
for (const token of ['listHackathonPartnerPosts', 'allowFallback: false', "topicKey: 'hackathon'", 'goHackathonTeam', 'goPartnerCreate({', 'emptyPartner']) {
  if (!hackathonIndexSource.includes(token)) {
    errors.push(`pages/hackathon/index.vue must use release hackathon partner token: ${token}`)
  }
}
for (const staleToken of ['const teams = [', '@/common/mock', 'uniCloud.callFunction']) {
  if (hackathonIndexSource.includes(staleToken)) {
    errors.push(`pages/hackathon/index.vue must not use static/mock/direct cloud data: ${staleToken}`)
  }
}
if (hackathonIndexSource.includes('showComingSoon') || hackathonIndexSource.includes('voice-card')) {
  errors.push('pages/hackathon/index.vue must hide low-priority voice placeholder entry in trial mode')
}

const partnerCreateTopicSource = read('pages/partner/create.vue')
for (const token of ['HACKATHON_TOPIC_KEY', 'topicKey', 'topic-notice', 'HACKATHON_LOCKED_TIME', 'HACKATHON_LOCKED_LOCATION', '2026年5月22日', '天津大学科技园']) {
  if (!partnerCreateTopicSource.includes(token)) {
    errors.push(`pages/partner/create.vue must expose locked hackathon publish token: ${token}`)
  }
}
for (const staleToken of ['PARTNER_TOPIC_OPTIONS', 'topicOptions', '黑客松/赛事', '确认方式', '希望对方', '标签']) {
  if (partnerCreateTopicSource.includes(staleToken)) {
    errors.push(`pages/partner/create.vue must not expose stale heavy publish token: ${staleToken}`)
  }
}

const hackathonTeamSource = read('pages/hackathon/team.vue')
for (const token of ['getPartnerPostDetail', 'createPartnerIntent', 'allowFallback: false', 'guardLoginAction', 'isLoggedIn', 'viewerIntent', 'intentStatus', 'goPartnerConversation']) {
  if (!hackathonTeamSource.includes(token)) {
    errors.push(`pages/hackathon/team.vue must use release hackathon intent token: ${token}`)
  }
}
for (const staleToken of ['const teams = [', '@/common/mock', 'goMessages', 'uniCloud.callFunction']) {
  if (hackathonTeamSource.includes(staleToken)) {
    errors.push(`pages/hackathon/team.vue must not use static/mock/direct cloud data: ${staleToken}`)
  }
}
if (partnerPageSource.includes('找搭子')) {
  errors.push('pages/partners/index.vue must not render the stale 找搭子 label')
}
for (const createPage of ['pages/activity/create.vue', 'pages/partner/create.vue']) {
  const source = read(createPage)
  if (source.includes('voice-launch-button') || source.includes('showComingSoon')) {
    errors.push(`${createPage} must hide low-priority voice placeholder entry in trial mode`)
  }
}
const normalizedPartnerPageSource = partnerPageSource.replace(/\r\n/g, '\n')
for (const token of ['margin: 18rpx 0 8rpx;', '.section-title--inline {\n  margin-bottom: 6rpx;', '.scene-scroll-row {\n  margin-top: 16rpx;']) {
  if (!normalizedPartnerPageSource.includes(token)) {
    errors.push(`pages/partners/index.vue must keep compact spacing below the feature card with ${token}`)
  }
}
if (!partnerPageSource.includes('gap: 18rpx;')) {
  errors.push('pages/partners/index.vue must tighten partner list spacing to gap: 18rpx')
}
if (partnerPageSource.includes('gap: 26rpx;')) {
  errors.push('pages/partners/index.vue must not keep tall partner list spacing gap: 26rpx')
}

const partnerCardSource = read('components/surego/SuPartnerCard.vue')
for (const token of ['contract-row__copy', 'contract-row__action', 'min-width: 152rpx', 'white-space: nowrap', 'text-overflow: ellipsis']) {
  if (!partnerCardSource.includes(token)) {
    errors.push(`SuPartnerCard.vue action capsule must keep single-line text on real devices with ${token}`)
  }
}
for (const token of ['compact-meta-row', 'compact-meta-chip', 'displayConnectionSummary']) {
  if (!partnerCardSource.includes(token)) {
    errors.push(`SuPartnerCard.vue must use compact partner list layout with ${token}`)
  }
}
for (const staleToken of ['partner-post-card__desc', 'displayExpectation', 'partner-post-card__want-main', 'partner-meta-grid']) {
  if (partnerCardSource.includes(staleToken)) {
    errors.push(`SuPartnerCard.vue compact list card must not render tall/redundant detail block: ${staleToken}`)
  }
}
if (partnerCardSource.includes('grid-template-columns: 1fr;') && partnerCardSource.includes('.contract-row')) {
  errors.push('SuPartnerCard.vue action capsule must sit on the right of the contract row, not stretch as a full-width grid row')
}
if (partnerCardSource.includes('width: 120rpx')) {
  errors.push('SuPartnerCard.vue action capsule must not use fixed 120rpx width because four Chinese characters wrap on device')
}

const partnerDetailSource = read('pages/partner/detail.vue')
for (const token of ['getPartnerPostDetail', 'createPartnerIntent', 'followPartnerPost', 'goPartnerWorkbench', 'guardLoginAction', 'viewerIntent', 'viewerIntentStatus', 'goPartnerConversation', 'openAcceptedConversation']) {
  if (!partnerDetailSource.includes(token)) {
    errors.push(`pages/partner/detail.vue is missing release partner detail token: ${token}`)
  }
}
for (const token of ['partner.detail', 'displayWants', 'partner.available', 'partner.locationRange']) {
  if (!partnerDetailSource.includes(token)) {
    errors.push(`pages/partner/detail.vue must align partner detail information order with ${token}`)
  }
}
if (partnerDetailSource.includes('搭子帖')) {
  errors.push('pages/partner/detail.vue must not expose 搭子帖 in user-visible copy')
}
if (partnerDetailSource.includes('showComingSoon')) {
  errors.push('pages/partner/detail.vue must replace placeholder chat actions with intent-state and conversation routing')
}

const partnerCreateSource = read('pages/partner/create.vue')
for (const token of ['createPartnerPost', 'adjust-position="false"', 'cursor-spacing="80"']) {
  if (!partnerCreateSource.includes(token)) {
    errors.push(`pages/partner/create.vue is missing release partner create token: ${token}`)
  }
}

const partnerConversationSource = read('pages/partner/conversation.vue')
for (const token of ['getPartnerConversation', 'conversation.partnerPostId', 'participantIds', 'goPartnerDetail']) {
  if (!partnerConversationSource.includes(token)) {
    errors.push(`pages/partner/conversation.vue is missing release conversation token: ${token}`)
  }
}

const partnerWorkbenchSource = read('pages/partner/workbench.vue')
for (const token of ['listPartnerIntents', 'updatePartnerIntentStatus', 'goPartnerDetail']) {
  if (!partnerWorkbenchSource.includes(token)) {
    errors.push(`pages/partner/workbench.vue is missing release partner workbench token: ${token}`)
  }
}
for (const token of ['convertPartnerPostToActivity', 'openConvertSheet', 'convertSheetVisible', 'conversionForm', 'sourcePartnerIntentIds', 'invitedUserIds']) {
  if (!partnerWorkbenchSource.includes(token)) {
    errors.push(`pages/partner/workbench.vue must support real partner conversion flow token: ${token}`)
  }
}
for (const staleToken of ['搭子转活动正在接入', '定向通知正在接入']) {
  if (partnerWorkbenchSource.includes(staleToken)) {
    errors.push(`pages/partner/workbench.vue must not keep placeholder conversion copy: ${staleToken}`)
  }
}

const publishSource = read('pages/publish/index.vue')
for (const token of ['goActivityCreate', 'goPartnerCreate', '发布活动', '发布搭子']) {
  if (!publishSource.includes(token)) {
    errors.push(`pages/publish/index.vue is missing release publish hub token: ${token}`)
  }
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
for (const token of ['uni.scanCode', 'listActivityMembers', 'confirmNextByScan', 'scanCheckinCode', 'parseScannedCheckinCode', 'onlyFromCamera: true']) {
  if (!checkinDeskSource.includes(token)) {
    errors.push(`pages/manage/checkin.vue is missing operation capability: ${token}`)
  }
}
if (checkinDeskSource.includes('await confirmNextByScan()') || checkinDeskSource.includes('result.result || checkinCode.value')) {
  errors.push('pages/manage/checkin.vue must not auto-confirm check-in when scan fails or returns an empty result')
}

const participantDeskSource = read('pages/participant/dashboard.vue')
if (!participantDeskSource.includes('buildParticipantCheckinCode')) {
  errors.push('pages/participant/dashboard.vue must render a stable participant check-in code')
}
const qrCodeSource = read('common/utils/qrcode.js')
for (const token of ['buildQrMatrix', 'addQuietZone', 'reedSolomonEncode', 'FORMAT_BITS_L_MASK_0']) {
  if (!qrCodeSource.includes(token)) {
    errors.push(`common/utils/qrcode.js must generate check-in QR matrices with ${token}`)
  }
}
const qrCodeComponentSource = read('components/surego/SuQrCode.vue')
for (const token of ['buildQrMatrix', 'su-qrcode__module', 'moduleSize']) {
  if (!qrCodeComponentSource.includes(token)) {
    errors.push(`components/surego/SuQrCode.vue must render QR modules with ${token}`)
  }
}
for (const token of ['SuQrCode', 'showEntryQr', 'code-box__qr']) {
  if (!participantDeskSource.includes(token)) {
    errors.push(`pages/participant/dashboard.vue must render a scan-ready QR pass using ${token}`)
  }
}
if (participantDeskSource.includes("source: 'participant'") || participantDeskSource.includes('remark: \'参与者中心确认签到\'')) {
  errors.push('pages/participant/dashboard.vue must not allow participants to self-confirm onsite check-in')
}

const calendarSource = read('pages/calendar/index.vue')
for (const token of ['month-grid', 'weekday-row', 'calendarCells', 'shiftMonth', 'calendar-tabs']) {
  if (!calendarSource.includes(token)) {
    errors.push(`pages/calendar/index.vue must align with reference month calendar using ${token}`)
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

const deploymentDocSource = read('docs/surego-cloud-trial-deployment.md')
for (const token of ['只上传 SureGo 业务云函数', '不要全量上传', 'surego-activity', 'surego-partner', 'surego-users.init_data.json', 'uni-id-roles.init_data.json']) {
  if (!deploymentDocSource.includes(token)) {
    errors.push(`docs/surego-cloud-trial-deployment.md is missing deployment scope token: ${token}`)
  }
}

const deploymentScopeCheckSource = read('scripts/surego-deployment-scope-check.mjs')
for (const token of ['allowedCloudFunctions', 'allowedDatabaseArtifacts', 'blockedDemoRoutes', 'surego-activity', 'user-center']) {
  if (!deploymentScopeCheckSource.includes(token)) {
    errors.push(`scripts/surego-deployment-scope-check.mjs is missing deployment scope token: ${token}`)
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
for (const token of ['确认试运行订单', '订单确认成功']) {
  if (!paymentSource.includes(token)) {
    errors.push(`pages/payment/index.vue must use trial-order wording token: ${token}`)
  }
}
for (const staleToken of ['确认支付', '支付成功', '试运行订单确认，不发生真实扣款']) {
  if (paymentSource.includes(staleToken)) {
    errors.push(`pages/payment/index.vue must not imply real payment with ${staleToken}`)
  }
}

const orderDetailSourceForStack = read('pages/order/detail.vue')
if (!orderDetailSourceForStack.includes('goPayment({ activityId: order.activityId, type: order.type, amount: order.amount }, { replace: true })')) {
  errors.push('pages/order/detail.vue must replace order detail when continuing to payment')
}
if (!orderDetailSourceForStack.includes('goParticipantDashboard(order.activityId, { replace: true })')) {
  errors.push('pages/order/detail.vue must replace order detail when opening participant credential from paid order')
}
for (const token of ['试运行金额', '试运行退款记录']) {
  if (!orderDetailSourceForStack.includes(token)) {
    errors.push(`pages/order/detail.vue must use trial-order detail wording token: ${token}`)
  }
}

const orderApiSourceForTrialCopy = read('common/api/order.js')
for (const token of ['试运行订单确认成功', '试运行退款记录', '订单确认成功']) {
  if (!orderApiSourceForTrialCopy.includes(token)) {
    errors.push(`common/api/order.js must use trial-order notification wording token: ${token}`)
  }
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
for (const token of ["visibility: payload.visibility || 'public'", 'source_partner_post_id', "source: payload.source || 'direct_activity'"]) {
  if (!activityCloudSource.includes(token)) {
    errors.push(`surego-activity must support converted activity visibility/source token: ${token}`)
  }
}
for (const token of ['invited_user_ids', 'source_partner_intent_ids']) {
  if (!activityCloudSource.includes(token)) {
    errors.push(`surego-activity must support converted activity invite token: ${token}`)
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
if (!messageApiSource.includes('getUnreadMessageCount')) {
  errors.push('common/api/message.js must expose getUnreadMessageCount for release notification badges')
}

const partnerCloudSource = read('uniCloud-aliyun/cloudfunctions/surego-partner/index.js')
for (const token of ['viewerIntent', 'viewerIntentStatus', 'viewerConversationId', 'findViewerIntentForPost']) {
  if (!partnerCloudSource.includes(token)) {
    errors.push(`surego-partner must return current viewer intent state with ${token}`)
  }
}
for (const token of ['surego-conversations', 'ensureConversationForIntent', 'participant_ids', 'conversation_id']) {
  if (!partnerCloudSource.includes(token)) {
    errors.push(`surego-partner must create/link conversations when accepting intents with ${token}`)
  }
}
for (const token of ["action === 'convertToActivity'", 'source_partner_post_id', 'visibility', 'invited_user_ids', 'source_partner_intent_ids']) {
  if (!partnerCloudSource.includes(token)) {
    errors.push(`surego-partner must support partner conversion flow token: ${token}`)
  }
}
for (const staleToken of ['createApprovedApplicationsForActivity', 'applications.add({']) {
  if (partnerCloudSource.includes(staleToken)) {
    errors.push(`surego-partner must not auto-create approved activity applications during conversion: ${staleToken}`)
  }
}
for (const token of ["if (!record.description)"]) {
  if (!partnerCloudSource.includes(token)) {
    errors.push(`surego-partner must validate partner post required fields with ${token}`)
  }
}
for (const token of ['buildListPostWhere', 'matchesPostTextFilters', 'tagsAny', 'payload.type', 'topic_key', 'normalizeTopicKey']) {
  if (!partnerCloudSource.includes(token)) {
    errors.push(`surego-partner must support release filtered project/hackathon listPosts token: ${token}`)
  }
}

const partnerApiSourceForMine = read('common/api/partner.js')
for (const token of ['REFERENCE_PREVIEW_OWNER_IDS', 'isReferencePreviewOwner', 'weekly-badminton']) {
  if (!partnerApiSourceForMine.includes(token)) {
    errors.push(`common/api/partner.js must keep reference mock owner posts visible in mine with ${token}`)
  }
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
