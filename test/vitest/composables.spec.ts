/**
 * Testes dos composables (ViewModel): rules do Quasar e exportação.
 */

import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFieldRules } from '@/composables/useFieldRules';
import { useFileExport } from '@/composables/useFileExport';
import { useFileStore } from '@/stores/file-store';
import { useSettingsStore } from '@/stores/settings-store';
import type { FieldSpec } from '@/core/leiautes';

beforeEach(() => {
  setActivePinia(createPinia());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const feeField: FieldSpec = {
  key: 'feeAmount',
  label: 'Valor da Tarifa',
  start: 66,
  end: 75,
  type: 'num',
  editable: true,
};

describe('useFieldRules (RF-09, RF-10)', () => {
  it('com validação ligada, a rule devolve a mensagem de erro', () => {
    const rules = useFieldRules(feeField);
    expect(rules.value).toHaveLength(1);
    expect(rules.value[0]!('00ABC8')).toBe(
      'Campo Valor da Tarifa: apenas dígitos são aceitos (posições 66–75).',
    );
    expect(rules.value[0]!('1050')).toBe(true);
  });

  it('trata null/undefined como vazio', () => {
    const rules = useFieldRules(feeField);
    expect(rules.value[0]!(null)).toBe(true);
    expect(rules.value[0]!(undefined)).toBe(true);
  });

  it('com validação desligada, não aplica nenhuma rule', () => {
    const settings = useSettingsStore();
    const rules = useFieldRules(feeField);
    settings.toggleValidation();
    expect(rules.value).toEqual([]);
  });
});

describe('useFileExport (RF-15)', () => {
  it('copia o conteúdo gerado para a área de transferência', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    const fileStore = useFileStore();
    const { copyContent } = useFileExport();
    await expect(copyContent()).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith(fileStore.generated.content);
  });

  it('retorna false quando o clipboard é negado', async () => {
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('negado')) },
    });

    const { copyContent } = useFileExport();
    await expect(copyContent()).resolves.toBe(false);
  });

  it('baixa o arquivo com o nome/extensão do leiaute', () => {
    const click = vi.fn();
    const anchor = { href: '', download: '', click } as unknown as HTMLAnchorElement;
    vi.stubGlobal('document', { createElement: vi.fn().mockReturnValue(anchor) });
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn().mockReturnValue('blob:fake'),
      revokeObjectURL: vi.fn(),
    });
    vi.stubGlobal('Blob', class FakeBlob {});

    const fileStore = useFileStore();
    const { downloadFile } = useFileExport();
    downloadFile();
    expect(anchor.download).toBe(fileStore.fileName);
    expect(anchor.href).toBe('blob:fake');
    expect(click).toHaveBeenCalledOnce();
  });
});
