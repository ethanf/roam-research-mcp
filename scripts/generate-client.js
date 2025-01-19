import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const generate = () => {
  const inputSpec = resolve(__dirname, '../src/api/openapi.yaml');
  const outputDir = resolve(__dirname, '../src/generated');

  execSync(
    `npx @openapitools/openapi-generator-cli generate -i ${inputSpec} -g typescript-axios -o ${outputDir} --additional-properties=supportsES6=true`
  );
};

generate(); 