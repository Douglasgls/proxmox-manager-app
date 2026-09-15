import { cloudApi } from '@/api/modules/cloudApi';
import type { CloudStatusResponse, CloudDetailsResponse, CloudActionResponse, CloudUnlinkResponse } from '@/api/modules/cloudApi';

export class CloudConnectionService {
  /**
   * Obtém o status atual da integração com a Cloud.
   */
  public static async getStatus(): Promise<CloudStatusResponse> {
    return await cloudApi.getStatus();
  }

  /**
   * Obtém os detalhes completos da integração Cloud e nós VPN sincronizados.
   */
  public static async getDetails(): Promise<CloudDetailsResponse> {
    return await cloudApi.getDetails();
  }

  /**
   * Registra o Environment Token na Cloud.
   */
  public static async registerEnvironment(token: string): Promise<CloudActionResponse> {
    if (!token || token.trim() === '') {
      throw new Error('O Environment Token é obrigatório.');
    }
    return await cloudApi.registerEnvironment(token.trim());
  }

  /**
   * Força a tentativa de reconexão do Agent com a Cloud.
   */
  public static async reconnect(): Promise<CloudActionResponse> {
    return await cloudApi.reconnect();
  }

  /**
   * Desvincula o Agent da Cloud.
   * Nunca enviar force=true de primeira — use apenas como medida de recuperação após um erro 400.
   * @param force - Se true, força o desvínculo local mesmo com falha na Cloud remota.
   */
  public static async unlink(force?: boolean): Promise<CloudUnlinkResponse> {
    return await cloudApi.unlinkFromCloud(force);
  }
}
