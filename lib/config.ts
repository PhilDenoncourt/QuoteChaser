export const appConfig = {
  ai: {
    apiKey: process.env.OPENAI_API_KEY ?? '',
    model: process.env.OPENAI_MODEL ?? 'gpt-5.4-mini',
    maxRecentActivities: Number.parseInt(process.env.OPENAI_DRAFT_CONTEXT_LIMIT ?? '3', 10) || 3,
    styleHint:
      process.env.OPENAI_DRAFT_STYLE_HINT ??
      'Write concise, practical follow-up drafts for roofing estimate recovery. Keep them human, direct, and easy to copy.',
    enabled() {
      return Boolean(this.apiKey);
    },
  },
  auth: {
    resetTokenTtlMinutes: Number.parseInt(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES ?? '60', 10) || 60,
    appBaseUrl: process.env.APP_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? '',
  },
} as const;
