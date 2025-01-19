import { execSync } from 'child_process';
import path from 'path';

const generate = () => {
  const inputSpec = path.resolve('src/api/openapi.yaml');
  const outputDir = path.resolve('src/generated');

  // Define all generator options
  const additionalProperties = {
    supportsES6: true,
    modelPropertyNaming: 'original',
    npmVersion: '8.19.4',
    platform: 'node',
    useObjectParameters: true,
    target: 'ES2022',
    moduleSystem: 'node16',
    useSingleRequestParameter: true,
    withSeparateModelsAndApi: true,
    apiPackage: 'api',
    modelPackage: 'models'
  };

  const propsString = Object.entries(additionalProperties)
    .map(([key, value]) => `${key}=${value}`)
    .join(',');

  execSync(
    `openapi-generator-cli generate -i ${inputSpec} -g typescript-axios -o ${outputDir} --additional-properties=${propsString}`
  );

  // After generation, fix the import paths to include .js extensions
  const fixImportPaths = `
    find ${outputDir} -name "*.ts" -exec sed -i '' 's/from '\\''\\.\\/\\([^'\'']\\+\\)'\\'/from '\\''\\.\\/\\1.js'\\'/g' {} +
  `;
  
  try {
    execSync(fixImportPaths, { stdio: 'inherit' });
  } catch (error) {
    console.error('Error fixing import paths:', error);
  }
};

generate(); 