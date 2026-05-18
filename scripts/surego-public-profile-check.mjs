import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'

const root = process.cwd()
const sourcePath = path.join(root, 'common/api/user.js')
let source = fs.readFileSync(sourcePath, 'utf8')

source = source
  .replace(/^import .+$/gm, '')
  .replace(/export async function /g, 'async function ')
  .replace(/export function /g, 'function ')
  .replace(/export const /g, 'const ')

source += `
Object.assign(__exports, {
  getUserProfileById,
  followUser
})
`

const targetUserId = 'member_1'
const storage = {}
const activities = [
  {
    id: 'hosted_public',
    title: '公开主办局',
    creatorId: targetUserId,
    creator_id: targetUserId,
    status: 'recruiting',
    lifecycleStatus: 'recruiting',
    moderationStatus: 'approved',
    moderation_status: 'approved',
    date: '5月10日',
    time: '14:00',
    image: '/static/hosted.png'
  },
  {
    id: 'joined_public',
    title: '公开参与局',
    creatorId: 'creator_2',
    creator_id: 'creator_2',
    status: 'formed',
    lifecycleStatus: 'formed',
    moderationStatus: 'approved',
    moderation_status: 'approved',
    date: '5月12日',
    time: '18:00',
    image: '/static/joined.png'
  },
  {
    id: 'hidden_hosted',
    title: '隐藏主办局',
    creatorId: targetUserId,
    creator_id: targetUserId,
    status: 'recruiting',
    moderationStatus: 'hidden',
    moderation_status: 'hidden'
  },
  {
    id: 'reviewing_hosted',
    title: '审核中主办局',
    creatorId: targetUserId,
    creator_id: targetUserId,
    status: 'reviewing',
    moderationStatus: 'pending',
    moderation_status: 'pending'
  },
  {
    id: 'pending_joined',
    title: '待审核参与局',
    creatorId: 'creator_3',
    creator_id: 'creator_3',
    status: 'recruiting',
    moderationStatus: 'approved',
    moderation_status: 'approved'
  }
]

const applicationsByActivityId = {
  joined_public: [
    { id: 'app_1', activityId: 'joined_public', activity_id: 'joined_public', userId: targetUserId, user_id: targetUserId, status: 'approved' }
  ],
  pending_joined: [
    { id: 'app_2', activityId: 'pending_joined', activity_id: 'pending_joined', userId: targetUserId, user_id: targetUserId, status: 'pending' }
  ]
}

const sandbox = {
  __exports: {},
  USE_UNICLOUD: false,
  shouldUseCloudFallback: () => false,
  callSuregoFunction: async () => {
    throw new Error('cloud disabled in public profile check')
  },
  handleSuregoCloudError: async (_error, fallback) => fallback(),
  DEFAULT_USER_AVATAR: '/static/userImg/user.png',
  DEFAULT_USER_NICKNAME: '微信用户',
  getCurrentUserId: () => 'current_user',
  getCurrentUserProfile: () => ({
    uid: 'current_user',
    userId: 'current_user',
    nickname: '当前用户',
    avatar: '/static/current.png',
    credit: 100,
    role: ['user'],
    roles: ['user']
  }),
  isLoggedIn: () => true,
  saveCurrentUserProfile: (profile) => profile,
  setMockLogin: (profile) => profile,
  listAllActivities: async () => activities,
  listApplications: async (activityId) => applicationsByActivityId[String(activityId)] || [],
  isPubliclyVisibleActivity: (activity = {}) => {
    const status = activity.status || activity.lifecycleStatus
    const moderationStatus = activity.moderationStatus || activity.moderation_status
    return ['published', 'recruiting', 'formed', 'ongoing'].includes(status)
      && ['approved', 'visible'].includes(moderationStatus)
  },
  sortActivitiesByStatusPriority: (items = []) => [...items],
  uni: {
    getStorageSync: (key) => storage[key],
    setStorageSync: (key, value) => {
      storage[key] = value
    }
  }
}

vm.runInNewContext(source, sandbox, { filename: sourcePath })

const profile = await sandbox.__exports.getUserProfileById(targetUserId)

assert.equal(profile.activityCount, 2)
assert.equal(profile.hostedCount, 1)
assert.equal(profile.joinedCount, 1)
assert.equal(profile.orderCount, undefined)
assert.equal(profile.roleText, undefined)
assert.deepEqual(
  profile.recentActivities.map((activity) => activity.id).sort(),
  ['hosted_public', 'joined_public']
)
assert.equal(profile.recentActivities.some((activity) => activity.id === 'hidden_hosted'), false)
assert.equal(profile.recentActivities.some((activity) => activity.id === 'reviewing_hosted'), false)
assert.equal(profile.recentActivities.some((activity) => activity.id === 'pending_joined'), false)

const followed = await sandbox.__exports.followUser(targetUserId)
assert.equal(followed.followedByMe, true)
assert.equal(followed.followerCount, 1)

const profileAfterFollow = await sandbox.__exports.getUserProfileById(targetUserId)
assert.equal(profileAfterFollow.followedByMe, true)
assert.equal(profileAfterFollow.followerCount, 1)

console.log('public profile check passed')
