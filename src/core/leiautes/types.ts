/**
 * Tipos fundamentais do Motor de Leiautes (camada Model do MVVM).
 *
 * Este módulo é TypeScript puro: nenhuma dependência de Vue, Quasar ou Pinia.
 * Cada leiaute bancário (RCB001, CNAB240, CNAB400) é descrito de forma
 * declarativa por especificações de campos posicionais e implementado como
 * uma estratégia plugável (padrão Strategy) — adicionar um leiaute novo não
 * exige mexer na interface.
 */

/** Identificadores dos leiautes suportados no lançamento (v2.0.0 "Cisne"). */
export type LayoutId = 'RCB001' | 'CNAB240' | 'CNAB400';

/** Tipo do arquivo: remessa (empresa → banco) ou retorno (banco → empresa). */
export type FileKind = 'remessa' | 'retorno';

/**
 * Tipo do campo posicional, conforme convenção FEBRABAN:
 * - `num`: numérico, alinhado à direita, preenchido com zeros à esquerda;
 * - `alfa`: alfanumérico, alinhado à esquerda, preenchido com espaços à direita.
 */
export type FieldType = 'num' | 'alfa';

/**
 * Contexto entregue aos campos calculados no momento da geração.
 * Permite preencher automaticamente sequenciais, totais e quantidades
 * (requisito RF-07) sem que o usuário precise contar nada na unha.
 */
export interface ComputeContext {
  /** Número da linha corrente no arquivo (1-based). */
  lineNumber: number;
  /** Índice do registro-detalhe corrente (0-based); -1 fora de detalhes. */
  detailIndex: number;
  /** Quantidade de registros-detalhe do arquivo. */
  detailCount: number;
  /** Quantidade total de linhas do arquivo (header + detalhes + trailer…). */
  totalLines: number;
  /** Valores preenchidos do registro corrente (crus, sem formatação). */
  values: Readonly<Record<string, string>>;
  /**
   * Soma dos valores numéricos de um campo em todos os detalhes.
   * Usado por trailers para totalizar (ex.: soma de "Valor Recebido").
   */
  sumOfDetailField: (key: string) => bigint;
}

/** Especificação declarativa de um campo posicional de um registro. */
export interface FieldSpec {
  /** Identificador do campo, em inglês (ex.: `receivedAmount`). */
  key: string;
  /** Rótulo exibido na UI, sempre em PT-BR (ex.: "Valor Recebido"). */
  label: string;
  /** Posição inicial no registro, 1-based e inclusiva (convenção FEBRABAN). */
  start: number;
  /** Posição final no registro, 1-based e inclusiva. */
  end: number;
  /** Tipo do campo — define alinhamento e caractere de preenchimento. */
  type: FieldType;
  /** Campo obrigatório? (validado apenas com a validação global ligada) */
  required?: boolean;
  /** Aparece no formulário? Campos fixos/calculados ficam ocultos. */
  editable?: boolean;
  /** Valor padrão do campo (literal fixo ou sugestão editável). */
  defaultValue?: string;
  /** Dica curta exibida sob o campo na UI (PT-BR). */
  hint?: string;
  /**
   * Função de cálculo automático (sequenciais, totais, datas de geração…).
   * Quando presente, o valor é computado na geração e o campo não é editável.
   */
  computed?: (ctx: ComputeContext) => string;
}

/** Especificação de um tipo de registro (linha) do leiaute. */
export interface RecordSpec {
  /** Identificador do registro (ex.: `fileHeader`, `detailP`). */
  id: string;
  /** Nome exibido na UI, em PT-BR (ex.: "Header de Arquivo"). */
  label: string;
  /** Campos posicionais do registro. Lacunas viram preenchimento padrão. */
  fields: FieldSpec[];
}

/** Conjunto de registros que compõem a estrutura de um arquivo. */
export interface FileStructure {
  /** Header de arquivo (obrigatório em todos os leiautes suportados). */
  fileHeader: RecordSpec;
  /** Header de lote (presente apenas no CNAB240). */
  batchHeader?: RecordSpec;
  /**
   * Segmentos que compõem UM registro-detalhe lógico.
   * No CNAB240 um detalhe vira duas linhas (segmentos P+Q ou T+U);
   * no CNAB400 e RCB001, uma linha única.
   */
  detailSegments: RecordSpec[];
  /** Trailer de lote (presente apenas no CNAB240). */
  batchTrailer?: RecordSpec;
  /** Trailer de arquivo (obrigatório). */
  fileTrailer: RecordSpec;
}

/** Contrato das estratégias de leiaute (padrão Strategy). */
export interface LayoutStrategy {
  /** Identificador do leiaute. */
  id: LayoutId;
  /** Nome exibido na UI. */
  label: string;
  /** Descrição curta (PT-BR) para a UI. */
  description: string;
  /** Largura fixa de cada registro (240, 400…). */
  lineLength: number;
  /** Tipos de arquivo suportados pelo leiaute. */
  kinds: FileKind[];
  /** Extensão adequada para download (.rem, .ret, .txt). */
  fileExtension: (kind: FileKind) => string;
  /** Estrutura de registros para o tipo de arquivo escolhido. */
  structure: (kind: FileKind) => FileStructure;
}

/** Erro de validação de um campo, com mensagem útil em PT-BR. */
export interface FieldValidationError {
  /** Registro ao qual o campo pertence. */
  recordId: string;
  /** Identificador do detalhe (quando aplicável). */
  detailId?: string;
  /** Chave do campo com problema. */
  fieldKey: string;
  /** Rótulo PT-BR do campo (para exibição direta na UI). */
  fieldLabel: string;
  /** Mensagem de erro em PT-BR, dizendo o esperado e a posição. */
  message: string;
}

/**
 * Mapa de um campo dentro do arquivo gerado — usado pelo visualizador
 * para acender o trecho correspondente quando o campo ganha foco (RF-14).
 */
export interface FieldPosition {
  /** Índice da linha no arquivo gerado (0-based). */
  lineIndex: number;
  /** Registro de origem. */
  recordId: string;
  /** Identificador do detalhe (quando aplicável). */
  detailId?: string;
  /** Chave do campo. */
  fieldKey: string;
  /** Posição inicial na linha (1-based, inclusiva). */
  start: number;
  /** Posição final na linha (1-based, inclusiva). */
  end: number;
}

/** Um registro-detalhe lógico preenchido pelo usuário. */
export interface DetailEntry {
  /** Identificador estável do detalhe na sessão (para Vue keys e foco). */
  id: string;
  /** Valores crus digitados, indexados pela chave do campo. */
  values: Record<string, string>;
}

/** Entrada completa para a geração de um arquivo. */
export interface FileInput {
  kind: FileKind;
  /** Valores do header de arquivo. */
  headerValues: Record<string, string>;
  /** Valores do header de lote (ignorado quando o leiaute não tem lote). */
  batchValues: Record<string, string>;
  /** Registros-detalhe preenchidos. */
  details: DetailEntry[];
}

/** Resultado da geração: conteúdo + metadados para a UI. */
export interface GeneratedFile {
  /** Linhas do arquivo, já formatadas na largura fixa do leiaute. */
  lines: string[];
  /** Conteúdo completo (linhas unidas por CRLF, padrão bancário). */
  content: string;
  /** Mapa de posições de todos os campos, para destaque no visualizador. */
  fieldMap: FieldPosition[];
  /** Erros de validação encontrados (vazio quando o arquivo está válido). */
  errors: FieldValidationError[];
}
