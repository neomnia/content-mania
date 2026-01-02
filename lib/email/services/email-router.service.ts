/**
 * Service de routage des emails vers le bon provider
 * Configuration centralisée via service_api_configs
 */

import type {
  EmailMessage,
  EmailProvider,
  EmailSendResult,
  ProviderConnectionStatus,
} from '../types';
import { ScalewayTemProvider } from '../providers/scaleway/provider';
import { emailConfigRepository } from '../repositories/config.repository';
import { emailLogger } from '../utils/logger';
import { serviceApiRepository } from '@/lib/services/repository';
import type { IEmailProvider } from '../providers/base/interface';
import { logSystemEvent } from '@/app/actions/logs';

export class EmailRouterService {
  private providers: Map<EmailProvider, IEmailProvider> = new Map();
  private initialized: boolean = false;

  /**
   * Initialiser tous les providers configurés
   * NOTE: Seul Scaleway TEM est supporté actuellement
   */
  async initialize(): Promise<void> {
    // Si déjà initialisé avec des providers, on ne fait rien
    if (this.initialized && this.providers.size > 0) {
      return;
    }

    try {
      const configs = await emailConfigRepository.getAllConfigs();

      for (const config of configs) {
        if (!config.isActive) {
          continue;
        }

        let provider: IEmailProvider | null = null;

        switch (config.provider) {
          case 'scaleway-tem':
            if (config.scalewayTem) {
              provider = new ScalewayTemProvider();
              await provider.initialize(config.scalewayTem);

              // Logger l'utilisation API dans service_api_usage
              await this.logProviderInitialization('scaleway', 'production');
            }
            break;

          default:
            emailLogger.warn(`Unsupported provider: ${config.provider}. Only Scaleway TEM is supported.`);
        }

        if (provider) {
          this.providers.set(config.provider, provider);
          emailLogger.info(`Provider ${config.provider} initialized`, config.provider);
        }
      }

      this.initialized = true;
      emailLogger.info(`Email router initialized with ${this.providers.size} provider(s)`);

      if (this.providers.size === 0) {
        emailLogger.warn('No email providers configured. Please configure Scaleway TEM via /admin/api');
      }
    } catch (error: any) {
      emailLogger.error('Failed to initialize email router', error);
      throw error;
    }
  }

  /**
   * Logger l'initialisation d'un provider dans service_api_usage
   */
  private async logProviderInitialization(serviceName: string, environment: string): Promise<void> {
    try {
      const config = await serviceApiRepository.getConfig(serviceName as any, environment as any);
      if (config && (config as any).id) {
        await serviceApiRepository.trackUsage({
          configId: (config as any).id,
          serviceName: serviceName as any,
          operation: 'email_provider_init',
          status: 'success',
          responseTime: 0,
        });
      }
    } catch (error) {
      // Silent fail, logging ne doit pas bloquer l'initialisation
      console.error('Failed to log provider initialization:', error);
    }
  }

  /**
   * Envoyer un email avec un provider spécifique ou le provider par défaut
   */
  async sendEmail(
    message: EmailMessage,
    providerName?: EmailProvider
  ): Promise<EmailSendResult> {
    await this.initialize();

    let provider: IEmailProvider | undefined;

    if (providerName) {
      // Utiliser le provider spécifié
      provider = this.providers.get(providerName);
      if (!provider) {
        emailLogger.warn(`Provider ${providerName} not found or not initialized`);
        throw new Error(`Provider ${providerName} is not available`);
      }
    } else {
      // Utiliser le provider par défaut
      const defaultConfig = await emailConfigRepository.getDefaultProvider();
      if (defaultConfig) {
        provider = this.providers.get(defaultConfig.provider);
      }

      if (!provider) {
        // Utiliser le premier provider disponible
        provider = this.providers.values().next().value;
      }

      if (!provider) {
        throw new Error('No email provider available. Please configure Scaleway TEM via /admin/api');
      }
    }

    // Ensure 'from' field is set
    if (!message.from) {
        message.from = 'no-reply@neosaas.tech'; // Default fallback
        message.fromName = 'NeoSaaS Platform';
    }

    emailLogger.info(`Sending email via ${provider.providerName}`, provider.providerName, {
      to: message.to,
      from: message.from,
      subject: message.subject,
      hasHtml: !!message.htmlContent,
      hasText: !!message.textContent
    });

    const result = await provider.sendEmail(message);

    // Logger l'envoi dans service_api_usage
    await this.logEmailSend(provider.providerName, result);

    return result;
  }

