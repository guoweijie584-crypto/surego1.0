const VERSION = 1
const SIZE = 21
const DATA_CODEWORDS = 19
const EC_CODEWORDS = 7
const FORMAT_BITS_L_MASK_0 = '111011111000100'
const PAD_BYTES = [0xec, 0x11]

let gfExp = null
let gfLog = null

function initGaloisField() {
  if (gfExp && gfLog) return
  gfExp = new Array(512).fill(0)
  gfLog = new Array(256).fill(0)
  let value = 1
  for (let i = 0; i < 255; i += 1) {
    gfExp[i] = value
    gfLog[value] = i
    value <<= 1
    if (value & 0x100) value ^= 0x11d
  }
  for (let i = 255; i < 512; i += 1) {
    gfExp[i] = gfExp[i - 255]
  }
}

function gfMultiply(a, b) {
  if (!a || !b) return 0
  initGaloisField()
  return gfExp[gfLog[a] + gfLog[b]]
}

function buildGeneratorPolynomial(degree) {
  initGaloisField()
  let poly = [1]
  for (let i = 0; i < degree; i += 1) {
    const next = new Array(poly.length + 1).fill(0)
    for (let j = 0; j < poly.length; j += 1) {
      next[j] ^= poly[j]
      next[j + 1] ^= gfMultiply(poly[j], gfExp[i])
    }
    poly = next
  }
  return poly
}

export function reedSolomonEncode(dataCodewords = [], ecCodewords = EC_CODEWORDS) {
  const generator = buildGeneratorPolynomial(ecCodewords)
  const result = [...dataCodewords, ...new Array(ecCodewords).fill(0)]
  dataCodewords.forEach((_, index) => {
    const factor = result[index]
    if (!factor) return
    generator.forEach((coefficient, generatorIndex) => {
      result[index + generatorIndex] ^= gfMultiply(coefficient, factor)
    })
  })
  return result.slice(dataCodewords.length)
}

function appendBits(bits, value, length) {
  for (let i = length - 1; i >= 0; i -= 1) {
    bits.push((value >>> i) & 1)
  }
}

function toUtf8Bytes(value = '') {
  const text = String(value)
  const bytes = []
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i)
    if (code < 0x80) {
      bytes.push(code)
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f))
    } else {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f))
    }
  }
  return bytes
}

function buildDataCodewords(value = '') {
  const bytes = toUtf8Bytes(value)
  if (bytes.length > 17) {
    throw new Error('QR version 1-L supports up to 17 bytes.')
  }

  const bits = []
  appendBits(bits, 0b0100, 4)
  appendBits(bits, bytes.length, 8)
  bytes.forEach((byte) => appendBits(bits, byte, 8))

  const maxBits = DATA_CODEWORDS * 8
  appendBits(bits, 0, Math.min(4, maxBits - bits.length))
  while (bits.length % 8) bits.push(0)

  const codewords = []
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0
    for (let j = 0; j < 8; j += 1) {
      byte = (byte << 1) | bits[i + j]
    }
    codewords.push(byte)
  }

  let padIndex = 0
  while (codewords.length < DATA_CODEWORDS) {
    codewords.push(PAD_BYTES[padIndex % PAD_BYTES.length])
    padIndex += 1
  }
  return codewords
}

function createMatrix() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(null))
}

function createReserved() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(false))
}

function setModule(matrix, reserved, row, col, value, reserve = true) {
  if (row < 0 || col < 0 || row >= SIZE || col >= SIZE) return
  matrix[row][col] = value ? 1 : 0
  if (reserve) reserved[row][col] = true
}

