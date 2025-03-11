export const CONFIG = {
  API: {
    BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
    DEFAULT_TENANT_ID:
      process.env.DEFAULT_TENANT_ID || "b5f88040-a8bf-4b1e-99c2-1650c4fcbf3f",
  },
  CHAT: {
    AGENT_NAME: "Support Agent",
    MAX_MESSAGE_LENGTH: 1000,
  },
};
