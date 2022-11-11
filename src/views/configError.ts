import { ModalView } from '@slack/bolt'

export const configErrorView: ModalView = {
  type: 'modal',
  title: {
    type: 'plain_text',
    text: 'An error occurred',
  },
  blocks: [
    {
      type: 'section',
      text: {
        type: 'plain_text',
        text: 'An error occurred while trying to save your configuration. Please check the values you entered and try again',
        emoji: true,
      },
    },
  ],
}
