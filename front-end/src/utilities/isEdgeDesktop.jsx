export const isEdgeDesktop = () => {
  const ua = navigator.userAgent;
  const isEdge = ua.includes('Edg/');
  const isWindows = navigator.platform?.startsWith('Win');
  return isEdge && isWindows;
};
