'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabaseClient';

export default function AdminPanel() {
  const [faseActual, setFaseActual] = useState('setup');
  const [propuestas, setPropuestas] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalJugadores: 0, salasActivas: 0 });
  const [usuarios, setUsuarios] = useState<any[]>([]);
  // perfiles del sistema
  const [systemProfiles, setSystemProfiles] = useState<any[]>([]); // Para guardar los perfiles de la DB
  const [editingProfile, setEditingProfile] = useState<any>(null); // Perfil que se está editando
  const variables = ['red', 'visibilidad', 'tiempo', 'margen_error', 'responsabilidades'];
  // Cartas del sistema
  const [cards, setCards] = useState<any[]>([]);
  const [editingCard, setEditingCard] = useState<any>(null);
  const [isAddingCard, setIsAddingCard] = useState(false);
  // Salas y Reset
  const [numSalas, setNumSalas] = useState(5); // Estado para el número de salas
  const [isResetting, setIsResetting] = useState(false);

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
        current_phase: 'playing'
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

  // editar perfiles del sistema
  const updateSystemProfile = async (profile: any) => {
    const { error } = await supabase
      .from('system_profiles')
      .update({
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
      setEditingProfile(null); // Cerramos el modal
      fetchSystemProfiles(); // Refrescamos la lista para ver los cambios
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
        impact_values: card.impact_values
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

  useEffect(() => {
    // 1. Escuchar propuestas de reglas en tiempo real [cite: 21]
    const fetchPropuestas = async () => {
      const { data } = await supabase.from('rule_proposals').select('*');
      setPropuestas(data || []);
    };

    fetchPropuestas();
    const channel = supabase.channel('admin_monitor')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rule_proposals' }, () => {
        fetchPropuestas();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    // Carga inicial
    const fetchUsuarios = async () => {
      const { data } = await supabase.from('participants').select('*');
      setUsuarios(data || []);
    };
    fetchUsuarios();

    fetchSystemProfiles();
    fetchCards();

    // Suscripción Realtime para inserciones y actualizaciones
    const channel = supabase.channel('admin_refresh')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'participants' },
        (payload) => {
          // Al recibir cualquier cambio, refrescamos la lista automáticamente
          fetchUsuarios();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

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
    // 1. Obtener datos combinados de la base de datos
    const { data: participants } = await supabase
      .from('participants')
      .select('alias, money, variables, compromiso')
      .order('money', { ascending: false });

    if (!participants) return;

    // 2. Definir cabeceras del CSV
    const headers = ["Alias", "Dinero Final", "Variables", "Compromiso"];

    // 3. Formatear filas
    const rows = participants.map(p => [
      p.alias,
      `${p.money} €`,
      JSON.stringify(p.variables).replace(/"/g, '""'), // Escapar JSON para CSV
      `"${p.compromiso || ''}"`
    ]);

    // 4. Crear contenido y descargar
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.setAttribute("href", url);
    link.setAttribute("download", `resultados_igualopoly_${new Date().toISOString().slice(0, 10)}.csv`);
    link.click();
  };

  const asignarLider = async (usuarioId: string, salaId: string) => {
    // 1. Quitamos el rol de líder a todos en esa minisala específica [cite: 47]
    await supabase
      .from('participants')
      .update({ is_leader: false })
      .eq('minisala_id', salaId);

    // 2. Asignamos el nuevo líder [cite: 158]
    await supabase
      .from('participants')
      .update({ is_leader: true })
      .eq('id', usuarioId);
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

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8">Panel de Host (Igualopoly)</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

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

        {/* Monitor de Propuestas */}
        <div className="bg-white p-6 rounded-xl shadow-sm border col-span-2">
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

        {/* Finalizar Votación y Ver Podio */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100 mb-8">
  <h2 className="font-bold mb-4 text-blue-600 flex items-center gap-2">
    🏆 Cierre del Taller
  </h2>
  <button
    onClick={() => finalizarYVerPodio()}
    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-lg hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-3"
  >
    <span>MOSTRAR PODIO DE REGLAS GANADORAS</span>
    <span className="text-2xl">🥇</span>
  </button>
  <p className="text-center text-[10px] text-slate-400 mt-2 italic">
    Esto cambiará la pantalla de todos los jugadores a los resultados finales.
  </p>
</div>
        
      </div>

      {/* Usuarios y salas */}
      <div className="p-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-black mb-8">Panel de Control Admin</h1>

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

        {/* SECCIÓN 2: PERFILES DE SISTEMA */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            ⚙️ Configuración del Sistema (Arquetipos)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemProfiles.map(p => (
              <div key={p.id} className="bg-white p-4 rounded-xl border flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: p.color }} />
                  <span className="font-bold text-slate-700">{p.alias}</span>
                </div>
                <button
                  onClick={() => setEditingProfile(p)}
                  className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg text-sm font-bold border border-blue-100"
                >
                  Editar
                </button>
              </div>
            ))}
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
                  impact_values: { ALTO: 0, MEDIO: 0, BAJO: 0 }
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

        {/* MODAL DE EDICIÓN DE PERFILES */}
        {editingProfile && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <h3 className="text-2xl font-black mb-6">Editar {editingProfile.alias}</h3>
              <div className="space-y-4">
                {variables.map(v => (
                  <div key={v} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
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
              <div className="flex gap-3 mt-8">
                <button onClick={() => setEditingProfile(null)} className="flex-1 py-3 font-bold text-slate-400">Cancelar</button>
                <button
                  onClick={() => updateSystemProfile(editingProfile)}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE EDICIÓN/CREACIÓN DE CARTAS */}
        {editingCard && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl my-8">
              <h3 className="text-2xl font-black mb-6">
                {isAddingCard ? 'Nueva Carta' : `Editar Carta: ${editingCard.name_es}`}
              </h3>
              <div className="space-y-4">
                {/* Nombre en Español */}
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">Nombre (Español)</label>
                  <input
                    type="text"
                    value={editingCard.name_es}
                    onChange={(e) => setEditingCard({ ...editingCard, name_es: e.target.value })}
                    className="w-full p-3 border rounded-lg text-sm"
                    placeholder="Ej: Calle Vacante"
                  />
                </div>

                {/* Nombre en Inglés */}
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">Nombre (English)</label>
                  <input
                    type="text"
                    value={editingCard.name_en}
                    onChange={(e) => setEditingCard({ ...editingCard, name_en: e.target.value })}
                    className="w-full p-3 border rounded-lg text-sm"
                    placeholder="Ex: Vacant Street"
                  />
                </div>

                {/* Nombre en Catalán */}
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">Nombre (Català)</label>
                  <input
                    type="text"
                    value={editingCard.name_cat}
                    onChange={(e) => setEditingCard({ ...editingCard, name_cat: e.target.value })}
                    className="w-full p-3 border rounded-lg text-sm"
                    placeholder="Ex: Carrer Vacant"
                  />
                </div>

                {/* Situación en Español */}
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">Situación (Español)</label>
                  <textarea
                    value={editingCard.situation_es}
                    onChange={(e) => setEditingCard({ ...editingCard, situation_es: e.target.value })}
                    className="w-full p-3 border rounded-lg text-sm resize-none"
                    rows={3}
                    placeholder="Describe la situación que representa esta carta..."
                  />
                </div>

                {/* Situación en Inglés */}
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">Situación (English)</label>
                  <textarea
                    value={editingCard.situation_en}
                    onChange={(e) => setEditingCard({ ...editingCard, situation_en: e.target.value })}
                    className="w-full p-3 border rounded-lg text-sm resize-none"
                    rows={3}
                    placeholder="Describe the situation this card represents..."
                  />
                </div>

                {/* Situación en Catalán */}
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">Situación (Català)</label>
                  <textarea
                    value={editingCard.situation_cat}
                    onChange={(e) => setEditingCard({ ...editingCard, situation_cat: e.target.value })}
                    className="w-full p-3 border rounded-lg text-sm resize-none"
                    rows={3}
                    placeholder="Descriu la situació que representa aquesta carta..."
                  />
                </div>

                {/* Variable de impacto */}
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">Variable de Impacto 1</label>
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

                {/* Variable de impacto 2 (opcional) */}
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">Variable de Impacto 2 (Opcional)</label>
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
      </div>

      {/* Footer Acciones */}
      <div className="flex gap-4 mt-8">
        <button onClick={exportToCSV} className="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-900 transition-all">
          📥 Exportar Resultados (CSV)
        </button>
      </div>
    </div>
  );
}