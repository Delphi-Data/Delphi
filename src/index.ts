import { App } from '@slack/bolt'
import * as dotenv from 'dotenv'

import nlpService from './services/NLPService'
import stripUser from './utils/stripUser'

dotenv.config()

console.info(process.env)

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
  const sqlQuery = await nlpService.nlqToSQL({ text }) // TODO: we'll want to add an org ID to this somehow

  await say(`<@${event.user}> here is your query in SQL: ${sqlQuery}`)
})
;(async () => {
  await app.start(process.env.PORT || 3000)
  console.info('⚡️ Bolt app is running!')
})()
