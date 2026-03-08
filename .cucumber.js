/**
 * Configuração do Cucumber para testes BDD
 */
export default {
  default: {
    requireModule: ['ts-node/register'],
    require: [
      'features/steps/register.ts'
    ],
    format: ['@cucumber/pretty-formatter'],
    formatOptions: {
      snippetInterface: 'async-await',
      colors: true,
    },
    publish: false,
    strict: true,
    forceExit: true,
    parallel: 1,
  },
};
