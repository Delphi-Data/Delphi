import fetch from 'node-fetch'

type NLPService = {
  readonly nlqToSQL: ({
    text,
    orgId,
  }: {
    readonly text: string
    readonly orgId: string
  }) => Promise<string>
}

class MockNLPService implements NLPService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  nlqToSQL(_: { readonly text: string }) {
    return Promise.resolve(
      `SELECT * FROM some_ideal_clean_and_pristine.table_that_you_think_exists`
    )
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
  async nlqToSQL({ text }: { readonly text: string }) {
    const res = await fetch(`${this.apiBaseUrl}/dbt-sql-query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CLIENT-ID': this.apiClientId as string,
        'X-API-KEY': this.apiKey as string,
      },
      body: JSON.stringify({ query: text }),
    })
    const { dbtSQLQuery } = (await res.json()) as {
      readonly dbtSQLQuery: string
    }
    return dbtSQLQuery
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