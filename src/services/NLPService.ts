import { QueryResult } from './DataService'
import { fetchHermes } from '../utils'
import { LightdashExplore, LightdashQuery } from '../types/lightdash'

type NLQToDbtSQLParams = {
  text: string
  jobId: string
  serviceToken: string
}

type NLQToLightdashQueryParams = {
  text: string
  baseURL: string
  explores: LightdashExplore[]
}

type NLQToQueryParams = NLQToDbtSQLParams & NLQToLightdashQueryParams

type GetAnswerParams = {
  query: string
  data: QueryResult
}

interface NLPService {
  readonly nlqToQuery: (
    params: NLQToQueryParams
  ) => Promise<string | LightdashQuery>
  readonly getAnswer: (params: GetAnswerParams) => Promise<string>
}

class MockNLPService implements NLPService {
  nlqToQuery() {
    return Promise.resolve(
      `SELECT * FROM some_ideal_clean_and_pristine.table_that_you_think_exists`
    )
  }
  getAnswer() {
    return Promise.resolve(`The answer is no`)
  }
}

class HermesNLPService implements NLPService {
  private readonly apiBaseUrl: string
  private readonly apiClientId?: string
  private readonly apiKey?: string

  constructor(params: {
    readonly apiBaseUrl: string
    readonly apiClientId?: string
    readonly apiKey?: string
  }) {
    this.apiBaseUrl = params.apiBaseUrl
    this.apiClientId = params.apiClientId
    this.apiKey = params.apiKey
  }
  private async nlqToDbtSQLQuery({
    text,
    jobId,
    serviceToken,
  }: NLQToDbtSQLParams) {
    const res = await fetchHermes({
      baseURL: this.apiBaseUrl,
      endpoint: 'dbt-sql-query',
      credentials: {
        apiClientId: this.apiClientId,
        apiKey: this.apiKey,
      },
      body: JSON.stringify({ query: text, jobId, serviceToken }),
    })
    const { dbtSQLQuery } = (await res.json()) as {
      readonly dbtSQLQuery: string
    }
    return dbtSQLQuery
  }

  /**
   *
   * @param params
   * NOTE: baseURL should include the project ID, e.g. https://demo.lightdash.com/api/v1/projects/2014e038-ff4b-4761-ae6f-fbf551e7b468/
   */
  private async nlqToLightdashQuery(params: NLQToLightdashQueryParams) {
    const res = await fetchHermes({
      baseURL: this.apiBaseUrl,
      endpoint: 'lightdash-query',
      credentials: {
        apiClientId: this.apiClientId,
        apiKey: this.apiKey,
      },
      body: JSON.stringify(params),
    })
    const { lightdashQuery } = (await res.json()) as {
      lightdashQuery: LightdashQuery
    }
    return lightdashQuery
  }

  async nlqToQuery(params: NLQToDbtSQLParams & NLQToLightdashQueryParams) {
    return process.env.LIGHTDASH_BASE_URL
      ? await this.nlqToLightdashQuery(params)
      : await this.nlqToDbtSQLQuery(params)
  }

  async getAnswer({ query, data }: GetAnswerParams) {
    const res = await fetchHermes({
      baseURL: this.apiBaseUrl,
      endpoint: 'answer-question',
      credentials: {
        apiClientId: this.apiClientId,
        apiKey: this.apiKey,
      },
      body: JSON.stringify({ query, data }),
    })
    const { answer } = await res.json()
    return answer
  }
}

const mockNlpService = process.env.HERMES_API_BASE_URL
  ? new HermesNLPService({
      apiBaseUrl: process.env.HERMES_API_BASE_URL,
      apiClientId: process.env.HERMES_API_CLIENT_ID,
      apiKey: process.env.HERMES_API_KEY,
    })
  : new MockNLPService()
export default mockNlpService
