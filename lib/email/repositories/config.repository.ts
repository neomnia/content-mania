/**
 * Repository pour gérer les configurations des fournisseurs d'email avec Drizzle
 */

import { eq, not } from 'drizzle-orm';
import { db } from '@/db';
import { emailProviderConfigs } from '@/db/schema';
import type { EmailProvider, EmailProviderConfig } from '../types';
import { encrypt, decrypt } from '../utils/encryption';

export class EmailConfigRepository {
  /**
   * Sauvegarder ou mettre à jour la configuration d'un fournisseur
   */
  async saveConfig(config: EmailProviderConfig): Promise<void> {
    try {
      // Chiffrer les credentials
      const credentials = JSON.stringify(
        config.awsSes || config.resend || config.scalewayTem || {}
      );
      const encryptedCredentials = await encrypt(credentials);

      // Préparer les données
      const configData = {
        provider: config.provider as string,
        isActive: config.isActive,
        isDefault: config.isDefault,
        config: { encrypted: encryptedCredentials } as any,
        updatedAt: new Date(),
      };

      // Vérifier si existe déjà
      const existing = await db
        .select()
        .from(emailProviderConfigs)
        .where(eq(emailProviderConfigs.provider, config.provider as string))
        .limit(1);

      if (existing.length > 0) {
        // Update
        await db
          .update(emailProviderConfigs)
          .set(configData)
          .where(eq(emailProviderConfigs.provider, config.provider as string));
      } else {
        // Insert
        await db.insert(emailProviderConfigs).values({
          ...configData,
          createdAt: new Date(),
        });
      }

      // Si défini comme défaut, désactiver les autres
      if (config.isDefault) {
        await db
          .update(emailProviderConfigs)
          .set({ isDefault: false })
          .where(not(eq(emailProviderConfigs.provider, config.provider as string)));
      }
    } catch (error) {
      console.error('Failed to save email config:', error);
      throw error;
    }
  }

  /**
   * Récupérer la configuration d'un fournisseur
   */
  async getConfig(provider: EmailProvider): Promise<EmailProviderConfig | null> {
    try {
      const result = await db
        .select()
        .from(emailProviderConfigs)
        .where(eq(emailProviderConfigs.provider, provider as string))
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      const config = result[0];

      // Déchiffrer les credentials
      const encryptedCredentials = (config.config as any)?.encrypted || '';
      if (!encryptedCredentials) {
        return null;
      }

      const decryptedCredentials = await decrypt(encryptedCredentials);
      const credentials = JSON.parse(decryptedCredentials);

      // Reconstituer la config
      const providerConfig: EmailProviderConfig = {
        provider: config.provider as EmailProvider,
        isActive: config.isActive,
        isDefault: config.isDefault,
      };

      // Ajouter les credentials selon le provider
      if (provider === 'aws-ses') {
        providerConfig.awsSes = credentials;
      } else if (provider === 'resend') {
        providerConfig.resend = credentials;
      } else if (provider === 'scaleway-tem') {
        providerConfig.scalewayTem = credentials;
      }

      return providerConfig;
    } catch (error) {
      console.error('Failed to get email config:', error);
      return null;
    }
  }

  /**
   * Récupérer toutes les configurations actives
   */
  async getAllConfigs(): Promise<EmailProviderConfig[]> {
    try {
      const configs = await db.select().from(emailProviderConfigs);
      const result: EmailProviderConfig[] = [];

      for (const config of configs) {
        const encryptedCredentials = (config.config as any)?.encrypted || '';
        if (!encryptedCredentials) continue;

        const decryptedCredentials = await decrypt(encryptedCredentials);
        const credentials = JSON.parse(decryptedCredentials);

        const providerConfig: EmailProviderConfig = {
          provider: config.provider as EmailProvider,
          isActive: config.isActive,
          isDefault: config.isDefault,
        };

        if (config.provider === 'aws-ses') {
          providerConfig.awsSes = credentials;
        } else if (config.provider === 'resend') {
          providerConfig.resend = credentials;
        } else if (config.provider === 'scaleway-tem') {
          providerConfig.scalewayTem = credentials;
        }

        result.push(providerConfig);
      }

      return result;
    } catch (error) {
      console.error('Failed to get all email configs:', error);
      return [];
    }
  }

  /**
   * Obtenir le fournisseur par défaut
   */
  async getDefaultProvider(): Promise<EmailProviderConfig | null> {
    try {
      const result = await db
        .select()
        .from(emailProviderConfigs)
        .where(eq(emailProviderConfigs.isDefault, true))
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      const config = result[0];
      const encryptedCredentials = (config.config as any)?.encrypted || '';
      if (!encryptedCredentials) {
        return null;
      }

      const decryptedCredentials = await decrypt(encryptedCredentials);
      const credentials = JSON.parse(decryptedCredentials);

      const providerConfig: EmailProviderConfig = {
        provider: config.provider as EmailProvider,
        isActive: config.isActive,
        isDefault: config.isDefault,
      };

      if (config.provider === 'aws-ses') {
        providerConfig.awsSes = credentials;
      } else if (config.provider === 'resend') {
        providerConfig.resend = credentials;
      } else if (config.provider === 'scaleway-tem') {
        providerConfig.scalewayTem = credentials;
      }

      return providerConfig;
    } catch (error) {
      console.error('Failed to get default provider:', error);
      return null;
    }
  }

  /**
   * Supprimer la configuration d'un fournisseur
   */
  async deleteConfig(provider: EmailProvider): Promise<void> {
    try {
      await db
        .delete(emailProviderConfigs)
        .where(eq(emailProviderConfigs.provider, provider as string));
    } catch (error) {
      console.error('Failed to delete email config:', error);
      throw error;
    }
  }
}

// Export singleton
export const emailConfigRepository = new EmailConfigRepository();
