import fetch from 'node-fetch'

type Params = {
  baseURL: string
  endpoint: string
  credentials?: {
    apiClientId?: string
    apiKey?: string
  }
  body: string
}

export const fetchHermes = async ({
  baseURL,
  endpoint,
  credentials,
  body,
}: Params) => {
  return await fetch(`${baseURL}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CLIENT-ID': credentials?.apiClientId as string,
      'X-API-KEY': credentials?.apiKey as string,
    },
    body,
  })
}
