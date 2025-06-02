export const isInAppBrowser = () => {
  const ua = navigator.userAgent || navigator.vendor || window.opera
  return /Instagram|FBAN|FBAV|Messenger|Line|Gmail|Snapchat/i.test(ua)
}

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