import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'

const root = path.resolve(process.cwd())
const databaseDir = path.join(root, 'uniCloud-aliyun', 'database')
const defaultAvatar = '/static/userImg/user.png'
const baseTime = Date.UTC(2026, 4, 14, 8, 0, 0)
const userIdMap = {
  mock_user: 'seed_owner_wu'
}

function readSource(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function loadMockArray(relativePath, exportName) {
  const source = readSource(relativePath)
    .replace(/export\s+const\s+/g, 'const ')
    .replace(/export\s+function\s+/g, 'function ')
  const context = {
    module: { exports: {} },
    exports: {}
  }
  vm.runInNewContext(`${source}\nmodule.exports = { ${exportName} };`, context, {
    filename: relativePath
  })
  return context.module.exports[exportName] || []
}

function mapUserId(userId = '') {
  const id = String(userId || '').trim()
  return userIdMap[id] || id
}

function uniqueStrings(items = []) {
  return Array.from(new Set(items.map((item) => String(item || '').trim()).filter(Boolean)))
}

function normalizeIdList(items = []) {
  return uniqueStrings((Array.isArray(items) ? items : []).map(mapUserId))
}

function parseTimestamp(value, index = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const parsed = Date.parse(String(value || '').replace(/\./g, '-'))
  if (!Number.isNaN(parsed)) return parsed
  return baseTime + index * 60 * 60 * 1000
}

function optionalNumber(value) {
  const next = Number(value)
  return Number.isFinite(next) ? next : undefined
}

function pickArray(...values) {
  for (const value of values) {
    if (Array.isArray(value)) return value
  }
  return []
}

function clean(value) {
  if (Array.isArray(value)) return value.map(clean)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entryValue]) => entryValue !== undefined)
      .map(([key, entryValue]) => [key, clean(entryValue)])
  )
}

function normalizeActivityStatus(status = 'recruiting') {
  const statuses = ['draft', 'reviewing', 'published', 'recruiting', 'formed', 'ongoing', 'finished', 'cancelled']
  return statuses.includes(status) ? status : 'recruiting'
}

function normalizeModerationStatus(status = 'approved') {
  const statuses = ['pending', 'approved', 'rejected', 'hidden', 'visible']
  return statuses.includes(status) ? status : 'approved'
}

