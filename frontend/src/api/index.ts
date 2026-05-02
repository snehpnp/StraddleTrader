// API Folder - All API calls organized by domain
// Common axios instance with cookie-based authentication

export { axiosInstance, publicAxios } from './axios';

// Auth APIs
export * as authApi from './auth';

// Strategy APIs
export * as strategyApi from './strategy';
export type { Strategy } from './strategy';

// Broker APIs
export * as brokerApi from './broker';
export type { Broker } from './broker';

// Market APIs
export * as marketApi from './market';

// Portfolio APIs
export * as portfolioApi from './portfolio';
export type { Portfolio, Position, Holding, Order, Log } from './portfolio';
