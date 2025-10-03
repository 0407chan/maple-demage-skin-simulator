declare module '*.png'
declare module '*.gif'
declare module '*.jpg'
declare module '*.jpeg'
declare module '*.svg'

declare module '*.module.scss' {
  const classes: { [key: string]: string }
  export default classes
}
