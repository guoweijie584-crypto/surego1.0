import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(process.cwd())
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

function mustInclude(file, source, token, message) {
  if (!source.includes(token)) {
    errors.push(`${file}: ${message}`)
  }
}

const routeSource = read('common/utils/route.js')
mustInclude('common/utils/route.js', routeSource, 'guardOpsAction', 'ops routes must use a cloud-refreshed ops guard')
mustInclude('common/utils/route.js', routeSource, "getCurrentUser({ allowFallback: false })", 'ops guard must not trust local cached roles')

const userApiSource = read('common/api/user.js')
mustInclude('common/api/user.js', userApiSource, 'allowFallback', 'getCurrentUser must support disabling fallback for permission checks')

const userCloudSource = read('uniCloud-aliyun/cloudfunctions/surego-user/index.js')
mustInclude('uniCloud-aliyun/cloudfunctions/surego-user/index.js', userCloudSource, 'tokenValid', 'profile should expose token validity for permission diagnostics')
mustInclude('uniCloud-aliyun/cloudfunctions/surego-user/index.js', userCloudSource, 'authUid', 'profile should expose the authoritative uid for permission diagnostics')
if (userCloudSource.includes('event.roles || payload.roles')) {
  errors.push('surego-user cloud function must not trust frontend-provided roles')
}

const activityCloudSource = read('uniCloud-aliyun/cloudfunctions/surego-activity/index.js')
mustInclude('uniCloud-aliyun/cloudfunctions/surego-activity/index.js', activityCloudSource, "status: 'reviewing'", 'created activities must enter review')
if (!activityCloudSource.includes("moderation_status: 'pending'") && !activityCloudSource.includes("moderation_status = 'pending'")) {
  errors.push('uniCloud-aliyun/cloudfunctions/surego-activity/index.js: created/edited activities must enter pending moderation')
}
mustInclude('uniCloud-aliyun/cloudfunctions/surego-activity/index.js', activityCloudSource, 'publicModerationStatuses.includes', 'public activity list/detail must require approved moderation')

const partnerCloudSource = read('uniCloud-aliyun/cloudfunctions/surego-partner/index.js')
mustInclude('uniCloud-aliyun/cloudfunctions/surego-partner/index.js', partnerCloudSource, 'publicPostModerationStatuses', 'partner posts must define public moderation statuses')
mustInclude('uniCloud-aliyun/cloudfunctions/surego-partner/index.js', partnerCloudSource, "moderation_status: 'pending'", 'created partner posts must enter pending moderation')
mustInclude('uniCloud-aliyun/cloudfunctions/surego-partner/index.js', partnerCloudSource, 'isPubliclyVisiblePost', 'partner list/detail must filter unapproved posts')
mustInclude('uniCloud-aliyun/cloudfunctions/surego-partner/index.js', partnerCloudSource, "status: 'reviewing'", 'partner converted public activities must enter review')
mustInclude('uniCloud-aliyun/cloudfunctions/surego-partner/index.js', partnerCloudSource, "moderation_status: 'pending'", 'partner converted public activities must enter pending moderation')
if (partnerCloudSource.includes('event.roles || payload.roles')) {
  errors.push('surego-partner cloud function must not trust frontend-provided roles')
}

const moderationCloudSource = read('uniCloud-aliyun/cloudfunctions/surego-moderation/index.js')
for (const token of ['listOpsPartnerPosts', 'moderatePartnerPost', 'partners', 'targetType: \'partner_post\'']) {
  mustInclude('uniCloud-aliyun/cloudfunctions/surego-moderation/index.js', moderationCloudSource, token, `moderation cloud must support ${token}`)
}
if (moderationCloudSource.includes('event.roles || payload.roles')) {
  errors.push('surego-moderation cloud function must not trust frontend-provided roles')
}

const moderationApiSource = read('common/api/moderation.js')
for (const token of ['listOpsPartnerPosts', 'moderatePartnerPost', 'pendingPartners', 'hiddenPartners']) {
  mustInclude('common/api/moderation.js', moderationApiSource, token, `moderation API must expose ${token}`)
}

const opsDashboardSource = read('pages/ops/dashboard.vue')
for (const token of ['partnerPosts', 'listOpsPartnerPosts', 'moderatePartnerPost', '待审核搭子']) {
  mustInclude('pages/ops/dashboard.vue', opsDashboardSource, token, `ops dashboard must show partner moderation via ${token}`)
}

const partnerSchema = readJson('uniCloud-aliyun/database/surego-partner-posts.schema.json')
if (!(partnerSchema.required || []).includes('moderation_status')) {
  errors.push('surego-partner-posts schema must require moderation_status')
}
for (const field of ['moderation_status', 'moderation_note', 'moderated_by', 'moderated_at']) {
  if (!partnerSchema.properties?.[field]) {
    errors.push(`surego-partner-posts schema is missing ${field}`)
  }
}

if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}

console.log('SureGo moderation permission static check passed.')
