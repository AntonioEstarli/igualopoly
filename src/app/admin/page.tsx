'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabaseClient';

export default function AdminPanel() {
  // Estado de autenticación
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [faseActual, setFaseActual] = useState('setup');
  const [propuestas, setPropuestas] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalJugadores: 0, salasActivas: 0 });
  const [usuarios, setUsuarios] = useState<any[]>([]);
  // perfiles del sistema
  const [systemProfiles, setSystemProfiles] = useState<any[]>([]); // Para guardar los perfiles de la DB
  const [editingProfile, setEditingProfile] = useState<any>(null); // Perfil que se está editando
  const [isAddingProfile, setIsAddingProfile] = useState(false); // Para crear nuevo perfil
  // perfiles del sistema FINAL
  const [systemProfilesFinal, setSystemProfilesFinal] = useState<any[]>([]);
  const [editingProfileFinal, setEditingProfileFinal] = useState<any>(null);
  const [isAddingProfileFinal, setIsAddingProfileFinal] = useState(false);
  const variables = ['red', 'visibilidad', 'tiempo', 'margen_error', 'responsabilidades'];
  // Cartas del sistema
  const [cards, setCards] = useState<any[]>([]);
  const [editingCard, setEditingCard] = useState<any>(null);
  const [isAddingCard, setIsAddingCard] = useState(false);
  // Valores del dado
  const [diceValues, setDiceValues] = useState<any[]>([]);
  const [editingDiceValue, setEditingDiceValue] = useState<any>(null);
  const [isAddingDiceValue, setIsAddingDiceValue] = useState(false);
  // Salas y Reset
  const [numSalas, setNumSalas] = useState(5); // Estado para el número de salas
  const [isResetting, setIsResetting] = useState(false);
  // Estado de las salas en tiempo real
  const [rooms, setRooms] = useState<any[]>([]);
  // Mostrar/ocultar configuración avanzada
  const [showConfig, setShowConfig] = useState(false);

  // Verificar autenticación al cargar
  useEffect(() => {
    const authStatus = sessionStorage.getItem('admin_authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  // Función para manejar el login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

    if (passwordInput === correctPassword) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_authenticated', 'true');
      setPasswordError(false);
      setPasswordInput('');
    } else {
      setPasswordError(true);
    }
  };

  // Función para hacer logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_authenticated');
    setPasswordInput('');
  };

  // Reset
  const iniciarNuevaPartida = async () => {
    const confirmar = confirm("⚠️ ¿Estás seguro? Esto borrará TODOS los jugadores, propuestas y votos actuales para empezar de cero.");
    if (!confirmar) return;

    setIsResetting(true);
    try {
      // 1. Eliminar datos de tablas dependientes (Votos y Propuestas)
      await supabase.from('votes').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Borra todo
      await supabase.from('rule_proposals').delete().neq('id', 0);

      // 2. Eliminar participantes
      await supabase.from('participants').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      // 3. Ajustar tabla de salas (rooms)
      // Primero borramos las existentes
      // Usamos un filtro que siempre sea cierto para borrar todo
      const { error: deleteError } = await supabase.from('rooms').delete().neq('id', '_none_');
      if (deleteError) throw deleteError;

      // Generamos las nuevas salas según el número indicado
      const nuevasSalas = Array.from({ length: numSalas }, (_, i) => ({
        id: `sala_${i + 1}`,
        name: `Sala ${i + 1}`,
        capacity: 5,
        current_phase: 'playing',
        next_dice_index: 0
      }));

      const { error: insertError } = await supabase.from('rooms').insert(nuevasSalas);
      if (insertError) {
        console.error("Error detallado al insertar salas:", insertError);
        alert("Error al crear salas: " + insertError.message);
      } else {
        alert("🚀 ¡Partida reseteada con éxito!");
        window.location.reload();
      }
    } catch (error) {
      console.error("Error en el reset:", error);
      alert("Hubo un error al resetear la partida.");
    } finally {
      setIsResetting(false);
    }
  };

  // Función para cargar las salas
  const fetchRooms = async () => {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error("Error cargando salas:", error);
    } else {
      setRooms(data || []);
    }
  };

  // Función para cargar los perfiles del sistema
  const fetchSystemProfiles = async () => {
    const { data, error } = await supabase
      .from('system_profiles')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error("Error cargando perfiles de sistema:", error);
    } else {
      setSystemProfiles(data || []);
    }
  };

  // Función para cargar los perfiles del sistema FINAL
  const fetchSystemProfilesFinal = async () => {
    const { data, error } = await supabase
      .from('system_profiles_final')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error("Error cargando perfiles de sistema final:", error);
    } else {
      setSystemProfilesFinal(data || []);
    }
  };

  // Función para cargar las cartas del sistema
  const fetchCards = async () => {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error("Error cargando cartas:", error);
    } else {
      setCards(data || []);
    }
  };

  // Función para cargar los valores del dado
  const fetchDiceValues = async () => {
    const { data, error } = await supabase
      .from('fake_dice_values')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error("Error cargando valores del dado:", error);
    } else {
      setDiceValues(data || []);
    }
  };

  // Funciones para gestionar valores del dado
  const createDiceValue = async (diceValue: any) => {
    const { error } = await supabase
      .from('fake_dice_values')
      .insert([{ value: diceValue.value }]);

    if (error) {
      alert("Error al crear valor del dado: " + error.message);
    } else {
      setIsAddingDiceValue(false);
      setEditingDiceValue(null);
      fetchDiceValues();
    }
  };

  const updateDiceValue = async (diceValue: any) => {
    const { error } = await supabase
      .from('fake_dice_values')
      .update({ value: diceValue.value })
      .eq('id', diceValue.id);

    if (error) {
      alert("Error al actualizar valor del dado: " + error.message);
    } else {
      setEditingDiceValue(null);
      fetchDiceValues();
    }
  };

  const deleteDiceValue = async (diceValueId: number) => {
    const confirmar = confirm("¿Estás seguro de eliminar este valor?");
    if (!confirmar) return;

    const { error } = await supabase
      .from('fake_dice_values')
      .delete()
      .eq('id', diceValueId);

    if (error) {
      alert("Error al eliminar valor del dado: " + error.message);
    } else {
      fetchDiceValues();
    }
  };

  // Funciones para gestionar perfiles del sistema (Arquetipos)
  const createSystemProfile = async (profile: any) => {
    // Generar el siguiente ID basándose en el patrón existente (p1, p2, p3...)
    const maxNum = systemProfiles.reduce((max, p) => {
      const num = parseInt(p.id.replace('p', '')) || 0;
      return num > max ? num : max;
    }, 0);
    const newId = `p${maxNum + 1}`;

    const { error } = await supabase
      .from('system_profiles')
      .insert([{
        id: newId,
        alias: profile.alias,
        color: profile.color,
        red: profile.red,
        visibilidad: profile.visibilidad,
        tiempo: profile.tiempo,
        margen_error: profile.margen_error,
        responsabilidades: profile.responsabilidades
      }]);

    if (error) {
      alert("Error al crear arquetipo: " + error.message);
    } else {
      setIsAddingProfile(false);
      setEditingProfile(null);
      fetchSystemProfiles();
    }
  };

  const updateSystemProfile = async (profile: any) => {
    const { error } = await supabase
      .from('system_profiles')
      .update({
        alias: profile.alias,
        color: profile.color,
        red: profile.red,
        visibilidad: profile.visibilidad,
        tiempo: profile.tiempo,
        margen_error: profile.margen_error,
        responsabilidades: profile.responsabilidades
      })
      .eq('id', profile.id);

    if (error) {
      alert("Error al actualizar: " + error.message);
    } else {
      setEditingProfile(null);
      fetchSystemProfiles();
    }
  };

  const deleteSystemProfile = async (profileId: string) => {
    const confirmar = confirm("¿Estás seguro de eliminar este arquetipo?");
    if (!confirmar) return;

    const { error } = await supabase
      .from('system_profiles')
      .delete()
      .eq('id', profileId);

    if (error) {
      alert("Error al eliminar arquetipo: " + error.message);
    } else {
      fetchSystemProfiles();
    }
  };

  // Funciones para gestionar perfiles del sistema FINAL (Arquetipos FINAL)
  const createSystemProfileFinal = async (profile: any) => {
    const maxNum = systemProfilesFinal.reduce((max, p) => {
      const num = parseInt(p.id.replace('p', '')) || 0;
      return num > max ? num : max;
    }, 0);
    const newId = `p${maxNum + 1}`;

    const { error } = await supabase
      .from('system_profiles_final')
      .insert([{
        id: newId,
        alias: profile.alias,
        color: profile.color,
        red: profile.red,
        visibilidad: profile.visibilidad,
        tiempo: profile.tiempo,
        margen_error: profile.margen_error,
        responsabilidades: profile.responsabilidades
      }]);

    if (error) {
      alert("Error al crear arquetipo final: " + error.message);
    } else {
      setIsAddingProfileFinal(false);
      setEditingProfileFinal(null);
      fetchSystemProfilesFinal();
    }
  };

  const updateSystemProfileFinal = async (profile: any) => {
    const { error } = await supabase
      .from('system_profiles_final')
      .update({
        alias: profile.alias,
        color: profile.color,
        red: profile.red,
        visibilidad: profile.visibilidad,
        tiempo: profile.tiempo,
        margen_error: profile.margen_error,
        responsabilidades: profile.responsabilidades
      })
      .eq('id', profile.id);

    if (error) {
      alert("Error al actualizar arquetipo final: " + error.message);
    } else {
      setEditingProfileFinal(null);
      fetchSystemProfilesFinal();
    }
  };

  const deleteSystemProfileFinal = async (profileId: string) => {
    const confirmar = confirm("¿Estás seguro de eliminar este arquetipo final?");
    if (!confirmar) return;

    const { error } = await supabase
      .from('system_profiles_final')
      .delete()
      .eq('id', profileId);

    if (error) {
      alert("Error al eliminar arquetipo final: " + error.message);
    } else {
      fetchSystemProfilesFinal();
    }
  };

  // Funciones para gestionar cartas
  const createCard = async (card: any) => {
    const { error } = await supabase
      .from('cards')
      .insert([card]);

    if (error) {
      alert("Error al crear carta: " + error.message);
    } else {
      setIsAddingCard(false);
      setEditingCard(null);
      fetchCards();
    }
  };

  const updateCard = async (card: any) => {
    const { error } = await supabase
      .from('cards')
      .update({
        name_es: card.name_es,
        name_en: card.name_en,
        name_cat: card.name_cat,
        situation_es: card.situation_es,
        situation_en: card.situation_en,
        situation_cat: card.situation_cat,
        impact_variable: card.impact_variable,
        impact_variable_2: card.impact_variable_2,
        impact_values: card.impact_values,
        color: card.color
      })
      .eq('id', card.id);

    if (error) {
      alert("Error al actualizar carta: " + error.message);
    } else {
      setEditingCard(null);
      fetchCards();
    }
  };

  const deleteCard = async (cardId: number) => {
    const confirmar = confirm("¿Estás seguro de eliminar esta carta?");
    if (!confirmar) return;

    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', cardId);

    if (error) {
      alert("Error al eliminar carta: " + error.message);
    } else {
      fetchCards();
    }
  };

  const reasignarSala = async (usuarioId: string, nuevaSala: string) => {
    await supabase
      .from('participants')
      .update({ minisala_id: nuevaSala })
      .eq('id', usuarioId);
  };

  const cambiarFase = async (nuevaFase: string) => {
    // Actualiza la fase en la base de datos para que todos los clientes cambien de pantalla
    await supabase.from('sessions').update({ phase: nuevaFase }).eq('id', 'SALA_ACTUAL');
    setFaseActual(nuevaFase);
  };

  const exportToCSV = async () => {
    // 1. Obtener participantes ordenados por puntos
    const { data: participants } = await supabase
      .from('participants')
      .select('alias, money, minisala_id, is_leader')
      .order('money', { ascending: false });

    // 2. Obtener propuestas con votos
    const { data: proposals } = await supabase
      .from('rule_proposals')
      .select('proposal_text, votes')
      .order('votes', { ascending: false });

    if (!participants && !proposals) {
      alert("No hay datos para exportar");
      return;
    }

    // 3. Fecha de la partida (fecha actual cuando se pulsa el botón)
    const fechaPartida = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // 4. Construir el CSV con múltiples secciones
    let csvContent = '';

    // Sección 1: Fecha
    csvContent += `FECHA DE LA PARTIDA\n`;
    csvContent += `"${fechaPartida}"\n\n`;

    // Sección 2: Participantes
    csvContent += `PARTICIPANTES (Ordenados por Puntos)\n`;
    csvContent += `Alias,Sala,Rol,Puntos\n`;

    if (participants && participants.length > 0) {
      participants.forEach(p => {
        const rol = p.is_leader ? 'Líder' : 'Participante';
        const sala = p.minisala_id || 'Sin sala';
        csvContent += `"${p.alias}","${sala}","${rol}",${p.money}\n`;
      });
    }

    csvContent += `\n`;

    // Sección 3: Propuestas
    csvContent += `PROPUESTAS\n`;
    csvContent += `Propuesta,Votos\n`;

    if (proposals && proposals.length > 0) {
      proposals.forEach(prop => {
        csvContent += `"${prop.proposal_text}",${prop.votes}\n`;
      });
    }

    // 5. Crear y descargar el archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    // Formatear fecha para el nombre del archivo (DD-MM-YYYY)
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const fileName = `resultados_igualopoly_${day}-${month}-${year}.csv`;

    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.click();

    // Liberar el objeto URL
    URL.revokeObjectURL(url);
  };

  const asignarLider = async (usuarioId: string, salaId: string) => {
    // 1. Quitamos el rol de líder a todos en esa minisala específica
    await supabase
      .from('participants')
      .update({ is_leader: false })
      .eq('minisala_id', salaId);

    // 2. Asignamos el nuevo líder
    await supabase
      .from('participants')
      .update({ is_leader: true })
      .eq('id', usuarioId);
  };

  // Activar votación global en todas las salas
  const activateGlobalVoting = async () => {
    // Verificar el estado de todas las salas
    const { data: currentRooms } = await supabase
      .from('rooms')
      .select('id, current_phase');

    if (!currentRooms || currentRooms.length === 0) {
      alert("No hay salas configuradas.");
      return;
    }

    const allInRanking = currentRooms.every(room => room.current_phase === 'ranking');

    let confirmar: boolean;
    if (allInRanking) {
      confirmar = confirm("✅ Todas las salas están listas. ¿Quieres pasar a la votación?");
    } else {
      confirmar = confirm("⚠️ ¡Cuidado! Hay alguna sala que no ha terminado. ¿Seguro que quieres pasar a la votación?");
    }

    if (!confirmar) return;

    // Actualizar todas las salas a 'voting'
    const { error: roomsError } = await supabase
      .from('rooms')
      .update({ current_phase: 'voting' })
      .neq('id', '_none_');

    if (roomsError) {
      alert("Error al actualizar salas: " + roomsError.message);
      return;
    }

    // Actualizar todos los participantes a 'voting'
    const { error: participantsError } = await supabase
      .from('participants')
      .update({ current_phase: 'voting' })
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (participantsError) {
      alert("Error al actualizar participantes: " + participantsError.message);
    } else {
      alert("🗳️ ¡Votación activada para todos los jugadores!");
    }
  };

  // Finalizar y ver el podio
  const finalizarYVerPodio = async () => {
    const confirmar = confirm("¿Deseas cerrar las votaciones y mostrar el podio a todos los participantes?");
    if (!confirmar) return;

    // Actualizamos a TODOS los participantes de todas las salas a la fase 'podium'
    const { error } = await supabase
      .from('participants')
      .update({ current_phase: 'podium' })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Truco para afectar a todos

    if (error) {
      alert("Error al activar podio: " + error.message);
    } else {
      alert("¡Podio activado para todos los jugadores!");
    }
  };

  // Iniciar simulación final con arquetipos igualados
  const iniciarSimulacionFinal = async () => {
    const confirmar = confirm("⚠️ ¿Estás seguro? Esto reiniciará el juego para todos los participantes usando los arquetipos finales (más igualados).");
    if (!confirmar) return;

    try {
      // 1. Reiniciar el dinero de todos los participantes a 0 y cambiar a fase 'final'
      const { error: participantsError } = await supabase
        .from('participants')
        .update({
          money: 0,
          current_phase: 'final'
        })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (participantsError) {
        alert("Error al actualizar participantes: " + participantsError.message);
        return;
      }

      // 2. Reiniciar las salas: current_step=0, next_dice_index=0, current_phase='final'
      const { error: roomsError } = await supabase
        .from('rooms')
        .update({
          current_step: 0,
          next_dice_index: 0,
          current_phase: 'final'
        })
        .neq('id', '_none_');

      if (roomsError) {
        alert("Error al actualizar salas: " + roomsError.message);
        return;
      }

      alert("🎯 ¡Simulación final activada! Los líderes verán el botón para empezar.");
    } catch (error) {
      console.error("Error al iniciar simulación final:", error);
      alert("Hubo un error al iniciar la simulación final.");
    }
  };

  // useEffect para escuchar propuestas - solo si está autenticado
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchPropuestas = async () => {
      const { data } = await supabase
        .from('rule_proposals')
        .select('*')
        .order('votes', { ascending: false });
      setPropuestas(data || []);
    };

    fetchPropuestas();
    const channel = supabase.channel('admin_monitor')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rule_proposals' }, () => {
        fetchPropuestas();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isAuthenticated]);

  // useEffect para cargar usuarios, perfiles y cartas - solo si está autenticado
  useEffect(() => {
    if (!isAuthenticated) return;

    // Carga inicial
    const fetchUsuarios = async () => {
      const { data } = await supabase
        .from('participants')
        .select('*')
        .order('minisala_id', { ascending: true })
        .order('id', { ascending: true });
      setUsuarios(data || []);
    };
    fetchUsuarios();

    fetchSystemProfiles();
    fetchSystemProfilesFinal();
    fetchCards();
    fetchDiceValues();
    fetchRooms();

    // Suscripción Realtime para inserciones y actualizaciones de participantes
    const channel = supabase.channel('admin_refresh')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'participants' },
        (payload) => {
          // Al recibir cualquier cambio, refrescamos la lista automáticamente
          fetchUsuarios();
        }
      )
      .subscribe();

    // Suscripción Realtime para cambios en salas
    const roomsChannel = supabase.channel('admin_rooms_refresh')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'rooms' },
        () => {
          fetchRooms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(roomsChannel);
    };
  }, [isAuthenticated]);

  // Pantalla de carga inicial
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-400 rounded-full animate-spin" />
      </div>
    );
  }

  // Pantalla de login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-slate-800 mb-2">Panel de Admin</h1>
            <p className="text-slate-500 text-sm">Introduce la contraseña para acceder</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">
                Contraseña
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError(false);
                }}
                className={`w-full p-4 border-2 rounded-xl outline-none transition-all ${
                  passwordError
                    ? 'border-red-500 bg-red-50'
                    : 'border-slate-200 focus:border-blue-500'
                }`}
                placeholder="Introduce tu contraseña"
                autoFocus
              />
              {passwordError && (
                <p className="text-red-600 text-xs mt-2 font-bold">
                  ⚠️ Contraseña incorrecta
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-slate-800 text-white rounded-xl font-black shadow-lg hover:bg-slate-900 transition-all active:scale-95"
            >
              Acceder
            </button>
          </form>

          <div className="mt-6 p-4 bg-slate-50 rounded-xl">
            <p className="text-xs text-slate-500 text-center">
              🔒 Acceso restringido solo para administradores
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Panel de Host (Igualopoly)</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-slate-700 text-white rounded-lg font-bold text-sm hover:bg-slate-800 transition-all"
        >
          🚪 Cerrar Sesión
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-6xl mx-auto">

        {/* SECCIÓN NUEVA: CONFIGURACIÓN DE PARTIDA */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100">
          <h2 className="font-bold mb-4 text-red-600 flex items-center gap-2">
            🚀 Nueva Partida
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-500 font-bold uppercase">Número de salas</label>
              <input
                type="number"
                value={numSalas}
                onChange={(e) => setNumSalas(parseInt(e.target.value))}
                min="1" max="20"
                className="w-full mt-1 p-2 border rounded-lg font-bold"
              />
            </div>
            <button
              onClick={iniciarNuevaPartida}
              disabled={isResetting}
              className={`w-full py-3 rounded-xl font-black text-white shadow-lg transition-all ${
                isResetting ? 'bg-slate-400' : 'bg-red-600 hover:bg-red-700 active:scale-95'
              }`}
            >
              {isResetting ? 'Limpiando...' : 'COMENZAR NUEVO JUEGO'}
            </button>
            <p className="text-[10px] text-slate-400 italic text-center">
              Borrará jugadores, votos y propuestas actuales.
            </p>
          </div>
        </div>

        {/* Activar Votación Global */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-purple-100">
          <h2 className="font-bold mb-4 text-purple-600 flex items-center gap-2">
            🗳️ Activar Voto
          </h2>
          <button
            onClick={() => activateGlobalVoting()}
            className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black text-lg shadow-lg hover:bg-purple-700 transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            <span>ACTIVAR VOTACIÓN</span>
            <span className="text-2xl">🗳️</span>
          </button>
          <p className="text-center text-[10px] text-slate-400 mt-2 italic">
            Verifica que todas las salas estén en "Ranking" antes de activar.
          </p>
        </div>

        {/* Finalizar Votación y Ver Podio */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
          <h2 className="font-bold mb-4 text-blue-600 flex items-center gap-2">
            🏆 Cierre del Taller
          </h2>
          <button
            onClick={() => finalizarYVerPodio()}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-lg hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            <span>MOSTRAR PODIO</span>
            <span className="text-2xl">🥇</span>
          </button>
          <p className="text-center text-[10px] text-slate-400 mt-2 italic">
            Esto cambiará la pantalla de todos los jugadores a los resultados finales.
          </p>
        </div>

        {/* Simulación Final */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100 md:col-span-3">
          <h2 className="font-bold mb-4 text-emerald-600 flex items-center gap-2">
            🎯 Simulación Final
          </h2>
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1">
              <p className="text-sm text-slate-600 mb-2">
                Reinicia el juego usando los <strong>arquetipos finales</strong> (más igualados).
                Los jugadores mantendrán su perfil pero verán cómo habría sido el resultado con condiciones más equitativas.
              </p>
              <p className="text-[10px] text-slate-400 italic">
                El dinero se reiniciará a 0, el peón volverá a la salida y se usarán los arquetipos de la tabla "system_profiles_final".
              </p>
            </div>
            <button
              onClick={() => iniciarSimulacionFinal()}
              className="w-full md:w-auto px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-lg shadow-lg hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              <span>INICIAR SIMULACIÓN</span>
              <span className="text-2xl">🎯</span>
            </button>
          </div>
        </div>

        {/* Exportar Resultados */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 md:col-span-3">
          <h2 className="font-bold mb-4 text-slate-600 flex items-center gap-2">
            📥 Exportar Datos
          </h2>
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1">
              <p className="text-sm text-slate-600 mb-2">
                Exporta todos los resultados de la partida en formato CSV: participantes ordenados por puntos (con sala, rol), propuestas con votos, y fecha de la partida.
              </p>
              <p className="text-[10px] text-slate-400 italic">
                El archivo incluirá la fecha actual como fecha de la partida.
              </p>
            </div>
            <button
              onClick={exportToCSV}
              className="w-full md:w-auto px-8 py-4 bg-slate-800 text-white rounded-2xl font-black text-lg shadow-lg hover:bg-slate-900 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              <span>EXPORTAR CSV</span>
              <span className="text-2xl">📥</span>
            </button>
          </div>
        </div>

        {/* Monitor de Propuestas - Ocupa toda la fila */}
        <div className="bg-white p-6 rounded-xl shadow-sm border md:col-span-3">
          <h2 className="font-bold mb-4 border-b pb-2 text-slate-600">Banco de Reglas Sugeridas</h2>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {propuestas.length > 0 ? propuestas.map((p) => (
              <div key={p.id} className="p-3 bg-slate-50 border-l-4 border-slate-400 rounded flex justify-between items-center">
                <span className="text-sm italic">"{p.proposal_text}"</span>
                <span className="text-xs font-black bg-white px-2 py-1 rounded shadow-sm text-slate-700">
                  {p.votes} VOTOS
                </span>
              </div>
            )) : <p className="text-slate-400 text-sm italic py-4">Esperando propuestas...</p>}
          </div>
        </div>

      </div>

      {/* Usuarios y salas */}
      <div className="p-8 max-w-6xl mx-auto">
        {/* SECCIÓN 0: ESTADO DE LAS SALAS */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            🏠 Salas
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {rooms.map(room => {
              const phaseColors: Record<string, string> = {
                playing: 'bg-green-100 text-green-700 border-green-200',
                ranking: 'bg-purple-100 text-purple-700 border-purple-200',
                voting: 'bg-blue-100 text-blue-700 border-blue-200',
                podium: 'bg-yellow-100 text-yellow-700 border-yellow-200'
              };
              const phaseLabels: Record<string, string> = {
                playing: '▶️ Jugando',
                ranking: '🏆 Ranking',
                voting: '🗳️ Votando',
                podium: '🥇 Podio'
              };
              const phaseClass = phaseColors[room.current_phase] || 'bg-slate-100 text-slate-600 border-slate-200';
              const phaseLabel = phaseLabels[room.current_phase] || room.current_phase;

              return (
                <div
                  key={room.id}
                  className="bg-white p-4 rounded-xl border shadow-sm flex flex-col items-center gap-2"
                >
                  <span className="font-black text-slate-700 text-sm">{room.name}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${phaseClass}`}>
                    {phaseLabel}
                  </span>
                </div>
              );
            })}
          </div>
          {rooms.length === 0 && (
            <div className="bg-white p-8 rounded-xl border text-center">
              <p className="text-slate-400 italic">No hay salas configuradas. Crea una nueva partida.</p>
            </div>
          )}
        </section>

        {/* SECCIÓN 1: PARTICIPANTES REALES */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            👥 Participantes en Vivo
          </h2>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="p-4">Alias</th>
                  <th className="p-4">Capital Actual</th>
                  <th className="p-4">Sala Actual</th>
                  <th className="p-4">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {usuarios.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors animate-fade-in">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {/* Avatar circular con el color y emoji elegido */}
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-sm"
                          style={{ backgroundColor: u.color + '20', border: `2px solid ${u.color}` }}
                        >
                          {u.emoji || '👤'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-700">{u.alias}</div>
                          {/* <div className="text-[10px] text-slate-400 font-mono">{u.id}</div> */}
                        </div>
                      </div>
                    </td>

                    {/* MOSTRAR PUNTOS EN TIEMPO REAL */}
                    <td className="p-4">
                      <span className={`inline-block px-3 py-1 rounded-full font-black text-sm ${u.money >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                        {u.money} €
                      </span>
                    </td>

                    <td className="p-4">
                      <select
                        value={u.minisala_id}
                        onChange={(e) => reasignarSala(u.id, e.target.value)}
                        className="bg-slate-100 border-none text-xs font-bold rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                      >
                        {/* Generar opciones dinámicamente según numSalas si quieres, o dejarlas fijas */}
                        <option value="sala_1">Sala 1</option>
                        <option value="sala_2">Sala 2</option>
                        <option value="sala_3">Sala 3</option>
                        <option value="sala_4">Sala 4</option>
                        <option value="sala_5">Sala 5</option>
                      </select>
                    </td>
                    <td className="p-4 flex gap-2">
                      <button
                        onClick={() => asignarLider(u.id, u.minisala_id)}
                        className={`px-4 py-1.5 rounded-full text-xs font-black transition-all shadow-sm ${u.is_leader
                          ? 'bg-yellow-400 text-yellow-900 ring-2 ring-yellow-200'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                      >
                        {u.is_leader ? '🌟 LÍDER' : 'HACER LÍDER'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {usuarios.length === 0 && (
              <p className="p-8 text-center text-slate-400 italic">No hay jugadores conectados...</p>
            )}
          </div>
        </section>

        {/* Botón para mostrar/ocultar configuración avanzada */}
        <div className="mt-8 mb-4">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-700 font-bold text-sm transition-all"
          >
            <span className={`transform transition-transform ${showConfig ? 'rotate-90' : ''}`}>▶</span>
            {showConfig ? 'Ocultar configuración avanzada' : 'Mostrar configuración avanzada'}
          </button>
        </div>

        {/* SECCIONES DE CONFIGURACIÓN (ocultas por defecto) */}
        {showConfig && (
          <>
            {/* SECCIÓN 2: PERFILES DE SISTEMA */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  ⚙️ Configuración del Sistema (Arquetipos)
                </h2>
                <button
                  onClick={() => {
                    setEditingProfile({
                      alias: '',
                      color: '#6366f1',
                      red: 'MEDIO',
                      visibilidad: 'MEDIO',
                      tiempo: 'MEDIO',
                      margen_error: 'MEDIO',
                      responsabilidades: 'MEDIO'
                    });
                    setIsAddingProfile(true);
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 shadow-sm"
                >
                  + Nuevo Arquetipo
                </button>
              </div>
              <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                    <tr>
                      <th className="p-4">Color</th>
                      <th className="p-4">Nombre</th>
                      <th className="p-4">Red</th>
                      <th className="p-4">Visibilidad</th>
                      <th className="p-4">Tiempo</th>
                      <th className="p-4">Margen Error</th>
                      <th className="p-4">Responsabilidades</th>
                      <th className="p-4">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {systemProfiles.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <div className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: p.color }} />
                        </td>
                        <td className="p-4 font-bold text-slate-700">{p.alias}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${p.red === 'ALTO' ? 'bg-green-100 text-green-700' : p.red === 'MEDIO' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                            {p.red}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${p.visibilidad === 'ALTO' ? 'bg-green-100 text-green-700' : p.visibilidad === 'MEDIO' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                            {p.visibilidad}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${p.tiempo === 'ALTO' ? 'bg-green-100 text-green-700' : p.tiempo === 'MEDIO' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                            {p.tiempo}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${p.margen_error === 'ALTO' ? 'bg-green-100 text-green-700' : p.margen_error === 'MEDIO' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                            {p.margen_error}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${p.responsabilidades === 'ALTO' ? 'bg-green-100 text-green-700' : p.responsabilidades === 'MEDIO' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                            {p.responsabilidades}
                          </span>
                        </td>
                        <td className="p-4 flex gap-2">
                          <button
                            onClick={() => {
                              setEditingProfile(p);
                              setIsAddingProfile(false);
                            }}
                            className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg text-xs font-bold border border-blue-100"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => deleteSystemProfile(p.id)}
                            className="text-red-600 hover:bg-red-50 px-3 py-1 rounded-lg text-xs font-bold border border-red-100"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {systemProfiles.length === 0 && (
                  <p className="p-8 text-center text-slate-400 italic">No hay arquetipos configurados...</p>
                )}
              </div>
            </section>

            {/* SECCIÓN 2.5: PERFILES DE SISTEMA FINAL */}
            <section className="mt-12">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  🏁 Configuración del Sistema (Arquetipos FINAL)
                </h2>
                <button
                  onClick={() => {
                    setEditingProfileFinal({
                      alias: '',
                      color: '#6366f1',
                      red: 'MEDIO',
                      visibilidad: 'MEDIO',
                      tiempo: 'MEDIO',
                      margen_error: 'MEDIO',
                      responsabilidades: 'MEDIO'
                    });
                    setIsAddingProfileFinal(true);
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 shadow-sm"
                >
                  + Nuevo Arquetipo Final
                </button>
              </div>
              <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                    <tr>
                      <th className="p-4">Color</th>
                      <th className="p-4">Nombre</th>
                      <th className="p-4">Red</th>
                      <th className="p-4">Visibilidad</th>
                      <th className="p-4">Tiempo</th>
                      <th className="p-4">Margen Error</th>
                      <th className="p-4">Responsabilidades</th>
                      <th className="p-4">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {systemProfilesFinal.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <div className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: p.color }} />
                        </td>
                        <td className="p-4 font-bold text-slate-700">{p.alias}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${p.red === 'ALTO' ? 'bg-green-100 text-green-700' : p.red === 'MEDIO' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                            {p.red}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${p.visibilidad === 'ALTO' ? 'bg-green-100 text-green-700' : p.visibilidad === 'MEDIO' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                            {p.visibilidad}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${p.tiempo === 'ALTO' ? 'bg-green-100 text-green-700' : p.tiempo === 'MEDIO' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                            {p.tiempo}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${p.margen_error === 'ALTO' ? 'bg-green-100 text-green-700' : p.margen_error === 'MEDIO' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                            {p.margen_error}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${p.responsabilidades === 'ALTO' ? 'bg-green-100 text-green-700' : p.responsabilidades === 'MEDIO' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                            {p.responsabilidades}
                          </span>
                        </td>
                        <td className="p-4 flex gap-2">
                          <button
                            onClick={() => {
                              setEditingProfileFinal(p);
                              setIsAddingProfileFinal(false);
                            }}
                            className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg text-xs font-bold border border-blue-100"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => deleteSystemProfileFinal(p.id)}
                            className="text-red-600 hover:bg-red-50 px-3 py-1 rounded-lg text-xs font-bold border border-red-100"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {systemProfilesFinal.length === 0 && (
                  <p className="p-8 text-center text-slate-400 italic">No hay arquetipos finales configurados...</p>
                )}
              </div>
            </section>

        {/* SECCIÓN 3: CONFIGURACIÓN DE CARTAS */}
        <section className="mt-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              🃏 Configuración de Cartas
            </h2>
            <button
              onClick={() => {
                setEditingCard({
                  name_es: '',
                  name_en: '',
                  name_cat: '',
                  situation_es: '',
                  situation_en: '',
                  situation_cat: '',
                  impact_variable: 'red',
                  impact_variable_2: '',
                  impact_values: { ALTO: 0, MEDIO: 0, BAJO: 0 },
                  color: '#6366f1'
                });
                setIsAddingCard(true);
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 shadow-sm"
            >
              + Nueva Carta
            </button>
          </div>
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="p-4">ID</th>
                  <th className="p-4">Color</th>
                  <th className="p-4">Nombre</th>
                  <th className="p-4">Situación</th>
                  <th className="p-4">Variable Impacto</th>
                  <th className="p-4">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {cards.map(card => (
                  <tr key={card.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-mono text-sm text-slate-500">{card.id}</td>
                    <td className="p-4">
                      <div className="w-8 h-8 rounded-lg border-2 border-white shadow-sm" style={{ backgroundColor: card.color || '#6366f1' }} />
                    </td>
                    <td className="p-4 font-bold text-slate-700">{card.name_es}</td>
                    <td className="p-4 text-sm text-slate-600 max-w-md truncate">{card.situation_es}</td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">
                          {card.impact_variable}
                        </span>
                        {card.impact_variable_2 && (
                          <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-bold">
                            {card.impact_variable_2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 flex gap-2">
                      <button
                        onClick={() => {
                          setEditingCard(card);
                          setIsAddingCard(false);
                        }}
                        className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg text-xs font-bold border border-blue-100"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => deleteCard(card.id)}
                        className="text-red-600 hover:bg-red-50 px-3 py-1 rounded-lg text-xs font-bold border border-red-100"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {cards.length === 0 && (
              <p className="p-8 text-center text-slate-400 italic">No hay cartas configuradas...</p>
            )}
          </div>
        </section>

        {/* SECCIÓN 4: CONFIGURACIÓN DEL DADO */}
        <section className="mt-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              🎲 Configuración del Dado
            </h2>
            <button
              onClick={() => {
                setEditingDiceValue({ value: 1 });
                setIsAddingDiceValue(true);
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 shadow-sm"
            >
              + Nuevo Valor
            </button>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            Secuencia de valores predeterminados del dado. El líder usará estos valores en orden.
          </p>
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="p-4">Orden</th>
                  <th className="p-4">Valor del Dado</th>
                  <th className="p-4">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {diceValues.map((dv, index) => (
                  <tr key={dv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-mono text-sm text-slate-500">{index + 1}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center justify-center w-10 h-10 bg-slate-800 text-white rounded-lg font-black text-xl">
                        {dv.value}
                      </span>
                    </td>
                    <td className="p-4 flex gap-2">
                      <button
                        onClick={() => {
                          setEditingDiceValue(dv);
                          setIsAddingDiceValue(false);
                        }}
                        className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg text-xs font-bold border border-blue-100"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => deleteDiceValue(dv.id)}
                        className="text-red-600 hover:bg-red-50 px-3 py-1 rounded-lg text-xs font-bold border border-red-100"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {diceValues.length === 0 && (
              <p className="p-8 text-center text-slate-400 italic">No hay valores configurados. El dado usará valores aleatorios.</p>
            )}
          </div>
        </section>
          </>
        )}

        {/* MODAL DE EDICIÓN/CREACIÓN DE PERFILES */}
        {editingProfile && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <h3 className="text-2xl font-black mb-6">
                {isAddingProfile ? 'Nuevo Arquetipo' : `Editar ${editingProfile.alias}`}
              </h3>
              <div className="space-y-4">
                {/* Nombre del arquetipo */}
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">Nombre</label>
                  <input
                    type="text"
                    value={editingProfile.alias || ''}
                    onChange={(e) => setEditingProfile({ ...editingProfile, alias: e.target.value })}
                    className="w-full p-3 border rounded-lg text-sm font-bold"
                    placeholder="Ej: Perfil Ejecutivo"
                  />
                </div>
                {/* Color del arquetipo */}
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={editingProfile.color || '#6366f1'}
                      onChange={(e) => setEditingProfile({ ...editingProfile, color: e.target.value })}
                      className="w-12 h-12 rounded-lg border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={editingProfile.color || '#6366f1'}
                      onChange={(e) => setEditingProfile({ ...editingProfile, color: e.target.value })}
                      className="flex-1 p-3 border rounded-lg text-sm font-mono"
                      placeholder="#6366f1"
                    />
                  </div>
                </div>
                {/* Variables */}
                <div className="border-t pt-4 mt-4">
                  <label className="text-xs font-bold text-slate-600 uppercase mb-3 block">Variables del Arquetipo</label>
                  {variables.map(v => (
                    <div key={v} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl mb-2">
                      <span className="text-sm font-bold capitalize text-slate-600">{v.replace('_', ' ')}</span>
                      <select
                        value={editingProfile[v]}
                        onChange={(e) => setEditingProfile({ ...editingProfile, [v]: e.target.value })}
                        className="bg-white border rounded-lg px-2 py-1 text-sm font-bold"
                      >
                        <option value="ALTO">ALTO</option>
                        <option value="MEDIO">MEDIO</option>
                        <option value="BAJO">BAJO</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => {
                    setEditingProfile(null);
                    setIsAddingProfile(false);
                  }}
                  className="flex-1 py-3 font-bold text-slate-400 hover:bg-slate-50 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => isAddingProfile ? createSystemProfile(editingProfile) : updateSystemProfile(editingProfile)}
                  className="flex-1 py-3 bg-green-600 text-white rounded-2xl font-bold shadow-lg shadow-green-200 hover:bg-green-700"
                >
                  {isAddingProfile ? 'Crear Arquetipo' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE EDICIÓN/CREACIÓN DE PERFILES FINAL */}
        {editingProfileFinal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <h3 className="text-2xl font-black mb-6">
                {isAddingProfileFinal ? 'Nuevo Arquetipo Final' : `Editar ${editingProfileFinal.alias}`}
              </h3>
              <div className="space-y-4">
                {/* Nombre del arquetipo */}
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">Nombre</label>
                  <input
                    type="text"
                    value={editingProfileFinal.alias || ''}
                    onChange={(e) => setEditingProfileFinal({ ...editingProfileFinal, alias: e.target.value })}
                    className="w-full p-3 border rounded-lg text-sm font-bold"
                    placeholder="Ej: Perfil Ejecutivo"
                  />
                </div>
                {/* Color del arquetipo */}
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={editingProfileFinal.color || '#6366f1'}
                      onChange={(e) => setEditingProfileFinal({ ...editingProfileFinal, color: e.target.value })}
                      className="w-12 h-12 rounded-lg border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={editingProfileFinal.color || '#6366f1'}
                      onChange={(e) => setEditingProfileFinal({ ...editingProfileFinal, color: e.target.value })}
                      className="flex-1 p-3 border rounded-lg text-sm font-mono"
                      placeholder="#6366f1"
                    />
                  </div>
                </div>
                {/* Variables */}
                <div className="border-t pt-4 mt-4">
                  <label className="text-xs font-bold text-slate-600 uppercase mb-3 block">Variables del Arquetipo</label>
                  {variables.map(v => (
                    <div key={v} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl mb-2">
                      <span className="text-sm font-bold capitalize text-slate-600">{v.replace('_', ' ')}</span>
                      <select
                        value={editingProfileFinal[v]}
                        onChange={(e) => setEditingProfileFinal({ ...editingProfileFinal, [v]: e.target.value })}
                        className="bg-white border rounded-lg px-2 py-1 text-sm font-bold"
                      >
                        <option value="ALTO">ALTO</option>
                        <option value="MEDIO">MEDIO</option>
                        <option value="BAJO">BAJO</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => {
                    setEditingProfileFinal(null);
                    setIsAddingProfileFinal(false);
                  }}
                  className="flex-1 py-3 font-bold text-slate-400 hover:bg-slate-50 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => isAddingProfileFinal ? createSystemProfileFinal(editingProfileFinal) : updateSystemProfileFinal(editingProfileFinal)}
                  className="flex-1 py-3 bg-green-600 text-white rounded-2xl font-bold shadow-lg shadow-green-200 hover:bg-green-700"
                >
                  {isAddingProfileFinal ? 'Crear Arquetipo Final' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE EDICIÓN/CREACIÓN DE CARTAS */}
        {editingCard && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-3xl p-8 max-w-6xl w-full shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-black mb-6">
                {isAddingCard ? 'Nueva Carta' : `Editar Carta: ${editingCard.name_es}`}
              </h3>
              <div className="space-y-4">
                {/* Nombres en los tres idiomas - misma fila */}
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">Nombre de la carta</label>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Español</label>
                      <input
                        type="text"
                        value={editingCard.name_es}
                        onChange={(e) => setEditingCard({ ...editingCard, name_es: e.target.value })}
                        className="w-full p-3 border rounded-lg text-sm"
                        placeholder="Ej: Calle Vacante"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">English</label>
                      <input
                        type="text"
                        value={editingCard.name_en}
                        onChange={(e) => setEditingCard({ ...editingCard, name_en: e.target.value })}
                        className="w-full p-3 border rounded-lg text-sm"
                        placeholder="Ex: Vacant Street"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Català</label>
                      <input
                        type="text"
                        value={editingCard.name_cat}
                        onChange={(e) => setEditingCard({ ...editingCard, name_cat: e.target.value })}
                        className="w-full p-3 border rounded-lg text-sm"
                        placeholder="Ex: Carrer Vacant"
                      />
                    </div>
                  </div>
                </div>

                {/* Color de la carta */}
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">Color de la carta</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={editingCard.color || '#6366f1'}
                      onChange={(e) => setEditingCard({ ...editingCard, color: e.target.value })}
                      className="w-16 h-12 rounded-lg border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={editingCard.color || '#6366f1'}
                      onChange={(e) => setEditingCard({ ...editingCard, color: e.target.value })}
                      className="flex-1 p-3 border rounded-lg text-sm font-mono"
                      placeholder="#6366f1"
                    />
                    <div
                      className="w-12 h-12 rounded-lg border-2 border-white shadow-lg"
                      style={{ backgroundColor: editingCard.color || '#6366f1' }}
                    />
                  </div>
                </div>

                {/* Situaciones en los tres idiomas - misma fila */}
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">Situación</label>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Español</label>
                      <textarea
                        value={editingCard.situation_es}
                        onChange={(e) => setEditingCard({ ...editingCard, situation_es: e.target.value })}
                        className="w-full p-3 border rounded-lg text-sm resize-none"
                        rows={3}
                        placeholder="Describe la situación..."
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">English</label>
                      <textarea
                        value={editingCard.situation_en}
                        onChange={(e) => setEditingCard({ ...editingCard, situation_en: e.target.value })}
                        className="w-full p-3 border rounded-lg text-sm resize-none"
                        rows={3}
                        placeholder="Describe the situation..."
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Català</label>
                      <textarea
                        value={editingCard.situation_cat}
                        onChange={(e) => setEditingCard({ ...editingCard, situation_cat: e.target.value })}
                        className="w-full p-3 border rounded-lg text-sm resize-none"
                        rows={3}
                        placeholder="Descriu la situació..."
                      />
                    </div>
                  </div>
                </div>

                {/* Variables de impacto - misma fila */}
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">Variables de Impacto</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Variable 1</label>
                      <select
                        value={editingCard.impact_variable}
                        onChange={(e) => setEditingCard({ ...editingCard, impact_variable: e.target.value })}
                        className="w-full p-3 border rounded-lg text-sm font-bold"
                      >
                        <option value="red">Red</option>
                        <option value="visibilidad">Visibilidad</option>
                        <option value="tiempo">Tiempo</option>
                        <option value="margen_error">Margen de Error</option>
                        <option value="responsabilidades">Responsabilidades</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Variable 2 (Opcional)</label>
                      <select
                        value={editingCard.impact_variable_2 || ''}
                        onChange={(e) => setEditingCard({ ...editingCard, impact_variable_2: e.target.value || null })}
                        className="w-full p-3 border rounded-lg text-sm font-bold"
                      >
                        <option value="">-- Ninguna --</option>
                        <option value="red">Red</option>
                        <option value="visibilidad">Visibilidad</option>
                        <option value="tiempo">Tiempo</option>
                        <option value="margen_error">Margen de Error</option>
                        <option value="responsabilidades">Responsabilidades</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Valores de impacto */}
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">Valores de Impacto Económico</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['ALTO', 'MEDIO', 'BAJO'].map(level => (
                      <div key={level} className="bg-slate-50 p-3 rounded-xl">
                        <span className="text-xs font-bold text-slate-500 block mb-1">{level}</span>
                        <input
                          type="number"
                          value={editingCard.impact_values?.[level] || 0}
                          onChange={(e) => setEditingCard({
                            ...editingCard,
                            impact_values: {
                              ...editingCard.impact_values,
                              [level]: parseInt(e.target.value) || 0
                            }
                          })}
                          className="w-full p-2 border rounded-lg text-sm font-bold"
                          placeholder="0"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-2 italic">
                    Valores positivos suman dinero, negativos restan
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => {
                    setEditingCard(null);
                    setIsAddingCard(false);
                  }}
                  className="flex-1 py-3 font-bold text-slate-400 hover:bg-slate-50 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => isAddingCard ? createCard(editingCard) : updateCard(editingCard)}
                  className="flex-1 py-3 bg-green-600 text-white rounded-2xl font-bold shadow-lg shadow-green-200 hover:bg-green-700"
                >
                  {isAddingCard ? 'Crear Carta' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE EDICIÓN/CREACIÓN DE VALORES DEL DADO */}
        {editingDiceValue && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
              <h3 className="text-2xl font-black mb-6">
                {isAddingDiceValue ? 'Nuevo Valor del Dado' : 'Editar Valor del Dado'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">Valor (1-6)</label>
                  <div className="flex gap-2 justify-center">
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <button
                        key={num}
                        onClick={() => setEditingDiceValue({ ...editingDiceValue, value: num })}
                        className={`w-12 h-12 rounded-xl font-black text-xl transition-all ${
                          editingDiceValue.value === num
                            ? 'bg-slate-800 text-white scale-110 shadow-lg'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => {
                    setEditingDiceValue(null);
                    setIsAddingDiceValue(false);
                  }}
                  className="flex-1 py-3 font-bold text-slate-400 hover:bg-slate-50 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => isAddingDiceValue ? createDiceValue(editingDiceValue) : updateDiceValue(editingDiceValue)}
                  className="flex-1 py-3 bg-green-600 text-white rounded-2xl font-bold shadow-lg shadow-green-200 hover:bg-green-700"
                >
                  {isAddingDiceValue ? 'Añadir' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