  /**
   * Logger un envoi d'email dans service_api_usage
   */
  private async logEmailSend(providerName: EmailProvider, result: EmailSendResult): Promise<void> {
    try {
      const config = await serviceApiRepository.getConfig('scaleway', 'production');
      if (config && (config as any).id) {
        await serviceApiRepository.trackUsage({
          configId: (config as any).id,
          serviceName: 'scaleway',
          operation: 'send_email',
          status: result.success ? 'success' : 'failed',
          errorMessage: result.error,
          responseTime: 0, // À améliorer avec un timestamp
        });
      }

      // Log to system_logs
      await logSystemEvent({
        category: 'email',
        level: result.success ? 'info' : 'error',
        message: result.success 
          ? `Email sent successfully via ${providerName}` 
          : `Failed to send email via ${providerName}: ${result.error}`,
        metadata: {
          provider: providerName,
          messageId: result.messageId,
          error: result.error
        }
      });
    } catch (error) {
      // Silent fail
      console.error('Failed to log email send:', error);
    }
  }

  /**
   * Envoyer un email avec fallback automatique
   * NOTE: Actuellement, seul Scaleway TEM est configuré, pas de fallback
   */
  async sendWithFallback(message: EmailMessage): Promise<EmailSendResult> {
    await this.initialize();

    const providers = Array.from(this.providers.values());
    if (providers.length === 0) {
      throw new Error('No email providers available. Please configure Scaleway TEM via /admin/api');
    }

    // Trier les providers pour mettre le provider par défaut en premier
    const defaultConfig = await emailConfigRepository.getDefaultProvider();
    if (defaultConfig) {
      const defaultIndex = providers.findIndex(
        (p) => p.providerName === defaultConfig.provider
      );
      if (defaultIndex > 0) {
        const defaultProvider = providers.splice(defaultIndex, 1)[0];
        providers.unshift(defaultProvider);
      }
    }

    let lastError: Error | undefined;

    for (const provider of providers) {
      try {
        emailLogger.info(`Attempting to send via ${provider.providerName}`, provider.providerName);
        const result = await provider.sendEmail(message);

        if (result.success) {
          emailLogger.info(`Email sent successfully via ${provider.providerName}`, provider.providerName);
          await this.logEmailSend(provider.providerName, result);
          return result;
        }

        lastError = new Error(result.error || 'Unknown error');
      } catch (error: any) {
        emailLogger.error(`Failed to send via ${provider.providerName}`, error, provider.providerName);
        lastError = error;
        continue;
      }
    }

    emailLogger.error('All providers failed', lastError);

    return {
      success: false,
      provider: providers[0]?.providerName || ('scaleway-tem' as EmailProvider),
      error: lastError?.message || 'All providers failed',
    };
  }

  /**
   * Tester la connexion de tous les providers
   */
  async testAllConnections(): Promise<Map<EmailProvider, ProviderConnectionStatus>> {
    await this.initialize();

    const results = new Map<EmailProvider, ProviderConnectionStatus>();

    for (const [providerName, provider] of this.providers) {
      try {
        const status = await provider.testConnection();
        results.set(providerName, status);
      } catch (error: any) {
        results.set(providerName, {
          provider: providerName,
          isConnected: false,
          lastChecked: new Date(),
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Obtenir la liste des providers disponibles
   */
  getAvailableProviders(): EmailProvider[] {
    return Array.from(this.providers.keys());
  }
}

// Export singleton
export const emailRouter = new EmailRouterService();
