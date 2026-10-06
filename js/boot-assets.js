// Start first-screen downloads in the head, before the image elements are parsed. Stream their
// actual bytes for progress, and reuse the downloaded blobs for display and vine animation.
(function () {
  if (!window.fetch || !window.URL || !URL.createObjectURL) return;
  var manifest = [
    ['assets/home/vine-left-paint-web.webp', 934070],
    ['assets/home/vine-right-full-paint-web.webp', 876132],
    ['assets/app/home-masthead-20261006.jpg', 86191],
    ['assets/home/iphone-frame.webp', 217644]
  ];
  var entries = {};
  function notify() { window.dispatchEvent(new Event('site:asset-progress')); }
  manifest.forEach(function (item) {
    var entry = entries[item[0]] = { loaded: 0, total: item[1], settled: false, url: null };
    entry.controller = new AbortController();
    entry.promise = fetch(item[0], { signal: entry.controller.signal, priority: 'high' }).then(async function (response) {
      if (!response.ok) throw new Error('Image download failed');
      var length = Number(response.headers.get('Content-Length'));
      if (length > 0 && !response.headers.get('Content-Encoding')) entry.total = length;
      var blob;
      if (response.body && response.body.getReader) {
        var reader = response.body.getReader();
        var chunks = [];
        while (true) {
          var part = await reader.read();
          if (part.done) break;
          chunks.push(part.value);
          entry.loaded += part.value.byteLength;
          notify();
        }
        blob = new Blob(chunks, { type: response.headers.get('Content-Type') || 'image/webp' });
      } else {
        blob = await response.blob();
        entry.loaded = blob.size;
      }
      entry.total = entry.loaded;
      entry.url = URL.createObjectURL(blob);
      return entry.url;
    }).catch(function () { return null; }).finally(function () {
      entry.settled = true;
      notify();
    });
  });
  window.siteAssetDownloads = {
    get: function (src) { return entries[src] ? entries[src].promise : Promise.resolve(src); },
    progress: function () {
      var loaded = 0, total = 0;
      Object.keys(entries).forEach(function (src) {
        loaded += entries[src].loaded;
        total += entries[src].total;
      });
      return total ? loaded / total : 0;
    }
  };
  window.addEventListener('site:ready', function (event) {
    if (!event.detail.timedOut) return;
    Object.keys(entries).forEach(function (src) {
      if (!entries[src].settled) entries[src].controller.abort();
    });
  });
})();
