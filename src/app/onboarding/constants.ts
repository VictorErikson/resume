export const enableNewAccountOnboarding = true;

export const ONBOARDING_BASE_ROUTE =
  typeof location !== 'undefined' && location.pathname.startsWith('/sv')
    ? '/sv/onboarding/'
    : '/onboarding/';
export const ONBOARDING_NEW_PARAMS = {};
export const ONBOARDING_NEW_PARAMS_STRING = '';
