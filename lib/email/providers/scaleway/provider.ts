/**
 * Provider Scaleway TEM (Transactional Email) pour l'envoi d'emails
 * Documentation: https://www.scaleway.com/en/docs/managed-services/transactional-email/
 */

import { BaseEmailProvider } from '../base/interface';
import type {
  EmailMessage,
  EmailProvider,
  EmailSendResult,
  ProviderConnectionStatus,
  ScalewayTemConfig,
} from '../../types';
import { emailLogger } from '../../utils/logger';

export class ScalewayTemProvider extends BaseEmailProvider {
  readonly providerName: EmailProvider = 'scaleway-tem' as EmailProvider;
  private temConfig: ScalewayTemConfig | null = null;

  async initialize(config: ScalewayTemConfig): Promise<void> {
    await super.initialize(config);
    this.temConfig = config;

    if (!config.projectId || !config.secretKey) {
      throw new Error('Scaleway TEM requires projectId and secretKey');
    }

    emailLogger.info('Scaleway TEM provider initialized', this.providerName, {
      plan: config.plan || 'essential',
    });
  }

  async sendEmail(message: EmailMessage): Promise<EmailSendResult> {
    this.ensureInitialized();

    try {
      const to = this.normalizeRecipients(message.to);

      emailLogger.info(
        `Sending email via Scaleway TEM to ${to.join(', ')}`,
        this.providerName,
        { subject: message.subject }
      );

      // SIMULATION MODE - Remplacer par Scaleway TEM API
      // const apiUrl = this.temConfig!.apiUrl || 'https://api.scaleway.com/transactional-email/v1alpha1';
      //
      // const response = await fetch(`${apiUrl}/regions/{region}/emails`, {
      //   method: 'POST',
      //   headers: {
      //     'X-Auth-Token': this.temConfig!.secretKey,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     from: { email: message.from, name: message.fromName },
      //     to: to.map(email => ({ email })),
      //     subject: message.subject,
      //     html: message.htmlContent,
      //     text: message.textContent,
      //     project_id: this.temConfig!.projectId,
      //   }),
      // });
      //
      // const data = await response.json();

      // SIMULATION
      const messageId = `scaleway_tem_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      emailLogger.info(
        `Email sent successfully: ${messageId}`,
        this.providerName
      );

      return {
        success: true,
        messageId,
        provider: this.providerName,
        sentAt: new Date(),
      };
    } catch (error: any) {
      emailLogger.error('Failed to send email via Scaleway TEM', error, this.providerName);

      return {
        success: false,
        provider: this.providerName,
        error: error.message || 'Unknown error occurred',
      };
    }
  }

  async testConnection(): Promise<ProviderConnectionStatus> {
    try {
      // SIMULATION MODE
      // Test de connexion avec l'API Scaleway TEM

      return {
        provider: this.providerName,
        isConnected: true,
        lastChecked: new Date(),
        details: {
          quotas: {
            sent24h: 5,
            max24h: this.temConfig?.plan === 'scale' ? 100000 : 1000,
          },
        },
      };
    } catch (error: any) {
      return {
        provider: this.providerName,
        isConnected: false,
        lastChecked: new Date(),
        error: error.message,
      };
    }
  }
}
