/**
 * Cucumber Runtime Setup
 * Registra todos os steps antes de executar
 */

// Importa world primeiro
import './support/index.js';

// Importa todos os steps explicitamente
import './steps/store-events.steps.js';
import './steps/query-retrieval.steps.js';
import './steps/context-building.steps.js';
import './steps/config.steps.js';
import './steps/compression.steps.js';
