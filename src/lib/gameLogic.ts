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
 * Calcula el impacto económico de una carta sobre un participante
 * Basado en los requisitos de impacto automático por variable [cite: 92, 93, 111]
 */
export const calculateCardImpact = (
  variables: ParticipantVariables,
  impactVariable: keyof ParticipantVariables | string,
  impactValues: Record<string, number>
): number => {
  
  // Caso 1: La regla depende de una sola variable (ej: Calle Vacante -> Red) [cite: 169]
  if (typeof impactVariable === 'string' && variables[impactVariable as keyof ParticipantVariables]) {
    const userLevel = variables[impactVariable as keyof ParticipantVariables];
    return impactValues[userLevel] ?? 0;
  }

  // Caso 2: La regla depende de combinaciones (ej: Calle Promoción -> Visibilidad + Red) [cite: 175]
  // Aquí podrías añadir lógica personalizada para casos complejos si impactVariable es 'COMBINED'
  
  return 0;
};

export const getImpactDetail = (userVars: any, impactVar: string, impactValues: any) => {
  const userLevel = userVars[impactVar.toLowerCase()] || 'MEDIO';
  const amount = impactValues[userLevel] || 0;
  
  return {
    amount,
    reason: `Por tener ${impactVar.replace('_', ' ')} en nivel ${userLevel}`
  };
};

/**
 * Calcula el capital acumulado de un perfil basado en sus variables 
 * y el histórico de cartas jugadas hasta el momento.
 */
export function calculateSystemMoney(profileVars: any, currentStep: number, allCards: any[]) {
  let total = 0;

  // Recorremos las cartas desde la primera hasta la actual
  for (let i = 0; i < currentStep; i++) {
    const card = allCards[i];
    if (card && card.impact_variable && card.impact_values) {
      // Obtenemos el nivel del perfil para esa variable específica (ALTO, MEDIO, BAJO)
      const variableName = card.impact_variable.toLowerCase();
      const profileLevel = profileVars[variableName] || 'MEDIO';
      
      // Sumamos el impacto correspondiente
      const impact = card.impact_values[profileLevel] || 0;
      total += impact;
    }
  }

  return total;
}