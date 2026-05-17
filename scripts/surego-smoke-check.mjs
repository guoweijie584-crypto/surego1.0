import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd());
const requiredFiles = [
  'pages.json',
  'App.vue',
  'common/mock/activities.js',
  'common/mock/partners.js',
  'common/utils/route.js',
  'components/surego/SuActivityCard.vue',
  'components/surego/SuPartnerCard.vue',
  'components/surego/SuIcon.vue',
  'components/surego/SuBottomDock.vue',
  'components/surego/SuActionSheet.vue',
  'components/surego/SuPageLoading.vue',
  'components/surego/SuWechatProfileSheet.vue',
  'common/config/runtime.js',
  'docs/surego-cloud-trial-deployment.md',
  'common/api/auth.js',
  'common/api/cloud.js',
  'common/utils/share.js',
  'common/utils/city.js',
  'common/utils/cover-presets.js',
  'common/utils/code128.js',
  'common/constants/icons.js',
  'common/api/activity.js',
  'common/api/partner.js',
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
  'scripts/surego-deployment-scope-check.mjs',
  'pages/home/index.vue',
  'pages/discover/index.vue',
  'pages/discover/search.vue',
  'pages/discover/city.vue',
  'pages/calendar/index.vue',
  'pages/graduation/index.vue',
  'pages/hackathon/index.vue',
  'pages/hackathon/team.vue',
  'pages/verify/index.vue',
  'pages/partners/index.vue',
  'pages/partner/detail.vue',
  'pages/partner/create.vue',
  'pages/partner/workbench.vue',
  'pages/partner/conversation.vue',
  'pages/publish/index.vue',
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
  'uniCloud-aliyun/database/surego-partner-posts.schema.json',
  'uniCloud-aliyun/database/surego-partner-intents.schema.json',
  'uniCloud-aliyun/database/surego-follows.schema.json',
  'uniCloud-aliyun/database/surego-conversations.schema.json',
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
  'uniCloud-aliyun/cloudfunctions/surego-partner/index.js',
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
const mojibakePattern = /[\u93bc\u934f\u9366\u7ead\u93cd\u9353\u8e47\u5bf0\u6fb6\u9422\u6dc7\u7487\u95c2\u95b8\u95bb\u9420\u5a62\u7035\u5bb8\u97eb\u59a4\u6fde\u5a32\u59e9\u70ac\u60e7\u57d7\u9352\u55e4\u60b3\u7ef1\u2540\u7d91\u935a\u5d89\ue582]/;
const questionRun = String.fromCharCode(63, 63, 63);
const replacementChar = String.fromCharCode(0xfffd);

const activityFormPages = ['pages/activity/create.vue', 'pages/activity/edit.vue'];
const requiredKeyboardAttributes = ['adjust-position="false"', 'cursor-spacing="80"'];

function getNativeFormControlTags(source) {
  return source.match(/<(?:input|textarea)\b[^>]*>/g) || [];
}

function assertNoMojibake(file, source) {
  source.split(/\r?\n/).forEach((line, index) => {
    if (mojibakePattern.test(line) || line.includes(questionRun) || line.includes(replacementChar)) {
      errors.push(`${file}:${index + 1} contains likely mojibake text`);
    }
  });
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
    if ((config.pages || [])[0]?.path !== 'pages/partners/index') {
      errors.push('pages/partners/index must be the startup page');
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
  for (const staleKey of ["key: 'calendar'", "key: 'message'", "key: 'discover'"]) {
    if (dockSource.includes(staleKey)) {
      errors.push(`SuBottomDock.vue still contains stale bottom nav item: ${staleKey}`);
    }
  }
  for (const helper of ['goHomeRoot', 'goPartnersRoot', 'goMessages', 'goUserProfile', 'goPartnerCreate', 'goActivityCreate']) {
    if (!dockSource.includes(helper)) {
      errors.push(`SuBottomDock.vue must use root navigation helper: ${helper}`);
    }
  }
  for (const token of ['showPublishSheet', '发布搭子', '发布活动', 'publish-sheet__panel']) {
    if (!dockSource.includes(token)) {
      errors.push(`SuBottomDock.vue must expose publish sheet token: ${token}`);
    }
  }
  if (dockSource.includes('goPublishCenter')) {
    errors.push('SuBottomDock.vue must open the publish sheet instead of navigating to goPublishCenter');
  }
  if (!dockSource.includes("label: '搭子'")) {
    errors.push("SuBottomDock.vue must use '搭子' as the partner tab label");
  }
  if (dockSource.includes("label: '找搭子'")) {
    errors.push("SuBottomDock.vue must not render the stale '找搭子' tab label");
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
  for (const helper of ['goPartnersRoot', 'goPublishCenter', 'goPartnerDetail', 'goPartnerCreate', 'goPartnerWorkbench', 'goPartnerConversation']) {
    if (!routeSource.includes(helper)) {
      errors.push(`common/utils/route.js is missing dual-entry helper: ${helper}`);
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
  for (const guardedHelper of ['goPartnerCreate', 'goPartnerWorkbench']) {
    const helperStart = routeSource.indexOf(`export function ${guardedHelper}`)
    const helperEnd = routeSource.indexOf('\nexport function ', helperStart + 1)
    const helperSource = routeSource.slice(helperStart, helperEnd === -1 ? routeSource.length : helperEnd)
    if (!helperSource.includes('guardLoginAction')) {
      errors.push(`common/utils/route.js ${guardedHelper} must use guardLoginAction`);
    }
  }
}

const partnerApiPath = path.join(root, 'common/api/partner.js');
if (fs.existsSync(partnerApiPath)) {
  const source = fs.readFileSync(partnerApiPath, 'utf8');
  for (const token of ['viewerIntent', 'viewerIntentStatus', 'viewerConversationId', 'findViewerIntentForPost']) {
    if (!source.includes(token)) {
      errors.push(`common/api/partner.js must normalize current viewer intent state with ${token}`);
    }
  }
  for (const helper of ['PARTNER_POST_TYPES', 'PARTNER_POST_STATUS_META', 'PARTNER_TOPIC_OPTIONS', 'HACKATHON_TOPIC_KEY', 'listPartnerPosts', 'listHackathonPartnerPosts', 'getPartnerPostDetail', 'createPartnerPost', 'listMyPartnerPosts', 'createPartnerIntent', 'listPartnerIntents', 'updatePartnerIntentStatus', 'followPartnerPost']) {
    if (!source.includes(helper)) {
      errors.push(`common/api/partner.js is missing ${helper}`);
    }
  }
  for (const token of ['USE_UNICLOUD', 'callSuregoFunction', '@/common/api/auth.js', 'createMessage']) {
    if (!source.includes(token)) {
      errors.push(`common/api/partner.js is missing ${token}`);
    }
  }
  for (const token of ['getPartnerConversation', 'listPartnerConversations', 'CONVERSATIONS_KEY']) {
    if (!source.includes(token)) {
      errors.push(`common/api/partner.js is missing conversation token: ${token}`);
    }
  }
  for (const token of ['convertPartnerPostToActivity', 'kind', 'converted', 'visibility', 'sourcePartnerPostId', 'sourcePartnerIntentIds', 'invitedUserIds', 'invited_user_ids', 'source_partner_intent_ids']) {
    if (!source.includes(token)) {
      errors.push(`common/api/partner.js must expose document-aligned partner conversion token: ${token}`);
    }
  }
  for (const staleToken of ['writeApprovedApplications(activity', 'writeApprovedApplications(activity,', 'APPLICATIONS_KEY']) {
    if (source.includes(staleToken)) {
      errors.push(`common/api/partner.js must not auto-create approved applications during partner conversion: ${staleToken}`);
    }
  }
  for (const token of ['REFERENCE_PREVIEW_OWNER_IDS', 'isReferencePreviewOwner', 'weekly-badminton']) {
    if (!source.includes(token)) {
      errors.push(`common/api/partner.js must keep reference mock owner posts visible in mine with ${token}`);
    }
  }
}

const partnerCardPath = path.join(root, 'components/surego/SuPartnerCard.vue');
if (fs.existsSync(partnerCardPath)) {
  const source = fs.readFileSync(partnerCardPath, 'utf8');
  for (const token of ['goPartnerDetail', 'partner.typeLabel', 'partner.intentCount', 'partner.fitTags']) {
    if (!source.includes(token)) {
      errors.push(`SuPartnerCard.vue is missing partner card token: ${token}`);
    }
  }
  for (const token of ['contract-row__copy', 'contract-row__action', 'min-width: 152rpx', 'white-space: nowrap', 'text-overflow: ellipsis']) {
    if (!source.includes(token)) {
      errors.push(`SuPartnerCard.vue action capsule must keep single-line text on real devices with ${token}`);
    }
  }
  for (const token of ['compact-meta-row', 'compact-meta-chip', 'displayConnectionSummary']) {
    if (!source.includes(token)) {
      errors.push(`SuPartnerCard.vue must use compact partner list layout with ${token}`);
    }
  }
  for (const staleToken of ['partner-post-card__desc', 'displayExpectation', 'partner-post-card__want-main', 'partner-meta-grid']) {
    if (source.includes(staleToken)) {
      errors.push(`SuPartnerCard.vue compact list card must not render tall/redundant detail block: ${staleToken}`);
    }
  }
  if (source.includes('grid-template-columns: 1fr;') && source.includes('.contract-row')) {
    errors.push('SuPartnerCard.vue action capsule must sit on the right of the contract row, not stretch as a full-width grid row');
  }
  if (source.includes('width: 120rpx')) {
    errors.push('SuPartnerCard.vue action capsule must not use fixed 120rpx width because four Chinese characters wrap on device');
  }
}

const activityCardPath = path.join(root, 'components/surego/SuActivityCard.vue');
if (fs.existsSync(activityCardPath)) {
  const source = fs.readFileSync(activityCardPath, 'utf8');
  for (const token of ['.activity-card--compact .activity-card__cover', 'height: 200rpx;', '.activity-card--compact .activity-card__body', 'activity-card__meta-row', '.activity-card--compact .activity-card__meta-row', 'activity-card__footer--compact', 'activity-card__status-chip', 'v-if="!compact"']) {
    if (!source.includes(token)) {
      errors.push(`SuActivityCard.vue must define compact home-card style token: ${token}`);
    }
  }
  const compactCoverBlock = source.match(/\.activity-card--compact\s+\.activity-card__cover\s*\{[\s\S]*?\}/);
  if (compactCoverBlock?.[0].includes('height: 308rpx')) {
    errors.push('SuActivityCard.vue compact cover must not keep the default 308rpx height');
  }
}

const partnerMessageSchemaPath = path.join(root, 'uniCloud-aliyun/database/surego-messages.schema.json');
if (fs.existsSync(partnerMessageSchemaPath)) {
  const schema = JSON.parse(fs.readFileSync(partnerMessageSchemaPath, 'utf8'));
  for (const field of ['partner_post_id', 'conversation_id']) {
    if (!schema.properties?.[field]) {
      errors.push(`surego-messages schema is missing ${field}`);
    }
  }
}

for (const [file, fields] of Object.entries({
  'uniCloud-aliyun/database/surego-partner-posts.schema.json': ['title', 'type', 'creator_id', 'status'],
  'uniCloud-aliyun/database/surego-partner-intents.schema.json': ['partner_post_id', 'user_id', 'status', 'conversation_id'],
  'uniCloud-aliyun/database/surego-follows.schema.json': ['target_type', 'target_id', 'user_id'],
  'uniCloud-aliyun/database/surego-conversations.schema.json': ['partner_post_id', 'participant_ids', 'status']
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
  const statusEnum = schema.properties?.status?.enum || [];
  for (const status of ['pending_payment', 'paid', 'frozen', 'refunding', 'refunded', 'settled', 'disputed']) {
    if (!statusEnum.includes(status)) {
      errors.push(`surego-orders schema must support ${status}`);
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
  for (const field of ['visibility', 'source', 'source_partner_post_id', 'invited_user_ids', 'source_partner_intent_ids']) {
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
  for (const helper of ['ACTIVITY_LIFECYCLE_STATUSES', 'normalizeActivityStatus', 'normalizeActivityRecord', 'applicationStatus', 'isCurrentUserActivityCreator', 'REFERENCE_PREVIEW_OWNER_IDS', 'isReferencePreviewActivityOwner']) {
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
  for (const helper of ['listCurrentUserApplications', 'buildActivityWithApplication', 'listAppliedLocalActivities']) {
    if (!activitySource.includes(helper)) {
      errors.push(`common/api/activity.js must sync my joined/pending activities through applications with ${helper}`);
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

const mockActivitiesPath = path.join(root, 'common/mock/activities.js');
if (fs.existsSync(mockActivitiesPath)) {
  const source = fs.readFileSync(mockActivitiesPath, 'utf8');
  for (const token of ['graduation-photo-walk-owner', "creatorId: 'mock_user'", '毕业季草坪约拍']) {
    if (!source.includes(token)) {
      errors.push(`common/mock/activities.js must include my published activity mock with ${token}`);
    }
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
  if (!cloudSource.includes('if (!canFallbackToMock())')) {
    errors.push('common/api/cloud.js must suppress cloud request toasts when local dev mock fallback is active');
  }
}

const runtimePath = path.join(root, 'common/config/runtime.js');
if (fs.existsSync(runtimePath)) {
  const runtimeSource = fs.readFileSync(runtimePath, 'utf8');
  for (const token of ['USE_UNICLOUD', 'ALLOW_MOCK_FALLBACK', 'ALLOW_LOCAL_DEV_MOCK_FALLBACK', 'TRIAL_STRICT_CLOUD_AUTH', 'APP_MODE', 'isTrialMode', 'isTrialStrictCloudAuthMode', 'isLocalDevMode', 'shouldUseCloudFallback']) {
    if (!runtimeSource.includes(token)) {
      errors.push(`common/config/runtime.js is missing ${token}`);
    }
  }
  if (!runtimeSource.includes('!isTrialStrictCloudAuthMode()')) {
    errors.push('common/config/runtime.js must disable local mock fallback when strict trial cloud auth is enabled');
  }
  for (const token of ['process.env.NODE_ENV', 'getAccountInfoSync', "envVersion === 'develop'"]) {
    if (!runtimeSource.includes(token)) {
      errors.push(`common/config/runtime.js must gate local mock fallback to development runtime with ${token}`);
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
  for (const helper of ['loginWithWeixin', 'loginWithMockFallback', 'persistUniIdSession', 'getLastLoginDiagnostic', 'recordLoginDiagnostic']) {
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
  if (authSource.indexOf('return await loginWithUserCenter(code, profile)') > authSource.indexOf('return await loginWithUniIdCo(code, profile)')) {
    errors.push('common/api/auth.js must try the project-local user-center login before uni-id-co');
  }
  if (!authSource.includes('LOGIN_DIAGNOSTIC_KEY') || !authSource.includes('cloudFallbackAllowed')) {
    errors.push('common/api/auth.js must persist login diagnostics including whether local fallback was allowed');
  }
  const loginWithWeixinBody = authSource.slice(
    authSource.indexOf('export async function loginWithWeixin'),
    authSource.indexOf('export function saveCurrentUserProfile')
  );
  if (loginWithWeixinBody.indexOf('await loginWithUniIdCo(code, profile)') > loginWithWeixinBody.lastIndexOf('return loginWithMockFallback(profile')) {
    errors.push('common/api/auth.js must try uni-id-co before falling back to mock login');
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
  for (const token of ['试运行订单金额', '试运行订单状态']) {
    if (!source.includes(token)) {
      errors.push(`pages/manage/dashboard.vue must label trial-order funds with ${token}`);
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
  for (const token of ["visibility: payload.visibility || 'public'", 'source_partner_post_id', "source: payload.source || 'direct_activity'"]) {
    if (!source.includes(token)) {
      errors.push(`surego-activity cloud function is missing conversion visibility token: ${token}`);
    }
  }
  for (const token of ['invited_user_ids', 'source_partner_intent_ids']) {
    if (!source.includes(token)) {
      errors.push(`surego-activity cloud function is missing conversion invite token: ${token}`);
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

const orderApiTrialCopyPath = path.join(root, 'common/api/order.js');
if (fs.existsSync(orderApiTrialCopyPath)) {
  const source = fs.readFileSync(orderApiTrialCopyPath, 'utf8');
  for (const token of ['试运行订单确认成功', '试运行退款记录', '订单确认成功']) {
    if (!source.includes(token)) {
      errors.push(`common/api/order.js must use trial-order notification wording token: ${token}`);
    }
  }
}

const participantQrDashboardPath = path.join(root, 'pages/participant/dashboard.vue');
if (fs.existsSync(participantQrDashboardPath)) {
  const source = fs.readFileSync(participantQrDashboardPath, 'utf8');
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
  for (const token of ['hasOpsRole', 'canUseOps.value = hasOpsRole(user.value)', 'goUserEdit', 'profile-edit-entry', 'fulfillmentStats', 'reputationReviews']) {
    if (!source.includes(token)) {
      errors.push(`pages/user/profile.vue is missing ${token}`);
    }
  }
  for (const token of ["{ key: 'overview'", "{ key: 'messages'", "label: '资料'", "activeTab === 'overview'", "activeTab === 'messages'"]) {
    if (source.includes(token)) {
      errors.push(`pages/user/profile.vue must remove stale profile module token: ${token}`);
    }
  }
  for (const token of ["{ key: 'activities', label: '活动' }", "{ key: 'partners', label: '搭子' }", "{ key: 'profile', label: '履约' }", "label: '关注'", "label: '粉丝'"]) {
    if (!source.includes(token)) {
      errors.push(`pages/user/profile.vue must keep updated profile tab/stat token: ${token}`);
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

const partnerCloudPath = path.join(root, 'uniCloud-aliyun/cloudfunctions/surego-partner/index.js');
if (fs.existsSync(partnerCloudPath)) {
  const source = fs.readFileSync(partnerCloudPath, 'utf8');
  for (const token of ['viewerIntent', 'viewerIntentStatus', 'viewerConversationId', 'findViewerIntentForPost']) {
    if (!source.includes(token)) {
      errors.push(`surego-partner cloud function must return current viewer intent state with ${token}`);
    }
  }
  for (const token of ["action === 'convertToActivity'", 'source_partner_post_id', 'visibility', 'invited_user_ids', 'source_partner_intent_ids']) {
    if (!source.includes(token)) {
      errors.push(`surego-partner cloud function must support partner conversion token: ${token}`);
    }
  }
  for (const staleToken of ['createApprovedApplicationsForActivity', 'applications.add({']) {
    if (source.includes(staleToken)) {
      errors.push(`surego-partner must not auto-create approved activity applications during conversion: ${staleToken}`);
    }
  }
  for (const token of ['buildListPostWhere', 'matchesPostTextFilters', 'tagsAny', 'payload.type', 'topic_key', 'normalizeTopicKey']) {
    if (!source.includes(token)) {
      errors.push(`surego-partner must support filtered project/hackathon listPosts token: ${token}`);
    }
  }
}

const hackathonIndexPath = path.join(root, 'pages/hackathon/index.vue');
if (fs.existsSync(hackathonIndexPath)) {
  const source = fs.readFileSync(hackathonIndexPath, 'utf8');
  for (const token of ['listHackathonPartnerPosts', 'allowFallback: false', "topicKey: 'hackathon'", 'goHackathonTeam', 'goPartnerCreate({', 'emptyPartner']) {
    if (!source.includes(token)) {
      errors.push(`pages/hackathon/index.vue must use real partner data flow token: ${token}`);
    }
  }
  for (const staleToken of ['const teams = [', '@/common/mock', 'uniCloud.callFunction']) {
    if (source.includes(staleToken)) {
      errors.push(`pages/hackathon/index.vue must not use static/mock/direct cloud data: ${staleToken}`);
    }
  }
  if (source.includes('showComingSoon') || source.includes('voice-card')) {
    errors.push('pages/hackathon/index.vue must hide low-priority voice placeholder entry in trial mode');
  }
}

const partnersIndexPath = path.join(root, 'pages/partners/index.vue');
if (fs.existsSync(partnersIndexPath)) {
  const source = fs.readFileSync(partnersIndexPath, 'utf8');
  for (const token of ['listHackathonPartnerPosts', 'hackathonTeamCountLabel', 'hackathonIntentCountLabel', 'hackathonStartLabel', 'allowFallback: false']) {
    if (!source.includes(token)) {
      errors.push(`pages/partners/index.vue must use real hackathon poster data token: ${token}`);
    }
  }
  for (const staleToken of ['>12</text> 支队伍', '>28</text> 缺队友', '周末开赛', 'hackathonRoleCountLabel']) {
    if (source.includes(staleToken)) {
      errors.push(`pages/partners/index.vue must not hardcode hackathon poster stat: ${staleToken}`);
    }
  }
}

const hackathonTeamPath = path.join(root, 'pages/hackathon/team.vue');
if (fs.existsSync(hackathonTeamPath)) {
  const source = fs.readFileSync(hackathonTeamPath, 'utf8');
  for (const token of ['getPartnerPostDetail', 'createPartnerIntent', 'allowFallback: false', 'guardLoginAction', 'isLoggedIn', 'viewerIntent', 'intentStatus', 'goPartnerConversation']) {
    if (!source.includes(token)) {
      errors.push(`pages/hackathon/team.vue must use real partner detail/intent flow token: ${token}`);
    }
  }
  for (const staleToken of ['const teams = [', '@/common/mock', 'goMessages', 'uniCloud.callFunction']) {
    if (source.includes(staleToken)) {
      errors.push(`pages/hackathon/team.vue must not use static/mock/direct cloud data: ${staleToken}`);
    }
  }
}

const partnerCreateTopicPath = path.join(root, 'pages/partner/create.vue');
if (fs.existsSync(partnerCreateTopicPath)) {
  const source = fs.readFileSync(partnerCreateTopicPath, 'utf8');
  for (const token of ['HACKATHON_TOPIC_KEY', 'topicKey', 'topic-notice', 'HACKATHON_LOCKED_TIME', 'HACKATHON_LOCKED_LOCATION', '2026年5月22日', '天津大学科技园']) {
    if (!source.includes(token)) {
      errors.push(`pages/partner/create.vue must expose locked hackathon publish token: ${token}`);
    }
  }
  for (const staleToken of ['PARTNER_TOPIC_OPTIONS', 'topicOptions', '黑客松/赛事', '确认方式', '希望对方', '标签']) {
    if (source.includes(staleToken)) {
      errors.push(`pages/partner/create.vue must not expose stale heavy publish token: ${staleToken}`);
    }
  }
}

const partnerSeedTopicPath = path.join(root, 'uniCloud-aliyun/database/surego-partner-posts.init_data.json');
if (fs.existsSync(partnerSeedTopicPath)) {
  const items = JSON.parse(fs.readFileSync(partnerSeedTopicPath, 'utf8'));
  for (const id of ['hackathon-ai-front', 'surego-labs', 'campus-ai', 'creator-map']) {
    const item = items.find((entry) => entry._id === id || entry.id === id);
    if (!item || item.topic_key !== 'hackathon') {
      errors.push(`surego-partner-posts.init_data.json must mark ${id} with topic_key=hackathon`);
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

const qrCodePath = path.join(root, 'common/utils/qrcode.js');
if (!fs.existsSync(qrCodePath)) {
  errors.push('common/utils/qrcode.js is required to generate participant check-in QR codes');
} else {
  const source = fs.readFileSync(qrCodePath, 'utf8');
  for (const token of ['buildQrMatrix', 'addQuietZone', 'reedSolomonEncode', 'FORMAT_BITS_L_MASK_0']) {
    if (!source.includes(token)) {
      errors.push(`common/utils/qrcode.js is missing ${token}`);
    }
  }
}

const qrComponentPath = path.join(root, 'components/surego/SuQrCode.vue');
if (!fs.existsSync(qrComponentPath)) {
  errors.push('components/surego/SuQrCode.vue is required for participant check-in QR display');
} else {
  const source = fs.readFileSync(qrComponentPath, 'utf8');
  for (const token of ['buildQrMatrix', 'su-qrcode__module', 'moduleSize']) {
    if (!source.includes(token)) {
      errors.push(`components/surego/SuQrCode.vue is missing ${token}`);
    }
  }
}

const participantDashboardPath = path.join(root, 'pages/participant/dashboard.vue');
if (fs.existsSync(participantDashboardPath)) {
  const source = fs.readFileSync(participantDashboardPath, 'utf8');
  for (const token of ['SuQrCode', 'showEntryQr', '请向局长出示入场二维码']) {
    if (!source.includes(token)) {
      errors.push(`pages/participant/dashboard.vue must render scan-ready QR check-in pass with ${token}`);
    }
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
  for (const token of ['SuQrCode', 'showEntryQr', 'code-box__qr']) {
    if (!source.includes(token)) {
      errors.push(`pages/participant/dashboard.vue must render a scan-ready QR pass using ${token}`);
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
  for (const token of ['priority-row', 'priority-row__content', 'priority-row__primary', 'priority-row__secondary']) {
    if (!source.includes(token)) {
      errors.push(`pages/activity/detail.vue must use explicit flex priority rows to avoid narrow vertical text: ${token}`);
    }
  }
  if (source.includes('.priority { display: grid') || source.includes('grid-template-columns: 34rpx 1fr')) {
    errors.push('pages/activity/detail.vue priority summary must not rely on mini-program grid layout');
  }
  if (source.includes("toastAndClose('举报已提交')")) {
    errors.push('pages/activity/detail.vue report action must create a moderation report instead of toast-only feedback');
  }
  for (const token of ['报名并确认订单']) {
    if (!source.includes(token)) {
      errors.push(`pages/activity/detail.vue must use trial-order activity wording token: ${token}`);
    }
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
  for (const staleToken of ['unicloud-city-select', 'openCitySelector', 'handleCitySelect', 'inferCityFromLocation', 'syncCityFromLocation', 'city-select']) {
    if (source.includes(staleToken)) {
      errors.push(`${file} must not expose city selection in Tianjin University mode: ${staleToken}`);
    }
  }
  for (const token of ['CAMPUS_NAME', '天津大学', 'CAMPUS_CITY_CODE', 'form.cityCode', 'form.district']) {
    if (!source.includes(token)) {
      errors.push(`${file} must keep fixed Tianjin University campus metadata with ${token}`);
    }
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

const activityApiSource = fs.readFileSync(path.join(root, 'common/api/activity.js'), 'utf8');
for (const token of ['invited', 'isActivityInvitee', 'invitedUserIds', 'invited_user_ids', 'sourcePartnerIntentIds', 'source_partner_intent_ids']) {
  if (!activityApiSource.includes(token)) {
    errors.push(`common/api/activity.js must support invited converted activity visibility with ${token}`);
  }
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
  const normalizedSource = source.replace(/\r\n/g, '\n');
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
  for (const token of ['catch (error)', 'activities.value = []', 'unreadCount.value = 0']) {
    if (!source.includes(token)) {
      errors.push(`pages/home/index.vue must handle startup cloud request failures without an unhandled promise using ${token}`);
    }
  }
  for (const token of ['openUserActivity', 'goParticipantDashboard', '...myGroups.value.pending']) {
    if (!source.includes(token)) {
      errors.push(`pages/home/index.vue must route applied/joined activities through participant dashboard with ${token}`);
    }
  }
  for (const staleStat of ['{{ activities.length }}', '{{ visibleMyActivities.length }}', '{{ quickStartCount }}']) {
    if (source.includes(staleStat)) {
      errors.push(`pages/home/index.vue must not bind topic stats to stale runtime count: ${staleStat}`);
    }
  }
  for (const bannedCopy of ['快成行', '我的进行中']) {
    if (source.includes(bannedCopy)) {
      errors.push(`pages/home/index.vue must not expose stale topic stat copy: ${bannedCopy}`);
    }
  }
  if (!source.includes(':activity="item" compact')) {
    errors.push('pages/home/index.vue home activity list must render SuActivityCard in compact mode');
  }
  for (const token of ['.scene-row {\n  margin-top: 14rpx;', '.sort-tabs {\n  display: flex;\n  gap: 12rpx;\n  margin-top: 14rpx;', 'margin: 24rpx 0 14rpx;']) {
    if (!normalizedSource.includes(token)) {
      errors.push(`pages/home/index.vue must keep compact spacing below the feature card with ${token}`);
    }
  }
}

for (const file of ['pages/home/index.vue', 'pages/discover/index.vue', 'pages/participant/dashboard.vue']) {
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

const partnerPagePath = path.join(root, 'pages/partners/index.vue');
if (fs.existsSync(partnerPagePath)) {
  const source = fs.readFileSync(partnerPagePath, 'utf8');
  const normalizedSource = source.replace(/\r\n/g, '\n');
  for (const token of ['searchKeyword', 'matchesKeyword', 'v-model="searchKeyword"']) {
    if (!source.includes(token)) {
      errors.push(`pages/partners/index.vue must implement real local partner search with ${token}`);
    }
  }
  if (source.includes('showComingSoon')) {
    errors.push('pages/partners/index.vue search must not be a placeholder toast');
  }
  if (source.includes('找搭子')) {
    errors.push('pages/partners/index.vue must not render the stale 找搭子 label');
  }
  for (const token of ['margin: 18rpx 0 8rpx;', '.section-title--inline {\n  margin-bottom: 6rpx;', '.scene-scroll-row {\n  margin-top: 16rpx;']) {
    if (!normalizedSource.includes(token)) {
      errors.push(`pages/partners/index.vue must keep compact spacing below the feature card with ${token}`);
    }
  }
  if (!source.includes('gap: 18rpx;')) {
    errors.push('pages/partners/index.vue must tighten partner list spacing to gap: 18rpx');
  }
  if (source.includes('gap: 26rpx;')) {
    errors.push('pages/partners/index.vue must not keep tall partner list spacing gap: 26rpx');
  }
}

for (const createPage of ['pages/activity/create.vue', 'pages/partner/create.vue']) {
  const absolute = path.join(root, createPage);
  if (!fs.existsSync(absolute)) continue;
  const source = fs.readFileSync(absolute, 'utf8');
  if (source.includes('voice-launch-button') || source.includes('showComingSoon')) {
    errors.push(`${createPage} must hide low-priority voice placeholder entry in trial mode`);
  }
}

const partnerDetailPath = path.join(root, 'pages/partner/detail.vue');
if (fs.existsSync(partnerDetailPath)) {
  const source = fs.readFileSync(partnerDetailPath, 'utf8');
  for (const token of ['partner.detail', 'displayWants', 'partner.available', 'partner.locationRange', 'viewerIntent', 'viewerIntentStatus', 'goPartnerConversation', 'openAcceptedConversation']) {
    if (!source.includes(token)) {
      errors.push(`pages/partner/detail.vue must align partner detail information order with ${token}`);
    }
  }
  if (source.includes('showComingSoon')) {
    errors.push('pages/partner/detail.vue must replace placeholder chat actions with intent-state and conversation routing');
  }
  if (source.includes('搭子帖')) {
    errors.push('pages/partner/detail.vue must not expose 搭子帖 in user-visible copy');
  }
}

const partnerWorkbenchPath = path.join(root, 'pages/partner/workbench.vue');
if (fs.existsSync(partnerWorkbenchPath)) {
  const source = fs.readFileSync(partnerWorkbenchPath, 'utf8');
  for (const token of ['convertPartnerPostToActivity', 'openConvertSheet', 'convertSheetVisible', 'conversionForm', 'sourcePartnerIntentIds', 'invitedUserIds']) {
    if (!source.includes(token)) {
      errors.push(`pages/partner/workbench.vue must support real partner conversion flow token: ${token}`);
    }
  }
  for (const staleToken of ['搭子转活动正在接入', '定向通知正在接入']) {
    if (source.includes(staleToken)) {
      errors.push(`pages/partner/workbench.vue must not keep placeholder conversion copy: ${staleToken}`);
    }
  }
}

for (const [file, tokens] of Object.entries({
  'pages/user/profile.vue': ['activeActivityScope', 'activePartnerScope', 'currentActivityList', 'currentPartnerList', 'getActivityStatusMeta', 'profile-card__status', 'postedPartnerPosts'],
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

const profilePagePath = path.join(root, 'pages/user/profile.vue');
if (fs.existsSync(profilePagePath)) {
  const source = fs.readFileSync(profilePagePath, 'utf8');
  for (const token of ['displayProfile', 'profileStats', ':src="displayProfile.avatar"', '{{ displayProfile.nickname }}', 'v-for="stat in profileStats"']) {
    if (!source.includes(token)) {
      errors.push(`pages/user/profile.vue must bind the hero card to current user/profile stats with ${token}`);
    }
  }
  for (const staleToken of ['mockProfileAvatar', 'pexels-photo-12603316']) {
    if (source.includes(staleToken)) {
      errors.push(`pages/user/profile.vue must not render stale static profile hero data: ${staleToken}`);
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

const deploymentDocPath = path.join(root, 'docs/surego-cloud-trial-deployment.md');
if (fs.existsSync(deploymentDocPath)) {
  const source = fs.readFileSync(deploymentDocPath, 'utf8');
  for (const token of ['只上传 SureGo 业务云函数', '不要全量上传', 'surego-activity', 'surego-partner', 'surego-users.init_data.json', 'uni-id-roles.init_data.json']) {
    if (!source.includes(token)) {
      errors.push(`docs/surego-cloud-trial-deployment.md is missing deployment scope token: ${token}`);
    }
  }
}

const deploymentScopeCheckPath = path.join(root, 'scripts/surego-deployment-scope-check.mjs');
if (fs.existsSync(deploymentScopeCheckPath)) {
  const source = fs.readFileSync(deploymentScopeCheckPath, 'utf8');
  for (const token of ['allowedCloudFunctions', 'allowedDatabaseArtifacts', 'blockedDemoRoutes', 'surego-activity', 'user-center']) {
    if (!source.includes(token)) {
      errors.push(`scripts/surego-deployment-scope-check.mjs is missing deployment scope token: ${token}`);
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
  for (const token of ['确认试运行订单', '订单确认成功']) {
    if (!source.includes(token)) {
      errors.push(`pages/payment/index.vue must use trial-order wording token: ${token}`);
    }
  }
  for (const staleToken of ['确认支付', '支付成功', '试运行订单确认，不发生真实扣款']) {
    if (source.includes(staleToken)) {
      errors.push(`pages/payment/index.vue must not imply real payment with ${staleToken}`);
    }
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
  for (const token of ['试运行金额', '试运行退款记录']) {
    if (!source.includes(token)) {
      errors.push(`pages/order/detail.vue must use trial-order detail wording token: ${token}`);
    }
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
  assertNoMojibake(file, source);
  for (const pattern of bannedPatterns) {
    if (pattern.test(source)) {
      errors.push(`${file} contains banned pattern: ${pattern}`);
    }
  }

  if (file.endsWith('.vue')) {
    if (file !== 'components/surego/SuIcon.vue' && source.includes('<uni-icons')) {
      errors.push(`${file} must use SuIcon instead of direct uni-icons`);
    }

    const corruptedTag = source.match(/\?\/(?:text|view|button|scroll-view|template)>/);
    if (corruptedTag) {
      errors.push(`${file} contains a corrupted template closing tag: ${corruptedTag[0]}`);
    }

    const interpolationPattern = /{{([\s\S]*?)}}/g;
    let interpolationMatch;
    while ((interpolationMatch = interpolationPattern.exec(source))) {
      const expression = interpolationMatch[1].trim();
      try {
        new Function(`return (${expression})`);
      } catch (error) {
        errors.push(`${file} has invalid template expression "${expression}": ${error.message}`);
      }
    }

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
