import React, { useEffect, useRef } from 'react';
import { Terminal as Xterm } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import 'xterm/css/xterm.css';

interface TerminalProps {
  onData: (data: string) => void;
  onResize: (cols: number, rows: number) => void;
  terminalRef: React.MutableRefObject<Xterm | null>;
}

export const Terminal: React.FC<TerminalProps> = ({
  onData,
  onResize,
  terminalRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Configurações do xterm.js
    const term = new Xterm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      theme: {
        background: '#0c0f12',
        foreground: '#e2e8f0',
        cursor: '#38bdf8',
        selectionBackground: 'rgba(56, 189, 248, 0.3)',
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    // Renderiza o xterm no DOM
    term.open(containerRef.current);
    
    // Pequeno delay para garantir que o contêiner esteja com o tamanho renderizado
    const timeoutId = setTimeout(() => {
      try {
        fitAddon.fit();
        onResize(term.cols, term.rows);
      } catch (e) {
        console.warn('[Terminal] Erro no primeiro ajuste:', e);
      }
    }, 50);

    terminalRef.current = term;
    fitAddonRef.current = fitAddon;

    // Stream de dados digitados
    const dataSub = term.onData((data) => {
      onData(data);
    });

    // Stream de redimensionamento
    const resizeSub = term.onResize((event) => {
      onResize(event.cols, event.rows);
    });

    // Monitora resize do viewport
    const handleResize = () => {
      try {
        fitAddon.fit();
      } catch (e) {
        // Ignora erros temporários se o container não estiver visível
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      dataSub.dispose();
      resizeSub.dispose();
      term.dispose();
      terminalRef.current = null;
    };
  }, [onData, onResize, terminalRef]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full bg-[#0c0f12] p-3 overflow-hidden rounded-xl border border-border shadow-inner" 
    />
  );
};
export default Terminal;
