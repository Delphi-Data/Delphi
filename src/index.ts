import {
  AllMiddlewareArgs,
  App,
  AppMentionEvent,
  ButtonClick,
  LogLevel,
  SayFn,
  SectionBlock,
  StaticSelectAction,
} from '@slack/bolt'
import * as dotenv from 'dotenv'
import { DEMO_TEAM_ID } from './constants'
dotenv.config()

import configService, { Config } from './services/ConfigService'
import { getDataService, ILightdashDataService } from './services/DataService'
import { getNLPService } from './services/NLPService'
import { LightdashCatalog, LightdashQuery } from './types/lightdash'
import { formatQueryResult } from './utils/formatQueryResult'
import { getInstallationStore } from './utils/getInstallationStore'
import stripUser from './utils/stripUser'
import {
  getConfigView,
  homeView,
  getMetricsView,
  getSQLView,
  configSuccessView,
} from './views'

type DownloadFileActionPayload = {
  channel: string
  thread: string
  url: string
}

// initialize app
const app = new App({
  // Oauth
  logLevel: LogLevel.DEBUG,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  stateSecret: 'my-state-secret',
  scopes: [
    'app_mentions:read',
    'channels:history',
    'chat:write',
    'files:write',
    'groups:history',
    'im:history',
    'mpim:history',
    'im:read',
    'im:write',
    'mpim:read',
    'mpim:write',
  ],
  installerOptions: {
    directInstall: true,
    callbackOptions: {
      success: (installation, _installOptions, _req, res) => {
        // Display a success page or redirect back into Slack
        //
        // Learn how to redirect into Slack:
        // https://github.com/slackapi/node-slack-sdk/blob/main/packages/oauth/src/index.ts#L527-L552
        res.end()

        // Send a welcome message to the user as a DM
        app.client.chat
          .postMessage({
            token: installation?.bot?.token,
            channel: installation.user.id,
            text: ":wave: Hi! I'm Delphi",
          })
          .then(() => {
            app.client.chat
              .postMessage({
                token: installation?.bot?.token,
                channel: installation.user.id,
                text: ':speech_balloon: To get started, message me with a question like "how much money did we make from gift cards last week?',
              })
              .then(() => {
                app.client.chat.postMessage({
                  token: installation?.bot?.token,
                  channel: installation.user.id,
                  text: ':partying_face: You can also add me to a channel so everyone can ask me questions by tagging "@Delphi"',
                })
              })
          })
      },
    },
  },
  installationStore: getInstallationStore(configService),

  // socket (should only be run locally)
  token:
    process.env.SOCKET_MODE === 'true'
      ? process.env.SLACK_BOT_TOKEN
      : undefined,
  socketMode: process.env.SOCKET_MODE === 'true',
  appToken:
    process.env.SOCKET_MODE === 'true'
      ? process.env.SLACK_APP_TOKEN
      : undefined,
})

