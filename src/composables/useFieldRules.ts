/**
 * Composable de validação de campo (ViewModel).
 *
 * Constrói as `rules` do Quasar (RF-09) a partir da especificação do campo
 * no Core, respeitando o toggle global de validação (RF-10): com a validação
 * desligada, nenhuma rule é aplicada e o usuário pode digitar o que quiser
 * — inclusive valores errados de propósito.
 */

import { computed } from 'vue';
import type { ComputedRef } from 'vue';
import { validateFieldValue } from '@/core/leiautes';
import type { FieldSpec } from '@/core/leiautes';
import { useSettingsStore } from '@/stores/settings-store';

/** Assinatura de rule aceita pelo q-input do Quasar. */
export type FieldRule = (value: string | number | null | undefined) => boolean | string;

/** Rules reativas para um campo: mudam junto com o toggle global. */
export function useFieldRules(field: FieldSpec): ComputedRef<FieldRule[]> {
  const settings = useSettingsStore();

  return computed(() => {
    // Validação desligada → sem rules → o Quasar aceita qualquer entrada.
    if (!settings.validationEnabled) return [];
    return [
      (value) => {
        const message = validateFieldValue(field, String(value ?? ''));
        return message ?? true;
      },
    ];
  });
}
