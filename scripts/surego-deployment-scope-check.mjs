import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(process.cwd())
const errors = []
const warnings = []

const allowedCloudFunctions = [
  'surego-activity',
  'surego-application',
  'surego-order',
  'surego-message',
  'surego-checkin',
  'surego-moderation',
  'surego-partner',
  'surego-user',
  'user-center'
]

const allowedDatabaseArtifacts = [
  'surego-activities.schema.json',
  'surego-activities.index.json',
  'surego-activities.init_data.json',
  'surego-applications.schema.json',
  'surego-applications.index.json',
  'surego-orders.schema.json',
  'surego-orders.index.json',
  'surego-checkins.schema.json',
  'surego-checkins.index.json',
  'surego-partner-posts.schema.json',
  'surego-partner-posts.index.json',
  'surego-partner-posts.init_data.json',
  'surego-partner-intents.schema.json',
  'surego-partner-intents.index.json',
  'surego-conversations.schema.json',
  'surego-conversations.index.json',
  'surego-messages.schema.json',
  'surego-messages.index.json',
  'surego-follows.schema.json',
  'surego-follows.index.json',
  'surego-reports.schema.json',
  'surego-reports.index.json',
  'surego-audit-logs.schema.json',
  'surego-audit-logs.index.json',
  'surego-users.schema.json',
  'surego-users.index.json',
  'surego-users.init_data.json',
  'uni-id-roles.init_data.json',
  'uni-id-roles.index.json',
  'uni-id-permissions.init_data.json',
  'uni-id-permissions.index.json',
  'uni-id-users.init_data.json'
]

const blockedDemoRoutes = [
  'pages/cloudFunction/cloudFunction',
  'pages/cloudObject/cloudObject',
  'pages/storage/storage',
  'pages/clientDB/clientDB',
  'pages/schema2code/schema2code',
  'pages/validate-demo/list',
  'pages/user-info/list'
]

const blockedDemoFunctions = [
  'add',
  'get',
  'remove',
  'update',
  'redis-test',
  'cloud-object-demo',
  'secure-network',
  'secure-network-object',
  'uni-admin',
  'uni-clientDB-actions'
]

const blockedDemoDatabasePrefixes = [
  'book',
  'order',
  'permission-test',
  'test',
  'unicloud-test',
  'user-info',
  'validate-demo',
  'opendb-'
]

function readJson(relativePath) {
  const absolute = path.join(root, relativePath)
  if (!fs.existsSync(absolute)) {
    errors.push(`Missing file: ${relativePath}`)
    return null
  }
  try {
    return JSON.parse(fs.readFileSync(absolute, 'utf8'))
  } catch (error) {
    errors.push(`${relativePath} is not valid JSON: ${error.message}`)
    return null
  }
}

function listDirectories(relativePath) {
  const absolute = path.join(root, relativePath)
  if (!fs.existsSync(absolute)) return []
  return fs.readdirSync(absolute, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
}

function listFiles(relativePath) {
  const absolute = path.join(root, relativePath)
  if (!fs.existsSync(absolute)) return []
  return fs.readdirSync(absolute, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
}

const pagesConfig = readJson('pages.json')
if (pagesConfig) {
  const registeredRoutes = (pagesConfig.pages || []).map((item) => item.path)
  for (const route of blockedDemoRoutes) {
    if (registeredRoutes.includes(route)) {
      errors.push(`pages.json must not register demo route: ${route}`)
    }
  }
}

for (const name of allowedCloudFunctions) {
  const indexPath = path.join(root, 'uniCloud-aliyun', 'cloudfunctions', name, 'index.js')
  if (!fs.existsSync(indexPath)) {
    errors.push(`Missing required SureGo cloud function: ${name}`)
  }
}

for (const artifact of allowedDatabaseArtifacts) {
  const artifactPath = path.join(root, 'uniCloud-aliyun', 'database', artifact)
  if (!fs.existsSync(artifactPath)) {
    errors.push(`Missing required SureGo database artifact: ${artifact}`)
  }
}

for (const name of listDirectories('uniCloud-aliyun/cloudfunctions')) {
  if (!allowedCloudFunctions.includes(name) && blockedDemoFunctions.includes(name)) {
    warnings.push(`Do not upload demo cloud function: ${name}`)
  }
}

for (const file of listFiles('uniCloud-aliyun/database')) {
  if (allowedDatabaseArtifacts.includes(file)) continue
  if (blockedDemoDatabasePrefixes.some((prefix) => file.startsWith(prefix))) {
    warnings.push(`Do not upload demo database artifact: ${file}`)
  }
}

if (warnings.length > 0) {
  console.warn(warnings.join('\n'))
}

if (errors.length > 0) {
  console.error(errors.join('\n'))
  process.exit(1)
}

console.log('SureGo deployment scope check passed.')
