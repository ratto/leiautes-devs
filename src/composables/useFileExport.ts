/**
 * Composable de exportação (ViewModel) — copiar e baixar o arquivo gerado.
 *
 * Usa apenas APIs nativas do navegador (Clipboard API e Blob/URL), conforme
 * o HLD: nenhum dado sai do navegador; o download é gerado em memória.
 */

import { useFileStore } from '@/stores/file-store';

export function useFileExport() {
  const fileStore = useFileStore();

  /** Copia o conteúdo do arquivo para a área de transferência (RF-15). */
  async function copyContent(): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(fileStore.generated.content);
      return true;
    } catch {
      // Clipboard pode ser negado pelo navegador (permissões/contexto).
      return false;
    }
  }

  /** Baixa o arquivo com a extensão adequada ao leiaute/tipo (RF-15). */
  function downloadFile(): void {
    // text/plain com charset latino — arquivos bancários são ASCII.
    const blob = new Blob([fileStore.generated.content], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileStore.fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return { copyContent, downloadFile };
}