function buildActivitySeed(item = {}, index = 0) {
  const id = String(item.id || item._id || `seed_activity_${index + 1}`)
  const creatorId = mapUserId(item.creator_id || item.creatorId)
  const image = item.image || item.cover || ''
  const status = normalizeActivityStatus(item.status || item.lifecycleStatus || 'recruiting')
  const moderationStatus = normalizeModerationStatus(item.moderation_status || item.moderationStatus || 'approved')
  const createdAt = parseTimestamp(item.createdAt || item.created_at || item.dateValue, index)

  return clean({
    _id: id,
    id,
    title: item.title || '',
    scene: item.scene || '',
    category: item.category || '',
    creator_id: creatorId,
    creatorId,
    organizer: item.organizer || item.creator || '',
    organizerAvatar: item.organizerAvatar || item.organizer_avatar || defaultAvatar,
    organizer_avatar: item.organizerAvatar || item.organizer_avatar || defaultAvatar,
    cover: image,
    image,
    university: item.university || '',
    verified: Boolean(item.verified),
    creditScore: Number(item.creditScore) || 0,
    fulfilledCount: Number(item.fulfilledCount) || 0,
    noShowRate: item.noShowRate || '',
    date: item.date || '',
    dateValue: item.dateValue || '',
    dayOfWeek: item.dayOfWeek || '',
    time: item.time || '',
    end_time: item.endTime || item.end_time || '',
    endTime: item.endTime || item.end_time || '',
    countdown: item.countdown || '',
    location: item.location || '',
    address: item.address || item.location || '',
    city: item.city || '',
    city_code: item.city_code || item.cityCode || '',
    cityCode: item.cityCode || item.city_code || '',
    district: item.district || '',
    latitude: optionalNumber(item.latitude),
    longitude: optionalNumber(item.longitude),
    distance: item.distance || '',
    mode: item.mode || item.partyMode || '',
    party_mode: item.partyMode || item.party_mode || item.mode || 'free',
    partyMode: item.partyMode || item.party_mode || item.mode || 'free',
    price: item.price || String(Number(item.amount) || 0),
    amount: Number(item.amount) || 0,
    approval: Boolean(item.approval ?? item.requireApproval),
    require_approval: Boolean(item.requireApproval ?? item.require_approval),
    requireApproval: Boolean(item.requireApproval ?? item.require_approval),
    waitlist: Boolean(item.waitlist),
    participants: Number(item.participants ?? item.participantCount) || 0,
    participant_count: Number(item.participantCount ?? item.participants) || 0,
    participantCount: Number(item.participantCount ?? item.participants) || 0,
    max_participants: Number(item.maxParticipants ?? item.max_participants) || 10,
    maxParticipants: Number(item.maxParticipants ?? item.max_participants) || 10,
    has_participant_limit: Boolean(item.hasParticipantLimit ?? item.has_participant_limit),
    hasParticipantLimit: Boolean(item.hasParticipantLimit ?? item.has_participant_limit),
    state: item.state || status,
    status,
    lifecycleStatus: status,
    moderation_status: moderationStatus,
    moderationStatus,
    applicationStatus: item.applicationStatus || item.application_status || 'not_applied',
    application_status: item.application_status || item.applicationStatus || 'not_applied',
    viewCount: Number(item.viewCount) || 0,
    likeCount: Number(item.likeCount) || 0,
    meetup: item.meetup || '',
    description: item.description || '',
    refundRule: item.refundRule || '',
    tags: pickArray(item.tags),
    constraints: pickArray(item.constraints),
    questions: pickArray(item.questions),
    faq: pickArray(item.faq),
    visibility: item.visibility || 'public',
    source: item.source || 'direct_activity',
    source_partner_post_id: item.source_partner_post_id || item.sourcePartnerPostId || '',
    sourcePartnerPostId: item.sourcePartnerPostId || item.source_partner_post_id || '',
    source_partner_intent_ids: normalizeIdList(item.source_partner_intent_ids || item.sourcePartnerIntentIds),
    sourcePartnerIntentIds: normalizeIdList(item.sourcePartnerIntentIds || item.source_partner_intent_ids),
    invited_user_ids: normalizeIdList(item.invited_user_ids || item.invitedUserIds),
    invitedUserIds: normalizeIdList(item.invitedUserIds || item.invited_user_ids),
    participant_ids: normalizeIdList(item.participant_ids || item.participantIds),
    participantIds: normalizeIdList(item.participantIds || item.participant_ids),
    created_at: createdAt,
    updated_at: parseTimestamp(item.updatedAt || item.updated_at || createdAt, index)
  })
}

