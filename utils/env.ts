export const getEnvVariable = (key: string): string => {
  const value = process.env[key]
  if (!value) {
    console.error(`Required environment variable is not set`)
    throw new Error(`Environment variable ${key} is not set. Please check your environment variables and redeploy if necessary.`)
  }
  return value
}

export const ELEVENLABS_API_KEY = getEnvVariable('NEXT_PUBLIC_ELEVENLABS_API_KEY')
export const ELEVENLABS_AGENT_ID = getEnvVariable('NEXT_PUBLIC_ELEVENLABS_AGENT_ID')

