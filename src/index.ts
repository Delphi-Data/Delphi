import { App, ButtonClick, SectionBlock } from '@slack/bolt'
import * as dotenv from 'dotenv'
import configService, { Config } from './services/ConfigService'
dotenv.config()

import { getDataService } from './services/DataService'
import { getNLPService } from './services/NLPService'
import { formatQueryResult } from './utils/formatQueryResult'
import stripUser from './utils/stripUser'
import { configView, homeView, getSQLView, configErrorView } from './views'

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
  await app.client.views.open(
    getSQLView({
      triggerID: (body as { trigger_id: string }).trigger_id,
      sql: (payload as ButtonClick).value,
    })
  )
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

app.event('app_home_opened', async ({ payload }) => {
  console.info('app home opened')
  app.client.views.publish({
    user_id: payload.user,
    view: homeView,
  })
})

app.action('open_config_modal', async ({ ack, body }) => {
  await ack()
  console.info('open_config_modal button clicked')
  app.client.views.open({
    view: configView,
    trigger_id: (body as { trigger_id: string }).trigger_id,
  })
})

app.view('config_modal_submit', async ({ ack, view, payload }) => {
  await ack()
  console.info('config submitted')
  try {
    const values = view.state.values
    const config = Object.entries(values).map(([key, val]) => [
      key,
      val[key].value,
    ])
    config.forEach(([key, val]) => {
      configService.set(payload.team_id, key as keyof Config, val as string)
    })
    console.info(JSON.stringify(config))
  } catch (error) {
    // TODO: show the user an error message. Rn it is telling me the trigger_id is invalid
    // app.client.views.push({
    //   trigger_id: (body as { trigger_id: string }).trigger_id,
    //   view: configErrorView,
    // })
    console.error('Error submitting config', error)
  }
})

// Start server
;(async () => {
  await app.start(process.env.PORT || 3000)
  console.info('⚡️ Bolt app is running!')
})()
