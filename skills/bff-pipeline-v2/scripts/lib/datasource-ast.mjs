import fs from 'node:fs';

import { createCheck } from './result.mjs';
import { extractExportedClassName, resolveDataSourcesIndexPath } from './datasource-path.mjs';

const HTTP_VERBS = new Set(['get', 'post', 'put', 'delete', 'patch']);

export function extractMethodBody(source, methodName) {
  const methodRe = new RegExp(`async\\s+${methodName}\\s*\\([^)]*\\)\\s*\\{`, 'm');
  const match = methodRe.exec(source);

  if (!match) {
    return null;
  }

  let depth = 1;
  let index = match.index + match[0].length;

  while (index < source.length && depth > 0) {
    const char = source[index];

    if (char === '{') {
      depth += 1;
    }

    if (char === '}') {
      depth -= 1;
    }

    index += 1;
  }

  return source.slice(match.index, index);
}

export function checkMethodExists(source, methodName) {
  const body = extractMethodBody(source, methodName);

  if (!body) {
    return createCheck(
      'datasource-method',
      false,
      `async method "${methodName}" not found in datasource class`
    );
  }

  return createCheck('datasource-method', true, methodName);
}

export function checkHttpCall(methodBody, httpMethod, endpoint) {
  const verb = httpMethod.toLowerCase();

  if (!HTTP_VERBS.has(verb)) {
    return createCheck('http-call', false, `unsupported httpMethod: ${httpMethod}`);
  }

  const verbIndex = methodBody.search(new RegExp(`this\\.${verb}\\b`, 'i'));

  if (verbIndex === -1) {
    return createCheck(
      'http-call',
      false,
      `expected this.${verb}() call with endpoint "${endpoint}"`
    );
  }

  const afterVerb = methodBody.slice(verbIndex);
  const parenIndex = afterVerb.indexOf('(');

  if (parenIndex === -1) {
    return createCheck(
      'http-call',
      false,
      `expected this.${verb}() call with endpoint "${endpoint}"`
    );
  }

  const endpointMatch = afterVerb.slice(parenIndex).match(/['"`]([^'"`]+)['"`]/);

  if (!endpointMatch) {
    return createCheck(
      'http-call',
      false,
      `expected this.${verb}() call with endpoint "${endpoint}"`
    );
  }

  const actualEndpoint = endpointMatch[1];

  if (actualEndpoint !== endpoint) {
    return createCheck(
      'http-call',
      false,
      `endpoint mismatch: expected "${endpoint}", got "${actualEndpoint}"`
    );
  }

  return createCheck('http-call', true, `${verb.toUpperCase()} ${endpoint}`);
}

export function checkApiSchemaTypes(source, methodBody, apiResponseType) {
  const hasApiSchemaImport =
    /from\s+['"]@realt-by\/api-schema(?:\/[^'"]+)?['"]/.test(source) ||
    /from\s+['"]@realt-by\/api-schema['"]/.test(source);

  if (!hasApiSchemaImport) {
    return createCheck(
      'api-schema-types',
      false,
      'datasource must import types from @realt-by/api-schema'
    );
  }

  const localTypeRe = new RegExp(
    `(?:interface|type)\\s+${apiResponseType}\\b`,
    'm'
  );

  if (localTypeRe.test(source)) {
    return createCheck(
      'api-schema-types',
      false,
      `local type "${apiResponseType}" is forbidden; use @realt-by/api-schema`
    );
  }

  const usesApiType =
    methodBody.includes(apiResponseType) ||
    new RegExp(`ResponseShape\\s*<[^>]*\\b${apiResponseType}\\b`).test(methodBody);

  if (!usesApiType) {
    return createCheck(
      'api-schema-types',
      false,
      `method must reference api type "${apiResponseType}" from @realt-by/api-schema`
    );
  }

  return createCheck('api-schema-types', true, apiResponseType);
}

export function checkErrorHandling(methodBody) {
  const hasSuccessGuard = /!response\.success/.test(methodBody);
  const throwsApiError = /throw\s+new\s+ApiDataSourceError\s*\(\s*response\.errors\s*\)/.test(
    methodBody
  );

  if (!hasSuccessGuard || !throwsApiError) {
    return createCheck(
      'error-handling',
      false,
      'method must guard response.success and throw new ApiDataSourceError(response.errors)'
    );
  }

  return createCheck('error-handling', true, 'ApiDataSourceError on !response.success');
}

export function checkServiceRegistration(bffRoot, source, manifest) {
  if (!manifest.newService) {
    return createCheck('service-registration', true, 'existing service — registration skipped');
  }

  const className = extractExportedClassName(source);

  if (!className) {
    return createCheck('service-registration', false, 'export class not found in datasource file');
  }

  const { absPath, relPath } = resolveDataSourcesIndexPath(bffRoot);

  if (!fs.existsSync(absPath)) {
    return createCheck('service-registration', false, `data sources index not found: ${relPath}`);
  }

  const indexSource = fs.readFileSync(absPath, 'utf8');
  const dataSourceKey = manifest.dataSourceKey;

  if (!dataSourceKey) {
    return createCheck(
      'service-registration',
      false,
      'manifest.dataSourceKey required when newService is true'
    );
  }

  const importsClass = new RegExp(`import\\s*\\{[^}]*\\b${className}\\b[^}]*\\}`).test(
    indexSource
  );
  const registersClass = new RegExp(
    `${dataSourceKey}\\s*:\\s*new\\s+${className}\\s*\\(`
  ).test(indexSource);

  if (!importsClass || !registersClass) {
    return createCheck(
      'service-registration',
      false,
      `${className} must be imported and registered as ${dataSourceKey} in src/data-sources/index.ts`
    );
  }

  return createCheck('service-registration', true, `${dataSourceKey}: new ${className}()`);
}

export function runDataSourceAstChecks(bffRoot, source, manifest) {
  const methodCheck = checkMethodExists(source, manifest.datasourceMethod);
  const methodBody = methodCheck.passed
    ? extractMethodBody(source, manifest.datasourceMethod)
    : '';

  const httpCheck = methodCheck.passed
    ? checkHttpCall(methodBody, manifest.httpMethod, manifest.endpoint)
    : createCheck(
        'http-call',
        false,
        `cannot verify HTTP call: method "${manifest.datasourceMethod}" not found`
      );

  const errorCheck = methodCheck.passed
    ? checkErrorHandling(methodBody)
    : createCheck(
        'error-handling',
        false,
        `cannot verify error handling: method "${manifest.datasourceMethod}" not found`
      );

  return [
    methodCheck,
    httpCheck,
    checkApiSchemaTypes(source, methodBody, manifest.apiResponseType),
    errorCheck,
    checkServiceRegistration(bffRoot, source, manifest),
  ];
}
