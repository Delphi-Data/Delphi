import snowflake from 'snowflake-sdk'
import { SnowflakeCredentials } from '../types/snowflake'
import { promisify } from 'util'

type QueryResult = Record<string, string | number | Date | boolean | JSON>[]

interface IDataService {
  readonly runQuery: (sql: string) => Promise<QueryResult>
}

class MockDataService implements IDataService {
  runQuery() {
    return Promise.resolve([
      { a: '1', b: 2, c: 3 },
      { a: '4', b: 5, c: 6 },
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

const instance =
  process.env.SNOWFLAKE_ACCOUNT &&
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