function buildPartnerPostSeed(item = {}, index = 0) {
  const id = String(item.id || item._id || `seed_partner_${index + 1}`)
  const creatorId = mapUserId(item.creator_id || item.creatorId)
  const createdAt = parseTimestamp(item.createdAt || item.created_at, index)

  return clean({
    _id: id,
    id,
    kind: item.kind || '',
    scene: item.scene || '',
    title: item.title || '',
    type: item.type || 'time_box',
    typeLabel: item.typeLabel || '',
    creator_id: creatorId,
    creatorId,
    creator: item.creator || item.author || '',
    author: item.author || item.creator || '',
    avatar: item.avatar || defaultAvatar,
    image: item.image || '',
    school: item.school || '',
    verified: Boolean(item.verified),
    bio: item.bio || '',
    city: item.city || '',
    location: item.location || item.locationRange || '',
    locationRange: item.locationRange || item.location || '',
    schedule: item.schedule || item.available || '',
    available: item.available || item.schedule || '',
    connection_mode: item.connectionMode || item.connection_mode || item.connectionRule || '',
    connectionMode: item.connectionMode || item.connection_mode || item.connectionRule || '',
    connectionRule: item.connectionRule || item.connectionMode || item.connection_mode || '',
    description: item.description || item.detail || '',
    detail: item.detail || item.description || '',
    expectation: item.expectation || '',
    wants: pickArray(item.wants),
    fit_tags: pickArray(item.fitTags || item.fit_tags || item.tags),
    fitTags: pickArray(item.fitTags || item.fit_tags || item.tags),
    tags: pickArray(item.tags || item.fitTags || item.fit_tags),
    actionLabel: item.actionLabel || '',
    status: item.status || 'open',
    intent_count: Number(item.intentCount ?? item.intent_count ?? item.interested) || 0,
    intentCount: Number(item.intentCount ?? item.intent_count ?? item.interested) || 0,
    interested: Number(item.interested ?? item.intentCount ?? item.intent_count) || 0,
    follow_count: Number(item.followCount ?? item.follow_count) || 0,
    followCount: Number(item.followCount ?? item.follow_count) || 0,
    source_activity_id: item.source_activity_id || item.sourceActivityId || '',
    created_at: createdAt,
    createdAt: item.createdAt || item.created_at || new Date(createdAt).toISOString(),
    updated_at: parseTimestamp(item.updatedAt || item.updated_at || createdAt, index)
  })
}

function addSeedUser(users, userId, profile = {}) {
  const mappedId = mapUserId(userId)
  if (!mappedId) return
  const existing = users.get(mappedId) || {}
  users.set(mappedId, {
    _id: mappedId,
    user_id: mappedId,
    nickname: profile.nickname || existing.nickname || mappedId,
    avatar: profile.avatar || existing.avatar || defaultAvatar,
    avatar_file_id: '',
    profile_completed_at: existing.profile_completed_at || baseTime,
    mbti: profile.mbti || existing.mbti || '',
    bio: profile.bio || existing.bio || '',
    quote: profile.quote || existing.quote || '',
    credit: Number(profile.credit ?? existing.credit) || 100,
    roles: ['user'],
    created_at: existing.created_at || baseTime,
    updated_at: baseTime
  })
}

function buildUserSeeds(activitySeeds, partnerSeeds) {
  const users = new Map()
  for (const activity of activitySeeds) {
    addSeedUser(users, activity.creator_id, {
      nickname: activity.organizer,
      avatar: activity.organizerAvatar,
      credit: activity.creditScore,
      bio: activity.university
    })
    for (const userId of [...(activity.participant_ids || []), ...(activity.invited_user_ids || [])]) {
      addSeedUser(users, userId)
    }
  }
  for (const post of partnerSeeds) {
    addSeedUser(users, post.creator_id, {
      nickname: post.creator,
      avatar: post.avatar,
      bio: post.bio
    })
  }
  return Array.from(users.values()).sort((a, b) => a.user_id.localeCompare(b.user_id))
}

function index(IndexName, keys, unique = false) {
  return {
    IndexName,
    MgoKeySchema: {
      MgoIndexKeys: keys.map(([Name, Direction]) => ({
        Name,
        Direction
      })),
      MgoIsUnique: unique
    }
  }
}

