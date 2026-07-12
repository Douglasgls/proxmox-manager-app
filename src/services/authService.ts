export interface JwtPayload {
  exp: number;
  iat: number;
  sub: string; // user id
  email: string;
  role: 'admin' | 'user' | 'readonly';
  name: string;
}

export const authService = {
  /**
   * Decodifica de forma segura a payload de um token JWT (sem validar a assinatura, feito pelo backend).
   */
  decodeToken: (token: string): JwtPayload | null => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const decodedPayload = window.atob(payloadBase64);
      return JSON.parse(decodedPayload) as JwtPayload;
    } catch (error) {
      console.error('[AuthService] Error decoding token', error);
      return null;
    }
  },

  /**
   * Verifica se o token JWT já expirou ou está prestes a expirar (menos de 60 segundos).
   */
  isTokenExpired: (token: string): boolean => {
    const payload = authService.decodeToken(token);
    if (!payload) return true;

    const currentTime = Math.floor(Date.now() / 1000);
    // Margem de segurança de 60 segundos
    return payload.exp - currentTime < 60;
  },

  /**
   * Verifica se o usuário tem o nível de permissão necessário.
   */
  hasPermission: (userRole: string, requiredRole: 'admin' | 'user' | 'readonly'): boolean => {
    const rolesOrder = {
      readonly: 1,
      user: 2,
      admin: 3,
    };

    const userWeight = rolesOrder[userRole as keyof typeof rolesOrder] || 0;
    const requiredWeight = rolesOrder[requiredRole] || 0;

    return userWeight >= requiredWeight;
  },
};
