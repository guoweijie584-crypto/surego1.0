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
  'pages/home/index.vue',
  'pages/discover/index.vue',
  'pages/discover/search.vue',
  'pages/discover/city.vue',
  'pages/calendar/index.vue',
  'pages/messages/index.vue',
  'pages/user/profile.vue',
  'pages/user/edit.vue',
  'pages/activity/detail.vue',
  'pages/activity/register.vue',
  'pages/activity/create.vue',
  'pages/activity/edit.vue',
  'pages/manage/dashboard.vue',
  'pages/manage/checkin.vue',
  'pages/participant/dashboard.vue',
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
  'pages/user/profile',
  'pages/user/edit',
  'pages/activity/detail',
  'pages/activity/register',
  'pages/activity/create',
  'pages/activity/edit',
  'pages/manage/dashboard',
  'pages/manage/checkin',
  'pages/participant/dashboard',
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
}

const orderPath = path.join(root, 'common/api/order.js');
if (fs.existsSync(orderPath)) {
  const orderSource = fs.readFileSync(orderPath, 'utf8');
  for (const helper of ['ensureOrderForActivity', 'getOrderForActivity', 'updateOrderStatus']) {
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
  for (const helper of ['createCheckinCode', 'confirmCheckin', 'listCheckins', 'getCheckinSummary']) {
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

const activityApiPath = path.join(root, 'common/api/activity.js');
if (fs.existsSync(activityApiPath)) {
  const activitySource = fs.readFileSync(activityApiPath, 'utf8');
  if (!activitySource.includes('updateActivity(')) {
    errors.push('common/api/activity.js is missing updateActivity');
  }
}

const userApiPath = path.join(root, 'common/api/user.js');
if (fs.existsSync(userApiPath)) {
  const userSource = fs.readFileSync(userApiPath, 'utf8');
  for (const helper of ['getCurrentUser', 'updateCurrentUser']) {
    if (!userSource.includes(helper)) {
      errors.push(`common/api/user.js is missing ${helper}`);
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

const activityCloudPath = path.join(root, 'uniCloud-aliyun/cloudfunctions/surego-activity/index.js');
if (fs.existsSync(activityCloudPath)) {
  const source = fs.readFileSync(activityCloudPath, 'utf8');
  if (!source.includes("action === 'update'")) {
    errors.push('surego-activity cloud function is missing update action');
  }
}

const orderCloudPath = path.join(root, 'uniCloud-aliyun/cloudfunctions/surego-order/index.js');
if (fs.existsSync(orderCloudPath)) {
  const source = fs.readFileSync(orderCloudPath, 'utf8');
  if (!source.includes('normalize')) {
    errors.push('surego-order cloud function is missing normalize helpers');
  }
  for (const action of ["action === 'ensureForActivity'", "action === 'getForActivity'", "action === 'updateStatus'"]) {
    if (!source.includes(action)) {
      errors.push(`surego-order cloud function is missing ${action}`);
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
