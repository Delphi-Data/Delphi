import { App } from '@slack/bolt'
import * as dotenv from 'dotenv'
process.env.USE_DOTENV && dotenv.config()

import dataService from './services/DataService'
import nlpService from './services/NLPService'
import stripUser from './utils/stripUser'

// initialize app
const app = new App({
  signingSecret: process.env.SLACK_SIGNING_TOKEN,
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
})

// Listens to incoming messages that contain "hello"
app.event('app_mention', async ({ event, say }) => {
  const text = stripUser(event.text)
  const sqlQuery = await nlpService.nlqToSQL({
    text,
    jobId: process.env.JOB_ID as string,
    serviceToken: process.env.SERVICE_TOKEN as string,
  })
  await say(`<@${event.user}> here is your query in SQL: ${sqlQuery}`)
  const sqlQueryResult = await dataService.runQuery(sqlQuery)
  await say(
    `<@${event.user}> here is your answer: ${JSON.stringify(sqlQueryResult)}`
  )
})
;(async () => {
  await app.start(process.env.PORT || 3000)
  console.info('⚡️ Bolt app is running!')
})()
