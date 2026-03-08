/**
 * Memory2Agent - Config Loader
 * Carrega configurações de arquivos JSON, JS ou TS
 */

import type { Memory2AgentFullConfig } from './types.js';
import { DEFAULT_CONFIG, mergeConfig, PRESETS } from './types.js';

/**
 * Opções para carregamento de configuração
 */
export interface ConfigLoaderOptions {
  /** Usar preset específico */
  preset?: keyof typeof PRESETS;
  /** Merge com config customizada */
  custom?: Partial<Memory2AgentFullConfig>;
  /** Path para arquivo de config (JSON) */
  configPath?: string;
  /** Validar configuração */
  validate: boolean;
}

/**
 * Resultado do carregamento de configuração
 */
export interface ConfigLoadResult {
  success: boolean;
  config: Memory2AgentFullConfig;
  errors?: string[];
  warnings?: string[];
}

/**
 * Valida uma configuração
 */
export function validateConfig(config: Memory2AgentFullConfig): string[] {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validar tree config
  if (config.tree.rootImportance < 0 || config.tree.rootImportance > 10) {
    errors.push('tree.rootImportance must be between 0 and 10');
  }

  // Validar encoder config
  if (config.encoder.maxKeywords < 1 || config.encoder.maxKeywords > 20) {
    warnings.push('encoder.maxKeywords should be between 1 and 20');
  }

  if (config.encoder.baseImportance < 0 || config.encoder.baseImportance > 10) {
    errors.push('encoder.baseImportance must be between 0 and 10');
  }

  // Validar router config
  if (config.router.maxSiblings < 1) {
    errors.push('router.maxSiblings must be at least 1');
  }

  // Validar retriever config
  if (config.retriever.maxResults < 1) {
    errors.push('retriever.maxResults must be at least 1');
  }

  if (config.retriever.maxDepth < 1) {
    errors.push('retriever.maxDepth must be at least 1');
  }

  if (config.retriever.minImportance < 0 || config.retriever.minImportance > 10) {
    errors.push('retriever.minImportance must be between 0 and 10');
  }

  // Validar compressor config
  if (config.compressor.minEvents < 1) {
    errors.push('compressor.minEvents must be at least 1');
  }

  if (config.compressor.maxEvents < config.compressor.minEvents) {
    errors.push('compressor.maxEvents must be >= compressor.minEvents');
  }

  // Validar global config
  if (config.global.autoCompressThreshold < 1) {
    errors.push('global.autoCompressThreshold must be at least 1');
  }

  if (config.global.autoSaveInterval < 1000) {
    warnings.push('global.autoSaveInterval should be at least 1000ms');
  }

  return [...errors, ...warnings];
}

/**
 * Carrega configuração de arquivo JSON
 */
export async function loadConfigFromJSON(path: string): Promise<Memory2AgentFullConfig> {
  // Em ambiente Node.js
  if (typeof process !== 'undefined' && process.versions?.node) {
    const fs = await import('fs/promises');
    const content = await fs.readFile(path, 'utf-8');
    return JSON.parse(content) as Memory2AgentFullConfig;
  }

  // Em ambiente browser, fetch
  const response = await fetch(path);
  return response.json() as Promise<Memory2AgentFullConfig>;
}

/**
 * Carrega configuração de um objeto JS/TS
 */
export async function loadConfigFromModule(path: string): Promise<Memory2AgentFullConfig> {
  // Em ambiente Node.js
  if (typeof process !== 'undefined' && process.versions?.node) {
    const module = await import(path);
    return module.default || module.config as Memory2AgentFullConfig;
  }

  throw new Error('loadConfigFromModule is only supported in Node.js environment');
}

/**
 * Carrega e mergeia configurações
 */
export async function loadConfig(
  options: ConfigLoaderOptions = { validate: true }
): Promise<ConfigLoadResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    let config: Memory2AgentFullConfig = { ...DEFAULT_CONFIG };

    // 1. Aplicar preset se especificado
    if (options.preset) {
      const preset = PRESETS[options.preset];
      if (preset) {
        config = mergeConfig(config, preset);
      } else {
        errors.push(`Unknown preset: ${options.preset}`);
      }
    }

    // 2. Carregar de arquivo se especificado
    if (options.configPath) {
      try {
        const fileConfig = await loadConfigFromJSON(options.configPath);
        config = mergeConfig(config, fileConfig);
      } catch (error) {
        errors.push(`Failed to load config from ${options.configPath}: ${error}`);
      }
    }

    // 3. Aplicar config customizada
    if (options.custom) {
      config = mergeConfig(config, options.custom);
    }

    // 4. Validar configuração
    if (options.validate) {
      const validation = validateConfig(config);
      for (const message of validation) {
        if (message.includes('must') || message.includes('should be')) {
          errors.push(message);
        } else {
          warnings.push(message);
        }
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        config,
        errors,
        warnings,
      };
    }

    return {
      success: true,
      config,
      warnings,
    };
  } catch (error) {
    errors.push(`Unexpected error loading config: ${error}`);
    return {
      success: false,
      config: DEFAULT_CONFIG,
      errors,
    };
  }
}

/**
 * Cria configuração rápida com overrides
 */
export function createConfig(
  overrides: Partial<Memory2AgentFullConfig>
): Memory2AgentFullConfig {
  return mergeConfig(DEFAULT_CONFIG, overrides);
}

/**
 * Exporta configuração para JSON
 */
export function configToJSON(config: Memory2AgentFullConfig): string {
  return JSON.stringify(config, null, 2);
}

/**
 * Salva configuração em arquivo JSON
 */
export async function saveConfigToJSON(
  config: Memory2AgentFullConfig,
  path: string
): Promise<void> {
  if (typeof process !== 'undefined' && process.versions?.node) {
    const fs = await import('fs/promises');
    await fs.writeFile(path, configToJSON(config), 'utf-8');
  } else {
    throw new Error('saveConfigToJSON is only supported in Node.js environment');
  }
}
