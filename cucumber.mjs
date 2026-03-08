import { setWorldConstructor, World } from '@cucumber/cucumber';

// Configuração customizada para Cucumber
export default {
  default: {
    import: ['features/steps/*.steps.ts'],
    require: ['features/steps/*.steps.ts', 'features/support/*.ts'],
    loader: 'ts-node/esm',
    format: ['@cucumber/pretty-formatter'],
    formatOptions: {
      snippetInterface: 'async-await',
    },
    publish: false,
    strict: true,
    forceExit: true,
    worldParameter: {
      // Configurações adicionais do world
    },
  },
};
