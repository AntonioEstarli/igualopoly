'use client';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/src/lib/supabaseClient';
import { calculateCardImpact } from '@/src/lib/gameLogic';
import { getImpactDetail } from '@/src/lib/gameLogic';
import Dice from '@/src/components/Dice';
import { BoardView } from '@/src/components/BoardView';
import { CapitalRace } from '@/src/components/CapitalRace';
import { calculateSystemMoney } from '@/src/lib/gameLogic';
import { VotingView } from '@/src/components/VotingView';
import { PodiumView } from '@/src/components/PodiumView';
import { MetricsView } from '@/src/components/MetricsView';
import { getTranslation, Language } from '@/src/lib/translations';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';

interface RoomPlayer {
  id: string;
  alias: string;
  money: number;
  minisala_id: string;
  color?: string;
  emoji?: string;
  variables?: Record<string, string>;
}

export default function MinisalaGame() {
  const [isLeader, setIsLeader] = useState(false);
  const [roomState, setRoomState] = useState({ currentCard: 0, isBoardVisible: false });
  const [myMoney, setMyMoney] = useState(0);
  const [card, setCard] = useState<any>(null);
  const [minisalaId, setMinisalaId] = useState(() => {
    // Proteger acceso a localStorage (puede no estar disponible en SSR)
    if (typeof window !== 'undefined') {
      return localStorage.getItem('minisala_id') || 'sala_1';
    }
    return 'sala_1';
  });
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
  const [gamePhase, setGamePhase] = useState<'start' | 'playing' | 'ranking' | 'voting' | 'podium' | 'final' | 'metrics_final'>('start');
  // Estado para la simulación final
  const [isFinalSimulation, setIsFinalSimulation] = useState(false);
  const isFinalSimulationRef = useRef(false); // Ref para leer en callbacks de Supabase sin closure stale
  const isRestoringRef = useRef(false); // Evita que el useEffect de carta aplique dinero al restaurar sesión
  const lastAppliedCardRef = useRef(0); // Último nº de carta cuyo impacto económico fue aplicado
  const [isAutoSimulating, setIsAutoSimulating] = useState(false); // Indica si la simulación automática está corriendo
  const gameChannelRef = useRef<any>(null); // Referencia al canal de juego para enviar broadcasts

  // Estado para detectar cuando el dado está girando
  const [isDiceRolling, setIsDiceRolling] = useState(false);

  // Estado para sincronizar el lanzamiento del dado entre todos los jugadores
  const [externalDiceRoll, setExternalDiceRoll] = useState<{ value: number; timestamp: number } | null>(null);

  // Estado para text-to-speech
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Idioma del usuario
  const [language, setLanguage] = useState<Language>('ES');

  // Estado para controlar el paso actual de la carta (1, 2, o 3)
  const [cardStep, setCardStep] = useState(1);

  // Retrasa la aparición de la carta para que se aprecie el movimiento del peón
  const [cardVisible, setCardVisible] = useState(false);

  // Versión retrasada de roomPlayers y boardPosition para sincronizar CapitalRace con la carta
  const [displayedPlayers, setDisplayedPlayers] = useState<RoomPlayer[]>([]);
  const playersInitialized = useRef(false);
  const isStartTransition = useRef(false);
  const [displayedCardNumber, setDisplayedCardNumber] = useState(0);

  // Variables del jugador
  const [userVars, setUserVars] = useState<Record<string, string>>({});

  // DEBUG: Log del valor de minisalaId al renderizar
  useEffect(() => {
    console.log('🔍 DEBUG - minisalaId actual:', minisalaId);
  }, [minisalaId]);

  useEffect(() => {
    const storedLang = localStorage.getItem('idioma') as Language;
    if (storedLang) {
      setLanguage(storedLang);
    }
    // Cargar variables del jugador
    const storedVars = localStorage.getItem('vars');
    if (storedVars) {
      setUserVars(JSON.parse(storedVars));
    }
  }, []);

  // Heartbeat: actualizar last_activity cada 30 segundos para detectar usuarios online
  useEffect(() => {
    const updateActivity = async () => {
      const participantId = localStorage.getItem('participant_id');
      if (!participantId) return;

      await supabase
        .from('participants')
        .update({ last_activity: new Date().toISOString() })
        .eq('id', participantId);
    };

    // Actualizar inmediatamente al entrar
    updateActivity();

    // Luego cada 30 segundos
    const interval = setInterval(updateActivity, 30000);

    return () => clearInterval(interval);
  }, []);

  // TODO: REvisar que los valores son correctos, aunque de hecho debería coger estos valores de la base de datos
  /*const SYSTEM_PROFILES = [
    { id: 'p1', alias: 'Hombre Blanco Cis', color: '#1e293b', vars: { red: 'ALTO', visibilidad: 'ALTO', tiempo: 'ALTO', margen_error: 'ALTO', responsabilidades: 'BAJO' } },
    { id: 'p2', alias: 'Madre Soltera', color: '#e11d48', vars: { red: 'BAJO', visibilidad: 'MEDIO', tiempo: 'BAJO', margen_error: 'ALTO', responsabilidades: 'BAJO' } },
    { id: 'p3', alias: 'Mujer Migrante', color: '#059669', vars: { red: 'BAJO', visibilidad: 'BAJO', tiempo: 'ALTO', margen_error: 'ALTO', responsabilidades: 'BAJO' } },
    { id: 'p4', alias: 'Senior +50', color: '#ca8a04', vars: { red: 'ALTO', visibilidad: 'BAJO', tiempo: 'ALTO', margen_error: 'ALTO', responsabilidades: 'BAJO' } },
    { id: 'p5', alias: 'Joven Prácticas', color: '#7c3aed', vars: { red: 'MEDIO', visibilidad: 'ALTO', tiempo: 'ALTO', margen_error: 'ALTO', responsabilidades: 'BAJO' } },
  ];*/

  // Detectar cambios en la sala vía Supabase Realtime (ej: admin cambia sala)
  useEffect(() => {
    const userId = localStorage.getItem('participant_id');
    if (!userId) {
      console.warn('⚠️ No hay participant_id, no se puede suscribir a cambios de sala');
      return;
    }

    console.log(`📡 Suscribiéndose a cambios de sala para usuario: ${userId}`);

    const channel = supabase
      .channel('participant_room_changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'participants',
        filter: `id=eq.${userId}`
      }, (payload: any) => {
        console.log('📨 Recibido cambio en participants:', payload);
        const newRoom = payload.new.minisala_id;
        if (newRoom && newRoom !== minisalaId) {
          // Actualizar el estado y localStorage
          setMinisalaId(newRoom);
          localStorage.setItem('minisala_id', newRoom);
          console.log(`🔄 Sala cambiada por admin: ${minisalaId} → ${newRoom}`);
        }
      })
      .subscribe((status) => {
        console.log(`📡 Estado de suscripción a cambios de sala: ${status}`);
      });

    return () => {
      console.log('🔌 Desuscribiéndose de cambios de sala');
      supabase.removeChannel(channel);
    };
  }, [minisalaId]);

  // Suscripción al canal - se re-ejecuta cuando minisalaId cambia
  useEffect(() => {
    if (!minisalaId) {
      console.warn('⚠️ No hay minisalaId, no se puede suscribir al canal de juego');
      return;
    }

    console.log(`🎮 Suscribiéndose al canal de juego: room:${minisalaId}`);

    const channel = supabase.channel(`room:${minisalaId}`, {
      config: {
        broadcast: { self: true } // Permitir que el líder reciba sus propios broadcasts
      }
    })
      .on('broadcast', { event: 'card_advance' }, ({ payload }) => {
        console.log('📨 Broadcast recibido - card_advance:', payload);
        // 1. Actualizamos la posición del peón (según el dado)
        setRoomState(prev => ({ ...prev, currentCard: payload.nextBoardPosition }));
        setBoardPosition(payload.nextBoardPosition);

        // 2. Actualizamos el número de carta (de 1 en 1)
        setCurrentCardNumber(payload.nextCardNumber);
      })
      .on('broadcast', { event: 'dice_roll' }, ({ payload }) => {
        console.log('🎲 Broadcast recibido - dice_roll:', payload);
        // Sincronizar el lanzamiento del dado para todos los jugadores
        setExternalDiceRoll({ value: payload.diceValue, timestamp: payload.timestamp });
      })
      .on('broadcast', { event: 'dismiss_card' }, () => {
        console.log('📨 Broadcast recibido - dismiss_card');
        setCard(null);
      })
      .subscribe((status) => {
        console.log(`🎮 Estado de suscripción al canal de juego: ${status}`);
      });

    // Guardar referencia al canal para usarla en broadcasts
    gameChannelRef.current = channel;

    return () => {
      console.log(`🔌 Desuscribiéndose del canal de juego: room:${minisalaId}`);
      gameChannelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [minisalaId]); // Re-suscribir cuando cambia la sala

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


  // Suscripción para detectar el cambio de fase en participants (voting/podium/final/simulación)
  // IMPORTANTE: Esta suscripción se dispara ante CUALQUIER UPDATE de participantes (ej: is_leader, money),
  // por lo que NO debe reaccionar a 'playing' genérico — solo cuando venimos de 'final' (simulación).
  useEffect(() => {
    if (!minisalaId) return;
    const channel = supabase.channel(`phase_sync_${minisalaId}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'participants', filter: `minisala_id=eq.${minisalaId}` },
        (payload) => {
          if (payload.new.current_phase) {
            const newPhase = payload.new.current_phase;

            if (newPhase === 'final') {
              // Entramos en simulación final: reiniciamos estado
              setGamePhase('final');
              setBoardPosition(0);
              setCurrentCardNumber(0);
              setCard(null);
              setHistory([]);
              setMyMoney(0);
              isFinalSimulationRef.current = true;
              setIsFinalSimulation(true);
              localStorage.setItem('is_final_simulation', 'true');
            } else if (newPhase === 'voting' || newPhase === 'podium' || newPhase === 'metrics_final') {
              setGamePhase(newPhase);
            } else if (newPhase === 'playing' && isFinalSimulationRef.current) {
              // Transición de 'final' → 'playing': arranca la simulación automática (jugadores no-líder)
              setGamePhase('playing');
            }
            // 'playing' sin isFinalSimulationRef: lo gestiona la suscripción de rooms
            // Ignoramos el resto para evitar saltar desde 'start' cuando admin cambia is_leader o money
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [minisalaId]);

  // Suscripción para detectar el cambio de fase en rooms (ranking, playing desde start)
  useEffect(() => {
    if (!minisalaId) return;

    const channel = supabase.channel(`room_phase_sync_${minisalaId}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${minisalaId}` },
        (payload) => {
          if (payload.new.current_phase === 'ranking') {
            setGamePhase('ranking');
          } else if (payload.new.current_phase === 'playing' && !isFinalSimulationRef.current) {
            // Transición de 'start' a 'playing': el líder ha iniciado el juego
            isStartTransition.current = true;
            setGamePhase('playing');
            // Actualizamos el dinero del jugador desde la DB (el líder lo ha puesto a 10)
            const usuarioId = localStorage.getItem('participant_id');
            if (usuarioId) {
              supabase
                .from('participants')
                .select('money')
                .eq('id', usuarioId)
                .single()
                .then(({ data }) => { if (data) setMyMoney(data.money); });
            }
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
    if (!minisalaId) return;

    let cancelled = false;

    const fetchRoomPlayers = async () => {
      const { data, error } = await supabase
        .from('participants')
        .select('id, alias, money, minisala_id, color, emoji, variables')
        .eq('minisala_id', minisalaId)
        .order('id', { ascending: true });

      if (cancelled) return;

      if (error) {
        console.error("Error cargando jugadores:", error);
        return;
      }

      // Ahora data será tratado como RoomPlayer[] y no dará error
      setRoomPlayers((data as RoomPlayer[]) || []);
    };

    fetchRoomPlayers();

    // Suscripción para ver cómo se mueven los demás en tiempo real
    // Escucha INSERT (nuevo jugador entra) y UPDATE (dinero cambia)
    const channel = supabase.channel(`room_players_${minisalaId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'participants', filter: `minisala_id=eq.${minisalaId}` }, fetchRoomPlayers)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'participants', filter: `minisala_id=eq.${minisalaId}` }, fetchRoomPlayers)
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
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

      // Si estamos restaurando sesión, reconstruimos el historial y no re-aplicamos dinero
      if (isRestoringRef.current) {
        isRestoringRef.current = false;
        lastAppliedCardRef.current = currentCardNumber; // Marca esta carta como ya procesada
        const restoredVars = JSON.parse(localStorage.getItem('vars') || '{}');
        const reconstructed: {cardName: string, amount: number, reason: string}[] = [];
        for (let i = 1; i <= currentCardNumber; i++) {
          const c = allCards[i - 1];
          if (!c) break;
          const d = getImpactDetail(restoredVars, c.impact_variable, c.impact_values, c.impact_variable_2, language);
          reconstructed.unshift({
            cardName: language === 'EN' ? c.name_en : language === 'CAT' ? c.name_cat : c.name_es,
            amount: d.amount,
            reason: d.reason
          });
        }
        setHistory(reconstructed);
        return;
      }

      // Si el useEffect se re-dispara por cambio de idioma o recarga de allCards
      // para una carta ya procesada, no volvemos a aplicar el dinero
      if (currentCardNumber <= lastAppliedCardRef.current) return;
      lastAppliedCardRef.current = currentCardNumber;

      // 2. Recuperamos las variables que el usuario eligió al inicio
      const userVars = JSON.parse(localStorage.getItem('vars') || '{}');

      // 3. Calculamos el impacto del detalle (monto y razón)
      const detail = getImpactDetail(userVars, data.impact_variable, data.impact_values, data.impact_variable_2, language);

      // --- NUEVA LÓGICA DE ACTUALIZACIÓN ---

      // 4. Calculamos el nuevo total de forma precisa (usando una función de actualización para evitar estados viejos)
      setMyMoney(prevMoney => {
        const nuevoTotal = prevMoney + detail.amount;

        // 5. Guardamos en Supabase para que el marcador global se actualice
        const usuarioId = localStorage.getItem('participant_id');
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
            cardName: language === 'EN' ? data.name_en : language === 'CAT' ? data.name_cat : data.name_es,
            amount: detail.amount,
            reason: detail.reason
          },
          ...prev
        ]);
      }
    }
  }, [currentCardNumber, allCards, language]); // Se dispara cada vez que cambia el número de carta o el idioma

  // Retrasa la aparición de la carta para que se aprecie el movimiento del peón
  useEffect(() => {
    if (!card) {
      setCardVisible(false);
      return;
    }
    const timer = setTimeout(() => setCardVisible(true), 1300);
    return () => clearTimeout(timer);
  }, [card]);

  // Sincroniza displayedPlayers con roomPlayers: inmediato en la carga inicial, retrasado en actualizaciones
  useEffect(() => {
    if (roomPlayers.length === 0) {
      playersInitialized.current = false;
      setDisplayedPlayers([]);
      return;
    }
    if (!playersInitialized.current) {
      playersInitialized.current = true;
      setDisplayedPlayers(roomPlayers);
      return;
    }
    // Sin retraso en la transición start → playing
    if (isStartTransition.current) {
      isStartTransition.current = false;
      setDisplayedPlayers(roomPlayers);
      return;
    }
    const timer = setTimeout(() => setDisplayedPlayers(roomPlayers), 2300);
    return () => clearTimeout(timer);
  }, [roomPlayers]);

  // Retrasa el número de carta para sincronizar CapitalRace con la carta mostrada
  useEffect(() => {
    const timer = setTimeout(() => setDisplayedCardNumber(currentCardNumber), 2300);
    return () => clearTimeout(timer);
  }, [currentCardNumber]);

  // Subscripcion para saber si es lider y la fase actual
  useEffect(() => {
    const usuarioId = localStorage.getItem('participant_id');
    if (!usuarioId) {
      console.error("No se encontró participant_id en localStorage");
      return;
    }

    // Función para obtener el estado actual
    const syncRole = async () => {
      const sId = localStorage.getItem('minisala_id') || 'sala_1';

      const [{ data }, { data: roomData }] = await Promise.all([
        supabase.from('participants').select('is_leader, current_phase, money').eq('id', usuarioId).single(),
        supabase.from('rooms').select('current_phase, current_step, current_card_number, next_dice_index').eq('id', sId).single(),
      ]);

      if (data) {
        setIsLeader(data.is_leader);
        // Inicializar el dinero desde la DB (0 antes del inicio, 10 después)
        setMyMoney(data.money || 0);
        // Sincronizar la fase al reconectar.
        // Prioridad: las fases avanzadas del participante ('final','voting','podium')
        // mandan sobre la sala. Para el resto, la sala manda ('start','ranking').
        const roomPhase = roomData?.current_phase;
        const participantPhase = data.current_phase;

        if (participantPhase === 'final' || roomPhase === 'final') {
          // Simulación final: arrancamos desde 0 (no hace falta restaurar progreso)
          setGamePhase('final');
          setBoardPosition(0);
          setCurrentCardNumber(0);
          setCard(null);
          setHistory([]);
          isFinalSimulationRef.current = true;
          setIsFinalSimulation(true);
          localStorage.setItem('is_final_simulation', 'true');
        } else if (participantPhase === 'voting' || participantPhase === 'podium' || participantPhase === 'metrics_final') {
          setGamePhase(participantPhase);
        } else if (roomPhase === 'start') {
          setGamePhase('start');
          localStorage.removeItem('is_final_simulation');
        } else if (roomPhase === 'ranking') {
          setGamePhase('ranking');
          isRestoringRef.current = true;
          setBoardPosition(roomData?.current_step || 0);
          setCurrentCardNumber(roomData?.current_card_number || 0);
        } else if (participantPhase) {
          // 'playing': puede ser juego normal O simulación final ya en marcha
          const wasInFinalSimulation = localStorage.getItem('is_final_simulation') === 'true';
          if (wasInFinalSimulation) {
            isFinalSimulationRef.current = true;
            setIsFinalSimulation(true);
            // Si el líder reconecta, reanuda la simulación automática desde el paso actual
            if (data.is_leader) {
              setIsAutoSimulating(true);
            }
          }
          setGamePhase(participantPhase);
          isRestoringRef.current = true;
          setBoardPosition(roomData?.current_step || 0);
          setCurrentCardNumber(roomData?.current_card_number || 0);
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
          table: 'participants',
          filter: `id=eq.${usuarioId}`
        },
        (payload) => {
          // Solo actualizamos si el ID coincide
          if (payload.new.id === usuarioId || payload.new.id == usuarioId) {
            setIsLeader(payload.new.is_leader);
            // Si el admin ha movido al jugador a otra sala, migramos todos los canales
            if (payload.new.minisala_id && payload.new.minisala_id !== payload.old?.minisala_id) {
              localStorage.setItem('minisala_id', payload.new.minisala_id);
              setMinisalaId(payload.new.minisala_id);
            }
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Ya no se usa MAX_CARDS: ahora el fin de partida se determina cuando no hay más cartas disponibles (allCards.length)

  // Función para que el líder inicie el juego: da 10€ a todos y cambia la fase a 'playing'
  const startGame = async () => {
    const sId = minisalaId || localStorage.getItem('minisala_id') || 'sala_1';

    // 1. Dar 10€ a todos los participantes de la sala
    await supabase
      .from('participants')
      .update({ money: 10 })
      .eq('minisala_id', sId);

    // 2. Cambiar la fase de la sala a 'playing'
    await supabase
      .from('rooms')
      .update({ current_phase: 'playing' })
      .eq('id', sId);

    // 3. Actualizar estado local del líder
    isStartTransition.current = true;
    setMyMoney(10);
    setGamePhase('playing');
  };

  // Función para que el líder descarte la carta y notifique a todos los de la sala
  const leaderDismissCard = async () => {
    if (gameChannelRef.current) {
      await gameChannelRef.current.send({
        type: 'broadcast',
        event: 'dismiss_card',
        payload: {}
      });
    }
    setCard(null);
  };

  // Función para manejar el inicio del lanzamiento del dado
  const handleDiceRollStart = () => {
    setIsDiceRolling(true);
  };

  // Función que el líder usa para obtener el valor del dado y hacer broadcast
  const handleLeaderDiceRoll = async (): Promise<number> => {
    // Obtener el valor del dado
    const diceValue = await getNextDiceValue() || Math.floor(Math.random() * 6) + 1;

    console.log(`🎲 Líder enviando broadcast dice_roll: ${diceValue} a canal room:${minisalaId}`);

    // Broadcast a todos (incluyendo el líder gracias a self: true)
    if (gameChannelRef.current) {
      await gameChannelRef.current.send({
        type: 'broadcast',
        event: 'dice_roll',
        payload: { diceValue, timestamp: Date.now() }
      });
    }

    return diceValue;
  };

  // Función para avanzar el juego (se llama después de que el dado termine de girar)
  const advanceGame = async (diceValue: number) => {
    // Solo el líder avanza el juego
    if (!isLeader) return;

    // El peón avanza según el dado, la carta avanza de 1 en 1
    const nextBoardPosition = boardPosition + diceValue;
    const nextCardNumber = currentCardNumber + 1;

    console.log(`📤 Líder enviando broadcast card_advance: pos=${nextBoardPosition}, card=${nextCardNumber} a canal room:${minisalaId}`);

    // Broadcast a todos (incluyendo el líder gracias a self: true)
    if (gameChannelRef.current) {
      await gameChannelRef.current.send({
        type: 'broadcast',
        event: 'card_advance',
        payload: { nextBoardPosition, nextCardNumber }
      });
    }

    // Guardamos progreso en db
    const { error } = await supabase
      .from('rooms')
      .update({
        current_step: nextBoardPosition,
        current_card_number: nextCardNumber
      })
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

    // Usamos el ID del participante del localStorage
    const usuarioId = localStorage.getItem('participant_id');

    // Priorizamos el estado 'minisalaId' del componente, 
    // y si está vacío, lo buscamos en el localStorage
    const sId = minisalaId || localStorage.getItem('minisala_id');

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
    // Guardar métricas del juego normal antes de iniciar la simulación
    // Incluir jugadores reales + system_profiles (igual que en admin)
    const systemProfilesWithMoney = systemProfiles.map(profile => ({
      ...profile,
      money: calculateSystemMoney(
        {
          red: profile.red,
          visibilidad: profile.visibilidad,
          tiempo: profile.tiempo,
          margen_error: profile.margen_error,
          responsabilidades: profile.responsabilidades
        },
        currentCardNumber,
        allCards
      )
    }));

    const allParticipants = [...roomPlayers, ...systemProfilesWithMoney];
    const moneyValues = allParticipants.map(p => p.money).sort((a, b) => b - a);
    const maxMoney = moneyValues[0] || 0;
    const minMoney = moneyValues[moneyValues.length - 1] || 0;
    const brecha = maxMoney - minMoney;
    const ratio = minMoney === 0 ? maxMoney : maxMoney / minMoney;

    // Guardar estas métricas en la tabla rooms
    await supabase
      .from('rooms')
      .update({
        brecha_normal: brecha,
        ratio_normal: parseFloat(ratio.toFixed(2))
      })
      .eq('id', minisalaId);

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

    // Actualizamos la sala a 'playing' y reseteamos el número de carta
    await supabase
      .from('rooms')
      .update({
        current_phase: 'playing',
        current_card_number: 0
      })
      .eq('id', minisalaId);

    // Actualizamos el estado local
    setGamePhase('playing');
    setIsAutoSimulating(true); // Iniciar simulación automática
  };

  // Función para que el Líder active las métricas finales
  const activateMetricsFinal = async () => {
    // Actualizamos todos los participantes de la sala a 'metrics_final'
    await supabase
      .from('participants')
      .update({ current_phase: 'metrics_final' })
      .eq('minisala_id', minisalaId);

    // Actualizamos el estado local inmediatamente para el líder
    setGamePhase('metrics_final');
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
      // Esperar 4 segundos antes de cada lanzamiento
      await new Promise(resolve => setTimeout(resolve, 4000));

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

  // Función para limpiar Markdown del texto antes de enviarlo al TTS
  const cleanMarkdownForSpeech = (text: string): string => {
    return text
      // Eliminar negritas (** o __)
      .replace(/\*\*/g, '')
      .replace(/__/g, '')
      // Eliminar itálicas (* o _)
      .replace(/\*/g, '')
      .replace(/_/g, '')
      // Eliminar encabezados (#)
      .replace(/^#+\s/gm, '')
      // Convertir flechas y símbolos especiales
      .replace(/→/g, '')
      .replace(/←/g, '')
      .replace(/↑/g, '')
      .replace(/↓/g, '')
      // Eliminar enlaces [texto](url) -> solo dejar el texto
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Eliminar bloques de código (`)
      .replace(/`/g, '')
      // Limpiar saltos de línea múltiples
      .replace(/\n\n+/g, '. ')
      .replace(/\n/g, ' ')
      // Limpiar espacios múltiples
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Funciones de Text-to-Speech
  const speakText = (text: string) => {
    // Detener cualquier voz anterior
    stopSpeaking();

    // Limpiar el texto de sintaxis Markdown
    const cleanText = cleanMarkdownForSpeech(text);

    // Mapeo de idiomas a códigos de voz
    const langMap: Record<Language, string> = {
      ES: 'es-ES',
      EN: 'en-US',
      CAT: 'ca-ES'
    };

    const targetLang = langMap[language];

    // Obtener todas las voces disponibles
    const voices = window.speechSynthesis.getVoices();

    // Buscar la mejor voz disponible para el idioma
    // Prioridad: Google > Premium/Enhanced > Natural > Cualquier voz del idioma
    const findBestVoice = (): { voice: SpeechSynthesisVoice | undefined; isSpanishFallback: boolean } => {
      const langVoices = voices.filter(v => v.lang.startsWith(targetLang.split('-')[0]));

      // 1. Buscar voces de Google (suelen ser las mejores)
      const googleVoice = langVoices.find(v => v.name.includes('Google'));
      if (googleVoice) return { voice: googleVoice, isSpanishFallback: false };

      // 2. Buscar voces Premium o Enhanced
      const premiumVoice = langVoices.find(v =>
        v.name.includes('Premium') ||
        v.name.includes('Enhanced') ||
        v.name.includes('Natural')
      );
      if (premiumVoice) return { voice: premiumVoice, isSpanishFallback: false };

      // 3. Buscar voces de Microsoft (mejor que las básicas)
      const microsoftVoice = langVoices.find(v => v.name.includes('Microsoft'));
      if (microsoftVoice) return { voice: microsoftVoice, isSpanishFallback: false };

      // 4. Usar la primera voz disponible del idioma
      if (langVoices.length > 0) return { voice: langVoices[0], isSpanishFallback: false };

      // 5. Fallback especial para catalán: usar español si no hay voces catalanas de calidad
      if (language === 'CAT') {
        console.log('⚠️ No hay buenas voces en catalán, usando español como fallback');
        const spanishVoices = voices.filter(v => v.lang.startsWith('es'));
        const fallbackVoice = spanishVoices.find(v => v.name.includes('Google')) ||
               spanishVoices.find(v => v.name.includes('Microsoft')) ||
               spanishVoices[0];
        return { voice: fallbackVoice, isSpanishFallback: true };
      }

      return { voice: undefined, isSpanishFallback: false };
    };

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const { voice: bestVoice, isSpanishFallback } = findBestVoice();

    // Si usamos fallback español para catalán, usar código de idioma español
    utterance.lang = isSpanishFallback ? 'es-ES' : targetLang;
    utterance.rate = language === 'CAT' ? 0.95 : 1.0; // Ligeramente más lento en catalán
    utterance.pitch = 1.0;

    // Asignar la mejor voz disponible
    if (bestVoice) {
      utterance.voice = bestVoice;
      console.log('🔊 Usando voz:', bestVoice.name, '| Idioma:', utterance.lang);
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  // Cargar las voces disponibles al inicio
  useEffect(() => {
    // Las voces pueden no estar disponibles inmediatamente en algunos navegadores
    // Este evento se dispara cuando las voces están listas
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        console.log('✅ Voces TTS cargadas:', voices.length);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Detener la voz cuando cambia el paso de la carta o se cierra
  useEffect(() => {
    return () => stopSpeaking();
  }, [cardStep, card]);

  return (
    <div className="min-h-screen bg-slate-100">
      {/* FASE 1: JUEGO ACTIVO (incluye 'start' mientras esperamos que el líder arranque) */}
      {(gamePhase === 'playing' || gamePhase === 'start') ? (
        <div className="flex flex-col md:flex-row h-screen overflow-hidden">

          {/* COLUMNA IZQUIERDA: CARRERA DE CAPITAL (Vertical) */}
          <div className="w-full md:w-[380px] md:shrink-0 h-1/3 md:h-full p-2 bg-slate-800 shadow-2xl">
            <CapitalRace
              players={displayedPlayers.map(player => gamePhase === 'start' ? { ...player, money: 0 } : isFinalSimulation ? {
                ...player,
                money: calculateSystemMoney(
                  player.variables || {},
                  displayedCardNumber,
                  allCards
                )
              } : player)}
              language={language}
              systemProfiles={systemProfiles.map(profile => ({
                id: profile.id,
                alias: profile.alias,
                color: profile.color,
                emoji: profile.emoji, // Asegúrate de que el backend traiga esto
                money: gamePhase === 'start' ? 0 : calculateSystemMoney(
                  {
                    red: profile.red,
                    visibilidad: profile.visibilidad,
                    tiempo: profile.tiempo,
                    margen_error: profile.margen_error,
                    responsabilidades: profile.responsabilidades
                  },
                  displayedCardNumber,
                  allCards,
                  { isFinalSimulation, profileId: profile.id }
                )
              }))}
            />
          </div>

          {/* COLUMNA DERECHA: TABLERO, CONTROLES E HISTORIAL */}
          <div className="flex-1 flex flex-col overflow-y-auto relative isolate">

            {/* 1. EL TABLERO (Arriba derecha) */}
            <div className="w-full bg-slate-800 px-6 pb-6 pt-2 shadow-lg relative">
<div className="max-w-[780px] mx-auto relative">
                <BoardView currentStep={boardPosition} />

                {/* CARTA centrada en el tablero - No mostrar en simulación final */}
                {card && cardVisible && !isFinalSimulation && !isDiceRolling && (
                  <div className="absolute inset-0 flex items-start justify-center pointer-events-none z-30" style={{ padding: '15% 15%' }}>
                    <div
                      className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col pointer-events-auto animate-zoom-in"
                      style={{
                        animation: 'zoomIn 0.6s ease-out 0.5s both',
                        maxHeight: '100%',
                        maxWidth: '100%'
                      }}
                    >
                      <div
                        className="p-3 flex justify-between items-center text-white flex-shrink-0"
                        style={{ backgroundColor: card.color || '#ef4444' }}
                      >
                        <span className="font-black uppercase text-sm tracking-widest">
                          {language === 'ES' ? card.name_es : language === 'EN' ? card.name_en : card.name_cat}
                        </span>
                        <button
                          onClick={() => {
                            if (isSpeaking) {
                              stopSpeaking();
                            } else {
                              // Leer el contenido según el paso actual
                              let textToRead = '';
                              if (cardStep === 1) {
                                textToRead = language === 'ES' ? card.situation_es : language === 'EN' ? card.situation_en : card.situation_cat;
                              } else if (cardStep === 2) {
                                const sabiasText = language === 'ES' ? card.sabias_es : language === 'EN' ? card.sabias_en : card.sabias_cat;
                                const afectaText = language === 'ES' ? card.afecta_es : language === 'EN' ? card.afecta_en : card.afecta_cat;
                                textToRead = `${sabiasText || ''} ${afectaText || ''}`.trim();
                              } else if (cardStep === 3) {
                                const reflexionText = language === 'ES' ? card.reflexion_es : language === 'EN' ? card.reflexion_en : card.reflexion_cat;
                                const reescribeText = language === 'ES' ? card.reescribe_es : language === 'EN' ? card.reescribe_en : card.reescribe_cat;
                                textToRead = `${reflexionText || ''} ${reescribeText || ''}`.trim();
                              }
                              speakText(textToRead);
                            }
                          }}
                          className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-xl transition-all"
                          title={isSpeaking ? 'Detener' : 'Escuchar'}
                        >
                          {isSpeaking ? '⏸️' : '🔊'}
                        </button>
                      </div>

                      <div className="p-4 flex-1 overflow-y-auto">
                        {/* PASO 1: Situación */}
                        {cardStep === 1 && (
                          <div className="space-y-4">
                            <div className="text-slate-700 font-serif text-xl leading-snug italic prose prose-lg max-w-none">
                              <ReactMarkdown remarkPlugins={[remarkBreaks]}>
                                {language === 'ES' ? card.situation_es : language === 'EN' ? card.situation_en : card.situation_cat}
                              </ReactMarkdown>
                            </div>
                            <button
                              onClick={() => setCardStep(2)}
                              className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black shadow-lg hover:bg-slate-900 transition-all"
                            >
                              {getTranslation('game.next', language)}
                            </button>
                          </div>
                        )}

                        {/* PASO 2: Sabías que + Afecta + Puntuación */}
                        {cardStep === 2 && (
                          <div className="space-y-4">
                            {/* Sabías que */}
                            {(card.sabias_es || card.sabias_en || card.sabias_cat) && (
                              <div>
                                <h4 className="text-xs font-black text-slate-600 mb-2">{getTranslation('game.cardDidYouKnow', language)}</h4>
                                <div className="text-slate-700 text-sm leading-relaxed prose prose-sm max-w-none">
                                  <ReactMarkdown remarkPlugins={[remarkBreaks]}>
                                    {language === 'ES' ? card.sabias_es : language === 'EN' ? card.sabias_en : card.sabias_cat}
                                  </ReactMarkdown>
                                </div>
                              </div>
                            )}

                            {/* Cómo afecta a los perfiles */}
                            {(card.afecta_es || card.afecta_en || card.afecta_cat) && (
                              <div>
                                <h4 className="text-xs font-black text-slate-600 mb-2">{getTranslation('game.cardHowAffects', language)}</h4>
                                <div className="text-slate-700 text-sm leading-relaxed prose prose-sm max-w-none">
                                  <ReactMarkdown remarkPlugins={[remarkBreaks]}>
                                    {language === 'ES' ? card.afecta_es : language === 'EN' ? card.afecta_en : card.afecta_cat}
                                  </ReactMarkdown>
                                </div>
                              </div>
                            )}

                            {/* Puntuación */}
                            <div>
                              <h4 className="text-xs font-black text-slate-600 mb-2">{getTranslation('game.cardScore', language)}</h4>
                              <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                                {card.impact_variable_2 ? (
                                  <>
                                    {/* Para el tier ALTO: mostrar el nivel raw real de cada variable que produce nivel efectivo ALTO
                                        (responsabilidades se invierte: necesita raw BAJO para ser efectivo ALTO) */}
                                    {(() => {
                                      const rawForEffectiveAlto = (v: string) =>
                                        v?.toLowerCase() === 'responsabilidades' ? 'BAJO' : 'ALTO';
                                      const raw1 = rawForEffectiveAlto(card.impact_variable);
                                      const raw2 = rawForEffectiveAlto(card.impact_variable_2);
                                      return (
                                        <>
                                          <div className="flex justify-between items-start">
                                            <div className="text-sm font-bold text-slate-700 flex-1 flex flex-col gap-0.5">
                                              <span>
                                                {getTranslation(`characterCreation.variableLabels.${card.impact_variable}`, language)}{' '}
                                                {getTranslation(`characterCreation.levels.${raw1}`, language)}
                                              </span>
                                              <span>
                                                {getTranslation(`characterCreation.variableLabels.${card.impact_variable_2}`, language)}{' '}
                                                {getTranslation(`characterCreation.levels.${raw2}`, language)}
                                              </span>
                                            </div>
                                            <span className="text-sm font-black text-green-600 ml-2 whitespace-nowrap">
                                              {card.impact_values?.ALTO >= 0 ? '+' : ''}{card.impact_values?.ALTO || 0}K€
                                            </span>
                                          </div>
                                          <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-slate-700">
                                              {getTranslation('game.scoreComboOneAlto', language)}
                                            </span>
                                            <span className="text-sm font-black text-yellow-600">
                                              {card.impact_values?.MEDIO >= 0 ? '+' : ''}{card.impact_values?.MEDIO || 0}K€
                                            </span>
                                          </div>
                                          <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-slate-700">
                                              {getTranslation('game.scoreComboNoneAlto', language)}
                                            </span>
                                            <span className="text-sm font-black text-red-600">
                                              {card.impact_values?.BAJO >= 0 ? '+' : ''}{card.impact_values?.BAJO || 0}K€
                                            </span>
                                          </div>
                                        </>
                                      );
                                    })()}
                                  </>
                                ) : (
                                  <>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-bold text-slate-700">
                                        {getTranslation(`characterCreation.variableLabels.${card.impact_variable}`, language)} {getTranslation('characterCreation.levels.ALTO', language)}
                                      </span>
                                      <span className="text-sm font-black text-green-600">
                                        {card.impact_values?.ALTO >= 0 ? '+' : ''}{card.impact_values?.ALTO || 0}K€
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-bold text-slate-700">
                                        {getTranslation(`characterCreation.variableLabels.${card.impact_variable}`, language)} {getTranslation('characterCreation.levels.MEDIO', language)}
                                      </span>
                                      <span className="text-sm font-black text-yellow-600">
                                        {card.impact_values?.MEDIO >= 0 ? '+' : ''}{card.impact_values?.MEDIO || 0}K€
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-bold text-slate-700">
                                        {getTranslation(`characterCreation.variableLabels.${card.impact_variable}`, language)} {getTranslation('characterCreation.levels.BAJO', language)}
                                      </span>
                                      <span className="text-sm font-black text-red-600">
                                        {card.impact_values?.BAJO >= 0 ? '+' : ''}{card.impact_values?.BAJO || 0}K€
                                      </span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-3">
                              <button
                                onClick={() => setCardStep(1)}
                                className="flex-1 py-4 bg-slate-200 text-slate-700 rounded-2xl font-black shadow-lg hover:bg-slate-300 transition-all"
                              >
                                {getTranslation('game.back', language)}
                              </button>
                              <button
                                onClick={() => setCardStep(3)}
                                className="flex-1 py-4 bg-slate-800 text-white rounded-2xl font-black shadow-lg hover:bg-slate-900 transition-all"
                              >
                                {getTranslation('game.next', language)}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* PASO 3: Reflexión + Reescribe + Propuesta */}
                        {cardStep === 3 && (
                          <div className="space-y-4">
                            {/* Preguntas de reflexión */}
                            {(card.reflexion_es || card.reflexion_en || card.reflexion_cat) && (
                              <div>
                                <h4 className="text-xs font-black text-slate-600 mb-2">{getTranslation('game.cardReflection', language)}</h4>
                                <div className="text-slate-700 text-sm leading-relaxed prose prose-sm max-w-none">
                                  <ReactMarkdown remarkPlugins={[remarkBreaks]}>
                                    {language === 'ES' ? card.reflexion_es : language === 'EN' ? card.reflexion_en : card.reflexion_cat}
                                  </ReactMarkdown>
                                </div>
                              </div>
                            )}

                            {/* Reescribe la regla */}
                            {(card.reescribe_es || card.reescribe_en || card.reescribe_cat) && (
                              <div>
                                <h4 className="text-xs font-black text-slate-600 mb-2">{getTranslation('game.cardRewrite', language)}</h4>
                                <div className="text-slate-700 text-sm leading-relaxed prose prose-sm max-w-none">
                                  <ReactMarkdown remarkPlugins={[remarkBreaks]}>
                                    {language === 'ES' ? card.reescribe_es : language === 'EN' ? card.reescribe_en : card.reescribe_cat}
                                  </ReactMarkdown>
                                </div>
                              </div>
                            )}

                            {/* Propuesta */}
                            <div className="pt-2 border-t border-slate-100">
                              <h4 className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">{getTranslation('game.proposeChange', language)}</h4>
                              {isLeader ? (
                                // Solo el líder puede proponer cambios de regla
                                !hasSubmittedProposal ? (
                                  <div className="space-y-3">
                                    <textarea
                                      value={proposalText}
                                      onChange={(e) => setProposalText(e.target.value)}
                                      placeholder={getTranslation('game.proposalPlaceholder', language)}
                                      className="w-full p-4 text-sm border-2 border-slate-100 rounded-2xl focus:border-red-500 outline-none transition-all resize-none h-24"
                                    />
                                    {proposalText.trim() ? (
                                      <div className="flex gap-3">
                                        <button
                                          onClick={() => setCardStep(2)}
                                          className="flex-1 py-4 bg-slate-200 text-slate-700 rounded-2xl font-black shadow-lg hover:bg-slate-300 transition-all"
                                        >
                                          {getTranslation('game.back', language)}
                                        </button>
                                        <button
                                          onClick={submitProposal}
                                          disabled={isSubmitting}
                                          className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black shadow-lg shadow-red-200 hover:bg-red-700 transition-all disabled:opacity-50"
                                        >
                                          {isSubmitting ? getTranslation('game.sending', language) : getTranslation('game.sendIdea', language)}
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex gap-3">
                                        <button
                                          onClick={() => setCardStep(2)}
                                          className="flex-1 py-4 bg-slate-200 text-slate-700 rounded-2xl font-black shadow-lg hover:bg-slate-300 transition-all"
                                        >
                                          {getTranslation('game.back', language)}
                                        </button>
                                        <button
                                          onClick={isLeader ? leaderDismissCard : () => setCard(null)}
                                          className="flex-1 py-4 bg-slate-800 text-white rounded-2xl font-black shadow-lg hover:bg-slate-900 transition-all"
                                        >
                                          {getTranslation('game.next', language)}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    <div className="bg-green-50 p-4 rounded-2xl border border-green-100 flex items-center gap-3">
                                      <span className="text-2xl">✅</span>
                                      <p className="text-green-700 text-xs font-bold uppercase">{getTranslation('game.proposalSent', language)}</p>
                                    </div>
                                    <div className="flex gap-3">
                                      <button
                                        onClick={() => setCardStep(2)}
                                        className="flex-1 py-4 bg-slate-200 text-slate-700 rounded-2xl font-black shadow-lg hover:bg-slate-300 transition-all"
                                      >
                                        {getTranslation('game.back', language)}
                                      </button>
                                      <button
                                        onClick={isLeader ? leaderDismissCard : () => setCard(null)}
                                        className="flex-1 py-4 bg-slate-800 text-white rounded-2xl font-black shadow-lg hover:bg-slate-900 transition-all"
                                      >
                                        {getTranslation('game.next', language)}
                                      </button>
                                    </div>
                                  </div>
                                )
                              ) : (
                                // Los no-líderes ven un mensaje informativo
                                <div className="space-y-3">
                                  <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-center gap-3">
                                    <span className="text-2xl">ℹ️</span>
                                    <p className="text-amber-700 text-xs font-bold">{getTranslation('game.onlyLeaderPropose', language)}</p>
                                  </div>
                                  <div className="flex gap-3">
                                    <button
                                      onClick={() => setCardStep(2)}
                                      className="flex-1 py-4 bg-slate-200 text-slate-700 rounded-2xl font-black shadow-lg hover:bg-slate-300 transition-all"
                                    >
                                      {getTranslation('game.back', language)}
                                    </button>
                                    <button
                                      onClick={() => setCard(null)}
                                      className="flex-1 py-4 bg-slate-800 text-white rounded-2xl font-black shadow-lg hover:bg-slate-900 transition-all"
                                    >
                                      {getTranslation('game.next', language)}
                                    </button>
                                  </div>
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

              {/* 2. PANEL DE CONTROL DEL LÍDER / ESPERA (encima del tablero) */}
              <div className="absolute top-[13%] left-0 right-0 flex justify-center z-10 pointer-events-none">
                <div className="max-w-md w-full mx-4 pointer-events-auto" style={{ transform: 'scale(0.8)' }}>
                  {gamePhase === 'start' ? (
                    /* FASE INICIO: El líder arranca el juego */
                    isLeader ? (
                      <div className="bg-white p-6 rounded-3xl shadow-xl border-4 border-dashed border-red-100 flex flex-col items-center justify-center gap-4">
                        <p className="text-red-600 font-black uppercase tracking-widest text-sm">{getTranslation('game.youAreLeader', language)}</p>
                        <p className="text-slate-500 text-xs text-center">{getTranslation('game.startGameDesc', language)}</p>
                        <button
                          onClick={startGame}
                          className="w-full py-4 bg-red-600 text-white rounded-2xl font-black shadow-lg shadow-red-200 hover:bg-red-700 transition-all active:scale-95"
                        >
                          {getTranslation('game.startGame', language)}
                        </button>
                      </div>
                    ) : (
                      <div className="bg-white p-6 rounded-3xl shadow-xl border-4 border-dashed border-slate-100 flex flex-col items-center justify-center gap-3">
                        <div className="w-10 h-10 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                        <p className="text-slate-600 font-black uppercase tracking-widest text-sm text-center">{getTranslation('game.waitingGameStart', language)}</p>
                      </div>
                    )
                  ) : isFinalSimulation ? (
                    /* SIMULACIÓN FINAL: Indicador de progreso automático */
                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-3xl shadow-xl border-4 border-emerald-300 flex flex-col items-center justify-center">
                      {currentCardNumber < allCards.length ? (
                        <>
                          <p className="text-white font-black mb-2 uppercase tracking-widest text-sm">{getTranslation('game.finalSimulation', language)}</p>
                          <p className="text-emerald-100 text-xs mb-4">{getTranslation('game.simulatingProgress', language)}</p>
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 border-4 border-emerald-200 border-t-white rounded-full animate-spin" />
                            <div className="text-white">
                              <p className="text-3xl font-black">{currentCardNumber}/{allCards.length}</p>
                              <p className="text-xs text-emerald-100">{getTranslation('game.steps', language)}</p>
                            </div>
                          </div>
                          {/* Mostrar texto de simulación de la carta actual */}
                          {currentCardNumber > 0 && allCards[currentCardNumber - 1] && (
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border-2 border-white/20 w-full">
                              <p className="text-white text-base leading-relaxed text-center font-medium">
                                {language === 'ES'
                                  ? allCards[currentCardNumber - 1].simulation_text_es
                                  : language === 'EN'
                                  ? allCards[currentCardNumber - 1].simulation_text_en
                                  : allCards[currentCardNumber - 1].simulation_text_cat}
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center space-y-4 w-full">
                          <p className="text-white font-black text-xl uppercase italic">{getTranslation('game.simulationComplete', language)}</p>
                          {/* Botón para mostrar métricas finales (solo líder) */}
                          {isLeader && (
                            <button
                              onClick={activateMetricsFinal}
                              className="w-full py-3 bg-white text-emerald-600 rounded-xl font-black shadow-lg hover:bg-emerald-50 transition-colors"
                            >
                              {getTranslation('game.showFinalMetrics', language)}
                            </button>
                          )}
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
                            showButton={isLeader && !card}
                            externalRoll={externalDiceRoll}
                            broadcastRoll={isLeader ? handleLeaderDiceRoll : undefined}
                            language={language}
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
        /* FASE 2: MÉTRICAS DE DESIGUALDAD */
        <MetricsView
          players={roomPlayers}
          systemProfiles={systemProfiles.map(profile => ({
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
              currentCardNumber,
              allCards
            )
          }))}
          isFinalSimulation={false}
          minisalaId={minisalaId}
        />

      ) : gamePhase === 'voting' ? (
        /* FASE 3: VOTACIÓN */
        <div className="pt-12 pb-20 px-4 max-w-4xl mx-auto">
          <VotingView
            minisalaId={minisalaId}
            participantId={localStorage.getItem('participant_id') || ''}
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

      ) : gamePhase === 'podium' ? (
        /* FASE 4: PODIO */
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-900 text-white">
          <PodiumView />
        </div>

      ) : gamePhase === 'metrics_final' ? (
        /* FASE 5: MÉTRICAS FINALES (después de la simulación) */
        (() => {
          // Calcular el dinero original de cada jugador usando sus variables reales
          const originalMoney: Record<string, number> = {};
          roomPlayers.forEach(player => {
            originalMoney[player.id] = calculateSystemMoney(
              player.variables || {},
              allCards.length,
              allCards,
              { isFinalSimulation: false } // Sin simulación final = variables reales del jugador
            );
          });

          return (
            <MetricsView
              players={roomPlayers.map(player => ({
                ...player,
                money: calculateSystemMoney(
                  player.variables || {},
                  allCards.length,
                  allCards,
                  { isFinalSimulation: true, profileId: player.id }
                )
              }))}
              systemProfiles={systemProfiles.map(profile => ({
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
                  allCards.length,
                  allCards,
                  { isFinalSimulation: true, profileId: profile.id }
                )
              }))}
              isFinalSimulation={true}
              minisalaId={minisalaId}
              originalMoneySnapshot={originalMoney}
            />
          );
        })()


      ) : null}
    </div>
  );
}