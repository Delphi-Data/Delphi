export type LightdashField = {
  name: string
  description: string
}

export type LightdashCatalog = {
  metrics: LightdashField[]
  dimensions: LightdashField[]
}
