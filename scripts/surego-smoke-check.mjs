import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd());
const requiredFiles = [
  'pages.json',
  'App.vue',
  'common/mock/activities.js',
  'common/utils/route.js',
  'components/surego/SuActivityCard.vue',
  'components/surego/SuBottomDock.vue',
  'components/surego/SuActionSheet.vue',
  'common/config/runtime.js',
  'common/api/auth.js',
  'common/api/cloud.js',
  'common/api/activity.js',
  'common/api/application.js',
  'common/api/order.js',
  'common/api/message.js',
  'common/api/checkin.js',
  'common/api/user.js',
  'scripts/surego-cloud-integration-check.mjs',
  'pages/home/index.vue',
  'pages/discover/index.vue',
  'pages/discover/search.vue',
  'pages/discover/city.vue',
  'pages/calendar/index.vue',
  'pages/messages/index.vue',
  'pages/auth/login.vue',
  'pages/user/profile.vue',
  'pages/user/edit.vue',
  'pages/activity/detail.vue',
  'pages/activity/members.vue',
  'pages/activity/register.vue',
  'pages/activity/create.vue',
  'pages/activity/edit.vue',
  'pages/manage/dashboard.vue',
  'pages/manage/checkin.vue',
  'pages/participant/dashboard.vue',
  'pages/order/detail.vue',
  'pages/share/poster.vue',
  'pages/my/activities.vue',
  'pages/payment/index.vue',
  'pages/status/success.vue'
];

const expectedPages = [
  'pages/home/index',
  'pages/discover/index',
  'pages/discover/search',
  'pages/discover/city',
  'pages/calendar/index',
  'pages/messages/index',
  'pages/auth/login',
  'pages/user/profile',
  'pages/user/edit',
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
  'pages/payment/index',
  'pages/status/success'
];

const expectedSchemas = [
  'uniCloud-aliyun/database/surego-activities.schema.json',
  'uniCloud-aliyun/database/surego-applications.schema.json',
  'uniCloud-aliyun/database/surego-orders.schema.json',
  'uniCloud-aliyun/database/surego-messages.schema.json',
  'uniCloud-aliyun/database/surego-checkins.schema.json'
];

const expectedCloudFunctions = [
  'uniCloud-aliyun/cloudfunctions/surego-activity/index.js',
  'uniCloud-aliyun/cloudfunctions/surego-application/index.js',
  'uniCloud-aliyun/cloudfunctions/surego-order/index.js',
  'uniCloud-aliyun/cloudfunctions/surego-message/index.js',
  'uniCloud-aliyun/cloudfunctions/surego-checkin/index.js'
];

const bannedPatterns = [
  /\bwindow\b/,
  /\bdocument\b/,
  /\blocalStorage\b/,
  /from\s+['"]react['"]/,
  /from\s+['"]react-router/,
  /framer-motion/,
  /motion\/react/,
  /lucide-react/
];

const errors = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) {
    errors.push(`Missing required file: ${file}`);
  }
}

for (const file of [...expectedSchemas, ...expectedCloudFunctions]) {
  if (!fs.existsSync(path.join(root, file))) {
    errors.push(`Missing backend scaffold file: ${file}`);
  }
}

for (const file of expectedSchemas) {
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute)) continue;
  try {
    JSON.parse(fs.readFileSync(absolute, 'utf8'));
  } catch (error) {
    errors.push(`${file} is not valid JSON: ${error.message}`);
  }
}

const applicationReviewSchemaPath = path.join(root, 'uniCloud-aliyun/database/surego-applications.schema.json');
if (fs.existsSync(applicationReviewSchemaPath)) {
  const schema = JSON.parse(fs.readFileSync(applicationReviewSchemaPath, 'utf8'));
  for (const field of ['review_note', 'reject_reason', 'reviewer_id']) {
    if (!schema.properties?.[field]) {
      errors.push(`surego-applications schema is missing ${field}`);
    }
  }
}

