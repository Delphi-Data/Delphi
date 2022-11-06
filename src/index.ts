import { App } from '@slack/bolt'
import * as dotenv from 'dotenv'
process.env.USE_DOTENV && dotenv.config()

import dataService from './services/DataService'
import nlpService from './services/NLPService'
import { formatQueryResult } from './utils/formatQueryResult'
import stripUser from './utils/stripUser'

// initialize app
const app = new App({
  signingSecret: process.env.SLACK_SIGNING_TOKEN,
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
})

app.event('app_mention', async ({ event, say }) => {
  const text = stripUser(event.text)
  // Get query
  const sqlQuery = await nlpService.nlqToSQL({
    text,
    jobId: process.env.JOB_ID as string,
    serviceToken: process.env.SERVICE_TOKEN as string,
  })
  await say({
    text: `<@${event.user}> here is your query in SQL:\n\`\`\`${sqlQuery}\`\`\``,
    thread_ts: event.ts,
  })

  // Run query against data
  const sqlQueryResult = await dataService.runQuery(sqlQuery)
  const { csv, pretty } = await formatQueryResult(sqlQueryResult)
  await say({
    text: `<@${event.user}> here is what I found:\n\`\`\`${pretty}\`\`\``,
    thread_ts: event.ts,
  })
  await app.client.files.upload({
    content: csv,
    filename: `delphi_result_${event.ts}.csv`,
    filetype: 'csv',
    channels: event.channel,
    thread_ts: event.ts,
    initial_comment: `Open this file in Excel or Google Docs to explore the full result`,
  })

  // Get answer
  if (process.env.GET_ANSWER_FROM_NLP) {
    const answer = await nlpService.getAnswer({
      query: text,
      data: sqlQueryResult,
    })
    await say({ text: answer, thread_ts: event.ts })
  }
})

// Start server
;(async () => {
  await app.start(process.env.PORT || 3000)
  console.info('⚡️ Bolt app is running!')
})()
