export function baseManifestSlice(manifest) {
  return {
    operation: manifest.operation,
    kind: manifest.kind,
    domain: manifest.domain,
    stack: manifest.stack,
  };
}

export function baseMeta(manifest) {
  return { stack: manifest.stack, operation: manifest.operation };
}
