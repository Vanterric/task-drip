export const isInAppBrowser = () => {
  const ua = navigator.userAgent || navigator.vendor || window.opera;

  // Known in-app browser signatures
  const inAppPatterns = [
    /FBAN/,        // Facebook
    /FBAV/,        // Facebook
    /Instagram/,   // Instagram
    /Line/,        // LINE
    /Twitter/,     // Twitter
    /Snapchat/,    // Snapchat
    /GSA/,         // Google Search App
    /Gmail/,       // Gmail
  ];

  // Detect if running in standalone mode (PWA)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  // Heuristic for in-app WebViews
  const isLikelyInAppWebView = (
    !isStandalone &&
    document.referrer === '' &&
    !window.navigator.standalone &&
    /Android|iPhone|iPad|iPod/i.test(ua)
  );

  return inAppPatterns.some((pattern) => pattern.test(ua)) || isLikelyInAppWebView;
};



export const redirectIfInApp = () => {
  try {
    const url = new URL(window.location.href)
    if (isInAppBrowser() && !url.searchParams.has('browserOpened')) {
        alert('You are using an in-app browser. For the best experience, please open this link in your default browser.')
      url.searchParams.set('browserOpened', 'true')
      window.open(url.toString(), '_blank')
    }
  } catch (err) {
    console.error('Failed to redirect from in-app browser:', err)
  }
}