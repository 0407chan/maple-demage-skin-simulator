export const numberWithCommas = (num: number | string): string => {
  if (num === null || num === undefined || num === '') return '0'
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}
