import { HomeView } from '@slack/bolt'

export const homeView: HomeView = {
  type: 'home',
  blocks: [
    {
      type: 'input',
      label: {
        type: 'plain_text',
        text: 'Select connection type',
      },
      element: {
        type: 'static_select',
        options: [
          {
            text: {
              type: 'plain_text',
              text: 'dbt Cloud Semantic Layer',
            },
            value: 'dbt_cloud',
          },
          {
            text: {
              type: 'plain_text',
              text: 'Lightdash',
            },
            value: 'lightdash',
          },
        ],
        action_id: 'open_config_select',
      },
      dispatch_action: true,
      block_id: 'select_connection',
    },
  ],
  callback_id: 'config_type_selected',
}