const expectedSchemaPermissions = {
  'uniCloud-aliyun/database/surego-activities.schema.json': {
    required: 'creator_id',
    read: true,
    create: 'auth.uid != null',
    update: 'doc.creator_id == auth.uid'
  },
  'uniCloud-aliyun/database/surego-applications.schema.json': {
    read: 'doc.user_id == auth.uid',
    create: 'auth.uid != null',
    update: 'doc.user_id == auth.uid'
  },
  'uniCloud-aliyun/database/surego-orders.schema.json': {
    read: 'doc.user_id == auth.uid',
    create: 'auth.uid != null',
    update: false
  },
  'uniCloud-aliyun/database/surego-messages.schema.json': {
    read: 'doc.user_id == auth.uid',
    update: 'doc.user_id == auth.uid'
  },
  'uniCloud-aliyun/database/surego-checkins.schema.json': {
    read: 'doc.user_id == auth.uid',
    create: 'auth.uid != null',
    update: false
  }
};

for (const [file, expected] of Object.entries(expectedSchemaPermissions)) {
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute)) continue;
  const schema = JSON.parse(fs.readFileSync(absolute, 'utf8'));
  const permission = schema.permission || {};
  for (const [key, value] of Object.entries(expected)) {
    if (key === 'required') {
      if (!(schema.required || []).includes(value)) {
        errors.push(`${file} must require ${value}`);
      }
      continue;
    }
    if (permission[key] !== value) {
      errors.push(`${file} permission.${key} must be ${JSON.stringify(value)}`);
    }
  }
}

const pagesPath = path.join(root, 'pages.json');
if (fs.existsSync(pagesPath)) {
  const source = fs.readFileSync(pagesPath, 'utf8');
  try {
    const config = JSON.parse(source);
    const pagePaths = new Set((config.pages || []).map((item) => item.path));
    for (const page of expectedPages) {
      if (!pagePaths.has(page)) {
        errors.push(`Missing route in pages.json: ${page}`);
      }
    }
    if ((config.pages || [])[0]?.path !== 'pages/home/index') {
      errors.push('pages/home/index must be the startup page');
    }
  } catch (error) {
    errors.push(`pages.json is not valid JSON: ${error.message}`);
  }
}

const dockPath = path.join(root, 'components/surego/SuBottomDock.vue');
if (fs.existsSync(dockPath)) {
  const dockSource = fs.readFileSync(dockPath, 'utf8');
  for (const staleKey of ["key: 'calendar'", "key: 'message'", "key: 'profile'"]) {
    if (dockSource.includes(staleKey)) {
      errors.push(`SuBottomDock.vue still contains stale bottom nav item: ${staleKey}`);
    }
  }
}

const routePath = path.join(root, 'common/utils/route.js');
if (fs.existsSync(routePath)) {
  const routeSource = fs.readFileSync(routePath, 'utf8');
  if (!routeSource.includes('goParticipantDashboard')) {
    errors.push('common/utils/route.js is missing goParticipantDashboard');
  }
  if (!routeSource.includes('goManageCheckin')) {
    errors.push('common/utils/route.js is missing goManageCheckin');
  }
  if (!routeSource.includes('goSharePoster')) {
    errors.push('common/utils/route.js is missing goSharePoster');
  }
  if (!routeSource.includes('goActivityMembers')) {
    errors.push('common/utils/route.js is missing goActivityMembers');
  }
  if (!routeSource.includes('goOrderDetail')) {
    errors.push('common/utils/route.js is missing goOrderDetail');
  }
  for (const helper of ['goSearch', 'goCityPicker', 'goCalendar']) {
    if (!routeSource.includes(helper)) {
      errors.push(`common/utils/route.js is missing ${helper}`);
    }
  }
  for (const helper of ['goUserEdit', 'goActivityEdit']) {
    if (!routeSource.includes(helper)) {
      errors.push(`common/utils/route.js is missing ${helper}`);
    }
  }
  for (const helper of ['goAuthLogin', 'guardLoginAction']) {
    if (!routeSource.includes(helper)) {
      errors.push(`common/utils/route.js is missing ${helper}`);
    }
  }
  for (const guardedHelper of ['goActivityRegister', 'goActivityCreate', 'goUserEdit', 'goManageDashboard', 'goManageCheckin', 'goPayment']) {
    const helperStart = routeSource.indexOf(`export function ${guardedHelper}`)
    const helperEnd = routeSource.indexOf('\nexport function ', helperStart + 1)
    const helperSource = routeSource.slice(helperStart, helperEnd === -1 ? routeSource.length : helperEnd)
    if (!helperSource.includes('guardLoginAction')) {
      errors.push(`common/utils/route.js ${guardedHelper} must use guardLoginAction`);
    }
  }
}

