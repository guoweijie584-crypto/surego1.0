import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'

const root = process.cwd()
const sourcePath = path.join(root, 'common/api/activity.js')
let source = fs.readFileSync(sourcePath, 'utf8')

source = source
  .replace(/^import .+$/gm, '')
  .replace(/export async function /g, 'async function ')
  .replace(/export function /g, 'function ')
  .replace(/export const /g, 'const ')

source += `
Object.assign(__exports, {
  getActivityDetail,
  isPubliclyVisibleActivity
})
`

const storage = {}
const mockActivities = [
  {
    id: '101',
    title: 'Reference activity',
    creatorId: 'creator_101',
    creator_id: 'creator_101',
    status: 'not_applied',
    participantCount: 1,
    maxParticipants: 8,
    hasParticipantLimit: true,
    partyMode: 'free'
  }
]

const sandbox = {
  __exports: {},
  activities: mockActivities,
  findActivityById: (id) => mockActivities.find((activity) => activity.id === String(id)) || mockActivities[0],
  USE_UNICLOUD: false,
  shouldUseReferenceMockPreview: () => false,
  callSuregoFunction: async () => {
    throw new Error('cloud disabled in eligibility check')
  },
  handleSuregoCloudError: async (_error, fallback) => fallback(),
  getCurrentUserId: () => 'current_user',
  getCurrentUserProfile: () => ({ userId: 'current_user', nickname: 'Current User', avatar: '' }),
  getDefaultCoverPreset: () => ({ image: '' }),
  CITY_OPTIONS: [],
  DEFAULT_CITY: '杭州',
  DEFAULT_CITY_CODE: '330100',
  getCityCode: () => '',
  inferCityFromLocation: () => ({ city: '杭州', cityCode: '330100' }),
  normalizeCityCode: (value = '') => String(value || ''),
  normalizeCityName: (value = '') => String(value || ''),
  uni: {
    getStorageSync: (key) => storage[key],
    setStorageSync: (key, value) => {
      storage[key] = value
    }
  }
}

vm.runInNewContext(source, sandbox, { filename: sourcePath })

const detail = await sandbox.__exports.getActivityDetail('101')

assert.equal(detail.status, 'recruiting')
assert.equal(detail.moderationStatus, 'approved')
assert.equal(detail.moderation_status, 'approved')
assert.equal(sandbox.__exports.isPubliclyVisibleActivity(detail), true)

console.log('registration eligibility check passed')