const handleMessage = async ({
  event,
  say,
  client,
}: {
  event: AppMentionEvent
  say: SayFn
  client: AllMiddlewareArgs['client']
}) => {
  const text = stripUser(event.text)
  console.info(`query asked: ${text}`)

  let config = event.team ? await configService.getAll(event.team) : {}
  if (!config || Object.keys(config).length <= 1) {
    if (process.env.DEFAULT_TO_DEMO === 'true') {
      config = await configService.getAll(DEMO_TEAM_ID)
      console.info(`Using demo data set`)
      await say({
        text: 'Using demo data set. If you want to use your own data, click on my name, go to my "home" tab, and select a connection type.',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: 'Using demo data set. If you want to use your own data, click on my name, go to my "home" tab, and select a connection type.',
            },
            accessory: {
              type: 'button',
              style: 'primary',
              text: {
                type: 'plain_text',
                text: 'See Available Metrics',
              },
              action_id: 'see_metrics',
            },
          },
        ],
        channel: event.channel,
        thread_ts: event.ts,
      })
    } else {
      console.info(`No config found. Exiting.`)
      await say({
        text: ':racehorse: Hold your horses! You still need to configure Delphi. :racehorse: \n\nClick on my name, go to my "home" tab, and select a connection type.',
        channel: event.channel,
        thread_ts: event.ts,
      })
      return
    }
  }

  try {
    const dataService = await getDataService(config)
    const nlpService = getNLPService(config)

    // Get query
    const metrics =
      dataService.type === 'lightdash'
        ? config.shouldUseLightdashSemanticLayer
          ? await (
              dataService as ILightdashDataService
            ).getMetricsAndDimensions()
          : await (dataService as ILightdashDataService).getMetrics() // TODO: put this in Redis but only persist for a short time (and/or let the user refresh?)
        : undefined
    const query = await (config.shouldUseLightdashSemanticLayer
      ? nlpService.nlqToLightdashQuery({
          question: text,
          ...(metrics as LightdashCatalog),
        })
      : nlpService.nlqToSQL({
          text,
          metrics: metrics as Record<string, string | string[]>[] | undefined,
          jobId: config.dbtCloudJobID as string,
          serviceToken: config.dbtCloudServiceToken as string,
        }))

    // Run query against data
    const sqlQueryResult = await (config.shouldUseLightdashSemanticLayer
      ? (dataService as ILightdashDataService).runQuery(query as LightdashQuery)
      : dataService.runSQLQuery(query as string))
    const { pretty, csv } = await formatQueryResult(sqlQueryResult)

    const [csvFile] = await Promise.all([
      client.files.upload({
        content: csv,
        filename: `delphi_result_${event.ts}.csv`,
        filetype: 'csv',
      }),
      client.files.upload({
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
            value: JSON.stringify(query),
          },
        },
        ...(config.lightdashURL
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
                  url: config.shouldUseLightdashSemanticLayer
                    ? `${config.lightdashURL}/tables/`
                    : `${config.lightdashURL}/sqlRunner?sql_runner=${encodeURI(
                        JSON.stringify({ sql: query })
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
}

app.event('message', async ({ event, say, client }) => {
  if (event.channel_type === 'im') {
    console.info('direct message received')
    await handleMessage({
      event: event as unknown as AppMentionEvent, // this is unsafe but it works. I think the TS types for the Slack Bolt API are outdated
      say,
      client,
    })
  }
})
app.event('app_mention', async ({ event, say, client }) => {
  console.info('app mentioned in channel')
  await handleMessage({ event, say, client })
})

// Action listeners
app.action('view_sql', async ({ ack, payload, body, client }) => {
  await ack()
  console.info('view_sql button clicked')
  await client.views.open(
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

app.event('app_home_opened', async ({ payload, client }) => {
  console.info('app home opened')
  client.views.publish({
    user_id: payload.user,
    view: homeView,
  })
})

app.action('open_config_select', async ({ ack, body, payload, client }) => {
  await ack()
  console.info('open_config_modal button clicked')
  const config = body.team ? await configService.getAll(body.team.id) : {}
  client.views.open({
    view: getConfigView({
      config,
      type: (payload as StaticSelectAction).selected_option.value as
        | 'dbt_cloud'
        | 'lightdash',
    }),
    trigger_id: (body as { trigger_id: string }).trigger_id,
  })
})

app.view(
  'config_modal_submit',
  async ({ ack, view, payload, client, body }) => {
    await ack()
    console.info('config submitted')
    try {
      const values = view.state.values
      const config = Object.entries(values).map(([key, val]) => [
        key,
        val[key].value,
      ])
      config.forEach(([key, val]) => {
        val && configService.set(payload.team_id, key as keyof Config, val)
      })
    } catch (error) {
      // TODO: show the user an error message. Rn it is telling me the trigger_id is invalid
      // client.views.push({
      //   trigger_id: (body as { trigger_id: string }).trigger_id,
      //   view: configErrorView,
      // })
      console.error('Error submitting config', error)
      return
    }
    console.log(`Successfully submitted config`)
    client.views.open({
      view: configSuccessView,
      trigger_id: (body as { trigger_id: string }).trigger_id,
    })
  }
)

app.action('see_metrics', async ({ ack, body, client }) => {
  await ack()
  console.info('see_metrics button clicked')
  const config = await configService.getAll(DEMO_TEAM_ID)
  client.views.open({
    view: await getMetricsView(config),
    trigger_id: (body as { trigger_id: string }).trigger_id,
  })
})

// Start server
;(async () => {
  await app.start(process.env.PORT || 3000)
  console.info('⚡️ Bolt app is running!')
})()
