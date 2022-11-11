import { HomeView } from '@slack/bolt'

export const homeView: HomeView = {
  type: 'home',
  blocks: [
    {
      type: 'section',
      text: {
        type: 'plain_text',
        text: 'Configure Delphi',
      },
      accessory: {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Configure',
        },
        action_id: 'open_config_modal',
      },
    },
  ],
}
