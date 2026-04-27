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
  'common/api/moderation.js'
]

const requiredCloudFunctions = [
  'surego-activity',
  'surego-application',
  'surego-order',
  'surego-message',
  'surego-checkin',
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
if (!runtimeSource.includes('USE_UNICLOUD = false')) {
  errors.push('common/config/runtime.js must keep USE_UNICLOUD = false for local release readiness')
}

for (const apiFile of requiredApiFiles) {
  const source = read(apiFile)
  if (!source.includes('USE_UNICLOUD') || !source.includes('callSuregoFunction')) {
    errors.push(`${apiFile} must keep mock/uniCloud facade mode`)
  }
  if (!source.includes('@/common/api/auth.js')) {
    errors.push(`${apiFile} must use the auth facade`)
  }
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
  for (const pattern of bannedPatterns) {
    if (pattern.test(source)) {
      errors.push(`${page}.vue contains banned pattern: ${pattern}`)
    }
  }
}

const routeSource = read('common/utils/route.js')
for (const helper of ['goActivityCreate', 'goActivityRegister', 'goManageDashboard', 'goManageCheckin', 'goOpsDashboard', 'goOpsReports', 'goSharePoster', 'goOrderDetail']) {
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
