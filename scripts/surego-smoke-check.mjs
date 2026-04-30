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
  'components/surego/SuWechatProfileSheet.vue',
  'common/config/runtime.js',
  'common/api/auth.js',
  'common/api/cloud.js',
  'common/utils/share.js',
  'common/utils/city.js',
  'common/utils/cover-presets.js',
  'common/utils/code128.js',
  'common/api/activity.js',
  'common/api/application.js',
  'common/api/order.js',
  'common/api/message.js',
  'common/api/checkin.js',
  'common/api/user.js',
  'common/api/upload.js',
  'common/api/location.js',
  'uni_modules/unicloud-city-select/components/unicloud-city-select/unicloud-city-select.vue',
  'uni_modules/unicloud-city-select/pages/uni-city-list/uni-city-list.vue',
  'common/api/member.js',
  'common/api/moderation.js',
  'scripts/surego-cloud-integration-check.mjs',
  'pages/home/index.vue',
  'pages/discover/index.vue',
  'pages/discover/search.vue',
  'pages/discover/city.vue',
  'pages/calendar/index.vue',
  'pages/messages/index.vue',
  'pages/auth/login.vue',
  'pages/user/profile.vue',
  'pages/user/detail.vue',
  'pages/user/edit.vue',
  'pages/ops/dashboard.vue',
  'pages/ops/reports.vue',
  'pages/ops/users.vue',
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
  'pages/user/detail',
  'pages/user/edit',
  'pages/ops/dashboard',
  'pages/ops/reports',
  'pages/ops/users',
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

const staleDemoPages = [
  'pages/cloudFunction/cloudFunction',
  'pages/cloudObject/cloudObject',
  'pages/storage/storage',
  'pages/clientDB/clientDB',
  'pages/schema2code/schema2code',
  'uni_modules/uni-id-pages/pages/login/login-withoutpwd'
];

const expectedSchemas = [
  'uniCloud-aliyun/database/surego-activities.schema.json',
  'uniCloud-aliyun/database/surego-applications.schema.json',
  'uniCloud-aliyun/database/surego-orders.schema.json',
  'uniCloud-aliyun/database/surego-messages.schema.json',
  'uniCloud-aliyun/database/surego-checkins.schema.json',
  'uniCloud-aliyun/database/surego-reports.schema.json',
  'uniCloud-aliyun/database/surego-audit-logs.schema.json',
  'uniCloud-aliyun/database/surego-users.schema.json'
];

