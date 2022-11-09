import fetch from 'node-fetch'
import {
  LightdashExplore,
  LightdashQuery,
  LightdashResponse,
  LightdashTable,
} from '../types/lightdash'

class LightdashClient {
  readonly baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  async getExplores(): Promise<LightdashExplore[]> {
    // TODO: get these from Redis if possible
    const res = await fetch(`${this.baseURL}/explores`, {
      method: 'GET',
    })
    const explores = (await res.json()) as Pick<
      LightdashExplore,
      'label' | 'name' | 'tags'
    >[]

    return await Promise.all(
      explores.map(async (explore) => {
        const exploreDetailsRes = await fetch(
          `${this.baseURL}/${explore.name}`,
          {
            method: 'GET',
          }
        )
        const exploreDetails = (await exploreDetailsRes.json()) as {
          results: { tables: Record<string, LightdashTable> }
        }
        return {
          ...explore,
          tables: Object.values(exploreDetails.results.tables),
        }
      })
    )
  }

  async runQuery({
    explore,
    dimensions,
    metrics,
  }: LightdashQuery): Promise<LightdashResponse> {
    const res = await fetch(`${this.baseURL}/explores/${explore}/runQuery`, {
      method: 'POST',
      body: JSON.stringify({
        dimensions,
        metrics,
      }),
    })
    return (await res.json()) as LightdashResponse
  }
}

export default process.env.LIGHTDASH_BASE_URL
  ? new LightdashClient(process.env.LIGHTDASH_BASE_URL)
  : undefined
