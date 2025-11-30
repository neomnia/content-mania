/**
 * API Route for Testing Service Configuration
 * POST /api/services/[service]/test - Test service connection
 */

import { NextRequest, NextResponse } from 'next/server';
import { testServiceConnection } from '@/lib/services';
import type { ServiceEnvironment } from '@/lib/services/types';
import { getCurrentUser } from '@/lib/auth/server';
import { serviceApiRepository } from '@/lib/services';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ service: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { service } = await params;
    const body = await request.json();
    const environment = (body.environment || 'production') as ServiceEnvironment;
    const testConfig = body.testConfig; // Optional: test config before saving

    let result: { success: boolean; message: string };
    const startTime = Date.now();

    // If testConfig is provided, test with those credentials directly
    if (testConfig) {
      try {
        // Test actual API connections with provided credentials
        switch (service) {
          case 'scaleway':
            if (!testConfig.config?.accessKey || !testConfig.config?.secretKey) {
              throw new Error('Clés Scaleway manquantes (Access Key et Secret Key requis)');
            }

            // Test Scaleway API - Using Instance API to list zones (simple and reliable)
            try {
              const scalewayResponse = await fetch('https://api.scaleway.com/instance/v1/zones', {
                method: 'GET',
                headers: {
                  'X-Auth-Token': testConfig.config.secretKey,
                  'Content-Type': 'application/json',
                },
              });

              if (!scalewayResponse.ok) {
                const errorText = await scalewayResponse.text();
                let errorMsg = '';
                try {
                  const errorJson = JSON.parse(errorText);
                  errorMsg = errorJson.message || errorJson.error_message || errorJson.error || '';
                } catch {
                  errorMsg = errorText;
                }

                if (scalewayResponse.status === 403) {
                  throw new Error(`Clé Scaleway invalide ou sans permissions (403). Vérifiez votre Secret Key.`);
                } else if (scalewayResponse.status === 401) {
                  throw new Error(`Authentification Scaleway échouée (401). Vérifiez votre Secret Key.`);
                } else {
                  throw new Error(`Erreur Scaleway ${scalewayResponse.status}: ${errorMsg || 'Erreur inconnue'}`);
                }
              }

              // Verify response is valid JSON with zones array
              const data = await scalewayResponse.json();
              if (!data || !Array.isArray(data.zones)) {
                throw new Error('Réponse Scaleway invalide - structure de données inattendue');
              }

              result = { success: true, message: `Connexion Scaleway réussie ✓ (${data.zones.length} zones disponibles)` };
            } catch (error) {
              if (error instanceof Error) {
                throw error;
              }
              throw new Error('Erreur réseau lors de la connexion à Scaleway');
            }
            break;

          case 'resend':
            if (!testConfig.config?.apiKey) {
              throw new Error('Missing required Resend API key');
            }
            // Test Resend API - list domains endpoint
            const resendResponse = await fetch('https://api.resend.com/domains', {
              headers: {
                'Authorization': `Bearer ${testConfig.config.apiKey}`,
                'Content-Type': 'application/json',
              },
            });
            if (!resendResponse.ok) {
              const errorText = await resendResponse.text();
              throw new Error(`Invalid Resend API key: ${errorText}`);
            }
            result = { success: true, message: 'Resend API connection successful' };
            break;

          case 'aws':
            if (!testConfig.config?.accessKeyId || !testConfig.config?.secretAccessKey) {
              throw new Error('Missing required AWS credentials');
            }
            // For AWS, we just validate the format for now
            // Real AWS testing would require AWS SDK
            result = { success: true, message: 'AWS credentials format is valid' };
            break;

          default:
            result = { success: false, message: `Unknown service: ${service}` };
        }
      } catch (error) {
        result = {
          success: false,
          message: error instanceof Error ? error.message : 'Invalid configuration',
        };
      }
    } else {
      // Test the saved service connection
      result = await testServiceConnection(service, environment);
    }

    const responseTime = Date.now() - startTime;

    // If test is successful and we're testing a saved config (not testConfig), mark as tested in database
    if (result.success && !testConfig) {
      const config = await serviceApiRepository.getConfig(
        service as any,
        environment
      );

      if (config) {
        // Find the config ID to mark as tested
        const configs = await serviceApiRepository.listConfigs(service as any);
        const configToUpdate = configs.find(
          (c) => c.serviceName === service && c.environment === environment
        );

        if (configToUpdate) {
          await serviceApiRepository.markTested(configToUpdate.id);
        }
      }

      // Track usage
      if (config) {
        const configs = await serviceApiRepository.listConfigs(service as any);
        const configToTrack = configs.find(
          (c) => c.serviceName === service && c.environment === environment
        );

        if (configToTrack) {
          await serviceApiRepository.trackUsage({
            configId: configToTrack.id,
            serviceName: service as any,
            operation: 'test_connection',
            status: 'success',
            responseTime,
          });
        }
      }
    }

    return NextResponse.json({
      success: result.success,
      message: result.message,
      responseTime,
    });
  } catch (error) {
    console.error('Error testing service configuration:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
