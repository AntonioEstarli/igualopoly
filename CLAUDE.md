# Igualopoly - Contexto del Proyecto

## ¿Qué es?
Juego de tablero educativo interactivo sobre desigualdad sistémica. Diseñado para talleres y eventos educativos. Los jugadores experimentan cómo sus atributos de privilegio afectan su progresión en el juego.

## Stack Técnico
- **Framework**: Next.js (App Router) + React 19 + TypeScript (strict)
- **Estilos**: Tailwind CSS 4
- **Base de datos / Tiempo real**: Supabase (PostgreSQL + Realtime broadcasts)
- **Librerías clave**: react-markdown, canvas-confetti, @supabase/supabase-js

## Comandos
```bash
npm run dev    # Servidor de desarrollo
npm run build  # Build de producción
npm run lint   # ESLint
```

## Variables de entorno (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_ADMIN_PASSWORD=
```

## Estructura de directorios
```
src/
├── app/
│   ├── lobby/               # Entrada de jugadores (nombre + idioma)
│   ├── character-creation/  # Creación de perfil (alias, emoji, color, 5 variables)
│   ├── game/                # Juego principal (múltiples fases)
│   ├── game/closure/        # Pantalla final de resultados
│   ├── admin/               # Panel de administración (con contraseña)
│   └── public/              # Página de información pública
├── components/
│   ├── BoardView.tsx        # Tablero de juego
│   ├── CapitalRace.tsx      # Visualización tipo estadio (jugadores vs arquetipos)
│   ├── Dice.tsx             # Dados con animación y sincronización
│   ├── RankingView.tsx      # Clasificación en tiempo real
│   ├── PodiumView.tsx       # Podio final con confetti
│   ├── VotingView.tsx       # Votación de propuestas
│   └── RulesEditor.tsx      # Gestión de reglas
└── lib/
    ├── supabaseClient.ts    # Inicialización de Supabase
    ├── gameLogic.ts         # Mecánicas (cálculo de impacto de cartas)
    ├── translations.ts      # i18n: ES, EN, CAT
    └── boardPositions.ts    # Layout del tablero
```

## Flujo del juego (fases)
1. **Lobby** → nombre + idioma
2. **Character Creation** → alias, avatar, 5 variables (ALTO/MEDIO/BAJO)
3. **PLAYING** → turnos con dados, cartas en 3 pasos, Capital Race
4. **RANKING** → clasificación
5. **VOTING** → votación de propuestas de reglas
6. **PODIUM** → resultados finales
7. **FINAL** → simulación igualitaria automática (compara con perfiles equalizados)

## Sistema de variables del jugador
Cada jugador tiene 5 atributos con valores ALTO/MEDIO/BAJO:
- `tiempo` (Tiempo)
- `visibilidad` (Visibilidad)
- `red` (Red de contactos)
- `margen_error` (Margen de error)
- `responsabilidades` (Responsabilidades)

Estos determinan el impacto económico de cada carta. Más privilegio = más ventaja.

## Tablas principales en Supabase
- `participants` — jugadores (alias, variables, money, room, leader, current_phase)
- `rooms` — salas de juego (current_step, current_phase, next_dice_index)
- `system_profiles` — arquetipos demográficos
- `system_profiles_final` — arquetipos igualados (para simulación final)
- `cards` — cartas de eventos (contenido multiidioma, 3 pasos)
- `rule_proposals` — propuestas de jugadores
- `votes` — votos sobre propuestas
- `fake_dice_values` — secuencia predeterminada de dados

## Mecánica de impacto de cartas
Ver `src/lib/gameLogic.ts`:
- Impacto simple: valor de `impact_values[ALTO|MEDIO|BAJO]` según la variable del jugador
- Impacto doble: combina dos variables — ambas ALTO→ALTO, una ALTO→MEDIO, resto→BAJO
- `calculateCardImpact()`, `calculateSystemMoney()`, `calculateCombinedLevel()`

## Multijugador en tiempo real
- Canal Supabase por sala: `room:${roomId}`
- Solo el líder puede tirar los dados; el resultado se broadcast a todos
- Sincronización de fases via Postgres changes en `participants`

## Panel de administración (`/admin`)
- Protegido con `NEXT_PUBLIC_ADMIN_PASSWORD`
- Reset/inicio de partida, asignación de líderes, configuración de arquetipos, gestión de cartas, secuencia de dados, exportar CSV

## Idiomas soportados
ES (primario), EN, CAT — vía `src/lib/translations.ts`, almacenado en sessionStorage
