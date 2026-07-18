/**
 * Store do arquivo em edição (ViewModel) — a fonte de verdade da sessão.
 *
 * Faz a ponte entre a View (formulários/visualizador) e o Motor de Leiautes
 * (Core). Estado 100% em memória, sem persistência (LGPD / RNF-02).
 */

import { defineStore } from 'pinia';
import { generateFile, getLayoutStrategy, layoutStrategies } from '@/core/leiautes';
import type {
  DetailEntry,
  FieldSpec,
  FileKind,
  FileStructure,
  GeneratedFile,
  LayoutId,
  LayoutStrategy,
} from '@/core/leiautes';

/** Detalhe com o estado de UI de abrir/fechar (RF-06). */
export interface DetailEntryState extends DetailEntry {
  /** Card expandido? Estado explícito → abre/fecha sempre confiável. */
  expanded: boolean;
}

/** Campo em foco no formulário, para o destaque no visualizador (RF-14). */
export interface FocusedField {
  fieldKey: string;
  detailId?: string | undefined;
}

/** Gera um id estável para detalhes criados na sessão. */
let detailIdCounter = 0;
function nextDetailId(): string {
  detailIdCounter += 1;
  return `detail-${detailIdCounter}`;
}

/** Valores iniciais dos campos editáveis de um conjunto de registros. */
function seedValues(records: { fields: FieldSpec[] }[]): Record<string, string> {
  const values: Record<string, string> = {};
  for (const record of records) {
    for (const field of record.fields) {
      if (field.editable && values[field.key] === undefined) {
        values[field.key] = field.defaultValue ?? '';
      }
    }
  }
  return values;
}

/**
 * Preserva valores compatíveis ao trocar de leiaute (RF-03): campos com a
 * mesma chave (empresa, banco, conta…) migram automaticamente.
 */
function mergePreserving(
  seeded: Record<string, string>,
  previous: Record<string, string>,
): Record<string, string> {
  const merged = { ...seeded };
  for (const key of Object.keys(seeded)) {
    const previousValue = previous[key];
    // Só migra o que o usuário de fato preencheu (não sobrescreve default com vazio).
    if (previousValue !== undefined && previousValue !== '') {
      merged[key] = previousValue;
    }
  }
  return merged;
}

/** Estado da store — tipado explicitamente para evitar estreitamento. */
interface FileStoreState {
  layoutId: LayoutId;
  kind: FileKind;
  headerValues: Record<string, string>;
  batchValues: Record<string, string>;
  details: DetailEntryState[];
  /** Campo atualmente focado no formulário (destaque no visualizador). */
  focusedField: FocusedField | null;
}

