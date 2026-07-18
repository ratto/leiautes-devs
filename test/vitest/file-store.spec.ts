/**
 * Testes da store do arquivo (ViewModel) — troca de leiaute, CRUD de
 * detalhes, foco de campo e geração reativa.
 */

import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { useFileStore } from '@/stores/file-store';

beforeEach(() => {
  setActivePinia(createPinia());
});

describe('estado inicial', () => {
  it('começa em CNAB240 retorno com um detalhe expandido', () => {
    const store = useFileStore();
    expect(store.layoutId).toBe('CNAB240');
    expect(store.kind).toBe('retorno');
    expect(store.details).toHaveLength(1);
    expect(store.details[0]?.expanded).toBe(true);
  });

  it('semeia valores padrão dos campos editáveis', () => {
    const store = useFileStore();
    expect(store.headerValues.bankCode).toBe('341');
    expect(store.details[0]?.values.movementCode).toBe('06');
  });
});

describe('setLayout (RF-02, RF-03)', () => {
  it('troca de leiaute preservando campos compatíveis', () => {
    const store = useFileStore();
    store.updateHeaderValue('companyName', 'EMPRESA TESTE LTDA');
    store.updateHeaderValue('agency', '1234');
    store.setLayout('CNAB400');
    expect(store.layoutId).toBe('CNAB400');
    expect(store.headerValues.companyName).toBe('EMPRESA TESTE LTDA');
    expect(store.headerValues.agency).toBe('1234');
  });

  it('ajusta o tipo quando o leiaute não o suporta (RCB001 é só retorno)', () => {
    const store = useFileStore();
    store.setLayout('CNAB240');
    store.setKind('remessa');
    store.setLayout('RCB001');
    expect(store.kind).toBe('retorno');
  });

  it('não sobrescreve default do novo leiaute com valor vazio do anterior', () => {
    const store = useFileStore();
    store.updateHeaderValue('bankName', '');
    store.setLayout('RCB001');
    expect(store.headerValues.bankName).toBe('BANCO TESTE');
  });

  it('é no-op para o mesmo leiaute', () => {
    const store = useFileStore();
    store.updateHeaderValue('companyName', 'ACME');
    store.setLayout('CNAB240');
    expect(store.headerValues.companyName).toBe('ACME');
  });
});

describe('setKind', () => {
  it('alterna remessa/retorno reconfigurando os campos de detalhe', () => {
    const store = useFileStore();
    const retornoKeys = store.detailFields.map((field) => field.key);
    store.setKind('remessa');
    const remessaKeys = store.detailFields.map((field) => field.key);
    expect(store.kind).toBe('remessa');
    expect(retornoKeys).toContain('receivedAmount');
    expect(remessaKeys).not.toContain('receivedAmount');
    expect(remessaKeys).toContain('payerName');
  });

  it('ignora tipo não suportado pelo leiaute', () => {
    const store = useFileStore();
    store.setLayout('RCB001');
    store.setKind('remessa');
    expect(store.kind).toBe('retorno');
  });
});

describe('CRUD de registros-detalhe (RF-05, RF-06)', () => {
  it('adiciona detalhe recolhido com valores padrão (issue #12)', () => {
    const store = useFileStore();
    store.addDetail();
    expect(store.details).toHaveLength(2);
    // Nasce recolhido de propósito: o corpo do card só monta os inputs quando
    // expandido, então criar recolhido evita inflar o DOM ao gerar em massa.
    expect(store.details[1]?.expanded).toBe(false);
    expect(store.details[1]?.id).not.toBe(store.details[0]?.id);
  });

  it('duplica detalhe copiando os valores, logo após o original', () => {
    const store = useFileStore();
    store.updateDetailValue(store.details[0]!.id, 'titleAmount', '150000');
    store.addDetail();
    store.duplicateDetail(store.details[0]!.id);
    expect(store.details).toHaveLength(3);
    expect(store.details[1]?.values.titleAmount).toBe('150000');
    expect(store.details[1]?.id).not.toBe(store.details[0]?.id);
  });

  it('duplica detalhe recolhido, sem montar os inputs do clone (issue #12)', () => {
    const store = useFileStore();
    store.duplicateDetail(store.details[0]!.id);
    expect(store.details).toHaveLength(2);
    expect(store.details[1]?.expanded).toBe(false);
  });

  it('mantém o primeiro detalhe expandido no estado inicial (UX)', () => {
    // Só os registros criados via add/duplicate nascem recolhidos; o detalhe
    // inicial continua aberto para o usuário começar a preencher de imediato.
    const store = useFileStore();
    store.addDetail();
    expect(store.details[0]?.expanded).toBe(true);
    expect(store.details[1]?.expanded).toBe(false);
  });

  it('remove detalhe', () => {
    const store = useFileStore();
    const id = store.details[0]!.id;
    store.addDetail();
    store.removeDetail(id);
    expect(store.details).toHaveLength(1);
    expect(store.details.some((detail) => detail.id === id)).toBe(false);
  });

  it('abre/fecha detalhe de forma confiável (corrige bug do protótipo)', () => {
    const store = useFileStore();
    const id = store.details[0]!.id;
    store.toggleDetail(id);
    expect(store.details[0]?.expanded).toBe(false);
    store.toggleDetail(id);
    expect(store.details[0]?.expanded).toBe(true);
  });
});

describe('geração reativa', () => {
  it('reflete alterações de valores no arquivo gerado', () => {
    const store = useFileStore();
    store.updateDetailValue(store.details[0]!.id, 'receivedAmount', '150000');
    const line = store.generated.lines[3]!; // segmento U
    expect(line.slice(77, 92)).toBe('000000000150000');
  });

  it('expõe o nome do arquivo com a extensão do leiaute', () => {
    const store = useFileStore();
    expect(store.fileName).toBe('cnab240_retorno.ret');
    store.setKind('remessa');
    expect(store.fileName).toBe('cnab240_remessa.rem');
  });

  it('isValid acompanha os erros de validação', () => {
    const store = useFileStore();
    expect(store.isValid).toBe(false); // campos obrigatórios ainda vazios
    // Preenche tudo que é obrigatório no CNAB240 retorno:
    store.updateHeaderValue('companyDocument', '12345678000199');
    store.updateHeaderValue('agency', '1234');
    store.updateHeaderValue('account', '123456');
    store.updateHeaderValue('companyName', 'EMPRESA TESTE');
    const id = store.details[0]!.id;
    store.updateDetailValue(id, 'ourNumber', '123');
    store.updateDetailValue(id, 'titleAmount', '150000');
    store.updateDetailValue(id, 'receivedAmount', '150000');
    store.updateDetailValue(id, 'occurrenceDate', '15062026');
    expect(store.isValid).toBe(true);
  });
});

describe('foco de campo (RF-14)', () => {
  it('registra e limpa o campo focado', () => {
    const store = useFileStore();
    store.focusField('receivedAmount', store.details[0]!.id);
    expect(store.focusedField).toEqual({
      fieldKey: 'receivedAmount',
      detailId: store.details[0]!.id,
    });
    store.blurField();
    expect(store.focusedField).toBeNull();
  });
});
