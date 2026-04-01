const path = require('node:path');
const Module = require('node:module');

const projectRoot = process.cwd();
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function patchedResolve(request, parent, isMain, options) {
  if (request.startsWith('@/')) {
    const mappedRequest = path.join(projectRoot, request.slice(2));
    return originalResolveFilename.call(this, mappedRequest, parent, isMain, options);
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};
