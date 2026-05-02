// Re-export from modular API files for backward compatibility
// NEW: Use these for better organization:
//   - '@/lib/api-client' - axios clients (authApiClient, publicApiClient, api, publicApi)
//   - '@/lib/api-services' - organized API services (authApi, strategyApi, brokerApi, etc.)

export { authApiClient, publicApiClient, api, publicApi } from './api-client';
export { authApi, strategyApi, brokerApi, portfolioApi, marketApi } from './api-services';
export type { Strategy, Broker, Portfolio, Position, Holding } from './api-services';
