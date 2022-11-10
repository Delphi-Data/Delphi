import { App, ButtonClick } from '@slack/bolt'
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

  // Run query against data
  const sqlQueryResult = await dataService.runQuery(sqlQuery)
  const { pretty } = await formatQueryResult(sqlQueryResult)

  await app.client.files.upload({
    content: pretty,
    filename: `delphi_result_${event.ts}.txt`,
    filetype: 'txt',
    channels: event.channel,
    thread_ts: event.ts,
    initial_comment: `<@${event.user}> here is what I found:`,
  })
  await say({
    text: `Want to dig in deeper?`,
    thread_ts: event.ts,
    blocks: [
      {
        type: 'header',
        text: {
          text: 'Dig in deeper:',
          type: 'plain_text',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Download CSV for Excel or Google Sheets',
        },
        accessory: {
          type: 'button',
          style: 'primary',
          text: {
            type: 'plain_text',
            text: 'Download',
          },
          action_id: 'download_csv',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'See generated SQL',
        },
        accessory: {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'SQL',
          },
          action_id: 'view_sql',
          value: sqlQuery,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'View results in Lightdash',
        },
        accessory: {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '⚡️ Lightdash',
          },
          action_id: 'view_in_lightdash',
        },
      },
    ],
  })
  // await app.client.files.upload({
  //   content: csv,
  //   filename: `delphi_result_${event.ts}.csv`,
  //   filetype: 'csv',
  //   channels: event.channel,
  //   thread_ts: event.ts,
  //   initial_comment: `Open this file in Excel or Google Docs to explore the full result`,
  // })

  // Get answer
  if (process.env.GET_ANSWER_FROM_NLP) {
    const answer = await nlpService.getAnswer({
      query: text,
      data: sqlQueryResult,
    })
    await say({ text: answer, thread_ts: event.ts })
  }
})

// Action listeners
app.action('view_sql', async ({ ack, payload, body }) => {
  await ack()
  // Update the message to reflect the action
  await app.client.views.open({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore trigger_id is clearly in the body type; not sure why this is complaining
    trigger_id: body.trigger_id,
    view: {
      title: {
        type: 'plain_text',
        text: 'View SQL',
      },
      type: 'modal',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `\`\`\`${(payload as ButtonClick).value}\`\`\``,
          },
        },
      ],
    },
  })
})

// Start server
;(async () => {
  await app.start(process.env.PORT || 3000)
  console.info('⚡️ Bolt app is running!')
})()
