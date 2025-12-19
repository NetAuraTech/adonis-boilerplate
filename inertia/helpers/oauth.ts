export function getProviderRoute(providerName: string) {
  return `/oauth/${providerName.toLowerCase()}`
}
