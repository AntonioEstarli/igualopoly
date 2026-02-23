-- Migración: Añadir campo recovery_code a la tabla participants
-- Fecha: 2026-02-23
-- Descripción: Añade un campo para códigos de recuperación que permite a los usuarios
--              recuperar su sesión en entornos donde localStorage puede estar bloqueado

-- 1. Añadir columna recovery_code
ALTER TABLE participants
ADD COLUMN recovery_code VARCHAR(6);

-- 2. Crear índice para búsquedas rápidas por código
CREATE INDEX idx_participants_recovery_code ON participants(recovery_code);

-- 3. Añadir constraint para asegurar unicidad (códigos únicos)
ALTER TABLE participants
ADD CONSTRAINT unique_recovery_code UNIQUE (recovery_code);

-- 4. (Opcional) Generar códigos para participantes existentes
-- Nota: Este paso es opcional. Los participantes existentes seguirán funcionando
-- con localStorage. Solo los nuevos participantes tendrán código de recuperación.
-- Si quieres generar códigos para participantes existentes, ejecuta:

-- UPDATE participants
-- SET recovery_code = UPPER(
--   SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 3) ||
--   LPAD(FLOOR(RANDOM() * 1000)::text, 3, '0')
-- )
-- WHERE recovery_code IS NULL;

-- IMPORTANTE: Antes de ejecutar el UPDATE, asegúrate de que no haya conflictos
-- de unicidad. Es mejor dejar NULL para participantes existentes.

-- Verificación:
-- SELECT id, alias, recovery_code FROM participants LIMIT 10;
