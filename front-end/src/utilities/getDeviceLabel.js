export const getDeviceLabel = () => {
    const platform = navigator.platform || '';
    const userAgent = navigator.userAgent || '';

    if (/Android/i.test(userAgent)) return 'android';
    if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios';
    if (/Win/i.test(platform)) return 'windows';
    if (/Mac/i.test(platform)) return 'mac';
    if (/Linux/i.test(platform)) return 'linux';

    return 'unknown';
  };