const indexFiles = {
  'surego-activities.index.json': [
    index('public_status_created_at', [['visibility', '1'], ['moderation_status', '1'], ['status', '1'], ['created_at', '-1']]),
    index('creator_created_at', [['creator_id', '1'], ['created_at', '-1']]),
    index('invited_created_at', [['invited_user_ids', '1'], ['created_at', '-1']]),
    index('city_status_created_at', [['city_code', '1'], ['status', '1'], ['created_at', '-1']]),
    index('source_partner_post', [['source_partner_post_id', '1'], ['created_at', '-1']])
  ],
  'surego-applications.index.json': [
    index('activity_user', [['activity_id', '1'], ['user_id', '1']]),
    index('user_created_at', [['user_id', '1'], ['created_at', '-1']]),
    index('activity_created_at', [['activity_id', '1'], ['created_at', '-1']]),
    index('activity_status', [['activity_id', '1'], ['status', '1']])
  ],
  'surego-orders.index.json': [
    index('activity_user', [['activityId', '1'], ['userId', '1']]),
    index('snake_activity_user', [['activity_id', '1'], ['user_id', '1']]),
    index('user_created_at', [['userId', '1'], ['created_at', '-1']]),
    index('activity_created_at', [['activityId', '1'], ['created_at', '-1']])
  ],
  'surego-partner-posts.index.json': [
    index('status_created_at', [['status', '1'], ['created_at', '-1']]),
    index('creator_created_at', [['creator_id', '1'], ['created_at', '-1']])
  ],
  'surego-partner-intents.index.json': [
    index('post_user', [['partner_post_id', '1'], ['user_id', '1']]),
    index('post_created_at', [['partner_post_id', '1'], ['created_at', '-1']]),
    index('user_created_at', [['user_id', '1'], ['created_at', '-1']])
  ],
  'surego-follows.index.json': [
    index('target_user', [['target_type', '1'], ['target_id', '1'], ['user_id', '1']]),
    index('user_created_at', [['user_id', '1'], ['created_at', '-1']])
  ],
  'surego-conversations.index.json': [
    index('post_updated_at', [['partner_post_id', '1'], ['updated_at', '-1']]),
    index('participant_updated_at', [['participant_ids', '1'], ['updated_at', '-1']])
  ],
  'surego-checkins.index.json': [
    index('activity_user', [['activity_id', '1'], ['user_id', '1']]),
    index('activity_status', [['activity_id', '1'], ['status', '1']]),
    index('user_created_at', [['user_id', '1'], ['created_at', '-1']])
  ],
  'surego-reports.index.json': [
    index('status_created_at', [['status', '1'], ['created_at', '-1']]),
    index('activity_created_at', [['activity_id', '1'], ['created_at', '-1']]),
    index('reporter_created_at', [['reporter_id', '1'], ['created_at', '-1']])
  ],
  'surego-audit-logs.index.json': [
    index('target_created_at', [['target_type', '1'], ['target_id', '1'], ['created_at', '-1']]),
    index('operator_created_at', [['operator_id', '1'], ['created_at', '-1']])
  ],
  'surego-users.index.json': [
    index('user_id', [['user_id', '1']]),
    index('roles_updated_at', [['roles', '1'], ['updated_at', '-1']])
  ]
}

function writeJson(relativePath, value) {
  const json = JSON.stringify(value, null, 2).replace(/[^\x00-\x7F]/g, (character) => {
    return `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`
  })
  fs.writeFileSync(path.join(databaseDir, relativePath), `${json}\n`)
}

const activities = loadMockArray('common/mock/activities.js', 'activities')
const partnerPosts = loadMockArray('common/mock/partners.js', 'partnerPosts')
const activitySeeds = activities.map(buildActivitySeed)
const partnerPostSeeds = partnerPosts.map(buildPartnerPostSeed)
const userSeeds = buildUserSeeds(activitySeeds, partnerPostSeeds)

writeJson('surego-activities.init_data.json', activitySeeds)
writeJson('surego-partner-posts.init_data.json', partnerPostSeeds)
writeJson('surego-users.init_data.json', userSeeds)

for (const [fileName, indexes] of Object.entries(indexFiles)) {
  writeJson(fileName, indexes)
}

console.log(`Generated ${activitySeeds.length} activities, ${partnerPostSeeds.length} partner posts, ${userSeeds.length} seed users.`)
console.log(`Generated ${Object.keys(indexFiles).length} index files.`)
