import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@/utils/validation';
import type { LoginInput } from '@/utils/validation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardDescription, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/utils/constants';
import { extractErrorMessage } from '@/utils/error';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setError(null);
    try {
      // Chama o login do AuthProvider passando email, senha e a opção de persistência
      await login(data.email, data.password, Boolean(data.rememberMe));
    } catch (err: any) {
      const errorMessage = extractErrorMessage(err, 'Erro ao realizar login');
      setError(errorMessage);
      console.log('Erro capturado no catch:', errorMessage);
    }
  };

  return (
    <Card className="border-border/60 shadow-lg">
      <CardHeader className="space-y-2 text-center">
        <div className="flex justify-center mb-2">
          <img
            src="/logoPMTCC/proxmanager-logo-on-dark.svg"
            alt="ProxManager"
            className="h-10 w-auto hidden dark:block"
          />
          <img
            src="/logoPMTCC/proxmanager-logo-on-light.svg"
            alt="ProxManager"
            className="h-10 w-auto dark:hidden"
          />
        </div>
        <CardDescription>
          Acesse a plataforma de gerenciamento do TCC
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-destructive rounded-lg bg-destructive/10 border border-destructive/20 animate-in fade-in duration-200">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              placeholder="seu-usuario@email.com"
              {...register('email')}
              className="w-full h-9 rounded-lg border border-border bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
            />
            {errors.email && (
              <p className="text-xs text-destructive mt-0.5">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase" htmlFor="password">
              Senha
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('password')}
                className="w-full h-9 rounded-lg border border-border bg-background pl-3 pr-10 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded focus:outline-none"
                title={showPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive mt-0.5">{errors.password.message}</p>
            )}
            {errors.root && (
              <p className="text-xs text-destructive mt-0.5">{errors.root.message}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              id="rememberMe"
              type="checkbox"
              {...register('rememberMe')}
              className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="rememberMe" className="text-sm text-muted-foreground font-medium select-none cursor-pointer">
              Lembrar-me neste dispositivo
            </label>
          </div>

          <Button type="submit" className="w-full gap-2 mt-4" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Entrar no Painel
          </Button>

          <div className="pt-2 text-center border-t border-border/40 mt-4">
            <span className="text-xs text-muted-foreground">
              Novo no Proxmox Manager?{' '}
              <Link
                to={ROUTES.REGISTER}
                className="font-semibold text-primary hover:underline transition-colors"
              >
                Criar nova conta
              </Link>
            </span>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
export default Login;
