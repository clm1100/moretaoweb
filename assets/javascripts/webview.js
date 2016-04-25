function getElementHeight(id, platform) {
  var height = document.getElementById(id).offsetHeight;
  if (platform === 'android') window.stub.getPageHeight(height);
  return height;
}
