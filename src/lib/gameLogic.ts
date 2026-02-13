// src/lib/gameLogic.ts

export type VariableLevel = 'ALTO' | 'MEDIO' | 'BAJO';

export interface ParticipantVariables {
  tiempo: VariableLevel;
  visibilidad: VariableLevel;
  red: VariableLevel;
  margen_error: VariableLevel;
  responsabilidades: VariableLevel;
}

/**
 * Calcula el nivel combinado cuando hay dos variables de impacto
 * - Si las dos variables son ALTO → ALTO
 * - Si solo una de ellas es ALTO → MEDIO
 * - En otro caso → BAJO
 */
export const calculateCombinedLevel = (
  level1: VariableLevel,
  level2: VariableLevel
): VariableLevel => {
  if (level1 === 'ALTO' && level2 === 'ALTO') {
    return 'ALTO';
  }
  if (level1 === 'ALTO' || level2 === 'ALTO') {
    return 'MEDIO';
  }
  return 'BAJO';
};

/**
 * Calcula el impacto económico de una carta sobre un participante
 * Basado en los requisitos de impacto automático por variable
 */
export const calculateCardImpact = (
  variables: ParticipantVariables,
  impactVariable: keyof ParticipantVariables | string,
  impactValues: Record<string, number>,
  impactVariable2?: keyof ParticipantVariables | string | null
): number => {

  // Caso 2: La regla depende de combinaciones (ej: Calle Promoción -> Visibilidad + Red)
  if (impactVariable2 && typeof impactVariable === 'string' && typeof impactVariable2 === 'string') {
    const level1 = variables[impactVariable as keyof ParticipantVariables];
    const level2 = variables[impactVariable2 as keyof ParticipantVariables];

    if (level1 && level2) {
      const combinedLevel = calculateCombinedLevel(level1, level2);
      return impactValues[combinedLevel] ?? 0;
    }
  }

  // Caso 1: La regla depende de una sola variable (ej: Calle Vacante -> Red)
  if (typeof impactVariable === 'string' && variables[impactVariable as keyof ParticipantVariables]) {
    const userLevel = variables[impactVariable as keyof ParticipantVariables];
    return impactValues[userLevel] ?? 0;
  }

  return 0;
};

const varLabels: Record<string, Record<string, string>> = {
  red:               { ES: '🤝 Red', EN: '🤝 Network', CAT: '🤝 Xarxa' },
  visibilidad:       { ES: '👀 Visibilidad', EN: '👀 Visibility', CAT: '👀 Visibilitat' },
  tiempo:            { ES: '🕒 Disponibilidad', EN: '🕒 Availability', CAT: '🕒 Disponibilitat' },
  margen_error:      { ES: '⚠️ Margen de error', EN: '⚠️ Error margin', CAT: '⚠️ Marge d\'error' },
  responsabilidades: { ES: '🎒 Cargas invisibles', EN: '🎒 Invisible burdens', CAT: '🎒 Càrregues invisibles' },
};

const reasonTemplates = {
  single: {
    ES: (v: string, l: string) => `Por tener ${v} en nivel ${l}`,
    EN: (v: string, l: string) => `Due to ${v} at level ${l}`,
    CAT: (v: string, l: string) => `Per tenir ${v} en nivell ${l}`,
  },
  combined: {
    ES: (v1: string, l1: string, v2: string, l2: string, lc: string) => `Por tener ${v1} (${l1}) + ${v2} (${l2}) = nivel ${lc}`,
    EN: (v1: string, l1: string, v2: string, l2: string, lc: string) => `Due to ${v1} (${l1}) + ${v2} (${l2}) = level ${lc}`,
    CAT: (v1: string, l1: string, v2: string, l2: string, lc: string) => `Per tenir ${v1} (${l1}) + ${v2} (${l2}) = nivell ${lc}`,
  },
};

export const getImpactDetail = (
  userVars: any,
  impactVar: string,
  impactValues: any,
  impactVar2?: string | null,
  language: 'ES' | 'EN' | 'CAT' = 'ES'
) => {
  const lang = language in reasonTemplates.single ? language : 'ES';
  const label = (v: string) => varLabels[v.toLowerCase()]?.[lang] ?? v.replace('_', ' ');

  // Caso 2: Combinación de dos variables
  if (impactVar2) {
    const level1 = userVars[impactVar.toLowerCase()] as VariableLevel || 'MEDIO';
    const level2 = userVars[impactVar2.toLowerCase()] as VariableLevel || 'MEDIO';
    const combinedLevel = calculateCombinedLevel(level1, level2);
    const amount = impactValues[combinedLevel] || 0;

    return {
      amount,
      reason: reasonTemplates.combined[lang as keyof typeof reasonTemplates.combined](label(impactVar), level1, label(impactVar2), level2, combinedLevel)
    };
  }

  // Caso 1: Una sola variable
  const userLevel = userVars[impactVar.toLowerCase()] || 'MEDIO';
  const amount = impactValues[userLevel] || 0;

  return {
    amount,
    reason: reasonTemplates.single[lang as keyof typeof reasonTemplates.single](label(impactVar), userLevel)
  };
};

/**
 * Calcula el capital acumulado de un perfil basado en sus variables
 * y el histórico de cartas jugadas hasta el momento.
 */
export function calculateSystemMoney(profileVars: any, currentStep: number, allCards: any[]) {
  let total = 10; // Capital inicial igual que los jugadores

  // Recorremos las cartas desde la primera hasta la actual
  for (let i = 0; i < currentStep; i++) {
    const card = allCards[i];
    if (card && card.impact_variable && card.impact_values) {
      let impact: number;

      // Caso 2: Dos variables de impacto
      if (card.impact_variable_2) {
        const level1 = (profileVars[card.impact_variable.toLowerCase()] || 'MEDIO') as VariableLevel;
        const level2 = (profileVars[card.impact_variable_2.toLowerCase()] || 'MEDIO') as VariableLevel;
        const combinedLevel = calculateCombinedLevel(level1, level2);
        impact = card.impact_values[combinedLevel] || 0;
      } else {
        // Caso 1: Una sola variable
        const variableName = card.impact_variable.toLowerCase();
        const profileLevel = profileVars[variableName] || 'MEDIO';
        impact = card.impact_values[profileLevel] || 0;
      }

      total += impact;
    }
  }

  return total;
}