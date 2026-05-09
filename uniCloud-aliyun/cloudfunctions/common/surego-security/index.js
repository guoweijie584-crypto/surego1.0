'use strict';

const uniID = require('uni-id');

const OPS_ROLES = ['admin', 'operator'];

function normalizeRoles(roles) {
  if (!roles) return [];
  const values = Array.isArray(roles) ? roles : [roles];
  return Array.from(new Set(values.map((role) => String(role || '').trim().toLowerCase()).filter(Boolean)));
}

function hasRole(user = {}, role) {
  return normalizeRoles(user.roles || user.role).includes(role);
}

function isOps(user = {}) {
  return normalizeRoles(user.roles || user.role).some((role) => OPS_ROLES.includes(role));
}

function response(code, message, data) {
  const body = { code, message };
  if (data !== undefined) body.data = data;
  return body;
}

function ok(data) {
  return { code: 0, data };
}

function authRequired() {
  return response('AUTH_REQUIRED', 'Authentication is required.');
}

function forbidden(message = 'Permission denied.') {
  return response('FORBIDDEN', message);
}

function invalid(message = 'Invalid request.', details) {
  return response('VALIDATION_ERROR', message, details);
}

function notFound(message = 'Resource not found.') {
  return response('NOT_FOUND', message);
}

function unknownAction() {
  return response('UNKNOWN_ACTION', 'Unsupported action.');
}

function createTraceId(prefix = 'sg') {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
}

function internalError(traceId) {
  return response('INTERNAL_ERROR', 'Internal service error.', { traceId });
}

async function withSafeHandler(event = {}, handler) {
  const traceId = cleanString(event.traceId, { max: 80 }) || createTraceId();
  try {
    return await handler({ traceId });
  } catch (error) {
    console.error('[surego-cloud-error]', {
      traceId,
      message: error && error.message,
      stack: error && error.stack
    });
    return internalError(traceId);
  }
}

async function checkToken(uniIdToken) {
  if (!uniIdToken) return null;
  const result = await uniID.checkToken(uniIdToken, {
    needPermission: true,
    needUserInfo: false
  });
  if (!result || result.code || result.errCode) return null;
  const roles = normalizeRoles(result.role || result.roles);
  return {
    uid: String(result.uid || ''),
    roles,
    role: roles,
    permission: result.permission || result.permissions || [],
    isAdmin: roles.includes('admin'),
    isOps: roles.some((role) => OPS_ROLES.includes(role)),
    token: result.token,
    tokenExpired: result.tokenExpired
  };
}

async function requireAuth(event = {}) {
  const user = await checkToken(event.uniIdToken);
  if (!user || !user.uid || user.uid === 'mock_user') return null;
  return user;
}

async function optionalAuth(event = {}) {
  try {
    return await requireAuth(event);
  } catch (error) {
    return null;
  }
}

function requireOps(user) {
  return Boolean(user && user.isOps);
}

function requireAdmin(user) {
  return Boolean(user && user.isAdmin);
}

function cleanString(value, options = {}) {
  const max = Number(options.max || 200);
  const min = Number(options.min || 0);
  const fallback = options.fallback || '';
  const next = String(value ?? fallback).trim().slice(0, max);
  if (next.length < min) return '';
  return next;
}

function cleanEnum(value, allowed = [], fallback = '') {
  const next = String(value || '').trim();
  return allowed.includes(next) ? next : fallback;
}

function cleanBool(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

function cleanInt(value, options = {}) {
  const fallback = Number.isFinite(options.fallback) ? options.fallback : 0;
  const min = Number.isFinite(options.min) ? options.min : Number.MIN_SAFE_INTEGER;
  const max = Number.isFinite(options.max) ? options.max : Number.MAX_SAFE_INTEGER;
  const next = Number(value);
  if (!Number.isInteger(next)) return fallback;
  return Math.min(max, Math.max(min, next));
}

function cleanNumber(value, options = {}) {
  const fallback = Number.isFinite(options.fallback) ? options.fallback : 0;
  const min = Number.isFinite(options.min) ? options.min : Number.MIN_SAFE_INTEGER;
  const max = Number.isFinite(options.max) ? options.max : Number.MAX_SAFE_INTEGER;
  const next = Number(value);
  if (!Number.isFinite(next)) return fallback;
  return Math.min(max, Math.max(min, next));
}

function cleanId(value) {
  return cleanString(value, { max: 128 });
}

function cleanArray(value, options = {}) {
  const max = Number(options.max || 20);
  return Array.isArray(value) ? value.slice(0, max) : [];
}

function cleanUrl(value, options = {}) {
  const url = cleanString(value, { max: options.max || 500 });
  if (!url) return '';
  if (url.startsWith('cloud://') || url.startsWith('https://') || url.startsWith('/static/')) return url;
  return '';
}

function limitObjectKeys(source = {}, allowedKeys = []) {
  const next = {};
  allowedKeys.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      next[key] = source[key];
    }
  });
  return next;
}

function now() {
  return Date.now();
}

module.exports = {
  authRequired,
  checkToken,
  cleanArray,
  cleanBool,
  cleanEnum,
  cleanId,
  cleanInt,
  cleanNumber,
  cleanString,
  cleanUrl,
  forbidden,
  hasRole,
  internalError,
  invalid,
  isOps,
  limitObjectKeys,
  normalizeRoles,
  notFound,
  now,
  ok,
  optionalAuth,
  requireAdmin,
  requireAuth,
  requireOps,
  withSafeHandler,
  unknownAction
};
