import { ModalView } from '@slack/bolt'

export const configSuccessView: ModalView = {
  type: 'modal',
  title: {
    type: 'plain_text',
    text: 'Success!',
  },
  blocks: [
    {
      type: 'section',
      text: {
        type: 'plain_text',
        text: ":white_check_mark: You're ready to get started. Add @Delphi to a channel and ask me some questions!",
        emoji: true,
      },
    },
  ],
}
