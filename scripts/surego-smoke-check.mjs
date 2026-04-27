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
  'common/api/activity.js',
  'common/api/application.js',
  'common/api/order.js',
  'common/api/message.js',
  'common/api/checkin.js',
  'pages/home/index.vue',
  'pages/discover/index.vue',
  'pages/messages/index.vue',
  'pages/user/profile.vue',
  'pages/activity/detail.vue',
  'pages/activity/register.vue',
  'pages/activity/create.vue',
  'pages/manage/dashboard.vue',
  'pages/participant/dashboard.vue',
  'pages/my/activities.vue',
  'pages/payment/index.vue',
  'pages/status/success.vue'
];

const expectedPages = [
  'pages/home/index',
  'pages/discover/index',
  'pages/messages/index',
  'pages/user/profile',
  'pages/activity/detail',
  'pages/activity/register',
  'pages/activity/create',
  'pages/manage/dashboard',
  'pages/participant/dashboard',
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

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('SureGo smoke check passed.');
