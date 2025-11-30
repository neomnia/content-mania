/**
 * Service de routage des emails vers le bon provider
 */

import type {
  EmailMessage,
  EmailProvider,
  EmailSendResult,
  ProviderConnectionStatus,
} from '../types';
import { AwsSesProvider } from '../providers/aws-ses/provider';
import { ResendProvider } from '../providers/resend/provider';
import { ScalewayTemProvider } from '../providers/scaleway/provider';
import { emailConfigRepository } from '../repositories/config.repository';
import { emailLogger } from '../utils/logger';
import type { IEmailProvider } from '../providers/base/interface';

export class EmailRouterService {
  private providers: Map<EmailProvider, IEmailProvider> = new Map();
  private initialized: boolean = false;

  /**
   * Initialiser tous les providers configurés
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
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
          case 'aws-ses':
            if (config.awsSes) {
              provider = new AwsSesProvider();
              await provider.initialize(config.awsSes);
            }
            break;

          case 'resend':
            if (config.resend) {
              provider = new ResendProvider();
              await provider.initialize(config.resend);
            }
            break;

          case 'scaleway-tem':
            if (config.scalewayTem) {
              provider = new ScalewayTemProvider();
              await provider.initialize(config.scalewayTem);
            }
            break;
        }

        if (provider) {
          this.providers.set(config.provider, provider);
          emailLogger.info(`Provider ${config.provider} initialized`, config.provider);
        }
      }

      this.initialized = true;
      emailLogger.info(`Email router initialized with ${this.providers.size} providers`);
    } catch (error: any) {
      emailLogger.error('Failed to initialize email router', error);
      throw error;
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
        throw new Error('No email provider available');
      }
    }

    emailLogger.info(`Sending email via ${provider.providerName}`, provider.providerName);

    return await provider.sendEmail(message);
  }

  /**
   * Envoyer un email avec fallback automatique
   */
  async sendWithFallback(message: EmailMessage): Promise<EmailSendResult> {
    await this.initialize();

    const providers = Array.from(this.providers.values());
    if (providers.length === 0) {
      throw new Error('No email providers available');
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
      provider: providers[0]?.providerName || ('resend' as EmailProvider),
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
