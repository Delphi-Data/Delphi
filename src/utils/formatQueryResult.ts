import { from } from 'arquero'
import Table from 'arquero/dist/types/table/table'
import { QueryResult } from '../services/DataService'
import { Console } from 'node:console'

const prettyPrint = (table: Table): string => {
  const logger = new Console({ stdout: process.stdout, colorMode: false })
  let pretty = ''
  logger.log = (message: string) => {
    pretty = message
  }
  logger.table(table.objects())
  return pretty
}

export const formatQueryResult = async (
  result: QueryResult
): Promise<{ csv: string; pretty: string }> => {
  const table = from(result)
  return {
    csv: table.toCSV(),
    pretty: prettyPrint(table),
  }
}