export const useFileStore = defineStore('file', {
  state: (): FileStoreState => {
    // Leiaute inicial: CNAB240 retorno — o caso mais comum das personas.
    const layoutId: LayoutId = 'CNAB240';
    const kind: FileKind = 'retorno';
    const structure = getLayoutStrategy(layoutId).structure(kind);
    return {
      layoutId,
      kind,
      headerValues: seedValues([structure.fileHeader]),
      batchValues: structure.batchHeader ? seedValues([structure.batchHeader]) : {},
      details: [
        {
          id: nextDetailId(),
          values: seedValues(structure.detailSegments),
          expanded: true,
        },
      ],
      focusedField: null,
    };
  },

  getters: {
    strategy(state): LayoutStrategy {
      return getLayoutStrategy(state.layoutId);
    },

    structure(state): FileStructure {
      return getLayoutStrategy(state.layoutId).structure(state.kind);
    },

    /** Arquivo gerado reativamente — o visualizador é sempre "ao vivo". */
    generated(state): GeneratedFile {
      return generateFile(getLayoutStrategy(state.layoutId), {
        kind: state.kind,
        headerValues: state.headerValues,
        batchValues: state.batchValues,
        details: state.details,
      });
    },

    /** Campos editáveis do header de arquivo, na ordem posicional. */
    headerFields(): FieldSpec[] {
      return this.structure.fileHeader.fields.filter((field) => field.editable);
    },

    /** Campos editáveis do header de lote (vazio quando não há lote). */
    batchFields(): FieldSpec[] {
      return this.structure.batchHeader?.fields.filter((field) => field.editable) ?? [];
    },

    /**
     * Campos editáveis de um registro-detalhe, mesclando os segmentos
     * (P+Q / T+U) sem duplicar chaves compartilhadas.
     */
    detailFields(): FieldSpec[] {
      const seen = new Set<string>();
      const fields: FieldSpec[] = [];
      for (const segment of this.structure.detailSegments) {
        for (const field of segment.fields) {
          if (field.editable && !seen.has(field.key)) {
            seen.add(field.key);
            fields.push(field);
          }
        }
      }
      return fields;
    },

    /** Nome sugerido para o download (ex.: `cnab240_retorno.ret`). */
    fileName(state): string {
      const extension = getLayoutStrategy(state.layoutId).fileExtension(state.kind);
      return `${state.layoutId.toLowerCase()}_${state.kind}${extension}`;
    },

    /** O arquivo está válido? (independe do toggle — informa o badge da UI) */
    isValid(): boolean {
      return this.generated.errors.length === 0;
    },
  },

  actions: {
    /** Troca o leiaute preservando campos compatíveis (RF-02, RF-03). */
    setLayout(layoutId: LayoutId) {
      if (layoutId === this.layoutId) return;
      const strategy = getLayoutStrategy(layoutId);
      // Se o leiaute não suporta o tipo atual (ex.: RCB001 é só retorno),
      // ajusta automaticamente para o primeiro tipo suportado.
      const kind = strategy.kinds.includes(this.kind) ? this.kind : strategy.kinds[0]!;
      const structure = strategy.structure(kind);

      this.layoutId = layoutId;
      this.kind = kind;
      this.headerValues = mergePreserving(seedValues([structure.fileHeader]), this.headerValues);
      this.batchValues = structure.batchHeader
        ? mergePreserving(seedValues([structure.batchHeader]), this.batchValues)
        : {};
      this.details = this.details.map((detail) => ({
        ...detail,
        values: mergePreserving(seedValues(structure.detailSegments), detail.values),
      }));
      this.focusedField = null;
    },

    /** Alterna entre remessa e retorno, re-semeando campos do novo tipo. */
    setKind(kind: FileKind) {
      if (kind === this.kind || !this.strategy.kinds.includes(kind)) return;
      this.kind = kind;
      const structure = this.strategy.structure(kind);
      this.headerValues = mergePreserving(seedValues([structure.fileHeader]), this.headerValues);
      this.batchValues = structure.batchHeader
        ? mergePreserving(seedValues([structure.batchHeader]), this.batchValues)
        : {};
      this.details = this.details.map((detail) => ({
        ...detail,
        values: mergePreserving(seedValues(structure.detailSegments), detail.values),
      }));
      this.focusedField = null;
    },

    updateHeaderValue(key: string, value: string) {
      this.headerValues[key] = value;
    },

    updateBatchValue(key: string, value: string) {
      this.batchValues[key] = value;
    },

    updateDetailValue(detailId: string, key: string, value: string) {
      const detail = this.details.find((item) => item.id === detailId);
      if (detail) detail.values[key] = value;
    },

    /**
     * Adiciona um registro-detalhe novo, já recolhido (RF-05).
     *
     * Nasce recolhido de propósito (issue #12): o corpo do DetailCard só monta
     * os ~15 q-input quando expandido. Criar recolhido evita montar dezenas de
     * inputs de uma vez ao gerar muitos registros — o heap cai ~85% no cenário
     * de centenas/milhares de detalhes. O usuário expande sob demanda.
     */
    addDetail() {
      this.details.push({
        id: nextDetailId(),
        values: seedValues(this.structure.detailSegments),
        expanded: false,
      });
    },

    /**
     * Duplica um registro-detalhe com todos os valores (RF-05).
     *
     * Também nasce recolhido (issue #12) pela mesma razão do addDetail: evitar
     * montar os inputs do clone imediatamente. Duplicar em massa não infla o DOM.
     */
    duplicateDetail(detailId: string) {
      const source = this.details.find((item) => item.id === detailId);
      if (!source) return;
      const index = this.details.indexOf(source);
      this.details.splice(index + 1, 0, {
        id: nextDetailId(),
        values: { ...source.values },
        expanded: false,
      });
    },

    /** Remove um registro-detalhe (RF-05). */
    removeDetail(detailId: string) {
      this.details = this.details.filter((item) => item.id !== detailId);
    },

    /** Abre/fecha o card de forma explícita e confiável (RF-06). */
    toggleDetail(detailId: string) {
      const detail = this.details.find((item) => item.id === detailId);
      if (detail) detail.expanded = !detail.expanded;
    },

    /** Registra o campo focado para o destaque no visualizador (RF-14). */
    focusField(fieldKey: string, detailId?: string) {
      this.focusedField = { fieldKey, detailId };
    },

    blurField() {
      this.focusedField = null;
    },
  },
});

/** Leiautes disponíveis para o seletor da UI. */
export { layoutStrategies };
