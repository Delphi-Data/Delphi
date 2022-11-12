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
}

class MockDataService implements IDataService {
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
  constructor(credentials: SnowflakeCredentials) {
    this.connectionOptions = credentials
  }

  async runQuery(sqlText: string) {
    const connection = snowflake.createConnection(this.connectionOptions)
    await promisify(connection.connect)()
    return new Promise<QueryResult>((resolve, reject) => {
      connection.execute({
        sqlText,
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
  constructor(
    baseURL: string,
    projectID: string,
    email: string,
    password: string
  ) {
    this.baseURL = baseURL
    this.projectID = projectID
    this.setCookie(email, password)
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
    const res = await fetch(`${this.baseURL}/api/v1/login`, {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
      }),
    })
    this.cookie = this.parseCookies(res)
  }

  async runQuery(sql: string) {
    const res = await fetch(
      `${this.baseURL}/api/v1/projects/${this.projectID}/sqlQuery`,
      {
        method: 'POST',
        headers: {
          cookie: this.cookie as string,
        },
        body: JSON.stringify({
          sql,
        }),
      }
    )
    const data = (await res.json()) as { rows: QueryResult }
    return data.rows
  }
}

export const getDataService = (config: Partial<Config>): IDataService => {
  return config.lightdashAPIBaseURL &&
    config.lightdashEmail &&
    config.lightdashPassword &&
    config.lightdashProjectID
    ? new LightdashDataService(
        config.lightdashAPIBaseURL,
        config.lightdashProjectID,
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
