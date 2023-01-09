export type LightdashField = {
  name: string
  description: string
  explore: string
  table: string
}

export type LightdashCatalog = {
  metrics: LightdashField[]
  dimensions: LightdashField[]
}

export type LightdashQuery = {
  explore: string
  dimensions: string[]
  metrics: string[]
}
