export const DEFAULT_CITY = '杭州'
export const DEFAULT_CITY_CODE = '330100'

export const CITY_OPTIONS = [
  { name: '北京', code: '110100', desc: '读书会与运动局预热' },
  { name: '上海', code: '310100', desc: '周末展览与城市漫游' },
  { name: '杭州', code: '330100', desc: '西湖、武林、滨江正在成行' },
  { name: '广州', code: '440100', desc: '城市漫游和周末饭局' },
  { name: '深圳', code: '440300', desc: '运动、展览和夜生活' },
  { name: '南京', code: '320100', desc: '咖啡、徒步、夜游小局' },
  { name: '成都', code: '510100', desc: '松弛饭局和展览计划' },
  { name: '重庆', code: '500100', desc: '山城夜游和火锅局' },
  { name: '武汉', code: '420100', desc: '江边散步和学习局' },
  { name: '西安', code: '610100', desc: '古城漫游和夜生活' },
  { name: '苏州', code: '320500', desc: '园林散步和周末茶局' },
  { name: '长沙', code: '430100', desc: '夜宵、展览和城市探索' }
]

export const HOT_CITY_OPTIONS = CITY_OPTIONS.map(({ code, name }) => ({
  code,
  name: `${name}市`
}))

const cityCodeMap = CITY_OPTIONS.reduce((map, city) => {
  map[city.name] = city.code
  return map
}, {})

function stripAdministrativeSuffix(value = '') {
  return String(value || '')
    .trim()
    .replace(/特别行政区$/, '')
    .replace(/地区$/, '')
    .replace(/盟$/, '')
    .replace(/自治州$/, '')
    .replace(/市$/, '')
}

export function normalizeCityName(city = '') {
  const source = stripAdministrativeSuffix(city)
  if (!source) return ''
  const known = CITY_OPTIONS.find((item) => source === item.name || source.includes(`${item.name}市`) || source.includes(item.name))
  if (known) return known.name

  const cityMatch = source.match(/(?:省|自治区)?([\u4e00-\u9fa5]{2,12})市/)
  if (cityMatch?.[1]) return stripAdministrativeSuffix(cityMatch[1])

  return source
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
  const matched = withoutCity.match(/([\u4e00-\u9fa5]{2,12}(?:区|县|镇|街道))/)
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

  const directCityMatch = source.match(/(?:省|自治区|特别行政区)?([\u4e00-\u9fa5]{2,12})市/)
  if (directCityMatch?.[1]) {
    const city = normalizeCityName(directCityMatch[1])
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
