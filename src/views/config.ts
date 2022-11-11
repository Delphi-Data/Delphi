import { ModalView } from '@slack/bolt'

export const configView: ModalView = {
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
        text: 'Delphi',
        emoji: true,
      },
    },
    {
      block_id: 'delphiClientID',
      type: 'input',
      element: {
        type: 'plain_text_input',
        action_id: 'delphiClientID',
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
      type: 'header',
      text: {
        type: 'plain_text',
        text: 'dbt Cloud',
        emoji: true,
      },
    },
    {
      block_id: 'dbtCloudJobID',
      type: 'input',
      element: {
        type: 'plain_text_input',
        action_id: 'dbtCloudJobID',
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
        text: 'Snowflake',
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
      },
      label: {
        type: 'plain_text',
        text: 'Database',
        emoji: true,
      },
    },
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: 'Snowflake',
        emoji: true,
      },
    },
    {
      block_id: 'lightdashURL',
      type: 'input',
      optional: true,
      element: {
        type: 'plain_text_input',
        action_id: 'lightdashURL',
        placeholder: {
          type: 'plain_text',
          text: 'https://demo.lightdash.com/projects/2014e038-ff4b-4761-ae6f-fbf551e7b468',
        },
      },
      label: {
        type: 'plain_text',
        text: 'Lightdash URL (including project)',
        emoji: true,
      },
      hint: {
        type: 'plain_text',
        text: 'optional',
      },
    },
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
}
