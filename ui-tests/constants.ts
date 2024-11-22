// Application Configuration
export const APP_CONFIG = {
  URL: process.env.CANDIG_URL,
  USERNAME: process.env.CANDIG_USER2_USERNAME,
  PASSWORD: process.env.CANDIG_USER2_PASSWORD,
};

// Viewport Dimensions
export const VIEWPORT = {
  WIDTH: 1920,
  HEIGHT: 1080,
};

// Timeouts
export const TIMEOUTS = {
  NETWORK_IDLE: 30000, // 30 seconds
};

// Debugging Options
export const DEBUG = process.env.DEBUG === "true";

// File Paths
export const FILE_PATHS = {
  CLINICAL_SEARCH_SCREENSHOT: "clinical-search-page.png",
};