const orderPath = path.join(root, 'common/api/order.js');
if (fs.existsSync(orderPath)) {
  const orderSource = fs.readFileSync(orderPath, 'utf8');
  for (const helper of ['ensureOrderForActivity', 'getOrderForActivity', 'getOrderDetail', 'listOrdersByStatus', 'refundOrder', 'closeOrder', 'getOrderStatusText', 'updateOrderStatus']) {
    if (!orderSource.includes(helper)) {
      errors.push(`common/api/order.js is missing ${helper}`);
    }
  }
  for (const token of ['USE_UNICLOUD', 'callSuregoFunction']) {
    if (!orderSource.includes(token)) {
      errors.push(`common/api/order.js is missing ${token}`);
    }
  }
}

const orderSchemaPath = path.join(root, 'uniCloud-aliyun/database/surego-orders.schema.json');
if (fs.existsSync(orderSchemaPath)) {
  const schema = JSON.parse(fs.readFileSync(orderSchemaPath, 'utf8'));
  for (const field of ['closed_at', 'refund_note', 'close_reason', 'activity_title', 'activity_cover']) {
    if (!schema.properties?.[field]) {
      errors.push(`surego-orders schema is missing ${field}`);
    }
  }
}

const messagePath = path.join(root, 'common/api/message.js');
if (fs.existsSync(messagePath)) {
  const messageSource = fs.readFileSync(messagePath, 'utf8');
  for (const helper of ['createMessage', 'listMessages', 'markMessageRead', 'markAllMessagesRead']) {
    if (!messageSource.includes(helper)) {
      errors.push(`common/api/message.js is missing ${helper}`);
    }
  }
  for (const token of ['USE_UNICLOUD', 'callSuregoFunction']) {
    if (!messageSource.includes(token)) {
      errors.push(`common/api/message.js is missing ${token}`);
    }
  }
}

const checkinPath = path.join(root, 'common/api/checkin.js');
if (fs.existsSync(checkinPath)) {
  const checkinSource = fs.readFileSync(checkinPath, 'utf8');
  for (const helper of ['createCheckinCode', 'confirmCheckin', 'listCheckins', 'getCheckinSummary', 'getCheckinForUser', 'hasCheckedIn', 'isValidCheckinCode']) {
    if (!checkinSource.includes(helper)) {
      errors.push(`common/api/checkin.js is missing ${helper}`);
    }
  }
  for (const token of ['USE_UNICLOUD', 'callSuregoFunction']) {
    if (!checkinSource.includes(token)) {
      errors.push(`common/api/checkin.js is missing ${token}`);
    }
  }
}

const checkinSchemaPath = path.join(root, 'uniCloud-aliyun/database/surego-checkins.schema.json');
if (fs.existsSync(checkinSchemaPath)) {
  const schema = JSON.parse(fs.readFileSync(checkinSchemaPath, 'utf8'));
  for (const field of ['checked_by', 'source', 'remark']) {
    if (!schema.properties?.[field]) {
      errors.push(`surego-checkins schema is missing ${field}`);
    }
  }
}

const activityApiPath = path.join(root, 'common/api/activity.js');
if (fs.existsSync(activityApiPath)) {
  const activitySource = fs.readFileSync(activityApiPath, 'utf8');
  if (!activitySource.includes('updateActivity(')) {
    errors.push('common/api/activity.js is missing updateActivity');
  }
  for (const helper of ['ACTIVITY_LIFECYCLE_STATUSES', 'normalizeActivityStatus', 'normalizeActivityRecord', 'applicationStatus']) {
    if (!activitySource.includes(helper)) {
      errors.push(`common/api/activity.js is missing ${helper}`);
    }
  }
}

