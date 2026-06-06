import { getExcerpt } from './excerpt'

test('HTMLタグを除去してプレーンテキストにする', () => {
  expect(getExcerpt('<p>こんにちは<strong>世界</strong></p>')).toBe('こんにちは世界')
})

test('連続する空白・改行を1つにまとめる', () => {
  expect(getExcerpt('<p>あ  い\n\nう</p>')).toBe('あ い う')
})

test('短い場合はそのまま返す（…を付けない）', () => {
  expect(getExcerpt('<p>短い本文</p>', 120)).toBe('短い本文')
})

test('長い場合は切り詰めて末尾に…を付ける', () => {
  const long = `<p>${'あ'.repeat(200)}</p>`
  const result = getExcerpt(long, 120)
  expect(result).toBe(`${'あ'.repeat(120)}…`)
})
