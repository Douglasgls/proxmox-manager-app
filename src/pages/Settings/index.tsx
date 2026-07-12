import React from 'react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Laptop, Shield } from 'lucide-react';

export const Settings: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações do Sistema"
        description="Ajuste preferências visuais e controle do painel de administração."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Preferências Visuais */}
        <Card>
          <CardHeader>
            <CardTitle>Preferências Visuais</CardTitle>
            <CardDescription>Altere o tema da aplicação e comportamento visual.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Tema Atual</label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('light')}
                  className="gap-2"
                >
                  <Sun className="size-4" />
                  Claro
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('dark')}
                  className="gap-2"
                >
                  <Moon className="size-4" />
                  Escuro
                </Button>
                <Button
                  variant={theme === 'system' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('system')}
                  className="gap-2"
                >
                  <Laptop className="size-4" />
                  Sistema
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações da Plataforma */}
        <Card>
          <CardHeader>
            <CardTitle>Segurança & API</CardTitle>
            <CardDescription>Informações de endpoint do backend e segurança.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                <Shield className="size-4" />
                <span>Backend Conectado</span>
              </div>
              <p className="text-xs font-mono text-muted-foreground mt-1 truncate">
                API URL: {import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}
              </p>
              <p className="text-xs font-mono text-muted-foreground truncate">
                WS URL: {import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws'}
              </p>
            </div>
            <div className="text-xs text-muted-foreground">
              Versão do Frontend: <span className="font-semibold text-foreground">0.1.0-alpha (TCC)</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
export default Settings;
