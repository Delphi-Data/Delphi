import { InstallationStore } from '@slack/bolt'
import { IConfigService, INSTALLATION_KEY } from '../services/ConfigService'

export const getInstallationStore = (
  configService: IConfigService
): InstallationStore => ({
  storeInstallation: async (installation) => {
    // change the line below so it saves to your database
    if (
      installation.isEnterpriseInstall &&
      installation.enterprise !== undefined
    ) {
      // support for org wide app installation
      return await configService.set(
        installation.enterprise.id,
        INSTALLATION_KEY,
        JSON.stringify(installation)
      )
    }
    if (installation.team !== undefined) {
      // single team app installation
      return await configService.set(
        installation.team.id,
        INSTALLATION_KEY,
        JSON.stringify(installation)
      )
    }
    throw new Error('Failed saving installation data to installationStore')
  },
  fetchInstallation: async (installQuery) => {
    // change the line below so it fetches from your database
    if (
      installQuery.isEnterpriseInstall &&
      installQuery.enterpriseId !== undefined
    ) {
      // org wide app installation lookup
      return JSON.parse(
        (await configService.get(
          installQuery.enterpriseId,
          INSTALLATION_KEY
        )) as string
      )
    }
    if (installQuery.teamId !== undefined) {
      // single team app installation lookup
      return JSON.parse(
        (await configService.get(
          installQuery.teamId,
          INSTALLATION_KEY
        )) as string
      )
    }
    throw new Error('Failed fetching installation')
  },
  deleteInstallation: async (installQuery) => {
    // change the line below so it deletes from your database
    if (
      installQuery.isEnterpriseInstall &&
      installQuery.enterpriseId !== undefined
    ) {
      // org wide app installation deletion
      return await configService.set(
        installQuery.enterpriseId,
        INSTALLATION_KEY,
        ''
      )
    }
    if (installQuery.teamId !== undefined) {
      // single team app installation deletion
      return await configService.set(installQuery.teamId, INSTALLATION_KEY, '')
    }
    throw new Error('Failed to delete installation')
  },
})
