import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@/utils/validation';
import type { LoginInput } from '@/utils/validation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Server, Loader2, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);


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
      // Chama o login do AuthProvider. Se for bem sucedido, o layout redirecionará
      await login(data.email, data.password);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || "Erro ao realizar login";
      setError(errorMessage);
      console.log("Erro capturado no catch:", errorMessage);
    }
  };

  return (
    <Card className="border-border/60 shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-primary/10 p-3 text-primary">
            <Server className="size-8" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Proxmox Manager</CardTitle>
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
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              className="w-full h-9 rounded-lg border border-border bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
            />
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
        </form>
      </CardContent>
    </Card>
  );
};
export default Login;