const expectedCloudFunctions = [
  'uniCloud-aliyun/cloudfunctions/surego-activity/index.js',
  'uniCloud-aliyun/cloudfunctions/surego-application/index.js',
  'uniCloud-aliyun/cloudfunctions/surego-order/index.js',
  'uniCloud-aliyun/cloudfunctions/surego-message/index.js',
  'uniCloud-aliyun/cloudfunctions/surego-checkin/index.js',
  'uniCloud-aliyun/cloudfunctions/surego-moderation/index.js',
  'uniCloud-aliyun/cloudfunctions/surego-user/index.js'
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

const activityFormPages = ['pages/activity/create.vue', 'pages/activity/edit.vue'];
const requiredKeyboardAttributes = ['adjust-position="false"', 'cursor-spacing="80"'];

function getNativeFormControlTags(source) {
  return source.match(/<(?:input|textarea)\b[^>]*>/g) || [];
}

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
    if (!pagePaths.has('uni_modules/unicloud-city-select/pages/uni-city-list/uni-city-list')) {
      errors.push('pages.json is missing unicloud-city-select city list route');
    }
    const citySelectPage = (config.pages || []).find((item) => item.path === 'uni_modules/unicloud-city-select/pages/uni-city-list/uni-city-list');
    if (citySelectPage?.style?.navigationBarTitleText !== '选择城市') {
      errors.push('unicloud-city-select route title must be Chinese: 选择城市');
    }
    for (const page of staleDemoPages) {
      if (pagePaths.has(page)) {
        errors.push(`Remove stale demo route from pages.json: ${page}`);
      }
    }
    if ((config.pages || [])[0]?.path !== 'pages/home/index') {
      errors.push('pages/home/index must be the startup page');
    }
    for (const pagePath of ['pages/activity/create', 'pages/activity/edit']) {
      const page = (config.pages || []).find((item) => item.path === pagePath);
      if (page && page.style?.disableScroll !== true) {
        errors.push(`${pagePath} must set style.disableScroll to true`);
      }
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
  for (const helper of ['goHomeRoot', 'goDiscoverRoot']) {
    if (!dockSource.includes(helper)) {
      errors.push(`SuBottomDock.vue must use root navigation helper: ${helper}`);
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
  for (const helper of ['goOpsDashboard', 'goOpsReports']) {
    if (!routeSource.includes(helper)) {
      errors.push(`common/utils/route.js is missing ${helper}`);
    }
  }
  if (!routeSource.includes('goOpsUsers')) {
    errors.push('common/utils/route.js is missing goOpsUsers');
  }
  for (const helper of ['goAuthLogin', 'guardLoginAction']) {
    if (!routeSource.includes(helper)) {
      errors.push(`common/utils/route.js is missing ${helper}`);
    }
  }
  for (const helper of ['goBackOrFallback', 'goHomeRoot', 'goDiscoverRoot']) {
    if (!routeSource.includes(helper)) {
      errors.push(`common/utils/route.js is missing stack navigation helper: ${helper}`);
    }
  }
  for (const token of ['options.replace', 'options.root', "typeof fallbackUrl === 'string'", 'export function goPayment(params = {}, options = {})']) {
    if (!routeSource.includes(token)) {
      errors.push(`common/utils/route.js is missing stack-safe navigation token: ${token}`);
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

const shareUtilPath = path.join(root, 'common/utils/share.js');
if (fs.existsSync(shareUtilPath)) {
  const source = fs.readFileSync(shareUtilPath, 'utf8');
  for (const helper of ['buildActivitySharePath', 'buildActivityShareTitle', 'buildActivitySharePayload', 'buildActivityPosterCopy']) {
    if (!source.includes(helper)) {
      errors.push(`common/utils/share.js is missing ${helper}`);
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

const moderationApiPath = path.join(root, 'common/api/moderation.js');
if (fs.existsSync(moderationApiPath)) {
  const moderationSource = fs.readFileSync(moderationApiPath, 'utf8');
  for (const helper of ['createReport', 'listReports', 'updateReportStatus', 'listOpsActivities', 'moderateActivity', 'getOpsStats']) {
    if (!moderationSource.includes(helper)) {
      errors.push(`common/api/moderation.js is missing ${helper}`);
    }
  }
  for (const token of ['USE_UNICLOUD', 'callSuregoFunction', '@/common/api/auth.js']) {
    if (!moderationSource.includes(token)) {
      errors.push(`common/api/moderation.js is missing ${token}`);
    }
  }
  for (const token of ['getModerationEventType', 'restored', 'previousModerationStatus', 'report:handled']) {
    if (!moderationSource.includes(token)) {
      errors.push(`common/api/moderation.js is missing moderation notification guard: ${token}`);
    }
  }
}

const activityModerationSchemaPath = path.join(root, 'uniCloud-aliyun/database/surego-activities.schema.json');
if (fs.existsSync(activityModerationSchemaPath)) {
  const schema = JSON.parse(fs.readFileSync(activityModerationSchemaPath, 'utf8'));
  for (const field of ['moderation_status', 'moderation_note', 'moderated_at', 'moderated_by']) {
    if (!schema.properties?.[field]) {
      errors.push(`surego-activities schema is missing ${field}`);
    }
  }
  const moderationEnum = schema.properties?.moderation_status?.enum || [];
  for (const status of ['pending', 'approved', 'rejected', 'hidden']) {
    if (!moderationEnum.includes(status)) {
      errors.push(`surego-activities moderation_status enum is missing ${status}`);
    }
  }
}

for (const [file, fields] of Object.entries({
  'uniCloud-aliyun/database/surego-reports.schema.json': ['activity_id', 'reporter_id', 'status', 'reason'],
  'uniCloud-aliyun/database/surego-audit-logs.schema.json': ['operator_id', 'action', 'target_type', 'target_id']
})) {
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute)) continue;
  const schema = JSON.parse(fs.readFileSync(absolute, 'utf8'));
  for (const field of fields) {
    if (!(schema.required || []).includes(field)) {
      errors.push(`${file} must require ${field}`);
    }
  }
}

const messagePath = path.join(root, 'common/api/message.js');
if (fs.existsSync(messagePath)) {
  const messageSource = fs.readFileSync(messagePath, 'utf8');
  for (const helper of ['createMessage', 'listMessages', 'markMessageRead', 'markAllMessagesRead', 'getUnreadMessageCount']) {
    if (!messageSource.includes(helper)) {
      errors.push(`common/api/message.js is missing ${helper}`);
    }
  }
  for (const token of ['USE_UNICLOUD', 'callSuregoFunction']) {
    if (!messageSource.includes(token)) {
      errors.push(`common/api/message.js is missing ${token}`);
    }
  }
  for (const staleToken of ['defaultMessages', 'getSeedMessages', 'msg_default']) {
    if (messageSource.includes(staleToken)) {
      errors.push(`common/api/message.js must not seed trial messages with ${staleToken}`);
    }
  }
  if (!messageSource.includes('filter((item) => isCurrentUserMessage(item, userId))')) {
    errors.push('common/api/message.js must only list local messages for the current user');
  }
}

const checkinPath = path.join(root, 'common/api/checkin.js');
if (fs.existsSync(checkinPath)) {
  const checkinSource = fs.readFileSync(checkinPath, 'utf8');
  for (const helper of ['createCheckinCode', 'confirmCheckin', 'listCheckins', 'getCheckinSummary', 'getCheckinForUser', 'hasCheckedIn', 'isValidCheckinCode', 'buildParticipantCheckinCode', 'parseScannedCheckinCode']) {
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
  for (const helper of ['ACTIVITY_LIFECYCLE_STATUSES', 'normalizeActivityStatus', 'normalizeActivityRecord', 'applicationStatus', 'isCurrentUserActivityCreator']) {
    if (!activitySource.includes(helper)) {
      errors.push(`common/api/activity.js is missing ${helper}`);
    }
  }
  for (const helper of ['PUBLIC_ACTIVITY_MODERATION_STATUSES', 'isPubliclyVisibleActivity', 'listAllActivities']) {
    if (!activitySource.includes(helper)) {
      errors.push(`common/api/activity.js is missing review visibility helper: ${helper}`);
    }
  }
  for (const helper of ['getActivityStatusMeta', 'sortActivitiesByStatusPriority', 'isHomeVisibleMyActivity', 'ACTIVITY_STATUS_FILTERS', 'filterActivitiesByStatusGroup']) {
    if (!activitySource.includes(helper)) {
      errors.push(`common/api/activity.js is missing activity status display helper: ${helper}`);
    }
  }
  for (const token of ["status: normalizeActivityStatus(form.status || 'reviewing')", "moderationStatus: 'pending'", "moderation_status: 'pending'", "'surego-activity', 'listMine'"]) {
    if (!activitySource.includes(token)) {
      errors.push(`common/api/activity.js is missing review-gated creation token: ${token}`);
    }
  }
  for (const token of ['DEFAULT_CITY_CODE', 'cityCode', 'city_code', 'listActivitiesByCity(city = DEFAULT_CITY, cityCode = \'\')']) {
    if (!activitySource.includes(token)) {
      errors.push(`common/api/activity.js is missing city selection token: ${token}`);
    }
  }
  if (activitySource.includes('isCreator: form.isCreator') || activitySource.includes('item.isCreator)') || activitySource.includes('activity.isCreator ||')) {
    errors.push('common/api/activity.js must derive ownership from creator_id/current user instead of trusting isCreator');
  }
}

const userApiPath = path.join(root, 'common/api/user.js');
if (fs.existsSync(userApiPath)) {
  const userSource = fs.readFileSync(userApiPath, 'utf8');
  for (const helper of ['getCurrentUser', 'updateCurrentUser', 'syncCurrentUserProfile', 'listUsers', 'updateUserRoles', 'getRoleLabel']) {
    if (!userSource.includes(helper)) {
      errors.push(`common/api/user.js is missing ${helper}`);
    }
  }
  for (const token of ['USE_UNICLOUD', 'callSuregoFunction', 'setMockLogin']) {
    if (!userSource.includes(token)) {
      errors.push(`common/api/user.js is missing ${token}`);
    }
  }
  for (const action of ['listUsers', 'updateUserRoles']) {
    if (!userSource.includes(`'${action}'`) && !userSource.includes(`"${action}"`)) {
      errors.push(`common/api/user.js must call surego-user ${action}`);
    }
  }
  if (userSource.includes("nickname: '吴哈哈'") || userSource.includes("|| '吴哈哈'")) {
    errors.push('common/api/user.js must not use 吴哈哈 as a real login profile fallback');
  }
}

const cloudApiPath = path.join(root, 'common/api/cloud.js');
if (fs.existsSync(cloudApiPath)) {
  const cloudSource = fs.readFileSync(cloudApiPath, 'utf8');
  for (const token of ['callSuregoFunction', 'uniCloud.callFunction', 'uni_id_token', 'getCurrentUserId', 'uniIdToken', 'AUTH_ERROR_CODES', 'logout']) {
    if (!cloudSource.includes(token)) {
      errors.push(`common/api/cloud.js is missing ${token}`);
    }
  }
}

const runtimePath = path.join(root, 'common/config/runtime.js');
if (fs.existsSync(runtimePath)) {
  const runtimeSource = fs.readFileSync(runtimePath, 'utf8');
  for (const token of ['USE_UNICLOUD', 'ALLOW_MOCK_FALLBACK', 'APP_MODE', 'isTrialMode', 'shouldUseCloudFallback']) {
    if (!runtimeSource.includes(token)) {
      errors.push(`common/config/runtime.js is missing ${token}`);
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
  for (const helper of ['loginWithWeixin', 'loginWithMockFallback', 'persistUniIdSession']) {
    if (!authSource.includes(helper)) {
      errors.push(`common/api/auth.js is missing ${helper}`);
    }
  }
  for (const helper of ['isOpsUser', 'hasOpsRole']) {
    if (!authSource.includes(helper)) {
      errors.push(`common/api/auth.js is missing ${helper}`);
    }
  }
  for (const token of ['uniCloud.getCurrentUserInfo', 'uni-id-pages-userInfo', 'mock_user', 'uni.login', 'uni-id-co', 'user-center']) {
    if (!authSource.includes(token)) {
      errors.push(`common/api/auth.js is missing ${token}`);
    }
  }
  if (authSource.includes("|| '吴哈哈'") || authSource.includes("nickname: '吴哈哈'")) {
    errors.push('common/api/auth.js must not use 吴哈哈 as a real login profile fallback');
  }
}

const authLoginPath = path.join(root, 'pages/auth/login.vue');
if (fs.existsSync(authLoginPath)) {
  const source = fs.readFileSync(authLoginPath, 'utf8');
  if (!source.includes('loginWithWeixin')) {
    errors.push('pages/auth/login.vue must call loginWithWeixin from the auth facade');
  }
  if (source.includes('setMockLogin')) {
    errors.push('pages/auth/login.vue must not directly call setMockLogin');
  }
  if (!source.includes('isLoggingIn')) {
    errors.push('pages/auth/login.vue must prevent duplicate login taps with isLoggingIn');
  }
  if (!source.includes('SuWechatProfileSheet') || !source.includes('profileSheetVisible')) {
    errors.push('pages/auth/login.vue must show the WeChat profile sheet after first login when profile is incomplete');
  }
}

const wechatProfileSheetPath = path.join(root, 'components/surego/SuWechatProfileSheet.vue');
if (fs.existsSync(wechatProfileSheetPath)) {
  const source = fs.readFileSync(wechatProfileSheetPath, 'utf8');
  for (const token of ['open-type="chooseAvatar"', '@chooseavatar', 'type="nickname"', 'syncCurrentUserProfile', 'uploadImageFile']) {
    if (!source.includes(token)) {
      errors.push(`SuWechatProfileSheet.vue is missing ${token}`);
    }
  }
  if (source.includes('tempFilePaths[0]')) {
    errors.push('SuWechatProfileSheet.vue must not persist tempFilePaths[0] directly');
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
  for (const token of ['getApplicationForActivity', 'getMineByActivity', 'writeApplicationCache', 'adjustLocalActivityParticipantCount']) {
    if (!applicationSource.includes(token)) {
      errors.push(`common/api/application.js is missing duplicate-application/member-count guard: ${token}`);
    }
  }
}

const memberApiPath = path.join(root, 'common/api/member.js');
if (fs.existsSync(memberApiPath)) {
  const source = fs.readFileSync(memberApiPath, 'utf8');
  for (const token of ['fallbackName', 'applicantName', 'applicantAvatar', "role: '参与者'"]) {
    if (!source.includes(token)) {
      errors.push(`common/api/member.js must avoid generic applicant placeholders with ${token}`);
    }
  }
}

for (const apiFile of ['common/api/activity.js', 'common/api/application.js', 'common/api/order.js', 'common/api/message.js', 'common/api/checkin.js', 'common/api/user.js', 'common/api/moderation.js', 'common/api/member.js']) {
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

const uploadApiPath = path.join(root, 'common/api/upload.js');
if (fs.existsSync(uploadApiPath)) {
  const uploadSource = fs.readFileSync(uploadApiPath, 'utf8');
  for (const token of ['chooseAndUploadImage', 'uploadImageFile', 'uni.chooseImage', 'uniCloud.uploadFile', 'ALLOW_MOCK_FALLBACK', 'USER_CANCEL_IMAGE_PICKER', 'isImagePickerCancel']) {
    if (!uploadSource.includes(token)) {
      errors.push(`common/api/upload.js is missing ${token}`);
    }
  }
}

const locationApiPath = path.join(root, 'common/api/location.js');
if (fs.existsSync(locationApiPath)) {
  const source = fs.readFileSync(locationApiPath, 'utf8');
  for (const token of ['getCurrentLocation', 'refreshCurrentLocation', 'getStoredLocation', 'uni.getLocation', 'sortActivitiesByDistance']) {
    if (!source.includes(token)) {
      errors.push(`common/api/location.js is missing ${token}`);
    }
  }
}

const routeUtilPath = path.join(root, 'common/utils/route.js');
if (fs.existsSync(routeUtilPath)) {
  const source = fs.readFileSync(routeUtilPath, 'utf8');
  for (const token of ['getMiniProgramNavMetrics', 'getWindowInfo', 'getMenuButtonBoundingClientRect', 'getMiniProgramNavStyle', 'getMiniProgramNavRowStyle', 'getMiniProgramNavActionsStyle', 'getMiniProgramNavContentStyle', 'boxSizing', 'rightReserveRpx', 'maxWidth']) {
    if (!source.includes(token)) {
      errors.push(`common/utils/route.js is missing mini-program capsule helper token: ${token}`);
    }
  }
}

for (const page of [
  'pages/home/index',
  'pages/discover/index',
  'pages/discover/search',
  'pages/discover/city',
  'pages/calendar/index',
  'pages/activity/detail',
  'pages/activity/register',
  'pages/activity/create',
  'pages/activity/edit',
  'pages/activity/members',
  'pages/messages/index',
  'pages/manage/dashboard',
  'pages/manage/checkin',
  'pages/my/activities',
  'pages/order/detail',
  'pages/payment/index',
  'pages/participant/dashboard',
  'pages/share/poster',
  'pages/status/success',
  'pages/user/profile',
  'pages/user/edit',
  'pages/auth/login',
  'pages/ops/dashboard',
  'pages/ops/reports',
  'pages/ops/users'
]) {
  const absolute = path.join(root, `${page}.vue`);
  if (!fs.existsSync(absolute)) continue;
  const source = fs.readFileSync(absolute, 'utf8');
  for (const token of ['getMiniProgramNavStyle', 'getMiniProgramNavRowStyle']) {
    if (!source.includes(token)) {
      errors.push(`${page}.vue must use mini-program nav metrics helper: ${token}`);
    }
  }
  if (source.includes('topSafeStyle') || source.includes('getCapsuleSafeAreaStyle')) {
    errors.push(`${page}.vue must not rely on padding-only capsule safe-area helpers`);
  }
  if (source.includes('height: 132rpx')) {
    errors.push(`${page}.vue must not hard-code custom nav height instead of capsule metrics`);
  }
  for (const fixedToken of ['padding: 58rpx', 'height: calc(100vh - 154rpx)', 'height: calc(100vh - 158rpx)', 'height: calc(100vh - 280rpx)']) {
    if (source.includes(fixedToken)) {
      errors.push(`${page}.vue must not use fixed custom nav spacing token: ${fixedToken}`);
    }
  }
}

for (const page of expectedPages) {
  const absolute = path.join(root, `${page}.vue`);
  if (!fs.existsSync(absolute)) continue;
  const source = fs.readFileSync(absolute, 'utf8');
  if (source.includes('@/common/mock/activities.js')) {
    errors.push(`${page}.vue must not directly import common/mock/activities.js`);
  }
  if (source.includes('tempFilePaths[0]')) {
    errors.push(`${page}.vue must not store tempFilePaths[0] directly; use common/api/upload.js`);
  }
  if (source.includes('goBackHome')) {
    errors.push(`${page}.vue must use goBackOrFallback instead of legacy goBackHome`);
  }
  for (const phrase of ['后续迁移', '闭环跑通', '前端闭环', '当前阶段不调用真实微信支付', '确认模拟支付', '继续模拟支付', '模拟退款']) {
    if (source.includes(phrase)) {
      errors.push(`${page}.vue contains internal trial copy: ${phrase}`);
    }
  }
}

for (const cloudFile of expectedCloudFunctions) {
  const absolute = path.join(root, cloudFile);
  if (!fs.existsSync(absolute)) continue;
  const source = fs.readFileSync(absolute, 'utf8');
  if (source.includes("|| 'mock_user'") || source.includes("|| \"mock_user\"")) {
    errors.push(`${cloudFile} must not default write paths to mock_user`);
  }
  if (!source.includes('resolveUserContext')) {
    errors.push(`${cloudFile} is missing resolveUserContext auth helper`);
  }
  for (const token of ['uni-id-users', 'findUniIdUser', 'isTokenOwnedByUser', 'uniIdToken', 'exists']) {
    if (!source.includes(token)) {
      errors.push(`${cloudFile} must validate the current uid against uni-id-users before write/read operations`);
      break;
    }
  }
  if (source.includes('event.roles || payload.roles')) {
    errors.push(`${cloudFile} must not trust frontend-provided roles for cloud permissions`);
  }
  if (!source.includes('!user.exists')) {
    errors.push(`${cloudFile} auth checks must reject deleted/stale uni-id users with !user.exists`);
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
  for (const token of ["action === 'getMineByActivity'", 'getExistingApplication', 'dbCmd.inc(1)', 'Creator cannot apply to own activity']) {
    if (!source.includes(token)) {
      errors.push(`surego-application cloud function is missing duplicate/member sync token: ${token}`);
    }
  }
}

const manageDashboardPath = path.join(root, 'pages/manage/dashboard.vue');
if (fs.existsSync(manageDashboardPath)) {
  const source = fs.readFileSync(manageDashboardPath, 'utf8');
  for (const token of ['ensureOwnerAccess', 'goActivityDetail', 'getMiniProgramNavStyle', 'getMiniProgramNavRowStyle']) {
    if (!source.includes(token)) {
      errors.push(`pages/manage/dashboard.vue is missing owner/safe-area guard token: ${token}`);
    }
  }
  if (source.includes('@tap="goActivityDetail(activity.id)"')) {
    errors.push('pages/manage/dashboard.vue back arrow must use goBackOrFallback/handleBack instead of pushing activity detail');
  }
  if (!source.includes('updateActivityStatus')) {
    errors.push('pages/manage/dashboard.vue is missing updateActivityStatus');
  }
  for (const token of ['getAllowedActivityStatusTransitions', 'availableLifecycleActions', 'handleLifecycleAction', 'state-summary']) {
    if (!source.includes(token)) {
      errors.push(`pages/manage/dashboard.vue is missing guarded lifecycle token ${token}`);
    }
  }
  for (const token of ['scrollTop', ':scroll-top="scrollTop"', 'scroll-with-animation']) {
    if (!source.includes(token)) {
      errors.push(`pages/manage/dashboard.vue must use stable review section scrolling token ${token}`);
    }
  }
  if (source.includes('v-for="item in lifecycleActions"') || source.includes('@tap="setActivityLifecycle(item.key)"')) {
    errors.push('pages/manage/dashboard.vue must not expose arbitrary lifecycle status selection');
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
  if (source.includes('isCreator')) {
    errors.push('surego-activity cloud function must strip client-provided isCreator');
  }
  for (const token of ["action === 'listMine'", 'isPubliclyVisibleActivity', "status: 'reviewing'", "activity.moderation_status = 'pending'"]) {
    if (!source.includes(token)) {
      errors.push(`surego-activity cloud function is missing review visibility token: ${token}`);
    }
  }
  for (const token of ['creatorStatusTransitions', 'canTransitionStatus', 'INVALID_TRANSITION']) {
    if (!source.includes(token)) {
      errors.push(`surego-activity cloud function is missing lifecycle transition guard ${token}`);
    }
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
  for (const token of ['orderFilters', 'filteredOrders', 'goOrderDetail', 'hasOpsRole', 'canUseOps.value = hasOpsRole(user.value)']) {
    if (!source.includes(token)) {
      errors.push(`pages/user/profile.vue is missing ${token}`);
    }
  }
  if (source.includes('count: loggedIn.value ? 2 : 0') || source.includes('靠谱、准时') || source.includes('活动组织清晰')) {
    errors.push('pages/user/profile.vue must not show hard-coded mock reviews after login');
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
  if (!source.includes('collection.where({ user_id: userId })')) {
    errors.push('surego-message cloud function must list messages scoped to the current user');
  }
  for (const token of ['event_key', 'eventKey', 'record.event_key', 'collection.where({']) {
    if (!source.includes(token)) {
      errors.push(`surego-message cloud function is missing idempotent message token ${token}`);
    }
  }
}

for (const file of ['pages/home/index.vue', 'pages/discover/index.vue']) {
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute)) continue;
  const source = fs.readFileSync(absolute, 'utf8');
  for (const token of ['currentAvatar', 'getCurrentUserProfile', 'isSuregoProfileComplete', '/static/userImg/user.png']) {
    if (!source.includes(token)) {
      errors.push(`${file} must render the current SureGo profile avatar via ${token}`);
    }
  }
  for (const staleToken of ['api.dicebear.com', 'avataaars', 'DiceBear']) {
    if (source.includes(staleToken)) {
      errors.push(`${file} must not hard-code DiceBear avatars in the top nav`);
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
  for (const token of ['isValidCheckinCode', "source: 'manual'", "source: 'scan'", 'nextCheckablePerson', 'ensureOwnerAccess', 'getMiniProgramNavStyle', 'getMiniProgramNavRowStyle', 'scanCheckinCode', 'parseScannedCheckinCode', 'onlyFromCamera: true']) {
    if (!source.includes(token)) {
      errors.push(`pages/manage/checkin.vue is missing ${token}`);
    }
  }
  if (source.includes('await confirmNextByScan()') || source.includes('result.result || checkinCode.value')) {
    errors.push('pages/manage/checkin.vue must not auto-confirm check-in when scan fails or returns an empty result');
  }
  if (source.includes('@tap="goManageDashboard(activity.id)"')) {
    errors.push('pages/manage/checkin.vue back arrow must use goBackOrFallback/handleBack instead of pushing manage dashboard');
  }
}

for (const opsChildPage of ['pages/ops/users.vue', 'pages/ops/reports.vue']) {
  const absolute = path.join(root, opsChildPage);
  if (!fs.existsSync(absolute)) continue;
  const source = fs.readFileSync(absolute, 'utf8');
  if (!source.includes('goBackOrFallback') || !source.includes('/pages/ops/dashboard')) {
    errors.push(`${opsChildPage} back arrow must use goBackOrFallback('/pages/ops/dashboard')`);
  }
  if (source.includes('@tap="goOpsDashboard"') || source.includes('@tap="goOpsDashboard()"')) {
    errors.push(`${opsChildPage} back arrow must not push a new ops dashboard page`);
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
  for (const token of ['getActivityStatusMeta', 'isTerminalActivity', 'goParticipantDashboard', 'buildParticipantCheckinCode']) {
    if (!source.includes(token)) {
      errors.push(`pages/participant/dashboard.vue is missing terminal activity guard token: ${token}`);
    }
  }
  for (const token of ['buildCode128Bars', 'entry-barcode', 'barcodeBars']) {
    if (!source.includes(token)) {
      errors.push(`pages/participant/dashboard.vue must render a scan-ready barcode using ${token}`);
    }
  }
  if (source.includes("source: 'participant'") || source.includes('remark: \'参与者中心确认签到\'')) {
    errors.push('pages/participant/dashboard.vue must not allow participants to self-confirm onsite check-in');
  }
}

const calendarPagePath = path.join(root, 'pages/calendar/index.vue');
if (fs.existsSync(calendarPagePath)) {
  const source = fs.readFileSync(calendarPagePath, 'utf8');
  for (const token of ['month-grid', 'weekday-row', 'calendarCells', 'shiftMonth', 'calendar-tabs']) {
    if (!source.includes(token)) {
      errors.push(`pages/calendar/index.vue must align with the reference month calendar using ${token}`);
    }
  }
}

const activityDetailPath = path.join(root, 'pages/activity/detail.vue');
if (fs.existsSync(activityDetailPath)) {
  const source = fs.readFileSync(activityDetailPath, 'utf8');
  for (const token of ['buildActivitySharePayload', 'buildActivitySharePath', 'getMiniProgramNavStyle', 'getMiniProgramNavRowStyle']) {
    if (!source.includes(token)) {
      errors.push(`pages/activity/detail.vue is missing ${token}`);
    }
  }
  for (const token of ['createReport', 'submitActivityReport']) {
    if (!source.includes(token)) {
      errors.push(`pages/activity/detail.vue is missing ${token}`);
    }
  }
  for (const token of ['getActivityStatusMeta', 'isTerminalActivity']) {
    if (!source.includes(token)) {
      errors.push(`pages/activity/detail.vue is missing terminal status guard token: ${token}`);
    }
  }
  if (source.includes("toastAndClose('举报已提交')") || source.includes("toastAndClose('涓炬姤宸叉彁浜?)")) {
    errors.push('pages/activity/detail.vue report action must create a moderation report instead of toast-only feedback');
  }
}

const registerPagePath = path.join(root, 'pages/activity/register.vue');
if (fs.existsSync(registerPagePath)) {
  const source = fs.readFileSync(registerPagePath, 'utf8');
  for (const token of ['validateJoinEligibility', 'adjust-position="false"', 'cursor-spacing', 'register__scroll', 'disable-default-padding="true"']) {
    if (!source.includes(token)) {
      errors.push(`pages/activity/register.vue is missing join/keyboard guard token: ${token}`);
    }
  }
  if (source.includes('overflow: hidden;')) {
    errors.push('pages/activity/register.vue must not hide overflow around keyboard form content');
  }
}

const discoverPagePath = path.join(root, 'pages/discover/index.vue');
if (fs.existsSync(discoverPagePath)) {
  const source = fs.readFileSync(discoverPagePath, 'utf8');
  for (const token of ['CITY_CODE_KEY', 'selectedCityCode', 'listActivitiesByCity', 'getMiniProgramNavStyle', 'getMiniProgramNavRowStyle']) {
    if (!source.includes(token)) {
      errors.push(`pages/discover/index.vue is missing manual city/safe-area token: ${token}`);
    }
  }
  if (source.includes('@/common/api/location.js') || source.includes('refreshCurrentLocation') || source.includes('sortActivitiesByDistance')) {
    errors.push('pages/discover/index.vue must use manual city filtering instead of automatic location refresh');
  }
}

const cityPagePath = path.join(root, 'pages/discover/city.vue');
if (fs.existsSync(cityPagePath)) {
  const source = fs.readFileSync(cityPagePath, 'utf8');
  for (const token of ['unicloud-city-select', ':location="false"', 'surego_selected_city_code', 'openCitySelector', 'handlePluginSelect']) {
    if (!source.includes(token)) {
      errors.push(`pages/discover/city.vue is missing city-select token: ${token}`);
    }
  }
  if (source.includes('refreshCurrentLocation') || source.includes("selectCity('杭州')")) {
    errors.push('pages/discover/city.vue must use manual unicloud-city-select instead of hard-coded or automatic location');
  }
}

for (const file of ['pages/activity/create.vue', 'pages/activity/edit.vue', 'pages/user/edit.vue', 'components/surego/SuWechatProfileSheet.vue', 'pages/discover/search.vue', 'pages/manage/dashboard.vue', 'pages/manage/checkin.vue', 'pages/ops/reports.vue']) {
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute)) continue;
  const source = fs.readFileSync(absolute, 'utf8');
  if (!source.includes('adjust-position="false"') || !source.includes('cursor-spacing')) {
    errors.push(`${file} must include keyboard compatibility attributes on input/textarea controls`);
  }
}

for (const file of activityFormPages) {
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute)) continue;
  const source = fs.readFileSync(absolute, 'utf8');
  const tags = getNativeFormControlTags(source);
  if (tags.length === 0) {
    errors.push(`${file} must contain native input/textarea controls`);
  }
  for (const tag of tags) {
    for (const token of requiredKeyboardAttributes) {
      if (!tag.includes(token)) {
        errors.push(`${file} native form control is missing ${token}: ${tag}`);
      }
    }
  }
  if (source.includes('always-embed="true"')) {
    errors.push(`${file} must not use always-embed on activity form inputs`);
  }
  if (source.includes('auto-height')) {
    errors.push(`${file} must not use auto-height on activity form textareas`);
  }
  if (source.includes('line-height: 82rpx')) {
    errors.push(`${file} must not vertically position input text with line-height: 82rpx`);
  }
  for (const token of ['unicloud-city-select', ':location="false"', 'hotCities', 'openCitySelector', 'handleCitySelect', 'inferCityFromLocation', 'syncCityFromLocation', 'form.cityCode', 'form.district']) {
    if (!source.includes(token)) {
      errors.push(`${file} must sync map location back to activity city with ${token}`);
    }
  }
  if (source.includes('<picker :range="cityNames"') || source.includes('cityNames =') || source.includes('cityIndex')) {
    errors.push(`${file} must use unicloud-city-select instead of a fixed city picker`);
  }
}

const cityUtilPath = path.join(root, 'common/utils/city.js');
if (fs.existsSync(cityUtilPath)) {
  const source = fs.readFileSync(cityUtilPath, 'utf8');
  for (const token of ['CITY_OPTIONS', 'HOT_CITY_OPTIONS', 'DEFAULT_CITY_CODE', 'normalizeCityName', 'inferCityFromLocation', 'inferDistrictFromLocation', 'stripAdministrativeSuffix']) {
    if (!source.includes(token)) {
      errors.push(`common/utils/city.js is missing city helper token: ${token}`);
    }
  }
  for (const city of ['广州', '深圳', '成都', '重庆', '武汉', '西安', '苏州', '长沙']) {
    if (!source.includes(city)) {
      errors.push(`common/utils/city.js must include expanded hot city: ${city}`);
    }
  }
}

const coverPresetPath = path.join(root, 'common/utils/cover-presets.js');
if (fs.existsSync(coverPresetPath)) {
  const source = fs.readFileSync(coverPresetPath, 'utf8');
  for (const token of ['COVER_PRESETS', 'COVER_CATEGORIES', 'getDefaultCoverPreset', 'listCoverPresets', 'pickRandomCoverPreset', 'isPresetCover']) {
    if (!source.includes(token)) {
      errors.push(`common/utils/cover-presets.js is missing cover preset token: ${token}`);
    }
  }
}

for (const file of ['pages/activity/create.vue', 'pages/activity/edit.vue']) {
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute)) continue;
  const source = fs.readFileSync(absolute, 'utf8');
  for (const token of ['showCoverPicker', 'coverPresets', 'listCoverPresets', 'pickRandomCoverPreset', 'uploadCoverFromAlbum', 'isPresetCover', 'handleCoverImageError']) {
    if (!source.includes(token)) {
      errors.push(`${file} must use the recommended cover picker token: ${token}`);
    }
  }
  if (source.includes("image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622")) {
    errors.push(`${file} must not hard-code a single default cover image`);
  }
  if (source.includes('tempFilePaths[0]')) {
    errors.push(`${file} must upload custom covers through common/api/upload.js`);
  }
  if (!source.includes('@tap.stop="useRandomCover"') || !source.includes('keepSheetOpen: true')) {
    errors.push(`${file} must keep the cover picker open when using random recommended covers`);
  }
}

const userDetailPath = path.join(root, 'pages/user/detail.vue');
if (fs.existsSync(userDetailPath)) {
  const source = fs.readFileSync(userDetailPath, 'utf8');
  for (const token of ['getUserProfileById', 'public-profile', 'goBackOrFallback']) {
    if (!source.includes(token)) {
      errors.push(`pages/user/detail.vue is missing public profile token: ${token}`);
    }
  }
}

const routeSource = fs.readFileSync(path.join(root, 'common/utils/route.js'), 'utf8');
if (!routeSource.includes('goUserDetail')) {
  errors.push('common/utils/route.js must expose goUserDetail for member/leader avatars');
}
for (const page of ['pages/activity/detail.vue', 'pages/activity/members.vue', 'pages/manage/checkin.vue', 'pages/manage/dashboard.vue']) {
  const absolute = path.join(root, page);
  if (!fs.existsSync(absolute)) continue;
  const source = fs.readFileSync(absolute, 'utf8');
  if (!source.includes('goUserDetail')) {
    errors.push(`${page} must open member/leader avatars through goUserDetail`);
  }
}

const citySelectPluginPagePath = path.join(root, 'uni_modules/unicloud-city-select/pages/uni-city-list/uni-city-list.vue');
if (fs.existsSync(citySelectPluginPagePath)) {
  const source = fs.readFileSync(citySelectPluginPagePath, 'utf8');
  for (const token of ['confirm-type="search"', ':adjust-position="false"', 'height: 40px', 'line-height: 40px']) {
    if (!source.includes(token)) {
      errors.push(`unicloud-city-select city list page must keep readable search input token: ${token}`);
    }
  }
}

const homePagePath = path.join(root, 'pages/home/index.vue');
if (fs.existsSync(homePagePath)) {
  const source = fs.readFileSync(homePagePath, 'utf8');
  for (const token of ['getMiniProgramNavContentStyle', 'contentTopStyle', 'position: fixed', 'backdrop-filter: blur']) {
    if (!source.includes(token)) {
      errors.push(`pages/home/index.vue must use a fixed floating top header with ${token}`);
    }
  }
  for (const token of ['isHomeVisibleMyActivity', 'sortActivitiesByStatusPriority']) {
    if (!source.includes(token)) {
      errors.push(`pages/home/index.vue must filter terminal my-activity cards with ${token}`);
    }
  }
  for (const token of ['openUserActivity', 'goParticipantDashboard', '...myGroups.value.pending']) {
    if (!source.includes(token)) {
      errors.push(`pages/home/index.vue must route applied/joined activities through participant dashboard with ${token}`);
    }
  }
}

for (const file of ['pages/home/index.vue', 'pages/discover/index.vue', 'pages/user/profile.vue', 'pages/participant/dashboard.vue']) {
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute)) continue;
  const source = fs.readFileSync(absolute, 'utf8');
  for (const token of ['unreadCount', 'getUnreadMessageCount']) {
    if (!source.includes(token)) {
      errors.push(`${file} must render message badge from unread count using ${token}`);
    }
  }
  if (source.includes('__notice-dot') || source.includes('discover__dot')) {
    errors.push(`${file} must not show a hard-coded message red dot`);
  }
}

for (const [file, tokens] of Object.entries({
  'pages/user/profile.vue': ['ACTIVITY_STATUS_FILTERS', 'filteredActivityList', 'getActivityStatusMeta', 'profile-card__status'],
  'pages/my/activities.vue': ['getActivityStatusMeta', 'sortActivitiesByStatusPriority', 'activity__status']
})) {
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute)) continue;
  const source = fs.readFileSync(absolute, 'utf8');
  for (const token of tokens) {
    if (!source.includes(token)) {
      errors.push(`${file} must render activity state categories/badges with ${token}`);
    }
  }
}

const searchPagePath = path.join(root, 'pages/discover/search.vue');
if (fs.existsSync(searchPagePath)) {
  const source = fs.readFileSync(searchPagePath, 'utf8');
  if (source.includes('\n            focus')) {
    errors.push('pages/discover/search.vue must not autofocus the input on page entry');
  }
}

for (const file of ['pages/manage/dashboard.vue', 'pages/ops/reports.vue']) {
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute)) continue;
  const source = fs.readFileSync(absolute, 'utf8');
  if (!source.includes('fixed="true"')) {
    errors.push(`${file} bottom sheet textarea must set fixed="true"`);
  }
}

const opsDashboardPath = path.join(root, 'pages/ops/dashboard.vue');
if (fs.existsSync(opsDashboardPath)) {
  const source = fs.readFileSync(opsDashboardPath, 'utf8');
  for (const token of ['getOpsStats', 'listOpsActivities', 'moderateActivity', 'goOpsReports', 'goOpsUsers']) {
    if (!source.includes(token)) {
      errors.push(`pages/ops/dashboard.vue is missing ${token}`);
    }
  }
}

const opsUsersPath = path.join(root, 'pages/ops/users.vue');
if (fs.existsSync(opsUsersPath)) {
  const source = fs.readFileSync(opsUsersPath, 'utf8');
  for (const token of ['listUsers', 'updateUserRoles', 'getRoleLabel', 'isAdminUser', 'roleOptions']) {
    if (!source.includes(token)) {
      errors.push(`pages/ops/users.vue is missing ${token}`);
    }
  }
}

const opsReportsPath = path.join(root, 'pages/ops/reports.vue');
if (fs.existsSync(opsReportsPath)) {
  const source = fs.readFileSync(opsReportsPath, 'utf8');
  for (const token of ['listReports', 'updateReportStatus', 'reportFilters', 'reviewNote']) {
    if (!source.includes(token)) {
      errors.push(`pages/ops/reports.vue is missing ${token}`);
    }
  }
}

const moderationCloudPath = path.join(root, 'uniCloud-aliyun/cloudfunctions/surego-moderation/index.js');
if (fs.existsSync(moderationCloudPath)) {
  const source = fs.readFileSync(moderationCloudPath, 'utf8');
  if (!source.includes('normalize')) {
    errors.push('surego-moderation cloud function is missing normalize helpers');
  }
  for (const action of ["action === 'createReport'", "action === 'listReports'", "action === 'updateReportStatus'", "action === 'listOpsActivities'", "action === 'moderateActivity'", "action === 'getOpsStats'"]) {
    if (!source.includes(action)) {
      errors.push(`surego-moderation cloud function is missing ${action}`);
    }
  }
}

const userCloudPath = path.join(root, 'uniCloud-aliyun/cloudfunctions/surego-user/index.js');
if (fs.existsSync(userCloudPath)) {
  const source = fs.readFileSync(userCloudPath, 'utf8');
  for (const token of ['ensureDefaultRole', "action === 'listUsers'", "action === 'updateUserRoles'", 'uni-id-users', 'role_updated_at', 'role_updated_by', 'LAST_ADMIN_REQUIRED']) {
    if (!source.includes(token)) {
      errors.push(`surego-user cloud function is missing ${token}`);
    }
  }
  if (source.includes('if (!user) return [DEFAULT_ROLE]')) {
    errors.push('surego-user must not silently grant default user role when uni-id user has been deleted');
  }
}

const rolesInitPath = path.join(root, 'uniCloud-aliyun/database/uni-id-roles.init_data.json');
if (fs.existsSync(rolesInitPath)) {
  const source = fs.readFileSync(rolesInitPath, 'utf8');
  for (const role of ['"role_id": "user"', '"role_id": "operator"', '"role_id": "admin"']) {
    if (!source.includes(role)) {
      errors.push(`uni-id-roles.init_data.json is missing ${role}`);
    }
  }
}

const posterPagePath = path.join(root, 'pages/share/poster.vue');
if (fs.existsSync(posterPagePath)) {
  const source = fs.readFileSync(posterPagePath, 'utf8');
  for (const token of ['canvas-id="posterCanvas"', 'generatePosterImage', 'uni.canvasToTempFilePath', 'uni.saveImageToPhotosAlbum', 'buildActivitySharePayload', 'buildActivityPosterCopy']) {
    if (!source.includes(token)) {
      errors.push(`pages/share/poster.vue is missing ${token}`);
    }
  }
  if (source.includes('canvas 阶段接入')) {
    errors.push('pages/share/poster.vue still contains canvas placeholder copy');
  }
}

const stackCheckFiles = {
  poster: 'pages/share/poster.vue',
  payment: 'pages/payment/index.vue',
  order: 'pages/order/detail.vue',
  success: 'pages/status/success.vue'
};

if (fs.existsSync(path.join(root, stackCheckFiles.poster))) {
  const source = fs.readFileSync(path.join(root, stackCheckFiles.poster), 'utf8');
  if (source.includes('@tap="goActivityDetail(activity.id)"')) {
    errors.push('pages/share/poster.vue back arrow must use goBackOrFallback/handleBack instead of pushing activity detail');
  }
}

if (fs.existsSync(path.join(root, stackCheckFiles.payment))) {
  const source = fs.readFileSync(path.join(root, stackCheckFiles.payment), 'utf8');
  if (!source.includes('goParticipantDashboard(activity.value.id, { replace: true })')) {
    errors.push('pages/payment/index.vue must replace payment with participant dashboard after paid/payment success');
  }
}

if (fs.existsSync(path.join(root, stackCheckFiles.order))) {
  const source = fs.readFileSync(path.join(root, stackCheckFiles.order), 'utf8');
  if (!source.includes('goPayment({ activityId: order.activityId, type: order.type, amount: order.amount }, { replace: true })')) {
    errors.push('pages/order/detail.vue must replace order detail when continuing to payment');
  }
  if (!source.includes('goParticipantDashboard(order.activityId, { replace: true })')) {
    errors.push('pages/order/detail.vue must replace order detail when opening participant credential from paid order');
  }
}

if (fs.existsSync(path.join(root, stackCheckFiles.success))) {
  const source = fs.readFileSync(path.join(root, stackCheckFiles.success), 'utf8');
  if (!source.includes('goHomeRoot')) {
    errors.push('pages/status/success.vue must use goHomeRoot for the home action');
  }
  if (!source.includes('goActivityDetail(activity.id, { replace: true })')) {
    errors.push('pages/status/success.vue terminal activity-detail actions must use replace navigation');
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
