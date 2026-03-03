-- Añadir campos para guardar métricas del juego normal
-- Ejecutar en Supabase SQL Editor

ALTER TABLE rooms
ADD COLUMN IF NOT EXISTS brecha_normal INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ratio_normal DECIMAL(10, 2) DEFAULT 0;

-- Comentarios para documentación
COMMENT ON COLUMN rooms.brecha_normal IS 'Brecha (max - min) del dinero de jugadores antes de la simulación final';
COMMENT ON COLUMN rooms.ratio_normal IS 'Ratio (max / min) del dinero de jugadores antes de la simulación final';
