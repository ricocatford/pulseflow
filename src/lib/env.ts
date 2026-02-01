/**
 * Typed environment variable accessor
 * All environment variables used by the app should be accessed through this module
 */

function getEnvVar(key: string, required: boolean = true): string | undefined {
  const value = process.env[key];

  if (required && !value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

function getOptionalEnvVar(key: string): string | undefined {
  return process.env[key];
}

/**
 * Environment configuration with typed access
 */
export const env = {
  // Database
  get DATABASE_URL(): string {
    return getEnvVar("DATABASE_URL") as string;
  },

  get DIRECT_URL(): string | undefined {
    return getOptionalEnvVar("DIRECT_URL");
  },

  // Supabase
  get NEXT_PUBLIC_SUPABASE_URL(): string {
    return getEnvVar("NEXT_PUBLIC_SUPABASE_URL") as string;
  },

  get NEXT_PUBLIC_SUPABASE_ANON_KEY(): string {
    return getEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY") as string;
  },

  // LLM - Gemini
  get GEMINI_API_KEY(): string | undefined {
    return getOptionalEnvVar("GEMINI_API_KEY");
  },

  // Helper to check if Gemini is configured
  get isGeminiConfigured(): boolean {
    return Boolean(this.GEMINI_API_KEY);
  },

  // Email - Resend
  get RESEND_API_KEY(): string | undefined {
    return getOptionalEnvVar("RESEND_API_KEY");
  },

  get EMAIL_FROM(): string {
    return getOptionalEnvVar("EMAIL_FROM") ?? "PulseFlow <alerts@pulseflow.dev>";
  },

  // Helper to check if email is configured
  get isEmailConfigured(): boolean {
    return Boolean(this.RESEND_API_KEY);
  },

  // Node environment
  get NODE_ENV(): string {
    return getOptionalEnvVar("NODE_ENV") ?? "development";
  },

  get isDevelopment(): boolean {
    return this.NODE_ENV === "development";
  },

  get isProduction(): boolean {
    return this.NODE_ENV === "production";
  },

  get isTest(): boolean {
    return this.NODE_ENV === "test";
  },
} as const;
