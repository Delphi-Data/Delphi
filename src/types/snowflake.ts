import { ConnectionOptions } from 'snowflake-sdk'

export type SnowflakeCredentials = ConnectionOptions & { accessUrl: string }
