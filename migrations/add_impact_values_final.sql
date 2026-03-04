-- Añadir campo para valores de impacto económico en la simulación final
-- Este campo reemplaza el sistema de valores fijos por perfil (final_simulation_values)
-- Ejecutar en Supabase SQL Editor

-- 1. Añadir el nuevo campo impact_values_final (estructura similar a impact_values)
ALTER TABLE cards
ADD COLUMN IF NOT EXISTS impact_values_final JSONB DEFAULT NULL;

-- 2. Comentario para documentación
COMMENT ON COLUMN cards.impact_values_final IS 'Valores de impacto más equitativos para la simulación final. Estructura: {"ALTO": number, "MEDIO": number, "BAJO": number}';

-- NOTA: El campo final_simulation_values quedará deprecated pero no se elimina aún
-- para mantener compatibilidad con datos existentes. Se puede eliminar en una migración futura.
