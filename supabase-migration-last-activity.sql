-- Migración: Añadir campo last_activity a la tabla participants
-- Fecha: 2026-02-23
-- Descripción: Añade timestamp para detectar usuarios online/offline

-- 1. Añadir columna last_activity con valor por defecto NOW()
ALTER TABLE participants
ADD COLUMN last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Actualizar todos los participantes existentes con timestamp actual
UPDATE participants
SET last_activity = NOW()
WHERE last_activity IS NULL;

-- 3. Crear índice para mejorar rendimiento en consultas de actividad
CREATE INDEX idx_participants_last_activity ON participants(last_activity DESC);

-- 4. (Opcional) Crear función para limpiar participantes inactivos automáticamente
-- Nota: Ejecutar esto solo si quieres auto-eliminar participantes después de X tiempo

-- CREATE OR REPLACE FUNCTION cleanup_inactive_participants()
-- RETURNS void AS $$
-- BEGIN
--   DELETE FROM participants
--   WHERE last_activity < NOW() - INTERVAL '24 hours';
-- END;
-- $$ LANGUAGE plpgsql;

-- Para ejecutar la limpieza manualmente:
-- SELECT cleanup_inactive_participants();

-- Verificación:
-- SELECT alias, last_activity,
--        EXTRACT(EPOCH FROM (NOW() - last_activity)) AS seconds_since_activity
-- FROM participants
-- ORDER BY last_activity DESC;
