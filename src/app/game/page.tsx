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
import { RankingView } from '@/src/components/RankingView';
import { getTranslation, Language } from '@/src/lib/translations';

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
  const [boardPosition, setBoardPosition] = useState(0);  // Posición del peón (avanza según dado)
  const [currentCardNumber, setCurrentCardNumber] = useState(0); // Número de carta actual (avanza de 1 en 1)
  const [history, setHistory] = useState<{cardName: string, amount: number, reason: string}[]>([]);
  const [roomPlayers, setRoomPlayers] = useState<RoomPlayer[]>([]);
  const [systemProfiles, setSystemProfiles] = useState<any[]>([]);
  const [allCards, setAllCards] = useState<any[]>([]);
  // proposals
  const [proposalText, setProposalText] = useState("");
  const [hasSubmittedProposal, setHasSubmittedProposal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 1. Estado para la fase (que escuchará de Supabase)
  const [gamePhase, setGamePhase] = useState<'playing' | 'ranking' | 'voting' | 'podium' | 'final'>('playing');
  // Estado para la simulación final
  const [isFinalSimulation, setIsFinalSimulation] = useState(false);
  const [systemProfilesFinal, setSystemProfilesFinal] = useState<any[]>([]);
  const [isAutoSimulating, setIsAutoSimulating] = useState(false); // Indica si la simulación automática está corriendo

  // Estado para detectar cuando el dado está girando
  const [isDiceRolling, setIsDiceRolling] = useState(false);

  // Estado para sincronizar el lanzamiento del dado entre todos los jugadores
  const [externalDiceRoll, setExternalDiceRoll] = useState<{ value: number; timestamp: number } | null>(null);

  // Idioma del usuario
  const [language, setLanguage] = useState<Language>('ES');

  // Estado para controlar el paso actual de la carta (1, 2, o 3)
  const [cardStep, setCardStep] = useState(1);

  // Variables del jugador
  const [userVars, setUserVars] = useState<Record<string, string>>({});

  useEffect(() => {
    const storedLang = sessionStorage.getItem('idioma') as Language;
    if (storedLang) {
      setLanguage(storedLang);
    }
    // Cargar variables del jugador
    const storedVars = sessionStorage.getItem('vars');
    if (storedVars) {
      setUserVars(JSON.parse(storedVars));
    }
  }, []);

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
        // 1. Actualizamos la posición del peón (según el dado)
        setRoomState(prev => ({ ...prev, currentCard: payload.nextBoardPosition }));
        setBoardPosition(payload.nextBoardPosition);

        // 2. Actualizamos el número de carta (de 1 en 1)
        setCurrentCardNumber(payload.nextCardNumber);
      })
      .on('broadcast', { event: 'dice_roll' }, ({ payload }) => {
        // Sincronizar el lanzamiento del dado para todos los jugadores
        setExternalDiceRoll({ value: payload.diceValue, timestamp: payload.timestamp });
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

  // carga inicial de Perfiles de sistema FINAL (para la simulación final)
  useEffect(() => {
    const fetchSystemDataFinal = async () => {
      const { data, error } = await supabase
        .from('system_profiles_final')
        .select('*')
        .order('id', { ascending: true });

      if (data) {
        setSystemProfilesFinal(data);
      } else {
        console.error("Error cargando perfiles de sistema final:", error);
      }
    };

    fetchSystemDataFinal();
  }, []);

  // Suscripción para detectar el cambio de fase en participants (voting/podium/final)
  useEffect(() => {
    const channel = supabase.channel(`phase_sync_${minisalaId}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'participants' },
        (payload) => {
          if (payload.new.current_phase) {
            const newPhase = payload.new.current_phase;
            setGamePhase(newPhase);

            // Si entramos en fase 'final', reiniciamos el estado del juego
            if (newPhase === 'final') {
              setBoardPosition(0);
              setCurrentCardNumber(0);
              setCard(null);
              setHistory([]);
              setMyMoney(0);
              setIsFinalSimulation(true);
            }
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [minisalaId]);

  // Suscripción para detectar el cambio de fase en rooms (ranking)
  useEffect(() => {
    if (!minisalaId) return;

    const channel = supabase.channel(`room_phase_sync_${minisalaId}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${minisalaId}` },
        (payload) => {
          if (payload.new.current_phase === 'ranking') {
            setGamePhase('ranking');
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
    // SALIDA: Si no hay carta o no hay cartas cargadas, no hacemos nada
    if (currentCardNumber === 0 || allCards.length === 0) {
      setCard(null);
      return;
    }

    setHasSubmittedProposal(false);
    setCardStep(1); // Resetear al paso 1 cuando cambia la carta

    // Usamos el array de cartas ya cargado, con el número de carta como posición
    // currentCardNumber = 1 corresponde a allCards[0], etc.
    const cardIndex = currentCardNumber - 1;

    // Si el índice está fuera de rango, no hay carta
    if (cardIndex < 0 || cardIndex >= allCards.length) {
      setCard(null);
      return;
    }

    const data = allCards[cardIndex];

    if (data) {
      setCard(data);

      // 2. Recuperamos las variables que el usuario eligió al inicio
      const userVars = JSON.parse(sessionStorage.getItem('vars') || '{}');

      // 3. Calculamos el impacto del detalle (monto y razón)
      const detail = getImpactDetail(userVars, data.impact_variable, data.impact_values, data.impact_variable_2);

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
      if (currentCardNumber > 0) {
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
  }, [currentCardNumber, allCards]); // Se dispara cada vez que cambia el número de carta

  // Subscripcion para saber si es lider y la fase actual
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
        .select('is_leader, current_phase, money')
        .eq('id', usuarioId)
        .single();
      if (data) {
        setIsLeader(data.is_leader);
        // Sincronizar la fase actual
        if (data.current_phase) {
          setGamePhase(data.current_phase);
          // Si entramos en fase 'final', reiniciamos el estado del juego
          if (data.current_phase === 'final') {
            setBoardPosition(0);
            setCurrentCardNumber(0);
            setCard(null);
            setHistory([]);
            setMyMoney(data.money || 0);
            setIsFinalSimulation(true);
          }
        }
      }
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

  // Ya no se usa MAX_CARDS: ahora el fin de partida se determina cuando no hay más cartas disponibles (allCards.length)

  // Función para manejar el inicio del lanzamiento del dado
  const handleDiceRollStart = () => {
    setIsDiceRolling(true);
  };

  // Función que el líder usa para obtener el valor del dado y hacer broadcast
  const handleLeaderDiceRoll = async (): Promise<number> => {
    // Obtener el valor del dado
    const diceValue = await getNextDiceValue() || Math.floor(Math.random() * 6) + 1;

    // Broadcast del lanzamiento del dado para que todos lo vean (incluyendo el líder)
    await supabase.channel(`room:${minisalaId}`).send({
      type: 'broadcast',
      event: 'dice_roll',
      payload: { diceValue, timestamp: Date.now() }
    });

    return diceValue;
  };

  // Función para avanzar el juego (se llama después de que el dado termine de girar)
  const advanceGame = async (diceValue: number) => {
    // Solo el líder avanza el juego
    if (!isLeader) return;

    // El peón avanza según el dado, la carta avanza de 1 en 1
    const nextBoardPosition = boardPosition + diceValue;
    const nextCardNumber = currentCardNumber + 1;

    // Siempre notificamos y avanzamos el estado (la lógica de si hay carta o no se maneja en el render)
    await supabase.channel(`room:${minisalaId}`).send({
      type: 'broadcast',
      event: 'card_advance',
      payload: { nextBoardPosition, nextCardNumber }
    });

    // Actualizar el estado local
    setRoomState(prev => ({ ...prev, currentCard: nextBoardPosition }));
    setBoardPosition(nextBoardPosition);  // Posición del peón
    setCurrentCardNumber(nextCardNumber);     // Número de carta

    // Guardamos progreso en db
    const { error } = await supabase
      .from('rooms')
      .update({ current_step: nextBoardPosition })
      .eq('id', minisalaId);

    if (error) {
      console.error("Error al guardar progreso en DB:", error.message);
    }

    // Resetear el estado del dado después de que se complete el lanzamiento
    setIsDiceRolling(false);
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
          card_id: card?.id
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

  // Función para que el Líder active el ranking
  const activateRanking = async () => {
    // Actualizamos el current_phase de la sala a 'ranking'
    await supabase
      .from('rooms')
      .update({ current_phase: 'ranking' })
      .eq('id', minisalaId);

    // Actualizamos el estado local inmediatamente para el líder
    setGamePhase('ranking');
  };

  // Función para que el Líder inicie la simulación final
  const startFinalSimulation = async () => {
    // Broadcast inicial para sincronizar el estado del juego
    await supabase.channel(`room:${minisalaId}`).send({
      type: 'broadcast',
      event: 'card_advance',
      payload: { nextBoardPosition: 0, nextCardNumber: 0 }
    });

    // Actualizamos todos los participantes de la sala a 'playing'
    await supabase
      .from('participants')
      .update({ current_phase: 'playing' })
      .eq('minisala_id', minisalaId);

    // Actualizamos la sala a 'playing'
    await supabase
      .from('rooms')
      .update({ current_phase: 'playing' })
      .eq('id', minisalaId);

    // Actualizamos el estado local
    setGamePhase('playing');
    setIsAutoSimulating(true); // Iniciar simulación automática
  };

  // Simulación automática: lanza el dado automáticamente durante la simulación final
  useEffect(() => {
    // Solo el líder ejecuta la simulación automática
    if (!isFinalSimulation || !isAutoSimulating || !isLeader || gamePhase !== 'playing') {
      return;
    }

    // Si ya no hay más cartas, detener la simulación
    if (currentCardNumber >= allCards.length) {
      setIsAutoSimulating(false);
      return;
    }

    const runAutoSimulation = async () => {
      // Esperar 2 segundos antes de cada lanzamiento
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Obtener el siguiente valor del dado y hacer broadcast
      const diceValue = await handleLeaderDiceRoll();

      // Esperar a que la animación del dado termine (1800ms)
      await new Promise(resolve => setTimeout(resolve, 1800));

      // Avanzar el juego
      await advanceGame(diceValue);
    };

    runAutoSimulation();
  }, [isFinalSimulation, isAutoSimulating, isLeader, gamePhase, boardPosition]);

  // Función para obtener el siguiente valor del dado (fake)
  const getNextDiceValue = async (): Promise<number | null> => {
    // 1. Obtener el next_dice_index de la sala actual
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('next_dice_index')
      .eq('id', minisalaId)
      .single();

    if (roomError || !roomData) {
      return null;
    }

    const nextIndex = roomData.next_dice_index || 0;

    // 2. Obtener todos los valores ordenados por id y usar el índice como posición
    const { data: diceData, error: diceError } = await supabase
      .from('fake_dice_values')
      .select('value')
      .order('id', { ascending: true });

    if (diceError || !diceData || diceData.length === 0) {
      return null;
    }

    // Si el índice está fuera de rango, no hay más valores predeterminados
    if (nextIndex >= diceData.length) {
      return null;
    }

    // 3. Incrementar el next_dice_index de la sala
    await supabase
      .from('rooms')
      .update({ next_dice_index: nextIndex + 1 })
      .eq('id', minisalaId);

    return diceData[nextIndex].value;
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
              systemProfiles={(isFinalSimulation ? systemProfilesFinal : systemProfiles).map(profile => ({
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
                  boardPosition,
                  allCards
                )
              }))}
            />
          </div>

          {/* COLUMNA DERECHA: TABLERO, CONTROLES E HISTORIAL */}
          <div className="flex-1 flex flex-col overflow-y-auto relative">

            {/* 1. EL TABLERO (Arriba derecha) */}
            <div className="w-full bg-slate-800 px-6 pb-6 pt-2 shadow-lg relative">
              <div className="max-w-4xl mx-auto" style={{ transform: 'scale(0.9)', transformOrigin: 'top center' }}>
                <BoardView currentStep={boardPosition} />
              </div>

              {/* 2. PANEL DE CONTROL DEL LÍDER / ESPERA (encima del tablero) */}
              <div className="absolute top-[12%] left-0 right-0 flex justify-center z-10 pointer-events-none">
                <div className="max-w-md w-full mx-4 pointer-events-auto" style={{ transform: 'scale(0.8)' }}>
                  {isFinalSimulation ? (
                    /* SIMULACIÓN FINAL: Indicador de progreso automático */
                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-3xl shadow-xl border-4 border-emerald-300 flex flex-col items-center justify-center">
                      {currentCardNumber <= allCards.length ? (
                        <>
                          <p className="text-white font-black mb-2 uppercase tracking-widest text-sm">{getTranslation('game.finalSimulation', language)}</p>
                          <p className="text-emerald-100 text-xs mb-4">{getTranslation('game.simulatingProgress', language)}</p>
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 border-4 border-emerald-200 border-t-white rounded-full animate-spin" />
                            <div className="text-white">
                              <p className="text-3xl font-black">{currentCardNumber}/{allCards.length}</p>
                              <p className="text-xs text-emerald-100">{getTranslation('game.steps', language)}</p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center space-y-4">
                          <p className="text-white font-black text-xl uppercase italic">{getTranslation('game.simulationComplete', language)}</p>
                          <button
                            onClick={activateRanking}
                            className="bg-white text-emerald-600 px-8 py-4 rounded-2xl font-black shadow-2xl hover:scale-105 transition-transform"
                          >
                            {getTranslation('game.openRanking', language)}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* JUEGO NORMAL: Dado para todos (solo el líder puede lanzar) */
                    <div className="bg-white p-6 rounded-3xl shadow-xl border-4 border-dashed border-red-100 flex flex-col items-center justify-center">
                      {currentCardNumber <= allCards.length ? (
                        <>
                          {isLeader ? (
                            <p className="text-red-600 font-black mb-4 uppercase tracking-widest text-sm">{getTranslation('game.youAreLeader', language)}</p>
                          ) : (
                            <p className="text-slate-600 font-black mb-4 uppercase tracking-widest text-sm">{getTranslation('game.leaderDeciding', language)}</p>
                          )}
                          <Dice
                            onRollComplete={(val) => advanceGame(val)}
                            onRollStart={handleDiceRollStart}
                            getNextValue={getNextDiceValue}
                            showButton={isLeader}
                            externalRoll={externalDiceRoll}
                            broadcastRoll={isLeader ? handleLeaderDiceRoll : undefined}
                          />
                        </>
                      ) : (
                        isLeader ? (
                          <div className="text-center space-y-4">
                            <p className="text-slate-800 font-black text-xl uppercase italic">{getTranslation('game.trajectoryComplete', language)}</p>
                            <button
                              onClick={activateRanking}
                              className="bg-black text-white px-8 py-4 rounded-2xl font-black shadow-2xl hover:scale-105 transition-transform"
                            >
                              {getTranslation('game.openRanking', language)}
                            </button>
                          </div>
                        ) : (
                          <div className="bg-slate-800/90 p-6 rounded-3xl border-2 border-slate-600 flex flex-col items-center justify-center text-center italic text-slate-300">
                            <div className="w-10 h-10 border-4 border-slate-600 border-t-slate-300 rounded-full animate-spin mb-3" />
                            <p className="text-sm font-medium">{getTranslation('game.leaderDeciding', language)}</p>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* CARTA (Aparece encajo del panel del dado con animación) - No mostrar en simulación final */}
              {card && !isFinalSimulation && !isDiceRolling && (
                <div className="absolute inset-0 flex items-start justify-center pt-[26%] pointer-events-none" style={{ transform: 'scale(0.83)' }}>
                  <div
                    className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-w-xl w-full mx-4 pointer-events-auto animate-zoom-in"
                    style={{
                      animation: 'zoomIn 0.6s ease-out 0.5s both'
                    }}
                  >
                    <div
                      className="p-5 flex justify-between items-center text-white"
                      style={{ backgroundColor: card.color || '#ef4444' }}
                    >
                      <span className="font-black uppercase text-sm tracking-widest">
                        {language === 'ES' ? card.name_es : language === 'EN' ? card.name_en : card.name_cat}
                      </span>
                    </div>

                    <div className="p-6 flex-1">
                      {/* PASO 1: Situación */}
                      {cardStep === 1 && (
                        <div className="space-y-4">
                          <p className="text-slate-700 font-serif text-xl leading-snug italic">
                            "{language === 'ES' ? card.situation_es : language === 'EN' ? card.situation_en : card.situation_cat}"
                          </p>
                          <button
                            onClick={() => setCardStep(2)}
                            className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black shadow-lg hover:bg-slate-900 transition-all"
                          >
                            Siguiente →
                          </button>
                        </div>
                      )}

                      {/* PASO 2: Sabías que + Afecta + Puntuación */}
                      {cardStep === 2 && (
                        <div className="space-y-4">
                          {/* Sabías que */}
                          {(card.sabias_es || card.sabias_en || card.sabias_cat) && (
                            <div>
                              <h4 className="text-xs font-black text-slate-600 mb-2">💡 ¿Sabías que...?</h4>
                              <p className="text-slate-700 text-sm leading-relaxed">
                                {language === 'ES' ? card.sabias_es : language === 'EN' ? card.sabias_en : card.sabias_cat}
                              </p>
                            </div>
                          )}

                          {/* Cómo afecta a los perfiles */}
                          {(card.afecta_es || card.afecta_en || card.afecta_cat) && (
                            <div>
                              <h4 className="text-xs font-black text-slate-600 mb-2">👥 Cómo afecta a los perfiles</h4>
                              <p className="text-slate-700 text-sm leading-relaxed">
                                {language === 'ES' ? card.afecta_es : language === 'EN' ? card.afecta_en : card.afecta_cat}
                              </p>
                            </div>
                          )}

                          {/* Puntuación */}
                          <div>
                            <h4 className="text-xs font-black text-slate-600 mb-2">🎯 Puntuación</h4>
                            <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-slate-700">
                                  {getTranslation(`characterCreation.variableLabels.${card.impact_variable}`, language)} {getTranslation('characterCreation.levels.ALTO', language)}
                                </span>
                                <span className="text-sm font-black text-green-600">
                                  {card.impact_values?.ALTO >= 0 ? '+' : ''}{card.impact_values?.ALTO || 0}€
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-slate-700">
                                  {getTranslation(`characterCreation.variableLabels.${card.impact_variable}`, language)} {getTranslation('characterCreation.levels.MEDIO', language)}
                                </span>
                                <span className="text-sm font-black text-yellow-600">
                                  {card.impact_values?.MEDIO >= 0 ? '+' : ''}{card.impact_values?.MEDIO || 0}€
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-slate-700">
                                  {getTranslation(`characterCreation.variableLabels.${card.impact_variable}`, language)} {getTranslation('characterCreation.levels.BAJO', language)}
                                </span>
                                <span className="text-sm font-black text-red-600">
                                  {card.impact_values?.BAJO >= 0 ? '+' : ''}{card.impact_values?.BAJO || 0}€
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => setCardStep(3)}
                            className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black shadow-lg hover:bg-slate-900 transition-all"
                          >
                            Siguiente →
                          </button>
                        </div>
                      )}

                      {/* PASO 3: Reflexión + Reescribe + Propuesta */}
                      {cardStep === 3 && (
                        <div className="space-y-4">
                          {/* Preguntas de reflexión */}
                          {(card.reflexion_es || card.reflexion_en || card.reflexion_cat) && (
                            <div>
                              <h4 className="text-xs font-black text-slate-600 mb-2">💬 Preguntas de reflexión</h4>
                              <p className="text-slate-700 text-sm leading-relaxed">
                                {language === 'ES' ? card.reflexion_es : language === 'EN' ? card.reflexion_en : card.reflexion_cat}
                              </p>
                            </div>
                          )}

                          {/* Reescribe la regla */}
                          {(card.reescribe_es || card.reescribe_en || card.reescribe_cat) && (
                            <div>
                              <h4 className="text-xs font-black text-slate-600 mb-2">✍️ Reescribe la regla</h4>
                              <p className="text-slate-700 text-sm leading-relaxed">
                                {language === 'ES' ? card.reescribe_es : language === 'EN' ? card.reescribe_en : card.reescribe_cat}
                              </p>
                            </div>
                          )}

                          {/* Propuesta */}
                          <div className="pt-2 border-t border-slate-100">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">{getTranslation('game.proposeChange', language)}</h4>
                            {!hasSubmittedProposal ? (
                              <div className="space-y-3">
                                <textarea
                                  value={proposalText}
                                  onChange={(e) => setProposalText(e.target.value)}
                                  placeholder={getTranslation('game.proposalPlaceholder', language)}
                                  className="w-full p-4 text-sm border-2 border-slate-100 rounded-2xl focus:border-red-500 outline-none transition-all resize-none h-24"
                                />
                                <button
                                  onClick={submitProposal}
                                  disabled={!proposalText.trim() || isSubmitting}
                                  className="w-full py-4 bg-red-600 text-white rounded-2xl font-black shadow-lg shadow-red-200 hover:bg-red-700 transition-all disabled:bg-slate-200"
                                >
                                  {isSubmitting ? getTranslation('game.sending', language) : getTranslation('game.sendIdea', language)}
                                </button>
                              </div>
                            ) : (
                              <div className="bg-green-50 p-4 rounded-2xl border border-green-100 flex items-center gap-3">
                                <span className="text-2xl">✅</span>
                                <p className="text-green-700 text-xs font-bold uppercase">{getTranslation('game.proposalSent', language)}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. TUS VARIABLES (Panel informativo del perfil) */}
            <div className="max-w-5xl mx-auto w-full px-6 pt-6">
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-700 p-3 text-white text-center text-[10px] font-black uppercase tracking-[0.3em]">
                  {getTranslation('game.yourVariables', language)}
                </div>
                <div className="p-4 flex flex-wrap justify-center gap-3">
                  {Object.entries(userVars).map(([key, value]) => {
                    const labelKey = `characterCreation.variableLabels.${key}`;
                    const levelKey = `characterCreation.levels.${value}`;
                    const colorClass = value === 'ALTO' ? 'bg-green-100 text-green-700 border-green-200'
                      : value === 'MEDIO' ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                      : 'bg-red-100 text-red-700 border-red-200';
                    return (
                      <div key={key} className={`px-4 py-2 rounded-2xl border ${colorClass} flex items-center gap-2`}>
                        <span className="text-xs font-bold">{getTranslation(labelKey, language)}:</span>
                        <span className="text-xs font-black uppercase">{getTranslation(levelKey, language)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 4. TU CAPITAL (Encima del historial) */}
            <div className="max-w-5xl mx-auto w-full px-6 pb-4 pt-4">
              <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="bg-red-600 p-5 flex justify-between items-center text-white">
                  <span className="font-black uppercase text-xs tracking-widest">{getTranslation('game.yourCapital', language)}</span>
                  <span className="text-4xl font-black">{myMoney} €</span>
                </div>
              </div>
            </div>

            {/* 5. HISTORIAL (Abajo) */}
            <div className="max-w-5xl mx-auto w-full px-6 pb-12">
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-100 p-3 text-slate-500 text-center text-[10px] font-black uppercase tracking-[0.3em]">
                  {getTranslation('game.movementHistory', language)}
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {history.length > 0 ? (
                    <table className="w-full text-left text-xs">
                      <tbody className="divide-y divide-slate-50">
                        {history.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-4">
                              <span className="font-bold text-slate-700">{item.cardName}</span>
                              <span className="text-xs text-slate-400 ml-2">{item.reason}</span>
                            </td>
                            <td className={`p-4 font-black text-right whitespace-nowrap ${item.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {item.amount >= 0 ? `+${item.amount}` : item.amount}€
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="p-8 text-center text-slate-300 text-[10px] uppercase font-bold italic">{getTranslation('game.noMovements', language)}</p>
                  )}
                </div>
              </div>
            </div>

            <style jsx>{`
              @keyframes zoomIn {
                from {
                  transform: scale(0);
                  opacity: 0;
                }
                to {
                  transform: scale(1);
                  opacity: 1;
                }
              }

              .animate-zoom-in {
                animation: zoomIn 0.4s ease-out;
              }
            `}</style>
          </div>
        </div>

      ) : gamePhase === 'ranking' ? (
        /* FASE 2: RANKING */
        <RankingView
          players={roomPlayers}
          systemProfiles={(isFinalSimulation ? systemProfilesFinal : systemProfiles).map(profile => ({
            id: profile.id,
            alias: profile.alias,
            color: profile.color,
            emoji: profile.emoji,
            money: calculateSystemMoney(
              {
                red: profile.red,
                visibilidad: profile.visibilidad,
                tiempo: profile.tiempo,
                margen_error: profile.margen_error,
                responsabilidades: profile.responsabilidades
              },
              boardPosition,
              allCards
            )
          }))}
        />

      ) : gamePhase === 'voting' ? (
        /* FASE 3: VOTACIÓN */
        <div className="pt-12 pb-20 px-4 max-w-4xl mx-auto">
          <VotingView
            minisalaId={minisalaId}
            participantId={sessionStorage.getItem('participant_id') || ''}
          />
        </div>

      ) : gamePhase === 'final' ? (
        /* FASE FINAL: Pantalla de espera antes de la simulación */
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-emerald-900 via-slate-900 to-emerald-900">
          <div className="max-w-lg w-full text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-emerald-500/30">
              <div className="text-6xl mb-6">🎯</div>
              <h1 className="text-3xl font-black text-white mb-4">
                {getTranslation('game.finalSimulation', language)}
              </h1>
              <p className="text-emerald-200 mb-8 text-sm">
                {getTranslation('game.finalSimulationDesc', language)}
              </p>

              {isLeader ? (
                <button
                  onClick={startFinalSimulation}
                  className="w-full py-5 bg-emerald-500 text-white rounded-2xl font-black text-xl shadow-2xl shadow-emerald-500/30 hover:bg-emerald-400 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  <span>{getTranslation('game.startSimulation', language)}</span>
                  <span className="text-2xl">🚀</span>
                </button>
              ) : (
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-600">
                  <div className="w-10 h-10 border-4 border-emerald-600 border-t-emerald-300 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-slate-300 text-sm">{getTranslation('game.waitingLeaderSimulation', language)}</p>
                </div>
              )}
            </div>
          </div>
        </div>

      ) : (
        /* FASE 4: PODIO */
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-900 text-white">
          <PodiumView />
        </div>
      )}
    </div>
  );
}