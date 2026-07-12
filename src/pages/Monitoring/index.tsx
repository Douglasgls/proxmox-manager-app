import React from 'react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Activity, BellRing, TrendingUp } from 'lucide-react';

export const Monitoring: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Monitoramento em Tempo Real"
        description="Acompanhamento detalhado de performance do cluster (CPU, Memória, IO e Rede)."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-primary">
              <Activity className="size-5" />
              <CardTitle>Histórico de Performance</CardTitle>
            </div>
            <CardDescription>
              Placeholder: Gráficos de uso do cluster serão implementados na Sprint seguinte.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center border-2 border-dashed border-border rounded-lg m-6 mt-0">
            <div className="text-center text-muted-foreground">
              <TrendingUp className="size-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">Área reservada para Gráficos RRD (Line Charts)</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-primary">
              <BellRing className="size-5" />
              <CardTitle>Alertas Recentes</CardTitle>
            </div>
            <CardDescription>
              Acompanhamento de eventos críticos e alertas de consumo de recursos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 text-yellow-800 dark:text-yellow-400">
                <span className="font-semibold text-xs bg-yellow-100 dark:bg-yellow-900 px-2 py-0.5 rounded mt-0.5">AVISO</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">Uso alto de CPU no container "vm-ubuntu-k8s-master" (92%)</p>
                  <span className="text-xs opacity-75">Há 5 minutos • pve-node-01</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 text-green-800 dark:text-green-400">
                <span className="font-semibold text-xs bg-green-100 dark:bg-green-900 px-2 py-0.5 rounded mt-0.5">OK</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">Backup do container 100 concluído com sucesso</p>
                  <span className="text-xs opacity-75">Há 2 horas • pve-node-01</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
export default Monitoring;
