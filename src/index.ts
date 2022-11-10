import { App, ButtonClick, SectionBlock } from '@slack/bolt'
import * as dotenv from 'dotenv'
import configService from './services/ConfigService'
dotenv.config()

import { getDataService } from './services/DataService'
import { getNLPService } from './services/NLPService'
import { formatQueryResult } from './utils/formatQueryResult'
import stripUser from './utils/stripUser'

type DownloadFileActionPayload = {
  channel: string
  thread: string
  url: string
}

// initialize app
const app = new App({
  signingSecret: process.env.SLACK_SIGNING_TOKEN,
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
})

app.event('app_mention', async ({ event, say }) => {
  const text = stripUser(event.text)
  console.info(`query asked: ${text}`)

  const config = event.team ? await configService.getAll(event.team) : {}

  try {
    const dataService = getDataService(config)
    const nlpService = getNLPService(config)

    // Get query
    const sqlQuery = await nlpService.nlqToSQL({
      text,
      jobId: config.dbtCloudJobID as string,
      serviceToken: config.dbtCloudServiceToken as string,
    })

    // Run query against data
    const sqlQueryResult = await dataService.runQuery(sqlQuery)
    const { pretty, csv } = await formatQueryResult(sqlQueryResult)

    const [csvFile] = await Promise.all([
      app.client.files.upload({
        content: csv,
        filename: `delphi_result_${event.ts}.csv`,
        filetype: 'csv',
      }),
      app.client.files.upload({
        content: pretty,
        filename: `delphi_result_${event.ts}.txt`,
        filetype: 'txt',
        channels: event.channel,
        thread_ts: event.ts,
        initial_comment: `<@${event.user}> here is what I found:`,
      }),
    ])
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
            value: JSON.stringify({
              channel: event.channel,
              thread: event.ts,
              url: csvFile.file?.permalink,
            } as DownloadFileActionPayload),
            url: csvFile.file?.url_private_download,
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
        ...(config.lightdashUrl
          ? [
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
                  url: `${
                    process.env.LIGHTDASH_URL
                  }/sqlRunner?sql_runner=${encodeURI(
                    JSON.stringify({ sql: sqlQuery })
                  )}`,
                },
              } as SectionBlock,
            ]
          : []),
      ],
    })

    // Get answer
    if (process.env.GET_ANSWER_FROM_NLP) {
      const answer = await nlpService.getAnswer({
        query: text,
        data: sqlQueryResult,
      })
      await say({ text: answer, thread_ts: event.ts })
    }
  } catch (error) {
    await say({
      text: `Sorry, I'm not sure. Try asking the question a slightly different way - I might just need a little more help!`,
      thread_ts: event.ts,
    })
    console.error(`error running query`, error)
  }
})

// Action listeners
app.action('view_sql', async ({ ack, payload, body }) => {
  await ack()
  console.info('view_sql button clicked')
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

app.action('download_csv', async ({ ack, say, payload }) => {
  await ack()
  console.info('download_csv button clicked')
  const { channel, thread, url } = JSON.parse(
    (payload as ButtonClick).value
  ) as DownloadFileActionPayload
  await say({
    text: url,
    channel,
    thread_ts: thread,
  })
})

app.action('view_in_lightdash', async ({ ack }) => {
  await ack()
  console.info('view_in_lightdash button clicked')
})

// Start server
;(async () => {
  await app.start(process.env.PORT || 3000)
  console.info('⚡️ Bolt app is running!')
})()
