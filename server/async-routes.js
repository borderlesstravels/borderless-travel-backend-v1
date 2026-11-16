function forwardAsyncErrors(router) {
  for (const layer of router.stack || []) {
    if (layer.route) {
      for (const handler of layer.route.stack) {
        const original = handler.handle;
        if (original.length === 4) continue;
        handler.handle = function (req, res, next) {
          try { return Promise.resolve(original(req, res, next)).catch(next); }
          catch (error) { return next(error); }
        };
      }
    } else if (layer.handle?.stack) forwardAsyncErrors(layer.handle);
  }
  return router;
}
module.exports = { forwardAsyncErrors };
