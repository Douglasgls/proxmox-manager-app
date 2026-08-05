import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema } from '@/utils/validation';
import type { RegisterInput } from '@/utils/validation';
import { userApi } from '@/api/modules/userApi';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { UserPlus, Loader2, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/utils/constants';
import { extractErrorMessage } from '@/utils/error';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    setError(null);
    try {
      await userApi.registerUser({
        username: data.username,
        email: data.email,
        password: data.password,
        role: 'admin',
      });
      setIsSuccess(true);
    } catch (err: any) {
      const errorMessage = extractErrorMessage(err, 'Erro ao realizar cadastro');
      setError(errorMessage);
    }
  };

  useEffect(() => {
    if (!isSuccess) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate(ROUTES.LOGIN);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSuccess, navigate]);

  return (
    <Card className="border-border/60 shadow-lg animate-in fade-in duration-300">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-primary/10 p-3 text-primary">
            {isSuccess ? (
              <CheckCircle2 className="size-8 text-green-500 animate-bounce" />
            ) : (
              <UserPlus className="size-8" />
            )}
          </div>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          {isSuccess ? 'Conta Criada com Sucesso!' : 'Criar Nova Conta'}
        </CardTitle>
        <CardDescription>
          {isSuccess
            ? 'Seu cadastro foi realizado com sucesso no sistema.'
            : 'Preencha as informações para registrar o seu usuário'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-4 space-y-4 text-center animate-in zoom-in-95 duration-300">
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 text-sm font-medium">
              Redirecionando para a tela de login em{' '}
              <span className="font-bold tabular-nums text-base">{countdown}</span> segundos...
            </div>
            <Button
              onClick={() => navigate(ROUTES.LOGIN)}
              className="w-full gap-2 mt-2"
            >
              Ir para o Login Agora
              <ArrowRight className="size-4" />
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-destructive rounded-lg bg-destructive/10 border border-destructive/20 animate-in fade-in duration-200">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase" htmlFor="username">
                Nome de Usuário
              </label>
              <input
                id="username"
                type="text"
                placeholder="ex: joao.silva"
                {...register('username')}
                className="w-full h-9 rounded-lg border border-border bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
              />
              {errors.username && (
                <p className="text-xs text-destructive mt-0.5">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase" htmlFor="email">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                placeholder="seu-email@exemplo.com"
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
              {errors.password && (
                <p className="text-xs text-destructive mt-0.5">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full gap-2 mt-4" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Finalizar Registro
            </Button>

            <div className="pt-2 text-center">
              <span className="text-xs text-muted-foreground">
                Já possui uma conta?{' '}
                <Link
                  to={ROUTES.LOGIN}
                  className="font-semibold text-primary hover:underline transition-colors"
                >
                  Fazer login
                </Link>
              </span>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default Register;
