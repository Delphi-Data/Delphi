import snowflake from 'snowflake-sdk'
import { SnowflakeCredentials } from '../types/snowflake'
import { promisify } from 'util'
import { Config } from './ConfigService'
import fetch, { Response } from 'node-fetch'

export type QueryResult = Record<
  string,
  string | number | Date | boolean | JSON
>[]

interface IDataService {
  readonly runQuery: (sql: string) => Promise<QueryResult>
  readonly type: 'mock' | 'snowflake' | 'lightdash'
}
export type ILightdashDataService = LightdashDataService

class MockDataService implements IDataService {
  type = 'mock' as const
  runQuery() {
    return Promise.resolve([
      {
        date_week: new Date('2022-10-16'),
        had_gift_card_payment: true,
        revenue: 139,
        expenses: 33,
        profit: 106,
      },
      {
        date_week: new Date('2022-10-23'),
        had_gift_card_payment: true,
        revenue: 69,
        expenses: 16,
        profit: 53,
      },
      {
        date_week: new Date('2022-10-30'),
        had_gift_card_payment: true,
        revenue: 96,
        expenses: 21,
        profit: 75,
      },
    ])
  }
}

class SnowflakeDataService implements IDataService {
  private readonly connectionOptions: SnowflakeCredentials
  type = 'snowflake' as const
  constructor(credentials: SnowflakeCredentials) {
    this.connectionOptions = credentials
  }

  async runQuery(sql: string) {
    console.info(`Beginning SnowflakeDataService runQuery`, { sql })
    const connection = snowflake.createConnection(this.connectionOptions)
    await promisify(connection.connect)()
    return new Promise<QueryResult>((resolve, reject) => {
      connection.execute({
        sqlText: sql,
        complete: (err, _, rows) => {
          if (err) {
            reject(err)
          } else if (rows) {
            resolve(rows)
          } else {
            reject(`No data returned from query`)
          }
        },
      })
    })
  }
}

class LightdashDataService implements IDataService {
  private baseURL: string
  private projectID: string
  private cookie?: string
  type = 'lightdash' as const
  constructor(baseURL: string, projectID: string) {
    this.baseURL = baseURL
    this.projectID = projectID
  }

  private parseCookies(response: Response) {
    const raw = response.headers.raw()['set-cookie']
    return raw
      .map((entry) => {
        const parts = entry.split(';')
        const cookiePart = parts[0]
        return cookiePart
      })
      .join(';')
  }

  private async setCookie(email: string, password: string) {
    try {
      const res = await fetch(`${this.baseURL}/api/v1/login`, {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      this.cookie = this.parseCookies(res)
    } catch (error) {
      console.error('[LightdashDataService] Could not set cookie', error)
    }
  }

  async getMetrics(): Promise<Record<string, string | string[]>[]> {
    console.info(`[LightdashDataService] beginning getMetrics() call`)
    const res = await fetch(
      `${this.baseURL}/api/v1/projects/${this.projectID}/integrations/dbt-cloud/metrics`,
      {
        method: 'GET',
        headers: {
          cookie: this.cookie as string,
        },
      }
    )
    const metrics = (
      (await res.json()) as {
        results: { metrics: Record<string, string | string[]>[] }
      }
    ).results.metrics
    metrics?.forEach((metric) => delete metric.uniqueId) // codex tries to use `uniqueID` instead of `name` in the SQL it generates if we include this
    console.info(`[LightdashDataService] found metrics`, metrics)
    return metrics
  }

  async runQuery(sql: string) {
    console.info(`Beginning LightdashDataService runQuery()`, { sql })
    const res = await fetch(
      `${this.baseURL}/api/v1/projects/${this.projectID}/sqlQuery`,
      {
        method: 'POST',
        headers: {
          cookie: this.cookie as string,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql,
        }),
      }
    )
    const data = (await res.json()) as { results: { rows: QueryResult } }
    return data.results?.rows
  }

  static async fetchLightdashDataService(
    baseURL: string,
    projectID: string,
    email: string,
    password: string
  ): Promise<LightdashDataService> {
    const lightdashDataService = new LightdashDataService(baseURL, projectID)
    await lightdashDataService.setCookie(email, password)
    return lightdashDataService
  }
}

export const getDataService = async (
  config: Partial<Config>
): Promise<IDataService> => {
  const [lightdashAPIBaseURL, lightdashProjectID] =
    config.lightdashURL?.split('/projects/') || []
  return lightdashAPIBaseURL &&
    config.lightdashEmail &&
    config.lightdashPassword &&
    lightdashProjectID
    ? await LightdashDataService.fetchLightdashDataService(
        lightdashAPIBaseURL,
        lightdashProjectID,
        config.lightdashEmail,
        config.lightdashPassword
      )
    : config.snowflakeAccount &&
      config.snowflakeUsername &&
      config.snowflakeAccessUrl
    ? new SnowflakeDataService({
        account: config.snowflakeAccount,
        username: config.snowflakeUsername,
        accessUrl: config.snowflakeAccessUrl,
        password: config.snowflakePassword,
        database: config.snowflakeDatabase,
        schema: config.snowflakeSchema,
        warehouse: config.snowflakeWarehouse,
        role: config.snowflakeRole,
      })
    : new MockDataService()
}
