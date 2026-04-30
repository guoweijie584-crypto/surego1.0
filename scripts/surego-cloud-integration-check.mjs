import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(process.cwd())

const modules = [
  {
    name: 'activity',
    api: 'common/api/activity.js',
    cloud: 'uniCloud-aliyun/cloudfunctions/surego-activity/index.js',
    schema: 'uniCloud-aliyun/database/surego-activities.schema.json',
    actions: ['list', 'detail', 'create', 'update', 'updateStatus'],
    apiExports: ['listActivities', 'getActivityDetail', 'createActivity', 'updateActivity', 'updateActivityStatus'],
    requiredSchemaFields: ['creator_id']
  },
  {
    name: 'application',
    api: 'common/api/application.js',
    cloud: 'uniCloud-aliyun/cloudfunctions/surego-application/index.js',
    schema: 'uniCloud-aliyun/database/surego-applications.schema.json',
    actions: ['submit', 'getMineByActivity', 'listByActivity', 'review'],
    apiExports: ['submitApplication', 'getApplicationForActivity', 'listApplications', 'reviewApplication'],
    requiredSchemaFields: ['activity_id', 'user_id', 'status']
  },
  {
    name: 'order',
    api: 'common/api/order.js',
    cloud: 'uniCloud-aliyun/cloudfunctions/surego-order/index.js',
    schema: 'uniCloud-aliyun/database/surego-orders.schema.json',
    actions: ['create', 'ensureForActivity', 'getForActivity', 'updateStatus', 'markPaid', 'list'],
    apiExports: ['createOrder', 'ensureOrderForActivity', 'getOrderForActivity', 'updateOrderStatus', 'markOrderPaid', 'listOrders'],
    requiredSchemaFields: ['activity_id', 'user_id', 'type', 'amount', 'status']
  },
  {
    name: 'message',
    api: 'common/api/message.js',
    cloud: 'uniCloud-aliyun/cloudfunctions/surego-message/index.js',
    schema: 'uniCloud-aliyun/database/surego-messages.schema.json',
    actions: ['create', 'list', 'markRead', 'markAllRead'],
    apiExports: ['createMessage', 'listMessages', 'markMessageRead', 'markAllMessagesRead'],
    requiredSchemaFields: ['user_id', 'title', 'content', 'read']
  },
  {
    name: 'checkin',
    api: 'common/api/checkin.js',
    cloud: 'uniCloud-aliyun/cloudfunctions/surego-checkin/index.js',
    schema: 'uniCloud-aliyun/database/surego-checkins.schema.json',
    actions: ['createCode', 'confirm', 'listByActivity', 'summary'],
    apiExports: ['createCheckinCode', 'confirmCheckin', 'listCheckins', 'getCheckinSummary'],
    requiredSchemaFields: ['activity_id', 'user_id', 'status']
  },
  {
    name: 'user',
    api: 'common/api/user.js',
    cloud: 'uniCloud-aliyun/cloudfunctions/surego-user/index.js',
    schema: 'uniCloud-aliyun/database/surego-users.schema.json',
    actions: ['profile', 'updateProfile', 'getProfiles'],
    apiExports: ['getCurrentUser', 'updateCurrentUser'],
    requiredSchemaFields: ['user_id']
  },
  {
    name: 'moderation',
    api: 'common/api/moderation.js',
    cloud: 'uniCloud-aliyun/cloudfunctions/surego-moderation/index.js',
    schema: 'uniCloud-aliyun/database/surego-reports.schema.json',
    actions: ['createReport', 'listReports', 'updateReportStatus', 'listOpsActivities', 'moderateActivity', 'getOpsStats'],
    apiExports: ['createReport', 'listReports', 'updateReportStatus', 'listOpsActivities', 'moderateActivity', 'getOpsStats'],
    requiredSchemaFields: ['activity_id', 'reporter_id', 'status']
  }
]

const errors = []

function readFile(relativePath) {
  const absolute = path.join(root, relativePath)
  if (!fs.existsSync(absolute)) {
    errors.push(`Missing file: ${relativePath}`)
    return ''
  }
  return fs.readFileSync(absolute, 'utf8')
}

function readSchema(relativePath) {
  const source = readFile(relativePath)
  if (!source) return {}
  try {
    return JSON.parse(source)
  } catch (error) {
    errors.push(`${relativePath} is not valid JSON: ${error.message}`)
    return {}
  }
}

for (const item of modules) {
  const apiSource = readFile(item.api)
  const cloudSource = readFile(item.cloud)
  const schema = readSchema(item.schema)

  for (const token of ['USE_UNICLOUD', 'callSuregoFunction']) {
    if (!apiSource.includes(token)) {
      errors.push(`${item.api} is missing ${token}`)
    }
  }

  for (const apiExport of item.apiExports) {
    if (!apiSource.includes(apiExport)) {
      errors.push(`${item.api} is missing ${apiExport}`)
    }
  }

  for (const action of item.actions) {
    if (!cloudSource.includes(`action === '${action}'`)) {
      errors.push(`${item.cloud} is missing action ${action}`)
    }
  }

  if (!cloudSource.includes('code: 0') || !cloudSource.includes('data:')) {
    errors.push(`${item.cloud} must return { code: 0, data } for successful actions`)
  }

  if (cloudSource.includes("|| 'mock_user'") || cloudSource.includes('|| "mock_user"')) {
    errors.push(`${item.cloud} must not default cloud writes to mock_user`)
  }

  if (!cloudSource.includes('resolveUserContext')) {
    errors.push(`${item.cloud} is missing resolveUserContext auth helper`)
  }

  for (const token of ['uni-id-users', 'findUniIdUser', 'isTokenOwnedByUser', 'uniIdToken', 'exists']) {
    if (!cloudSource.includes(token)) {
      errors.push(`${item.cloud} must validate the current uid against uni-id-users`)
      break
    }
  }

  if (cloudSource.includes('event.roles || payload.roles')) {
    errors.push(`${item.cloud} must not trust frontend-provided roles`)
  }

  if (!cloudSource.includes('!user.exists')) {
    errors.push(`${item.cloud} must reject deleted/stale uni-id users with !user.exists`)
  }

  if (item.name === 'user' && cloudSource.includes('if (!user) return [DEFAULT_ROLE]')) {
    errors.push('surego-user must not silently grant default user role when uni-id user has been deleted')
  }

  for (const field of item.requiredSchemaFields) {
    if (!(schema.required || []).includes(field)) {
      errors.push(`${item.schema} must require ${field}`)
    }
  }
}

const authSource = readFile('common/api/auth.js')
for (const token of ['getCurrentUserId', 'getCurrentUserProfile', 'requireLogin', 'uniCloud.getCurrentUserInfo']) {
  if (!authSource.includes(token)) {
    errors.push(`common/api/auth.js is missing ${token}`)
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'))
  process.exit(1)
}

console.log('SureGo cloud integration static check passed.')
console.log('Manual HBuilderX sequence: login as A -> create activity -> login as B -> apply -> login as A -> review -> login as B -> pay placeholder -> check messages -> check in.')
