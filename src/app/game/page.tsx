'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabaseClient';
import { calculateCardImpact } from '@/src/lib/gameLogic';
import { getImpactDetail } from '@/src/lib/gameLogic';
import Dice from '@/src/components/Dice';
import { BoardView } from '@/src/components/BoardView';
import { CapitalRace } from '@/src/components/CapitalRace';
import { calculateSystemMoney } from '@/src/lib/gameLogic';
import { VotingView } from '@/src/components/VotingView';
import { PodiumView } from '@/src/components/PodiumView';

interface RoomPlayer {
  id: string;
  alias: string;
  money: number;
  minisala_id: string;
  color?: string; // Opcional, por si quieres asignar colores distintos
}

export default function MinisalaGame() {
  const [isLeader, setIsLeader] = useState(false);
  const [roomState, setRoomState] = useState({ currentCard: 0, isBoardVisible: false });
  const [myMoney, setMyMoney] = useState(0);
  const [card, setCard] = useState<any>(null);
  const [minisalaId, setMinisalaId] = useState('');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [history, setHistory] = useState<{cardName: string, amount: number, reason: string}[]>([]);
  const [roomPlayers, setRoomPlayers] = useState<RoomPlayer[]>([]);
  const [systemProfiles, setSystemProfiles] = useState<any[]>([]);
  const [allCards, setAllCards] = useState<any[]>([]);
  // proposals
  const [proposalText, setProposalText] = useState("");
  const [hasSubmittedProposal, setHasSubmittedProposal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 1. Estado para la fase (que escuchará de Supabase)
  const [gamePhase, setGamePhase] = useState<'playing' | 'voting' | 'podium'>('playing');

  // TODO: REvisar que los valores son correctos, aunque de hecho debería coger estos valores de la base de datos
  /*const SYSTEM_PROFILES = [
    { id: 'p1', alias: 'Hombre Blanco Cis', color: '#1e293b', vars: { red: 'ALTO', visibilidad: 'ALTO', tiempo: 'ALTO', margen_error: 'ALTO', responsabilidades: 'BAJO' } },
    { id: 'p2', alias: 'Madre Soltera', color: '#e11d48', vars: { red: 'BAJO', visibilidad: 'MEDIO', tiempo: 'BAJO', margen_error: 'ALTO', responsabilidades: 'BAJO' } },
    { id: 'p3', alias: 'Mujer Migrante', color: '#059669', vars: { red: 'BAJO', visibilidad: 'BAJO', tiempo: 'ALTO', margen_error: 'ALTO', responsabilidades: 'BAJO' } },
    { id: 'p4', alias: 'Senior +50', color: '#ca8a04', vars: { red: 'ALTO', visibilidad: 'BAJO', tiempo: 'ALTO', margen_error: 'ALTO', responsabilidades: 'BAJO' } },
    { id: 'p5', alias: 'Joven Prácticas', color: '#7c3aed', vars: { red: 'MEDIO', visibilidad: 'ALTO', tiempo: 'ALTO', margen_error: 'ALTO', responsabilidades: 'BAJO' } },
  ];*/

  useEffect(() => {
    const sId = sessionStorage.getItem('minisala_id') || 'sala_1';
    setMinisalaId(sId);

    // Suscripción al estado de la minisala específica
    const channel = supabase.channel(`room:${sId}`)
      .on('broadcast', { event: 'card_advance' }, ({ payload }) => {
        // 1. Actualizamos el estado de la sala (para el tablero)
        setRoomState(prev => ({ ...prev, currentCard: payload.newIndex }));

        // 2. IMPORTANTE: Actualizamos el índice de la carta (lo que no tenías)
        // Esto hará que los que NO son líderes también avancen de carta y sumen/resten dinero
        setCurrentCardIndex(payload.newIndex);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [minisalaId]); // Añadimos minisalaId como dependencia por seguridad

  // carga inicial de Perfiles de sistema
  useEffect(() => {
    const fetchSystemData = async () => {
      const { data, error } = await supabase
        .from('system_profiles')
        .select('*')
        .order('id', { ascending: true });

      if (data) {
        setSystemProfiles(data);
      } else {
        console.error("Error cargando perfiles de sistema:", error);
      }
    };

    fetchSystemData();
  }, []);

  // Suscripción para detectar el cambio de fase (añadir al useEffect de Realtime existente)
  useEffect(() => {
    const usuarioId = sessionStorage.getItem('participant_id');
    const channel = supabase.channel(`phase_sync_${minisalaId}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'participants' },
        (payload) => {
          // Esto ahora aceptará 'voting' o 'podium'
          if (payload.new.current_phase) {
            setGamePhase(payload.new.current_phase);
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [minisalaId]);

  // 2. Carga todas las cartas al inicio del juego
  useEffect(() => {
    const fetchAllCards = async () => {
      const { data } = await supabase
        .from('cards')
        .select('*')
        .order('id', { ascending: true });
      if (data) setAllCards(data);
    };
    fetchAllCards();
  }, []);

  // Carrera de capital
  useEffect(() => {
    const fetchRoomPlayers = async () => {
      const { data, error } = await supabase
        .from('participants')
        .select('id, alias, money, minisala_id, color, emoji') // Asegúrarse de que los nombres coinciden con la DB
        .eq('minisala_id', minisalaId);

      if (error) {
        console.error("Error cargando jugadores:", error);
        return;
      }

      // Ahora data será tratado como RoomPlayer[] y no dará error
      setRoomPlayers((data as RoomPlayer[]) || []);
    };

    fetchRoomPlayers();

    // Suscripción para ver cómo se mueven los demás en tiempo real
    const channel = supabase.channel(`room_players_${minisalaId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'participants' }, fetchRoomPlayers)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [minisalaId]);

  // Cargar la carta, actualizar el dinero y añadir al historial
  useEffect(() => {
    // SALIDA: Si el índice es 0, no cargamos carta ni aplicamos impacto
    if (roomState.currentCard === 0) {
      setCard(null);
      return;
    }

    setHasSubmittedProposal(false);

    const loadCard = async () => {
  // 1. Cargamos la carta desde Supabase usando el índice actual de la sala
  const { data } = await supabase
    .from('cards')
    .select('*')
    .eq('id', roomState.currentCard)
    .single();

      if (data) {
        setCard(data);

        // 2. Recuperamos las variables que el usuario eligió al inicio
        const userVars = JSON.parse(sessionStorage.getItem('vars') || '{}');

        // 3. Calculamos el impacto del detalle (monto y razón)
        const detail = getImpactDetail(userVars, data.impact_variable, data.impact_values);

        // --- NUEVA LÓGICA DE ACTUALIZACIÓN ---

        // 4. Calculamos el nuevo total de forma precisa (usando una función de actualización para evitar estados viejos)
        setMyMoney(prevMoney => {
          const nuevoTotal = prevMoney + detail.amount;

          // 5. Guardamos en Supabase para que el marcador global se actualice
          const usuarioId = sessionStorage.getItem('participant_id');
          if (usuarioId) {
            // Ejecutamos la actualización en segundo plano
            supabase
              .from('participants')
              .update({ money: nuevoTotal })
              .eq('id', usuarioId)
              .then(({ error }) => {
                if (error) console.error("Error al sincronizar dinero:", error);
              });
          }

          return nuevoTotal;
        });

        // 6. Registramos este movimiento en el historial
        if (roomState.currentCard > 0) {
          setHistory(prev => [
            {
              cardName: data.name_es,
              amount: detail.amount,
              reason: detail.reason
            },
            ...prev
          ]);
        }
      }
    };

    loadCard();
  }, [roomState.currentCard]); // Se dispara cada vez que el líder mueve la ficha

  // Subscripcion para saber si es lider
  useEffect(() => {
    const usuarioId = sessionStorage.getItem('participant_id');
    if (!usuarioId) {
      console.error("No se encontró participant_id en sessionStorage");
      return;
    }

    // Función para obtener el estado actual
    const syncRole = async () => {
      const { data } = await supabase
        .from('participants')
        .select('is_leader')
        .eq('id', usuarioId)
        .single();
      if (data) setIsLeader(data.is_leader);
    };

    syncRole();

    // Suscripción Realtime mejorada
    const channel = supabase.channel(`role_sync_${usuarioId}`)
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'participants'
          // Eliminamos el filtro 'filter' aquí momentáneamente si da problemas
        },
        (payload) => {
          // Solo actualizamos si el ID coincide
          if (payload.new.id === usuarioId || payload.new.id == usuarioId) {
            console.log("Nuevo estado de líder recibido:", payload.new.is_leader);
            setIsLeader(payload.new.is_leader);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Función para avanzar el juego (Solo la ejecuta el líder)
  const advanceGame = async () => {
    // 1. Calcular el siguiente paso (máximo 10 cartas)
    const nextIndex = currentCardIndex + 1;
    
    if (nextIndex <= 5) {
      // 2. Notificar a todos los miembros de la minisala vía Realtime
      await supabase.channel(`room:${minisalaId}`).send({
        type: 'broadcast',
        event: 'card_advance',
        payload: { newIndex: nextIndex }
      });

      // 3. Actualizar el estado local para mover la ficha y cargar la nueva carta
      setRoomState(prev => ({ ...prev, currentCard: nextIndex }));
      setCurrentCardIndex(nextIndex);
      
      // 3. Guardamos progreso en db
      const { error } = await supabase
        .from('rooms')
        .update({ current_step: nextIndex }) 
        .eq('id', minisalaId);

      if (error) {
        console.error("Error al guardar progreso en DB:", error.message);
      }
    }
  };

  // Funcion para Enviar propuesta
  const submitProposal = async () => {
    if (!proposalText.trim()) return;

    setIsSubmitting(true);

    // Usamos el ID del participante del sessionStorage
    const usuarioId = sessionStorage.getItem('participant_id');

    // Priorizamos el estado 'minisalaId' del componente, 
    // y si está vacío, lo buscamos en el sessionStorage
    const sId = minisalaId || sessionStorage.getItem('minisala_id');

    console.log("Intentando enviar propuesta:", {
      texto: proposalText,
      sala: sId,
      usuario: usuarioId
    });

    if (!usuarioId || !sId) {
      alert("Faltan datos críticos (ID de usuario o sala). Por favor, refresca la página.");
      setIsSubmitting(false);
      return;
    }

    const { data, error } = await supabase
      .from('rule_proposals')
      .insert([
        {
          participant_id: usuarioId,
          minisala_id: sId, // <--- Aseguramos que este valor existe
          proposal_text: proposalText,
          votes: 0,
          card_id: roomState.currentCard
        }
      ]);

    if (!error) {
      setHasSubmittedProposal(true);
      setProposalText("");
      console.log("Propuesta guardada correctamente");
    } else {
      console.error("Error de Supabase al insertar:", error.message);
      alert("Error al guardar: " + error.message);
    }
    setIsSubmitting(false);
  };

  // Función para que el Líder active la votación
  const activateVoting = async () => {
    // Actualizamos a todos los miembros de la minisala
    await supabase
      .from('participants')
      .update({ current_phase: 'voting' })
      .eq('minisala_id', minisalaId);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* FASE 1: JUEGO ACTIVO */}
      {gamePhase === 'playing' ? (
        <div className="flex flex-col md:flex-row h-screen overflow-hidden">

          {/* COLUMNA IZQUIERDA: CARRERA DE CAPITAL (Vertical) */}
          <div className="w-full md:w-80 h-1/3 md:h-full p-2 bg-slate-900 shadow-2xl z-10">
            <CapitalRace
              players={roomPlayers}
              systemProfiles={systemProfiles.map(profile => ({
                id: profile.id,
                alias: profile.alias,
                color: profile.color,
                emoji: profile.emoji, // Asegúrate de que el backend traiga esto
                money: calculateSystemMoney(
                  {
                    red: profile.red,
                    visibilidad: profile.visibilidad,
                    tiempo: profile.tiempo,
                    margen_error: profile.margen_error,
                    responsabilidades: profile.responsabilidades
                  },
                  currentCardIndex,
                  allCards
                )
              }))}
            />
          </div>

          {/* COLUMNA DERECHA: TABLERO, CONTROLES E HISTORIAL */}
          <div className="flex-1 flex flex-col overflow-y-auto">

            {/* 1. EL TABLERO (Arriba derecha) */}
            <div className="w-full bg-slate-800 p-6 shadow-lg">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-white text-center mb-4 font-black tracking-widest uppercase text-xs opacity-50">
                  Progreso de la Minisala
                </h2>
                <BoardView currentStep={currentCardIndex} />
              </div>
            </div>

            {/* 2. CONTROLES Y CARTA ACTUAL */}
            <div className="max-w-5xl mx-auto w-full p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Tarjeta de Situación del Jugador */}
              <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
                <div className="bg-red-600 p-5 flex justify-between items-center text-white">
                  <span className="font-black uppercase text-xs tracking-widest">Tu Capital</span>
                  <span className="text-4xl font-black">{myMoney} €</span>
                </div>

                <div className="p-6 flex-1">
                  {card ? (
                    <div className="animate-fade-in space-y-4">
                      <h3 className="text-red-600 font-black text-sm uppercase tracking-tighter">{card.name_es}</h3>
                      <p className="text-slate-700 font-serif text-xl leading-snug italic">"{card.situation_es}"</p>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-500 text-sm">
                        <strong>Reflexión:</strong> {card.discussion_question}
                      </div>

                      <div className="pt-4 border-t border-slate-100">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Propón un cambio de regla</h4>
                        {!hasSubmittedProposal ? (
                          <div className="space-y-3">
                            <textarea
                              value={proposalText}
                              onChange={(e) => setProposalText(e.target.value)}
                              placeholder="Si pudieras cambiar algo del sistema..."
                              className="w-full p-4 text-sm border-2 border-slate-100 rounded-2xl focus:border-red-500 outline-none transition-all resize-none h-24"
                            />
                            <button
                              onClick={submitProposal}
                              disabled={!proposalText.trim() || isSubmitting}
                              className="w-full py-4 bg-red-600 text-white rounded-2xl font-black shadow-lg shadow-red-200 hover:bg-red-700 transition-all disabled:bg-slate-200"
                            >
                              {isSubmitting ? 'ENVIANDO...' : 'ENVIAR IDEA 💡'}
                            </button>
                          </div>
                        ) : (
                          <div className="bg-green-50 p-4 rounded-2xl border border-green-100 flex items-center gap-3">
                            <span className="text-2xl">✅</span>
                            <p className="text-green-700 text-xs font-bold uppercase">Propuesta enviada con éxito</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <div className="text-5xl mb-4 animate-bounce">🏁</div>
                      <p className="text-slate-400 font-bold uppercase text-xs">Esperando al líder para empezar...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Panel de Control del Líder / Espera */}
              <div className="flex flex-col gap-4">
                {isLeader ? (
                  <div className="bg-white p-10 rounded-3xl shadow-xl border-4 border-dashed border-red-100 flex flex-col items-center justify-center h-full">
                    {currentCardIndex < 10 ? (
                      <>
                        <p className="text-red-600 font-black mb-8 uppercase tracking-widest text-sm">🌟 Eres el Líder</p>
                        <Dice onRollComplete={() => advanceGame()} />
                      </>
                    ) : (
                      <div className="text-center space-y-6">
                        <p className="text-slate-800 font-black text-2xl uppercase italic">¡Trayectoria Completa!</p>
                        <button
                          onClick={activateVoting}
                          className="bg-black text-white px-10 py-5 rounded-2xl font-black shadow-2xl hover:scale-105 transition-transform"
                        >
                          ABRIR VOTACIÓN GLOBAL 💡
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-800/5 p-10 rounded-3xl border-2 border-slate-200 flex flex-col items-center justify-center text-center h-full italic text-slate-400">
                    <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-400 rounded-full animate-spin mb-4" />
                    <p className="text-sm font-medium">El líder está decidiendo el siguiente paso...</p>
                  </div>
                )}
              </div>
            </div>

            {/* 3. HISTORIAL (Abajo) */}
            <div className="max-w-5xl mx-auto w-full px-6 pb-12">
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-100 p-3 text-slate-500 text-center text-[10px] font-black uppercase tracking-[0.3em]">
                  Registro de Movimientos
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {history.length > 0 ? (
                    <table className="w-full text-left text-xs">
                      <tbody className="divide-y divide-slate-50">
                        {history.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-4 font-bold text-slate-700">{item.cardName}</td>
                            <td className={`p-4 font-black text-right ${item.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {item.amount >= 0 ? `+${item.amount}` : item.amount}€
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="p-8 text-center text-slate-300 text-[10px] uppercase font-bold italic">Sin movimientos registrados</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

      ) : gamePhase === 'voting' ? (
        /* FASE 2: VOTACIÓN */
        <div className="pt-12 pb-20 px-4 max-w-4xl mx-auto">
          <VotingView
            minisalaId={minisalaId}
            participantId={sessionStorage.getItem('participant_id') || ''}
          />
        </div>

      ) : (
        /* FASE 3: PODIO */
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-900 text-white">
          <PodiumView />
        </div>
      )}
    </div>
  );
}