const userApiPath = path.join(root, 'common/api/user.js');
if (fs.existsSync(userApiPath)) {
  const userSource = fs.readFileSync(userApiPath, 'utf8');
  for (const helper of ['getCurrentUser', 'updateCurrentUser', 'syncCurrentUserProfile']) {
    if (!userSource.includes(helper)) {
      errors.push(`common/api/user.js is missing ${helper}`);
    }
  }
  for (const token of ['USE_UNICLOUD', 'callSuregoFunction', 'setMockLogin']) {
    if (!userSource.includes(token)) {
      errors.push(`common/api/user.js is missing ${token}`);
    }
  }
}

const runtimePath = path.join(root, 'common/config/runtime.js');
if (fs.existsSync(runtimePath)) {
  const runtimeSource = fs.readFileSync(runtimePath, 'utf8');
  if (!runtimeSource.includes('USE_UNICLOUD')) {
    errors.push('common/config/runtime.js is missing USE_UNICLOUD');
  }
}

const cloudApiPath = path.join(root, 'common/api/cloud.js');
if (fs.existsSync(cloudApiPath)) {
  const cloudSource = fs.readFileSync(cloudApiPath, 'utf8');
  for (const token of ['callSuregoFunction', 'uniCloud.callFunction']) {
    if (!cloudSource.includes(token)) {
      errors.push(`common/api/cloud.js is missing ${token}`);
    }
  }
}

const authApiPath = path.join(root, 'common/api/auth.js');
if (fs.existsSync(authApiPath)) {
  const authSource = fs.readFileSync(authApiPath, 'utf8');
  for (const helper of ['getCurrentUserId', 'getCurrentUserProfile', 'requireLogin']) {
    if (!authSource.includes(helper)) {
      errors.push(`common/api/auth.js is missing ${helper}`);
    }
  }
  for (const helper of ['isLoggedIn', 'setMockLogin', 'logout']) {
    if (!authSource.includes(helper)) {
      errors.push(`common/api/auth.js is missing ${helper}`);
    }
  }
  if (!authSource.includes('saveCurrentUserProfile')) {
    errors.push('common/api/auth.js is missing saveCurrentUserProfile');
  }
  for (const token of ['uniCloud.getCurrentUserInfo', 'uni-id-pages-userInfo', 'mock_user']) {
    if (!authSource.includes(token)) {
      errors.push(`common/api/auth.js is missing ${token}`);
    }
  }
}

for (const apiFile of ['common/api/activity.js', 'common/api/application.js']) {
  const absolute = path.join(root, apiFile);
  if (!fs.existsSync(absolute)) continue;
  const source = fs.readFileSync(absolute, 'utf8');
  for (const token of ['USE_UNICLOUD', 'callSuregoFunction']) {
    if (!source.includes(token)) {
      errors.push(`${apiFile} is missing ${token}`);
    }
  }
}

const applicationApiPath = path.join(root, 'common/api/application.js');
if (fs.existsSync(applicationApiPath)) {
  const applicationSource = fs.readFileSync(applicationApiPath, 'utf8');
  for (const token of ['reviewNote', 'rejectReason', 'reviewerId']) {
    if (!applicationSource.includes(token)) {
      errors.push(`common/api/application.js is missing ${token}`);
    }
  }
}

for (const apiFile of ['common/api/activity.js', 'common/api/application.js', 'common/api/order.js', 'common/api/message.js', 'common/api/checkin.js', 'common/api/user.js']) {
  const absolute = path.join(root, apiFile);
  if (!fs.existsSync(absolute)) continue;
  const source = fs.readFileSync(absolute, 'utf8');
  if (!source.includes('@/common/api/auth.js')) {
    errors.push(`${apiFile} must import the auth facade`);
  }
  if (source.includes('CURRENT_USER_ID')) {
    errors.push(`${apiFile} must not define a local CURRENT_USER_ID`);
  }
}

