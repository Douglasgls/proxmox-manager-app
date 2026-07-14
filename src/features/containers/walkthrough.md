# Walkthrough — Criação de Container LXC + Console Remoto em Tempo Real

## Resumo

Implementadas as funcionalidades completas de criação de containers LXC com um wizard multi-step modal, monitoramento de jobs em tempo real via WebSocket, e um console interativo em tempo real utilizando xterm.js conectado à API do terminal PTY. Toda a lógica foi dividida de forma organizada e limpa de acordo com responsabilidade única.

---

## Estrutura do Frontend para Console Remoto

Criados 5 novos arquivos organizados:

1. **`src/services/websocket/ConsoleSocket.ts`**
   - Encapsula a lógica de conexão WebSocket com `/api/console/{container_id}`.
   - Envia o token JWT como parâmetro de consulta (`?token=`).
   - Fornece métodos auxiliares `sendInput(data)` e `sendResize(cols, rows)`.

2. **`src/components/terminal/Terminal.tsx`**
   - Wrapper em torno do `xterm.js` com suporte a `FitAddon`.
   - Gerencia abertura do terminal, captura de inputs (`onData`) e eventos de resize (`onResize`).
   - Tema escuro e customizações de fonte e cursor.

3. **`src/pages/containers/console/useContainerConsole.ts`**
   - Hook de controle do console. Gerencia conexão, encerramento de canais, reconexões, redimensionamentos e escrita de outputs no xterm.
   - Tradução de códigos de encerramento da API (ex: `4004` indica container parado).

4. **`src/pages/containers/console/ContainerConsole.tsx`**
   - Página inteira do console remetendo à interface do Proxmox VE.
   - Exibe metadados do container (nome, ID e status) e botão "Reconnect".

5. **`src/pages/containers/console/index.tsx`**
   - Barrel file para re-export do componente.

---

## Rotas e Navegação

- Rota `/app/containers/:containerId/console` registrada com sucesso.
- Botão **Console** na tabela de containers (`ContainerTable.tsx`) habilitado. Ele redireciona o usuário para a página de console quando o container estiver em execução.
- Botão **Console** na página de detalhes do container (`ContainerDetailsPage.tsx`) integrado da mesma maneira.
