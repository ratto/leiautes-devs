/**
 * Gerador genérico de arquivos posicionais.
 *
 * Recebe a estratégia do leiaute + os valores preenchidos e produz:
 * - as linhas na largura fixa do padrão;
 * - o mapa de posições de cada campo (para o destaque no visualizador);
 * - os erros de validação do arquivo inteiro (para o resumo da UI).
 *
 * Regras importantes:
 * - Campos calculados (sequenciais, totais, quantidades) são resolvidos aqui
 *   (RF-07) — o usuário nunca conta registro na unha.
 * - Nada é truncado: valor maior que o campo sai maior mesmo, deslocando a
 *   linha — comportamento desejado com a validação desligada (RF-10).
 * - Linhas unidas por CRLF, terminação usual dos arquivos bancários.
 */

import { fieldLength, formatFieldValue } from './formatting';
import { validateRecordValues } from './validation';
import type {
  ComputeContext,
  DetailEntry,
  FieldPosition,
  FileInput,
  GeneratedFile,
  LayoutStrategy,
  RecordSpec,
} from './types';

/** Parâmetros internos para montar uma única linha. */
interface LineBuild {
  record: RecordSpec;
  values: Record<string, string>;
  ctx: ComputeContext;
  detailId?: string;
}

/**
 * Monta uma linha posicional a partir da especificação do registro.
 * Os campos são escritos na ordem de `start`; lacunas entre campos são
 * preenchidas com espaços (posições não mapeadas do leiaute).
 */
function buildLine(
  build: LineBuild,
  lineLength: number,
  lineIndex: number,
  fieldMap: FieldPosition[],
): string {
  const { record, values, ctx, detailId } = build;
  // Ordena por posição inicial para escrever da esquerda para a direita.
  const fields = [...record.fields].sort((a, b) => a.start - b.start);

  let line = '';
  for (const field of fields) {
    // Preenche a lacuna entre o fim do campo anterior e o início deste.
    if (line.length < field.start - 1) {
      line = line.padEnd(field.start - 1, ' ');
    }

    const raw = field.computed
      ? field.computed(ctx)
      : (values[field.key]?.trim() ?? '') || (field.defaultValue ?? '');
    const formatted = formatFieldValue(field, raw);

    // O deslocamento real considera transbordos de campos anteriores —
    // com validação desligada a linha pode "andar", e o destaque acompanha.
    const start = line.length + 1;
    line += formatted;
    fieldMap.push({
      lineIndex,
      recordId: record.id,
      fieldKey: field.key,
      start,
      end: start + formatted.length - 1,
      ...(detailId !== undefined ? { detailId } : {}),
    });
  }

  // Completa a linha até a largura fixa do leiaute.
  return line.length < lineLength ? line.padEnd(lineLength, ' ') : line;
}

/** Soma um campo numérico em todos os detalhes (para totais de trailer). */
function sumDetailField(details: DetailEntry[], key: string): bigint {
  let total = 0n;
  for (const detail of details) {
    const raw = (detail.values[key] ?? '').trim();
    if (/^\d+$/.test(raw)) total += BigInt(raw);
  }
  return total;
}