function drawFinder(matrix, reserved, row, col) {
  for (let y = -1; y <= 7; y += 1) {
    for (let x = -1; x <= 7; x += 1) {
      const targetRow = row + y
      const targetCol = col + x
      if (targetRow < 0 || targetCol < 0 || targetRow >= SIZE || targetCol >= SIZE) continue
      const separator = x === -1 || x === 7 || y === -1 || y === 7
      const border = x === 0 || x === 6 || y === 0 || y === 6
      const center = x >= 2 && x <= 4 && y >= 2 && y <= 4
      setModule(matrix, reserved, targetRow, targetCol, !separator && (border || center))
    }
  }
}

function drawFunctionPatterns(matrix, reserved) {
  drawFinder(matrix, reserved, 0, 0)
  drawFinder(matrix, reserved, 0, SIZE - 7)
  drawFinder(matrix, reserved, SIZE - 7, 0)

  for (let i = 8; i < SIZE - 8; i += 1) {
    setModule(matrix, reserved, 6, i, i % 2 === 0)
    setModule(matrix, reserved, i, 6, i % 2 === 0)
  }

  setModule(matrix, reserved, 4 * VERSION + 9, 8, true)
  reserveFormatModules(reserved)
}

function reserveFormatModules(reserved) {
  for (let i = 0; i <= 8; i += 1) {
    if (i !== 6) {
      reserved[8][i] = true
      reserved[i][8] = true
    }
  }
  for (let i = 0; i < 8; i += 1) {
    reserved[SIZE - 1 - i][8] = true
    reserved[8][SIZE - 1 - i] = true
  }
}

function getDataBits(value) {
  const data = buildDataCodewords(value)
  const ec = reedSolomonEncode(data, EC_CODEWORDS)
  return [...data, ...ec].flatMap((byte) => {
    const bits = []
    appendBits(bits, byte, 8)
    return bits
  })
}

function mask(row, col) {
  return (row + col) % 2 === 0
}

function drawData(matrix, reserved, value) {
  const bits = getDataBits(value)
  let bitIndex = 0
  let upward = true

  for (let col = SIZE - 1; col > 0; col -= 2) {
    if (col === 6) col -= 1
    for (let step = 0; step < SIZE; step += 1) {
      const row = upward ? SIZE - 1 - step : step
      for (let offset = 0; offset < 2; offset += 1) {
        const targetCol = col - offset
        if (reserved[row][targetCol]) continue
        const rawBit = bits[bitIndex] || 0
        const maskedBit = rawBit ^ (mask(row, targetCol) ? 1 : 0)
        setModule(matrix, reserved, row, targetCol, maskedBit, false)
        bitIndex += 1
      }
    }
    upward = !upward
  }
}

function drawFormatBits(matrix, reserved) {
  const bits = FORMAT_BITS_L_MASK_0.split('').reverse().map(Number)
  for (let i = 0; i <= 5; i += 1) setModule(matrix, reserved, 8, i, bits[i])
  setModule(matrix, reserved, 8, 7, bits[6])
  setModule(matrix, reserved, 8, 8, bits[7])
  setModule(matrix, reserved, 7, 8, bits[8])
  for (let i = 9; i < 15; i += 1) setModule(matrix, reserved, 14 - i, 8, bits[i])

  for (let i = 0; i < 8; i += 1) setModule(matrix, reserved, SIZE - 1 - i, 8, bits[i])
  for (let i = 8; i < 15; i += 1) setModule(matrix, reserved, 8, SIZE - 15 + i, bits[i])
}

export function addQuietZone(matrix = [], quietZone = 4) {
  const size = matrix.length
  const nextSize = size + quietZone * 2
  const result = Array.from({ length: nextSize }, () => Array(nextSize).fill(0))
  matrix.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      result[rowIndex + quietZone][colIndex + quietZone] = value ? 1 : 0
    })
  })
  return result
}

export function buildQrMatrix(value = '') {
  const matrix = createMatrix()
  const reserved = createReserved()
  drawFunctionPatterns(matrix, reserved)
  drawData(matrix, reserved, value)
  drawFormatBits(matrix, reserved)
  return addQuietZone(matrix)
}
