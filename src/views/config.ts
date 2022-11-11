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
      type: 'input',
      element: {
        type: 'plain_text_input',
        action_id: 'delphi_client_id',
      },
      label: {
        type: 'plain_text',
        text: 'Client ID',
        emoji: true,
      },
    },
    {
      type: 'input',
      element: {
        type: 'plain_text_input',
        action_id: 'delphi_api_key',
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
      type: 'input',
      element: {
        type: 'plain_text_input',
        action_id: 'dbt_cloud_job_id',
      },
      label: {
        type: 'plain_text',
        text: 'Job ID',
        emoji: true,
      },
    },
    {
      type: 'input',
      element: {
        type: 'plain_text_input',
        action_id: 'dbt_cloud_service_token',
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
      type: 'input',
      element: {
        type: 'plain_text_input',
        action_id: 'snowflake_account',
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
      type: 'input',
      element: {
        type: 'plain_text_input',
        action_id: 'snowflake_username',
      },
      label: {
        type: 'plain_text',
        text: 'Username',
        emoji: true,
      },
    },
    {
      type: 'input',
      element: {
        type: 'plain_text_input',
        action_id: 'snowflake_password',
      },
      label: {
        type: 'plain_text',
        text: 'Password',
        emoji: true,
      },
    },
    {
      type: 'input',
      element: {
        type: 'plain_text_input',
        action_id: 'snowflake_role',
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
      type: 'input',
      element: {
        type: 'plain_text_input',
        action_id: 'snowflake_access_url',
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
      type: 'input',
      element: {
        type: 'plain_text_input',
        action_id: 'snowflake_warehouse',
      },
      label: {
        type: 'plain_text',
        text: 'Warehouse',
        emoji: true,
      },
    },
    {
      type: 'input',
      element: {
        type: 'plain_text_input',
        action_id: 'snowflake_database',
      },
      label: {
        type: 'plain_text',
        text: 'Database',
        emoji: true,
      },
    },
    {
      type: 'input',
      element: {
        type: 'plain_text_input',
        action_id: 'snowflake_schema',
      },
      label: {
        type: 'plain_text',
        text: 'Schema',
        emoji: true,
      },
    },
  ],
  submit: {
    type: 'plain_text',
    text: 'Submit',
  },
}
