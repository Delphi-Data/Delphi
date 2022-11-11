import { ViewsOpenArguments } from '@slack/web-api'

export const getSQLView = ({
  triggerID,
  sql,
}: {
  triggerID: string
  sql: string
}): ViewsOpenArguments => ({
  trigger_id: triggerID,
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
          text: `\`\`\`${sql}\`\`\``,
        },
      },
    ],
  },
})
