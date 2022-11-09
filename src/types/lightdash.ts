type LightdashDimensionOrMetric = {
  name: string
  label: string
  fieldType: 'dimension' | 'metric'
}

export type LightdashTable = {
  name: string
  label: string
  description: string
  dimensions: LightdashDimensionOrMetric[]
  metrics: LightdashDimensionOrMetric[]
}

export type LightdashExplore = {
  name: string
  label: string
  tags: string[]
  tables: LightdashTable[]
}

type LightdashResponseRow = {
  value: {
    raw: string
    formatted: string
  }
}

export type LightdashResponse = {
  results: {
    rows: Record<string, LightdashResponseRow>
  }
}

export type LightdashQuery = {
  explore: string
  dimensions: string[]
  metrics: string[]
}
