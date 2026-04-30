export const DEFAULT_CITY = '杭州'
export const DEFAULT_CITY_CODE = '330100'

export const CITY_OPTIONS = [
  { name: '杭州', code: '330100', desc: '西湖、武林、滨江正在成行' },
  { name: '上海', code: '310100', desc: '周末展览与城市漫游' },
  { name: '南京', code: '320100', desc: '咖啡、徒步、夜游小局' },
  { name: '北京', code: '110100', desc: '读书会与运动局预热' }
]

const cityCodeMap = CITY_OPTIONS.reduce((map, city) => {
  map[city.name] = city.code
  return map
}, {})

export function normalizeCityName(city = '') {
  return String(city || '')
    .trim()
    .replace(/市$/, '')
}

export function normalizeCityCode(code = '') {
  return String(code || '').trim()
}

export function findCityOption(city = '', code = '') {
  const cityName = normalizeCityName(city)
  const cityCode = normalizeCityCode(code)
  return CITY_OPTIONS.find((item) => item.code === cityCode || item.name === cityName) || null
}

export function getCityCode(city = '', fallbackCode = '') {
  const cityName = normalizeCityName(city)
  return normalizeCityCode(cityCodeMap[cityName] || fallbackCode)
}

export function inferDistrictFromLocation(text = '', city = '') {
  const source = String(text || '')
  const cityName = normalizeCityName(city)
  const withoutCity = cityName ? source.replace(`${cityName}市`, '').replace(cityName, '') : source
  const matched = withoutCity.match(/([\u4e00-\u9fa5]{2,12}(?:区|县|市|镇|街道))/)
  return matched?.[1] || ''
}

export function inferCityFromLocation(text = '', fallback = {}) {
  const source = String(text || '').trim()
  const fallbackCity = normalizeCityName(fallback.city || DEFAULT_CITY)
  const fallbackCode = normalizeCityCode(fallback.cityCode || fallback.city_code || DEFAULT_CITY_CODE)

  const known = CITY_OPTIONS.find((city) => source.includes(city.name) || source.includes(`${city.name}市`))
  if (known) {
    return {
      city: known.name,
      cityCode: known.code,
      district: inferDistrictFromLocation(source, known.name)
    }
  }

  const generic = source.match(/([\u4e00-\u9fa5]{2,12})市/)
  if (generic?.[1]) {
    const city = normalizeCityName(generic[1])
    return {
      city,
      cityCode: getCityCode(city, ''),
      district: inferDistrictFromLocation(source, city)
    }
  }

  return {
    city: fallbackCity,
    cityCode: fallbackCode,
    district: fallback.district || ''
  }
}
