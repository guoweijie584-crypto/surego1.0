import { getCurrentUserId } from '@/common/api/auth.js'

const LOCATION_KEY = 'surego_current_location'
const CITY_KEY = 'surego_selected_city'
const EARTH_RADIUS_KM = 6371
const LOCATION_TIMEOUT_MS = 8000

function toNumber(value) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

function normalizeLocation(location = {}) {
  const latitude = toNumber(location.latitude)
  const longitude = toNumber(location.longitude)
  return {
    latitude,
    longitude,
    accuracy: toNumber(location.accuracy),
    city: location.city || uni.getStorageSync(CITY_KEY) || '',
    source: location.source || 'weixin',
    userId: location.userId || getCurrentUserId(),
    locatedAt: location.locatedAt || Date.now()
  }
}

function saveLocation(location) {
  const normalized = normalizeLocation(location)
  uni.setStorageSync(LOCATION_KEY, normalized)
  return normalized
}

export function getStoredLocation() {
  try {
    return normalizeLocation(uni.getStorageSync(LOCATION_KEY) || {})
  } catch (error) {
    return normalizeLocation({})
  }
}

export function refreshCurrentLocation(options = {}) {
  return new Promise((resolve, reject) => {
    if (typeof uni.getLocation !== 'function') {
      const error = new Error('getLocation is not available')
      reject(error)
      return
    }

    let settled = false
    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      const error = new Error('定位超时，可手动选择城市')
      if (!options.silent) {
        uni.showToast({ title: error.message, icon: 'none' })
      }
      reject(error)
    }, options.timeout || LOCATION_TIMEOUT_MS)

    uni.getLocation({
      type: 'gcj02',
      isHighAccuracy: true,
      success(result = {}) {
        if (settled) return
        settled = true
        clearTimeout(timer)
        resolve(saveLocation({
          latitude: result.latitude,
          longitude: result.longitude,
          accuracy: result.accuracy,
          city: uni.getStorageSync(CITY_KEY) || '',
          source: 'weixin'
        }))
      },
      fail(error) {
        if (settled) return
        settled = true
        clearTimeout(timer)
        if (!options.silent) {
          uni.showToast({
            title: '定位失败，可手动选择城市',
            icon: 'none'
          })
        }
        reject(error)
      }
    })
  })
}

export async function getCurrentLocation(options = {}) {
  const stored = getStoredLocation()
  if (!options.force && stored.latitude && stored.longitude) {
    return stored
  }

  try {
    return await refreshCurrentLocation({ silent: options.silent !== false })
  } catch (error) {
    return stored
  }
}

export function calculateDistanceKm(fromLocation = {}, toLocation = {}) {
  const fromLat = toNumber(fromLocation.latitude)
  const fromLng = toNumber(fromLocation.longitude)
  const toLat = toNumber(toLocation.latitude)
  const toLng = toNumber(toLocation.longitude)

  if (!fromLat || !fromLng || !toLat || !toLng) {
    return null
  }

  const radians = (degree) => degree * Math.PI / 180
  const deltaLat = radians(toLat - fromLat)
  const deltaLng = radians(toLng - fromLng)
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(radians(fromLat)) * Math.cos(radians(toLat)) * Math.sin(deltaLng / 2) ** 2
  const distance = 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a))
  return Math.round(distance * 10) / 10
}

export function sortActivitiesByDistance(activities = [], location = getStoredLocation()) {
  const hasLocation = location?.latitude && location?.longitude

  const mapped = activities.map((activity, index) => {
    const latitude = activity.latitude || activity.location?.latitude
    const longitude = activity.longitude || activity.location?.longitude
    const distanceKm = hasLocation
      ? calculateDistanceKm(location, { latitude, longitude })
      : null

    return {
      ...activity,
      distanceKm,
      distanceText: distanceKm === null ? activity.distanceText || '' : `${distanceKm}km`,
      _distanceIndex: index
    }
  })

  if (!hasLocation) {
    return mapped.map(({ _distanceIndex, ...activity }) => activity)
  }

  return mapped
    .sort((left, right) => {
      if (left.distanceKm === null && right.distanceKm === null) {
        return left._distanceIndex - right._distanceIndex
      }
      if (left.distanceKm === null) return 1
      if (right.distanceKm === null) return -1
      return left.distanceKm - right.distanceKm
    })
    .map(({ _distanceIndex, ...activity }) => activity)
}
