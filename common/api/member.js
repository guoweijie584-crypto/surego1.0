import { USE_UNICLOUD } from '../config/runtime.js'
import { callSuregoFunction, handleSuregoCloudError } from '@/common/api/cloud.js'
import { getCurrentUserId } from '@/common/api/auth.js'
import { getActivityDetail } from '@/common/api/activity.js'
import { listApplications } from '@/common/api/application.js'
import { getUserProfiles } from '@/common/api/user.js'

function buildFallbackAvatar(seed = 'surego') {
  return `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(seed)}`
}

function profileMap(profiles = []) {
  return profiles.reduce((map, profile) => {
    const id = profile.userId || profile.uid || profile.user_id
    if (id) map[String(id)] = profile
    return map
  }, {})
}

export async function listActivityMembers(activityId) {
  const [activity, applications] = await Promise.all([
    getActivityDetail(activityId),
    listApplications(activityId)
  ])
  const approved = applications.filter((item) => item.status === 'approved')
  const ids = [
    activity.creatorId || activity.creator_id,
    ...approved.map((item) => item.userId || item.user_id)
  ].filter(Boolean)
  const profiles = profileMap(await getUserProfiles(ids))
  const creatorId = activity.creatorId || activity.creator_id || 'creator'
  const creatorProfile = profiles[creatorId] || {}
  const creator = {
    id: creatorId,
    userId: creatorId,
    name: creatorProfile.nickname || activity.organizer || '局长',
    role: '局长',
    avatar: creatorProfile.avatar || activity.organizerAvatar || buildFallbackAvatar(creatorId),
    isCreator: true,
    isMe: creatorId === getCurrentUserId()
  }
  const members = approved.map((item, index) => {
    const userId = item.userId || item.user_id || `member_${index + 1}`
    const profile = profiles[userId] || {}
    return {
      id: userId,
      userId,
      name: profile.nickname || `参与者 ${index + 1}`,
      role: '参与者',
      avatar: profile.avatar || buildFallbackAvatar(userId),
      application: item,
      isMe: userId === getCurrentUserId()
    }
  })
  return [creator, ...members]
}

export async function getActivityMemberSummary(activityId) {
  const members = await listActivityMembers(activityId)
  return {
    activityId: String(activityId || ''),
    members,
    confirmedCount: Math.max(0, members.length - 1)
  }
}

export async function listActivityMemberProfiles(activityId) {
  if (USE_UNICLOUD) {
    try {
      const result = await callSuregoFunction('surego-user', 'getProfiles', {
        userIds: (await listActivityMembers(activityId)).map((item) => item.userId)
      })
      if (result?.length) return result
    } catch (error) {
      return handleSuregoCloudError(error, () => listActivityMembers(activityId))
    }
  }
  return listActivityMembers(activityId)
}
