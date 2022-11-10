import fetch from 'node-fetch'
import { Config } from './ConfigService'
import { QueryResult } from './DataService'

type NLQToSQLParams = {
  text: string
  jobId: string
  serviceToken: string
}

type GetAnswerParams = {
  query: string
  data: QueryResult
}

interface NLPService {
  readonly nlqToSQL: (params: NLQToSQLParams) => Promise<string>
  readonly getAnswer: (params: GetAnswerParams) => Promise<string>
}

class MockNLPService implements NLPService {
  nlqToSQL() {
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
  async nlqToSQL({ text, jobId, serviceToken }: NLQToSQLParams) {
    const res = await fetch(`${this.apiBaseUrl}/dbt-sql-query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CLIENT-ID': this.apiClientId as string,
        'X-API-KEY': this.apiKey as string,
      },
      body: JSON.stringify({ query: text, jobId, serviceToken }),
    })
    const { dbtSQLQuery } = (await res.json()) as {
      readonly dbtSQLQuery: string
    }
    return dbtSQLQuery
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
