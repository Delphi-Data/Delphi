import snowflake from 'snowflake-sdk'
import { SnowflakeCredentials } from '../types/snowflake'
import { promisify } from 'util'
import fetch from 'node-fetch'

export type QueryResult = Record<
  string,
  string | number | Date | boolean | JSON
>[]

interface IDataService {
  readonly runQuery: (query: string) => Promise<QueryResult>
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
  private readonly baseURL: string
  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  async runQuery(query: string) {
    const res = await fetch(this.baseURL, {
      method: 'POST',
      body: query,
    })
    return mapLightdashResponseToQueryResult(
      (await res.json()) as LightdashResponse
    )
  }
}

const instance = process.env.LIGHTDASH_BASE_URL
  ? new LightdashDataService(process.env.LIGHTDASH_BASE_URL)
  : process.env.SNOWFLAKE_ACCOUNT &&
    process.env.SNOWFLAKE_USERNAME &&
    process.env.SNOWFLAKE_ACCESS_URL
  ? new SnowflakeDataService({
      account: process.env.SNOWFLAKE_ACCOUNT,
      username: process.env.SNOWFLAKE_USERNAME,
      accessUrl: process.env.SNOWFLAKE_ACCESS_URL,
      password: process.env.SNOWFLAKE_PASSWORD,
      database: process.env.SNOWFLAKE_DATABASE,
      schema: process.env.SNOWFLAKE_SCHEMA,
      warehouse: process.env.SNOWFLAKE_WAREHOUSE,
      role: process.env.SNOWFLAKE_ROLE,
    })
  : new MockDataService()

export default instance
