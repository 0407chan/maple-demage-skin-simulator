export const numberWithCommas = (num: number | string): string => {
  if (num === null || num === undefined || num === '') return '0'
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function getRandomInt({
  min,
  max
}: {
  min: number
  max: number
}): number {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min)) + min // 최댓값은 제외, 최솟값은 포함
}
