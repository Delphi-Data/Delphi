import fetch from 'node-fetch'
import { LightdashField, LightdashQuery } from '../types/lightdash'
import { Config } from './ConfigService'
import { QueryResult } from './DataService'

type NLQToSQLParams = {
  text: string
  jobId: string
  serviceToken: string
  metrics?: Record<string, string | string[]>[]
}

type NLQToLightdashQueryParams = {
  question: string
  dimensions: LightdashField[]
  metrics: LightdashField[]
}

type GetAnswerParams = {
  query: string
  data: QueryResult
}

interface NLPService {
  readonly nlqToSQL: (params: NLQToSQLParams) => Promise<string>
  readonly nlqToLightdashQuery: (
    params: NLQToLightdashQueryParams
  ) => Promise<LightdashQuery>
  readonly getAnswer: (params: GetAnswerParams) => Promise<string>
}

class MockNLPService implements NLPService {
  nlqToSQL() {
    return Promise.resolve(
      `SELECT * FROM some_ideal_clean_and_pristine.table_that_you_think_exists`
    )
  }
  nlqToLightdashQuery() {
    return Promise.resolve({
      explore: 'customers',
      dimensions: ['customers_customer_id'],
      metrics: ['customers_revenue'],
    })
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
  async nlqToSQL({ text, jobId, metrics, serviceToken }: NLQToSQLParams) {
    const res = await fetch(`${this.apiBaseUrl}/dbt-sql-query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CLIENT-ID': this.apiClientId as string,
        'X-API-KEY': this.apiKey as string,
      },
      body: JSON.stringify({ query: text, jobId, metrics, serviceToken }),
    })
    const { dbtSQLQuery } = (await res.json()) as {
      readonly dbtSQLQuery: string
    }
    return dbtSQLQuery
  }

  async nlqToLightdashQuery({
    question,
    dimensions,
    metrics,
  }: NLQToLightdashQueryParams): Promise<LightdashQuery> {
    const res = await fetch(`${this.apiBaseUrl}/lightdash-query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CLIENT-ID': this.apiClientId as string,
        'X-API-KEY': this.apiKey as string,
      },
      body: JSON.stringify({ question, dimensions, metrics }),
    })
    const { lightdashQuery } = (await res.json()) as {
      readonly lightdashQuery: {
        dimensions: Omit<LightdashField, 'description'>[]
        metrics: Omit<LightdashField, 'description'>[]
      }
    }
    return {
      explore: lightdashQuery.dimensions[0].explore,
      dimensions: lightdashQuery.dimensions.map(
        (dimension) => `${dimension.table}_${dimension.name}`
      ),
      metrics: lightdashQuery.metrics.map(
        (metric) => `${metric.table}_${metric.name}`
      ),
    }
  }

  async getAnswer({ query, data }: GetAnswerParams) {
    const res = await fetch(`${this.apiBaseUrl}/answer-question`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CLIENT-ID': this.apiClientId as string,
        'X-API-KEY': this.apiKey as string,
      },
      body: JSON.stringify({ query, data }),
    })
    const { answer } = await res.json()
    return answer
  }
}

export const getNLPService = (config: Partial<Config>) => {
  return process.env.HERMES_API_BASE_URL
    ? new HermesNLPService({
        apiBaseUrl: process.env.HERMES_API_BASE_URL,
        apiClientId: config.delphiClientID,
        apiKey: config.delphiAPIKey,
      })
    : new MockNLPService()
}
