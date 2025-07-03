export interface SocialLoginConfig {
  clientId: string;
  redirectUri: string;
  scope: string[];
}

export interface SocialLoginProviders {
  github: SocialLoginConfig;
  microsoft: SocialLoginConfig;
  apple: SocialLoginConfig;
}

const socialLoginConfig: SocialLoginProviders = {
  github: {
    clientId: import.meta.env.VITE_GITHUB_CLIENT_ID,
    redirectUri: `${window.location.origin}/auth/github/callback`,
    scope: ['user:email']
  },
  microsoft: {
    clientId: import.meta.env.VITE_MICROSOFT_CLIENT_ID,
    redirectUri: `${window.location.origin}/auth/microsoft/callback`,
    scope: ['user.read']
  },
  apple: {
    clientId: import.meta.env.VITE_APPLE_CLIENT_ID,
    redirectUri: `${window.location.origin}/auth/apple/callback`,
    scope: ['name', 'email']
  }
}

export const initiateSocialLogin = (provider: keyof SocialLoginProviders) => {
  const config = socialLoginConfig[provider]
  const searchParams = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scope.join(' '),
    response_type: 'code',
    state: crypto.randomUUID()
  })

  const authUrls = {
    github: `https://github.com/login/oauth/authorize?${searchParams}`,
    microsoft: `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${searchParams}`,
    apple: `https://appleid.apple.com/auth/authorize?${searchParams}`
  }

  window.location.href = authUrls[provider]
}