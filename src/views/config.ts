import { Block, KnownBlock, ModalView } from '@slack/bolt'
import { Config } from '../services/ConfigService'

type Params = {
  config: Partial<Config>
  type: 'dbt_cloud' | 'lightdash'
}

export const getConfigView = ({ config, type }: Params): ModalView => ({
  type: 'modal',
  title: {
    type: 'plain_text',
    text: 'Configure Delphi',
  },
  blocks: [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: ':robot_face: Delphi',
        emoji: true,
      },
    },
    {
      block_id: 'delphiClientID',
      type: 'input',
      element: {
        type: 'plain_text_input',
        action_id: 'delphiClientID',
        initial_value: config.delphiClientID,
      },
      label: {
        type: 'plain_text',
        text: 'Client ID',
        emoji: true,
      },
    },
    {
      type: 'input',
      block_id: 'delphiAPIKey',
      element: {
        type: 'plain_text_input',
        action_id: 'delphiAPIKey',
      },
      label: {
        type: 'plain_text',
        text: 'API Key',
        emoji: true,
      },
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: "Don't have a client ID and API key yet? Reach out to Michael Irvine on the dbt or Locally Optimistic Slacks, or email michael@sightglassdata.com",
        },
      ],
    },
    ...(type === 'dbt_cloud'
      ? ([
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: ':cloud: dbt Cloud',
              emoji: true,
            },
          },
          {
            block_id: 'dbtCloudJobID',
            type: 'input',
            element: {
              type: 'plain_text_input',
              action_id: 'dbtCloudJobID',
              initial_value: config.dbtCloudJobID,
            },
            label: {
              type: 'plain_text',
              text: 'Job ID',
              emoji: true,
            },
          },
          {
            block_id: 'dbtCloudServiceToken',
            type: 'input',
            element: {
              type: 'plain_text_input',
              action_id: 'dbtCloudServiceToken',
            },
            label: {
              type: 'plain_text',
              text: 'Service Token',
              emoji: true,
            },
          },
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: ':snowflake: Snowflake',
              emoji: true,
            },
          },
          {
            block_id: 'snowflakeAccount',
            type: 'input',
            element: {
              type: 'plain_text_input',
              action_id: 'snowflakeAccount',
              placeholder: {
                type: 'plain_text',
                text: 'cib42085.us-east-1',
              },
              initial_value: config.snowflakeAccount,
            },
            label: {
              type: 'plain_text',
              text: 'Account',
              emoji: false,
            },
          },
          {
            type: 'divider',
          },
          {
            block_id: 'snowflakeUsername',
            type: 'input',
            element: {
              type: 'plain_text_input',
              action_id: 'snowflakeUsername',
              initial_value: config.snowflakeUsername,
            },
            label: {
              type: 'plain_text',
              text: 'Username',
              emoji: true,
            },
          },
          {
            block_id: 'snowflakePassword',
            type: 'input',
            element: {
              type: 'plain_text_input',
              action_id: 'snowflakePassword',
            },
            label: {
              type: 'plain_text',
              text: 'Password',
              emoji: true,
            },
          },
          {
            block_id: 'snowflakeRole',
            type: 'input',
            element: {
              type: 'plain_text_input',
              action_id: 'snowflakeRole',
              initial_value: config.snowflakeRole,
            },
            label: {
              type: 'plain_text',
              text: 'Role',
              emoji: true,
            },
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: 'Tip: use a user and role with read-only permissions. Delphi will _never_ attempt to write to your data warehouse.',
              },
            ],
          },
          {
            type: 'divider',
          },
          {
            block_id: 'snowflakeAccessUrl',
            type: 'input',
            element: {
              type: 'plain_text_input',
              action_id: 'snowflakeAccessUrl',
              placeholder: {
                type: 'plain_text',
                text: 'https://eagle-hqya7.proxy.cloud.getdbt.com',
              },
              initial_value: config.snowflakeAccessUrl,
            },
            label: {
              type: 'plain_text',
              text: 'Access URL (dbt Cloud Proxy URL)',
              emoji: true,
            },
          },
          {
            type: 'divider',
          },
          {
            block_id: 'snowflakeWarehouse',
            type: 'input',
            element: {
              type: 'plain_text_input',
              action_id: 'snowflakeWarehouse',
              initial_value: config.snowflakeWarehouse,
            },
            label: {
              type: 'plain_text',
              text: 'Warehouse',
              emoji: true,
            },
          },
          {
            block_id: 'snowflakeDatabase',
            type: 'input',
            element: {
              type: 'plain_text_input',
              action_id: 'snowflakeDatabase',
              initial_value: config.snowflakeDatabase,
            },
            label: {
              type: 'plain_text',
              text: 'Database',
              emoji: true,
            },
          },
        ] as (Block | KnownBlock)[])
      : []),
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: ':zap: Lightdash',
        emoji: true,
      },
    },
    {
      block_id: 'lightdashURL',
      type: 'input',
      optional: type !== 'lightdash',
      element: {
        type: 'plain_text_input',
        action_id: 'lightdashURL',
        placeholder: {
          type: 'plain_text',
          text: 'https://app.lightdash.cloud/projects/8cf007dd-8999-4add-a3ca-92fc8d4c6ace',
        },
        initial_value: config.lightdashURL,
      },
      label: {
        type: 'plain_text',
        text: 'Lightdash Project URL',
        emoji: true,
      },
    },
    ...(type === 'lightdash'
      ? ([
          {
            block_id: 'lightdashEmail',
            type: 'input',
            element: {
              type: 'plain_text_input',
              action_id: 'lightdashEmail',
              initial_value: config.lightdashEmail,
            },
            label: {
              type: 'plain_text',
              text: 'Lightdash Email',
              emoji: true,
            },
          },
          {
            block_id: 'lightdashPassword',
            type: 'input',
            element: {
              type: 'plain_text_input',
              action_id: 'lightdashPassword',
            },
            label: {
              type: 'plain_text',
              text: 'Lightdash Password',
              emoji: true,
            },
          },
          {
            block_id: 'shouldUseLightdashSemanticLayer',
            type: 'input',
            element: {
              type: 'radio_buttons',
              action_id: 'shouldUseLightdashSemanticLayer',
              options: [
                {
                  text: {
                    type: 'plain_text',
                    text: 'dbt Cloud Semantic Layer',
                  },
                  value: 'option 1',
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'Lightdash Semantic Layer',
                  },
                  value: 'option 2',
                },
              ],
              initial_option: {
                text: { type: 'plain_text', text: 'dbt Cloud Semantic Layer' },
                value: 'option 1',
              },
            },
            label: {
              type: 'plain_text',
              text: 'Semantic Layer Type',
              emoji: true,
            },
          },
        ] as (Block | KnownBlock)[])
      : []),
    // Unclear if we need schema:
    // {
    //   block_id: 'snowflake_schema',
    //   type: 'input',
    //   element: {
    //     type: 'plain_text_input',
    //     action_id: 'snowflake_schema',
    //   },
    //   label: {
    //     type: 'plain_text',
    //     text: 'Schema',
    //     emoji: true,
    //   },
    // },
  ],
  submit: {
    type: 'plain_text',
    text: 'Submit',
  },
  callback_id: 'config_modal_submit',
})
