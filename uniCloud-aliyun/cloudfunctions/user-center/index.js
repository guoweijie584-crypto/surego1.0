'use strict';

const uniID = require('uni-id');

const PUBLIC_ACTIONS = ['login', 'loginByWeixin', 'loginBySms', 'loginByEmail', 'code2SessionWeixin', 'code2SessionAlipay'];
const SELF_ACTIONS = [
  'logout',
  'checkToken',
  'updatePwd',
  'setAvatar',
  'bindMobile',
  'unbindMobile',
  'bindEmail',
  'unbindEmail',
  'bindWeixin',
  'unbindWeixin',
  'loginByAlipay',
  'bindAlipay',
  'unbindAlipay'
];
const ADMIN_ACTIONS = [
  'updateUser',
  'setUserInviteCode',
  'acceptInvite',
  'getRoleByUid',
  'getRoleList',
  'getPermissionList'
];
const DISABLED_ACTIONS = [
  'register',
  'resetPwd',
  'encryptPwd',
  'sendSmsCode',
  'setVerifyCode',
  'addRole',
  'addPermission',
  'bindRole',
  'bindPermission'
];

function hasAdminRole(payload = {}) {
  const roles = Array.isArray(payload.role) ? payload.role : [payload.role];
  return roles.map((role) => String(role || '').toLowerCase()).includes('admin');
}

function forbidden(message = 'Permission denied.') {
  return { code: 'FORBIDDEN', message };
}

async function verifyToken(event) {
  if (!event.uniIdToken) return null;
  const auth = await uniID.checkToken(event.uniIdToken, {
    needPermission: true,
    needUserInfo: false
  });
  if (!auth || auth.code) return null;
  return auth;
}

exports.main = async (event = {}) => {
  const action = event.action;
  const params = event.params || {};

  if (DISABLED_ACTIONS.includes(action)) {
    return forbidden('This legacy user-center action is disabled. Use uni-id-co or a dedicated admin endpoint.');
  }

  let auth = null;
  if (!PUBLIC_ACTIONS.includes(action)) {
    auth = await verifyToken(event);
    if (!auth) return { code: 'AUTH_REQUIRED', message: 'Authentication is required.' };
    params.uid = auth.uid;
  }

  if (ADMIN_ACTIONS.includes(action) && !hasAdminRole(auth)) {
    return forbidden('Administrator permission is required.');
  }

  switch (action) {
    case 'login':
      return uniID.login({ ...params, queryField: ['username', 'email', 'mobile'] });
    case 'logout':
      return uniID.logout(event.uniIdToken);
    case 'updatePwd':
      return uniID.updatePwd(params);
    case 'setAvatar':
      return uniID.setAvatar(params);
    case 'bindMobile':
      return uniID.bindMobile(params);
    case 'unbindMobile':
      return uniID.unbindMobile(params);
    case 'bindEmail':
      return uniID.bindEmail(params);
    case 'unbindEmail':
      return uniID.unbindEmail(params);
    case 'code2SessionWeixin':
      return uniID.code2SessionWeixin(params);
    case 'loginByWeixin':
      return uniID.loginByWeixin(params);
    case 'bindWeixin':
      return uniID.bindWeixin(params);
    case 'unbindWeixin':
      return uniID.unbindWeixin(auth.uid);
    case 'code2SessionAlipay':
      return uniID.code2SessionAlipay(params);
    case 'loginByAlipay':
      return uniID.loginByAlipay(params);
    case 'bindAlipay':
      return uniID.bindAlipay(params);
    case 'unbindAlipay':
      return uniID.unbindAlipay(auth.uid);
    case 'checkToken':
      return uniID.checkToken(event.uniIdToken);
    case 'updateUser':
      return uniID.updateUser(params);
    case 'setUserInviteCode':
      return uniID.setUserInviteCode(params);
    case 'acceptInvite':
      return uniID.acceptInvite(params);
    case 'getRoleList':
      return uniID.getRoleList(params);
    case 'getPermissionList':
      return uniID.getPermissionList(params);
    case 'getRoleByUid':
      return uniID.getRoleByUid(params);
    default:
      return { code: 'UNKNOWN_ACTION', message: 'Unknown action.' };
  }
};
