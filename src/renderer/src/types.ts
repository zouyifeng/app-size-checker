export interface AppInfo {
  id: string
  name: string
  icon: string
  exePath: string
  hidden?: boolean
  basePath: string
}

export interface Pkg {
  path: string,
  size: number
}