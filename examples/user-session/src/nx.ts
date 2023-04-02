// This file is a hack to add explicit dependencies between this example and the
// various codegen plugins. You can ignore this outside of this repo.
// Hopefully, someone will tackle https://github.com/nrwl/nx/issues/15044 and
// this won't be necessary anymore.
//
// If the foundation plugins aren't yet built and this file is affecting an
// example for the first time, you'll still need to run `make build` once to
// update package.json. Once that's done, the depenedency graph should be
// correct moving forward.

import '@code-like-a-carpenter/foundation-plugin-cloudformation';
import '@code-like-a-carpenter/foundation-plugin-typescript';
