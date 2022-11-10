import { createClient, RedisClientType } from 'redis'

export type Config = {
  delphiClientID: string
  delphiAPIKey: string
  dbtCloudJobID: string
  dbtCloudServiceToken: string
  lightdashUrl: string
  snowflakeAccount: string
  snowflakeUsername: string
  snowflakeAccessUrl: string
  snowflakePassword: string
  snowflakeDatabase: string
  snowflakeSchema: string
  snowflakeWarehouse: string
  snowflakeRole: string
}

interface IConfigService {
  set: (teamID: string, field: keyof Config, value: string) => Promise<void>
  get: (teamID: string, field: keyof Config) => Promise<string | undefined>
  getAll: (teamID: string) => Promise<Partial<Config>>
}

class EnvConfigService implements IConfigService {
  set(): Promise<void> {
    throw new Error(`cannot set environment variables`)
  }
  get(): Promise<string | undefined> {
    throw new Error(`not yet implemented`)
  }
  getAll() {
    return Promise.resolve({
      delphiClientID: process.env.DELPHI_CLIENT_ID,
      delphiAPIKey: process.env.DELPHI_API_KEY,
      dbtCloudJobID: process.env.DBT_CLOUD_JOB_ID,
      dbtCloudServiceToken: process.env.DBT_CLOUD_SERVICE_TOKEN,
      lightdashUrl: process.env.LIGHTDASH_URL,
      snowflakeAccount: process.env.SNOWFLAKE_ACCOUNT,
      snowflakeUsername: process.env.SNOWFLAKE_USERNAME,
      snowflakeAccessUrl: process.env.SNOWFLAKE_ACCESS_URL,
      snowflakePassword: process.env.SNOWFLAKE_PASSWORD,
      snowflakeDatabase: process.env.SNOWFLAKE_DATABASE,
      snowflakeSchema: process.env.SNOWFLAKE_SCHEMA,
      snowflakeWarehouse: process.env.SNOWFLAKE_WAREHOUSE,
      snowflakeRole: process.env.SNOWFLAKE_ROLE,
    })
  }
}

class RedisConfigService implements IConfigService {
  private client: RedisClientType
  constructor(connectionString: string) {
    this.client = createClient({ url: connectionString })
  }

  async set(teamID: string, field: keyof Config, value: string) {
    await this.client.connect()
    await this.client.hSet(teamID, field, value)
    await this.client.disconnect()
  }

  async get(teamID: string, field: keyof Config) {
    await this.client.connect()
    const res = await this.client.hGet(teamID, field)
    await this.client.disconnect()
    return res
  }

  async getAll(teamID: string) {
    await this.client.connect()
    const res = await this.client.hGetAll(teamID)
    await this.client.disconnect()
    return res
  }
}

const configService = process.env.REDIS_CONNECTION_STRING
  ? new RedisConfigService(process.env.REDIS_CONNECTION_STRING)
  : new EnvConfigService()

export default configService
