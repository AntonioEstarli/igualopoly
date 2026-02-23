# Sistema de Códigos de Recuperación - Guía de Instalación

## 📋 Resumen

Este sistema permite a los usuarios recuperar su sesión usando un código de 6 caracteres (ej: `ABC-123`), funcionando como alternativa a localStorage en entornos corporativos/universitarios donde puede estar bloqueado.

## 🎯 Características

- ✅ **Códigos únicos de 6 caracteres** (3 letras + 3 números)
- ✅ **Compatibilidad total con localStorage** (funciona como fallback)
- ✅ **Soporte multiidioma** (ES, EN, CAT)
- ✅ **Interfaz amigable** con modal informativo
- ✅ **Búsqueda rápida** con índices en BD

## 🚀 Instalación

### Paso 1: Ejecutar migración SQL

1. Ve a tu panel de Supabase
2. Navega a **SQL Editor**
3. Abre el archivo `supabase-migration-recovery-code.sql`
4. Copia y pega el contenido en el editor
5. Ejecuta la migración

**Comandos ejecutados:**
```sql
ALTER TABLE participants ADD COLUMN recovery_code VARCHAR(6);
CREATE INDEX idx_participants_recovery_code ON participants(recovery_code);
ALTER TABLE participants ADD CONSTRAINT unique_recovery_code UNIQUE (recovery_code);
```

### Paso 2: Verificar instalación

Ejecuta en Supabase SQL Editor:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'participants' AND column_name = 'recovery_code';
```

Deberías ver:
```
column_name     | data_type
----------------+-----------
recovery_code   | character varying
```

## 📖 Cómo funciona

### Para usuarios normales (localStorage disponible)

1. Usuario crea perfil → se genera código automáticamente
2. Se muestra modal con código de recuperación
3. Usuario anota el código (opcional, "por si acaso")
4. localStorage funciona normalmente
5. Si vuelve al lobby → recuperación automática

### Para entornos restrictivos (localStorage bloqueado)

1. Usuario crea perfil → se genera código automáticamente
2. Se muestra modal con código de recuperación
3. ⚠️ **Usuario DEBE anotar el código** (localStorage no funcionará)
4. Si se desconecta:
   - Va a `/lobby`
   - Clic en "🔑 ¿Tienes un código de recuperación?"
   - Introduce código (ej: `ABC-123`)
   - ✅ Sesión recuperada

## 🎨 Flujo de usuario

```
┌─────────────────────────────────────────────────────┐
│  /lobby                                             │
│  ┌───────────────────────────────────────────┐     │
│  │ Introduce tu nombre                       │     │
│  │ [Juan Pérez____________]                  │     │
│  │                                            │     │
│  │ [Entrar a la sesión]                      │     │
│  │                                            │     │
│  │          --- o ---                         │     │
│  │                                            │     │
│  │ [🔑 ¿Tienes un código de recuperación?]  │     │
│  └───────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│  /character-creation                                │
│  (Configura perfil, sala, etc.)                    │
│  [Listo para jugar] ← Click                        │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│  MODAL: ¡Tu código de recuperación!                │
│  ┌───────────────────────────────────────────┐     │
│  │           🔑                              │     │
│  │                                            │     │
│  │  Tu código:                               │     │
│  │  ┌──────────────┐                         │     │
│  │  │  ABC-123     │                         │     │
│  │  └──────────────┘                         │     │
│  │                                            │     │
│  │  ⚠️ Anota este código en papel o haz     │     │
│  │     captura de pantalla                   │     │
│  │                                            │     │
│  │  [Continuar al juego]                     │     │
│  └───────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────┘
```

## 🔧 Archivos modificados

### Nuevos archivos:
- `src/lib/recoveryCode.ts` - Funciones de generación y validación de códigos

### Archivos modificados:
- `src/app/character-creation/page.tsx` - Genera y muestra código
- `src/app/lobby/page.tsx` - Permite recuperación por código
- `src/lib/translations.ts` - Traducciones multiidioma

## 🧪 Testing

### Prueba 1: Crear usuario y ver código

1. Ve a `/lobby`
2. Introduce nombre
3. Ve a `/character-creation`
4. Configura perfil
5. Click "Listo para jugar"
6. ✅ Debe aparecer modal con código

### Prueba 2: Recuperar por código (simulando localStorage bloqueado)

1. Abre DevTools → Console
2. Ejecuta: `localStorage.clear()`
3. Ve a `/lobby`
4. Click "🔑 ¿Tienes un código de recuperación?"
5. Introduce código (ej: `ABC-123`)
6. ✅ Debe recuperar sesión y llevar a `/game`

### Prueba 3: Código inválido

1. Ve a `/lobby`
2. Click "🔑 ¿Tienes un código de recuperación?"
3. Introduce código inválido (ej: `XYZ999`)
4. ✅ Debe mostrar error "Código inválido o no encontrado"

## 📊 Consultas útiles

### Ver todos los códigos generados
```sql
SELECT alias, recovery_code, created_at
FROM participants
WHERE recovery_code IS NOT NULL
ORDER BY created_at DESC;
```

### Buscar participante por código
```sql
SELECT * FROM participants WHERE recovery_code = 'ABC123';
```

### Regenerar código para un participante específico
```sql
UPDATE participants
SET recovery_code = 'NEW123'
WHERE id = 'participant-id-here';
```

## ⚠️ Notas importantes

1. **Unicidad**: Los códigos son únicos. No puede haber dos participantes con el mismo código.

2. **Participantes existentes**: Los participantes creados antes de esta migración tendrán `recovery_code = NULL`. Esto es normal y no afecta su funcionamiento (seguirán usando localStorage).

3. **Seguridad**: Los códigos son de 6 caracteres para balance entre seguridad y usabilidad en talleres. Si necesitas más seguridad, modifica `generateRecoveryCode()` para generar códigos más largos.

4. **Formato**: Los códigos se muestran como `ABC-123` (con guión) pero se guardan como `ABC123` (sin guión) en la BD. La función `normalizeRecoveryCode()` maneja ambos formatos.

## 🎓 Recomendaciones para talleres

1. **Antes del evento**: Avisa a los participantes que tendrán un código de recuperación
2. **Durante la creación de perfil**: Recuérdales que anoten el código
3. **En universidades/empresas**: Menciona que el código es especialmente útil si cambian de dispositivo o si localStorage está bloqueado
4. **Proyecta el código**: Si es presencial, los participantes pueden hacer foto de la pantalla proyectada

## 🐛 Troubleshooting

### "Error: duplicate key value violates unique constraint"
**Causa**: Dos usuarios intentaron registrarse con el mismo código (muy improbable, pero posible)
**Solución**: La función genera códigos aleatorios. Pide al usuario que vuelva a intentar crear su perfil.

### "Código inválido o no encontrado"
**Causas posibles**:
1. Usuario escribió el código mal
2. El participante fue eliminado de la BD (reset de partida)
3. Código con espacios/caracteres extra

**Solución**: Verifica el código en la BD con `SELECT * FROM participants WHERE recovery_code = 'ABC123'`

## 📝 Changelog

### v1.0 (2026-02-23)
- ✅ Sistema de códigos de recuperación implementado
- ✅ Modal informativo tras crear perfil
- ✅ Recuperación por código en lobby
- ✅ Soporte multiidioma (ES, EN, CAT)
- ✅ Fallback automático a localStorage cuando disponible
