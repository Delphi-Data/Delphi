import crypto from 'crypto'
import { createClient, RedisClientType } from 'redis'

export const INSTALLATION_KEY = 'installation' as const
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
  [INSTALLATION_KEY]: string
}

export interface IConfigService {
  set: (teamID: string, field: keyof Config, value: string) => Promise<void>
  get: (teamID: string, field: keyof Config) => Promise<string | undefined>
  getAll: (teamID: string) => Promise<Partial<Config>>
}

class Encrypter {
  private algorithm: string
  private key: Buffer
  constructor(encryptionKey: string | undefined) {
    if (!encryptionKey) {
      throw new Error('no encryption key provided')
    }
    this.algorithm = 'aes-256-cbc'
    this.key = crypto.scryptSync(encryptionKey, 'salt', 32)
  }

  encrypt(clearText: string) {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv)
    const encrypted = cipher.update(clearText, 'utf8', 'hex')
    return [
      encrypted + cipher.final('hex'),
      Buffer.from(iv).toString('hex'),
    ].join('|')
  }

  decrypt(encryptedText: string) {
    const [encrypted, iv] = encryptedText.split('|')
    if (!iv) throw new Error('IV not found')
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(iv, 'hex')
    )
    return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8')
  }
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
  private encrypter: Encrypter
  constructor(connectionString: string) {
    console.info('initializing RedisConfigService')
    this.client = createClient({ url: connectionString })
    this.client.connect()
    this.encrypter = new Encrypter(process.env.ENCRYPTION_KEY)
  }

  async set(teamID: string, field: keyof Config, value: string) {
    await this.client.hSet(teamID, field, this.encrypter.encrypt(value))
  }

  async get(teamID: string, field: keyof Config) {
    const res = await this.client.hGet(teamID, field)
    return res ? this.encrypter.decrypt(res) : undefined
  }

  async getAll(teamID: string) {
    const res = await this.client.hGetAll(teamID)
    Object.keys(res).forEach((key) => {
      res[key] = this.encrypter.decrypt(res[key])
    })
    return res
  }
}

const configService = process.env.REDIS_CONNECTION_STRING
  ? new RedisConfigService(process.env.REDIS_CONNECTION_STRING)
  : new EnvConfigService()

export default configService
