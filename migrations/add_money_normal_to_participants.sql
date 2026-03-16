-- Migración: Añadir campo money_normal a la tabla participants
-- Fecha: 2026-03-16
-- Descripción: Guarda los puntos del juego normal antes de resetear para la simulación final

ALTER TABLE participants
ADD COLUMN money_normal INTEGER DEFAULT NULL;