for (const cloudFile of [
  'uniCloud-aliyun/cloudfunctions/surego-activity/index.js',
  'uniCloud-aliyun/cloudfunctions/surego-application/index.js'
]) {
  const absolute = path.join(root, cloudFile);
  if (!fs.existsSync(absolute)) continue;
  const source = fs.readFileSync(absolute, 'utf8');
  if (!source.includes('normalize')) {
    errors.push(`${cloudFile} is missing normalize helpers`);
  }
}

const applicationCloudPath = path.join(root, 'uniCloud-aliyun/cloudfunctions/surego-application/index.js');
if (fs.existsSync(applicationCloudPath)) {
  const source = fs.readFileSync(applicationCloudPath, 'utf8');
  for (const token of ['reviewNote', 'rejectReason', 'reviewerId']) {
    if (!source.includes(token)) {
      errors.push(`surego-application cloud function is missing ${token}`);
    }
  }
}

const manageDashboardPath = path.join(root, 'pages/manage/dashboard.vue');
if (fs.existsSync(manageDashboardPath)) {
  const source = fs.readFileSync(manageDashboardPath, 'utf8');
  if (!source.includes('updateActivityStatus')) {
    errors.push('pages/manage/dashboard.vue is missing updateActivityStatus');
  }
  for (const status of ['draft', 'reviewing', 'published', 'recruiting', 'formed', 'ongoing', 'finished', 'cancelled']) {
    if (!source.includes(status)) {
      errors.push(`pages/manage/dashboard.vue is missing lifecycle action ${status}`);
    }
  }
}

const activityCloudPath = path.join(root, 'uniCloud-aliyun/cloudfunctions/surego-activity/index.js');
if (fs.existsSync(activityCloudPath)) {
  const source = fs.readFileSync(activityCloudPath, 'utf8');
  if (!source.includes("action === 'update'")) {
    errors.push('surego-activity cloud function is missing update action');
  }
  if (!source.includes('normalizeStatus')) {
    errors.push('surego-activity cloud function is missing normalizeStatus');
  }
  if (source.includes("status: payload.status || 'hosting'")) {
    errors.push('surego-activity cloud function still defaults to legacy hosting status');
  }
}

const orderCloudPath = path.join(root, 'uniCloud-aliyun/cloudfunctions/surego-order/index.js');
if (fs.existsSync(orderCloudPath)) {
  const source = fs.readFileSync(orderCloudPath, 'utf8');
  if (!source.includes('normalize')) {
    errors.push('surego-order cloud function is missing normalize helpers');
  }
  for (const action of ["action === 'ensureForActivity'", "action === 'getForActivity'", "action === 'getDetail'", "action === 'updateStatus'", "action === 'refund'", "action === 'close'"]) {
    if (!source.includes(action)) {
      errors.push(`surego-order cloud function is missing ${action}`);
    }
  }
}

const participantDashboardPath = path.join(root, 'pages/participant/dashboard.vue');
if (fs.existsSync(participantDashboardPath)) {
  const source = fs.readFileSync(participantDashboardPath, 'utf8');
  if (source.includes("userId === 'mock_user'")) {
    errors.push('pages/participant/dashboard.vue must not filter by hard-coded mock_user');
  }
  if (!source.includes('getCurrentUserId')) {
    errors.push('pages/participant/dashboard.vue must use getCurrentUserId');
  }
  if (!source.includes('goOrderDetail')) {
    errors.push('pages/participant/dashboard.vue is missing goOrderDetail');
  }
}

const userProfilePath = path.join(root, 'pages/user/profile.vue');
if (fs.existsSync(userProfilePath)) {
  const source = fs.readFileSync(userProfilePath, 'utf8');
  for (const token of ['orderFilters', 'filteredOrders', 'goOrderDetail']) {
    if (!source.includes(token)) {
      errors.push(`pages/user/profile.vue is missing ${token}`);
    }
  }
}

