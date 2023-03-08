// This is really unfortunate, but a necessary workaround for esbuild and
// OpenTelemetry to work together. esbuild uses defineProperty to define, well,
// something when using ESM exports. When OpenTelemetry tries to patch the
// module, it fails because it's immutable. By using CJS export, we can work
// around this problem. (esbuild produces cjs either way, so it has no real
// impact on bundling or treeshaking). It _may_ be possible to avoid this by
// compiling to ESM, but that may also just make the problem completely
// intractable.

// eslint-disable-next-line @typescript-eslint/no-var-requires
const {ping} = require('./ping');
exports.handler = ping;
