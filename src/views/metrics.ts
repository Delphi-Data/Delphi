import { ModalView } from '@slack/bolt'
import { Config } from '../services/ConfigService'
import { getDataService, ILightdashDataService } from '../services/DataService'

export const getMetricsView = async (
  config: Partial<Config>
): Promise<ModalView> => {
  const dataService = await getDataService(config)
  const metrics = await (dataService as ILightdashDataService).getMetrics()
  return {
    type: 'modal',
    title: {
      type: 'plain_text',
      text: 'Metrics',
    },
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: metrics
            .map((metric) => `\`\`\`${JSON.stringify(metric)}\`\`\``)
            .join('\n\n'),
        },
      },
    ],
  }
}
