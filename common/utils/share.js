export function buildActivitySharePath(activity = {}) {
  const id = activity.id || activity.activityId || ''
  return `/pages/activity/detail?id=${encodeURIComponent(String(id))}`
}

export function buildActivityShareTitle(activity = {}) {
  return activity.title ? `SureGo | ${activity.title}` : 'SureGo 一起成行'
}

export function buildActivityPosterCopy(activity = {}) {
  const mode = activity.partyMode === 'ticket'
    ? `门票 ¥${activity.amount || 0}`
    : activity.partyMode === 'sincerity'
      ? `诚意金 ¥${activity.amount || 0}`
      : '免费局'
  return {
    brand: 'SUREGO',
    slogan: '一起成行',
    mode,
    time: `${activity.date || ''} ${activity.time || ''}${activity.endTime ? ` - ${activity.endTime}` : ''}`.trim(),
    location: activity.location || '地点待确认',
    people: `${activity.participantCount || 0}/${activity.maxParticipants || '不限'}`,
    path: buildActivitySharePath(activity),
    qrHint: '微信扫码或搜索 SureGo'
  }
}

export function buildActivitySharePayload(activity = {}, imageUrl = '') {
  return {
    title: buildActivityShareTitle(activity),
    path: buildActivitySharePath(activity),
    imageUrl: imageUrl || activity.image || activity.cover || ''
  }
}