/** Gera o arquivo completo para a estratégia e entrada fornecidas. */
export function generateFile(strategy: LayoutStrategy, input: FileInput): GeneratedFile {
  const structure = strategy.structure(input.kind);
  const { fileHeader, batchHeader, detailSegments, batchTrailer, fileTrailer } = structure;

  // Total de linhas: headers + (detalhes × segmentos) + trailers.
  const detailCount = input.details.length;
  const totalLines =
    1 + (batchHeader ? 1 : 0) + detailCount * detailSegments.length + (batchTrailer ? 1 : 0) + 1;

  const makeCtx = (
    lineNumber: number,
    detailIndex: number,
    values: Record<string, string>,
  ): ComputeContext => ({
    lineNumber,
    detailIndex,
    detailCount,
    totalLines,
    values,
    sumOfDetailField: (key) => sumDetailField(input.details, key),
  });

  const lines: string[] = [];
  const fieldMap: FieldPosition[] = [];

  // Registros de lote, detalhe e trailer "herdam" os valores do header de
  // arquivo (banco, agência, conta, empresa…) — o usuário preenche uma vez.
  const batchValues = { ...input.headerValues, ...input.batchValues };
  const detailValues = (detail: DetailEntry) => ({ ...input.headerValues, ...detail.values });

  const errors = collectErrors(structure, input, batchValues, detailValues);

  const push = (build: LineBuild) => {
    lines.push(buildLine(build, strategy.lineLength, lines.length, fieldMap));
  };

  // Header de arquivo
  push({
    record: fileHeader,
    values: input.headerValues,
    ctx: makeCtx(1, -1, input.headerValues),
  });

  // Header de lote (CNAB240)
  if (batchHeader) {
    push({
      record: batchHeader,
      values: batchValues,
      ctx: makeCtx(lines.length + 1, -1, batchValues),
    });
  }

  // Registros-detalhe: cada detalhe lógico pode virar mais de uma linha
  // (segmentos P+Q no CNAB240) — todos alimentados pelos mesmos valores.
  input.details.forEach((detail, detailIndex) => {
    const values = detailValues(detail);
    for (const segment of detailSegments) {
      push({
        record: segment,
        values,
        ctx: makeCtx(lines.length + 1, detailIndex, values),
        detailId: detail.id,
      });
    }
  });

  // Trailer de lote (CNAB240)
  if (batchTrailer) {
    push({
      record: batchTrailer,
      values: batchValues,
      ctx: makeCtx(lines.length + 1, -1, batchValues),
    });
  }

  // Trailer de arquivo
  push({
    record: fileTrailer,
    values: batchValues,
    ctx: makeCtx(lines.length + 1, -1, batchValues),
  });

  return {
    lines,
    content: lines.join('\r\n') + '\r\n',
    fieldMap,
    errors,
  };
}

/** Valida o arquivo inteiro: headers, lote e cada registro-detalhe. */
function collectErrors(
  structure: ReturnType<LayoutStrategy['structure']>,
  input: FileInput,
  batchValues: Record<string, string>,
  detailValues: (detail: DetailEntry) => Record<string, string>,
): GeneratedFile['errors'] {
  const errors = [...validateRecordValues(structure.fileHeader, input.headerValues)];
  if (structure.batchHeader) {
    errors.push(...validateRecordValues(structure.batchHeader, batchValues));
  }
  for (const detail of input.details) {
    const values = detailValues(detail);
    for (const segment of structure.detailSegments) {
      errors.push(...validateRecordValues(segment, values, detail.id));
    }
  }
  return errors;
}

/**
 * Régua de posições do visualizador — marca as posições 1, 11, 21… na
 * largura do leiaute. Fica no Core para ser testável e reutilizável.
 */
export function buildRuler(lineLength: number): string {
  let ruler = '';
  for (let pos = 1; pos <= lineLength; pos += 10) {
    ruler = ruler.padEnd(pos - 1, ' ') + String(pos);
  }
  return ruler.padEnd(lineLength, ' ').slice(0, lineLength);
}

/** Sanidade estrutural: todos os campos cabem na largura e não se sobrepõem. */
export function assertRecordSpecIsSound(record: RecordSpec, lineLength: number): void {
  const sorted = [...record.fields].sort((a, b) => a.start - b.start);
  let cursor = 0;
  for (const field of sorted) {
    if (field.start <= cursor) {
      throw new Error(
        `Registro ${record.id}: campo ${field.key} sobrepõe o anterior (início ${field.start} ≤ ${cursor}).`,
      );
    }
    if (field.end > lineLength) {
      throw new Error(
        `Registro ${record.id}: campo ${field.key} ultrapassa a largura ${lineLength} (fim ${field.end}).`,
      );
    }
    if (fieldLength(field) < 1) {
      throw new Error(`Registro ${record.id}: campo ${field.key} tem tamanho inválido.`);
    }
    cursor = field.end;
  }
}