const messageCloudPath = path.join(root, 'uniCloud-aliyun/cloudfunctions/surego-message/index.js');
if (fs.existsSync(messageCloudPath)) {
  const source = fs.readFileSync(messageCloudPath, 'utf8');
  if (!source.includes('normalize')) {
    errors.push('surego-message cloud function is missing normalize helpers');
  }
  for (const action of ["action === 'create'", "action === 'list'", "action === 'markRead'", "action === 'markAllRead'"]) {
    if (!source.includes(action)) {
      errors.push(`surego-message cloud function is missing ${action}`);
    }
  }
}

const checkinCloudPath = path.join(root, 'uniCloud-aliyun/cloudfunctions/surego-checkin/index.js');
if (fs.existsSync(checkinCloudPath)) {
  const source = fs.readFileSync(checkinCloudPath, 'utf8');
  if (!source.includes('normalize')) {
    errors.push('surego-checkin cloud function is missing normalize helpers');
  }
  for (const action of ["action === 'createCode'", "action === 'confirm'", "action === 'listByActivity'", "action === 'summary'"]) {
    if (!source.includes(action)) {
      errors.push(`surego-checkin cloud function is missing ${action}`);
    }
  }
  for (const token of ['findExistingCheckin', 'checked_by', 'source', 'remark']) {
    if (!source.includes(token)) {
      errors.push(`surego-checkin cloud function is missing ${token}`);
    }
  }
}

const manageCheckinPath = path.join(root, 'pages/manage/checkin.vue');
if (fs.existsSync(manageCheckinPath)) {
  const source = fs.readFileSync(manageCheckinPath, 'utf8');
  for (const token of ['isValidCheckinCode', "source: 'manual'", "source: 'scan'", 'nextCheckablePerson']) {
    if (!source.includes(token)) {
      errors.push(`pages/manage/checkin.vue is missing ${token}`);
    }
  }
}

const participantCheckinPath = path.join(root, 'pages/participant/dashboard.vue');
if (fs.existsSync(participantCheckinPath)) {
  const source = fs.readFileSync(participantCheckinPath, 'utf8');
  if (!source.includes('getCheckinForUser')) {
    errors.push('pages/participant/dashboard.vue is missing getCheckinForUser');
  }
  if (source.includes('listCheckins(activityId.value)')) {
    errors.push('pages/participant/dashboard.vue should use getCheckinForUser instead of scanning all checkins');
  }
}

for (const file of [...requiredFiles, ...expectedCloudFunctions].filter((item) => item.endsWith('.vue') || item.endsWith('.js'))) {
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute)) continue;
  const source = fs.readFileSync(absolute, 'utf8');
  for (const pattern of bannedPatterns) {
    if (pattern.test(source)) {
      errors.push(`${file} contains banned pattern: ${pattern}`);
    }
  }

  if (file.endsWith('.vue')) {
    const match = source.match(/<script setup>([\s\S]*?)<\/script>/);
    if (match) {
      const parseableScript = match[1].replace(/^import[^\n]*\n/gm, '');
      try {
        new Function(parseableScript);
      } catch (error) {
        errors.push(`${file} has invalid script syntax: ${error.message}`);
      }
    }
  }

  if (expectedCloudFunctions.includes(file)) {
    try {
      new Function(source);
    } catch (error) {
      errors.push(`${file} has invalid cloud function syntax: ${error.message}`);
    }
  }
}

const lifecycleSchemaPath = path.join(root, 'uniCloud-aliyun/database/surego-activities.schema.json');
if (fs.existsSync(lifecycleSchemaPath)) {
  const schema = JSON.parse(fs.readFileSync(lifecycleSchemaPath, 'utf8'));
  const enumValues = schema.properties?.status?.enum || [];
  for (const status of ['draft', 'reviewing', 'published', 'recruiting', 'formed', 'ongoing', 'finished', 'cancelled']) {
    if (!enumValues.includes(status)) {
      errors.push(`surego-activities status enum is missing ${status}`);
    }
  }
}

for (const file of requiredFiles.filter((item) => item.endsWith('.vue') && item.startsWith('pages/'))) {
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute)) continue;
  const source = fs.readFileSync(absolute, 'utf8');
  if (source.includes('uniCloud.callFunction')) {
    errors.push(`${file} must use common/api facade instead of uniCloud.callFunction`);
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('SureGo smoke check passed.');
