'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/src/lib/supabaseClient';
import { calculateSystemMoney, VariableLevel } from '@/src/lib/gameLogic';

interface Participant {
  id: string;
  alias: string;
  money: number;
  money_normal?: number;
  minisala_id: string;
  red: VariableLevel;
  visibilidad: VariableLevel;
  tiempo: VariableLevel;
  margen_error: VariableLevel;
  responsabilidades: VariableLevel;
}

interface Room {
  id: string;
  name: string;
  current_card_number: number;
  brecha_normal: number;
  ratio_normal: number;
}

interface SystemProfile {
  id: string;
  alias: string;
  color: string;
  emoji: string;
  red: VariableLevel;
  visibilidad: VariableLevel;
  tiempo: VariableLevel;
  margen_error: VariableLevel;
  responsabilidades: VariableLevel;
}

export default function BrechasPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    }>
      <BrechasPage />
    </Suspense>
  );
}

function BrechasPage() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'inicial';
  const isFinal = type === 'final';

  const [rooms, setRooms] = useState<Room[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [systemProfiles, setSystemProfiles] = useState<SystemProfile[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const [roomsRes, participantsRes, profilesRes, cardsRes] = await Promise.all([
        supabase.from('rooms').select('*').order('id', { ascending: true }),
        supabase.from('participants').select('*').neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('system_profiles').select('*').order('id', { ascending: true }),
        supabase.from('cards').select('*').order('id', { ascending: true }),
      ]);

      setRooms(roomsRes.data || []);
      setParticipants(participantsRes.data || []);
      setSystemProfiles(profilesRes.data || []);
      setCards(cardsRes.data || []);
      setLoading(false);
    };

    fetchAll();
  }, []);

  const getRoomMetrics = (room: Room) => {
    const roomPlayers = participants.filter(p => p.minisala_id === room.id);
    if (roomPlayers.length === 0) return null;

    const currentCardNumber = room.current_card_number || 0;

    // For "inicial": use player.money (or money_normal if saved) + system_profiles normal
    // For "final": recalculate with isFinalSimulation=true
    const playersWithMoney = isFinal
      ? roomPlayers.map(player => ({
          id: player.id,
          alias: player.alias,
          isPlayer: true,
          money: calculateSystemMoney(
            {
              red: player.red,
              visibilidad: player.visibilidad,
              tiempo: player.tiempo,
              margen_error: player.margen_error,
              responsabilidades: player.responsabilidades,
            },
            cards.length,
            cards,
            { isFinalSimulation: true, profileId: player.id }
          ),
        }))
      : roomPlayers.map(player => ({
          id: player.id,
          alias: player.alias,
          isPlayer: true,
          money: player.money_normal ?? player.money ?? 0,
        }));

    const systemProfilesWithMoney = systemProfiles.map(profile => ({
      id: profile.id,
      alias: profile.alias,
      isPlayer: false,
      money: calculateSystemMoney(
        {
          red: profile.red,
          visibilidad: profile.visibilidad,
          tiempo: profile.tiempo,
          margen_error: profile.margen_error,
          responsabilidades: profile.responsabilidades,
        },
        isFinal ? cards.length : currentCardNumber,
        cards,
        isFinal ? { isFinalSimulation: true, profileId: profile.id } : undefined
      ),
    }));

    const allParticipants = [...playersWithMoney, ...systemProfilesWithMoney];
    const moneyValues = allParticipants.map(p => p.money).sort((a, b) => b - a);
    const maxMoney = moneyValues[0] || 0;
    const minMoney = moneyValues[moneyValues.length - 1] || 0;
    const brecha = maxMoney - minMoney;
    const ratio = minMoney === 0 ? maxMoney : maxMoney / minMoney;

    const concentracionLevel = isFinal ? 'BAJO' : (ratio > 2 ? 'ALTO' : ratio > 1.5 ? 'MEDIO' : 'BAJO');
    const motivacionLevel = isFinal ? 'ALTO' : (ratio > 2 ? 'BAJO' : ratio > 1.5 ? 'MEDIO' : 'ALTO');

    return {
      brecha,
      ratio,
      maxMoney,
      minMoney,
      concentracionLevel,
      motivacionLevel,
      allParticipants: allParticipants.sort((a, b) => b.money - a.money),
      playerCount: roomPlayers.length,
    };
  };

  // Global metrics across all rooms
  const getGlobalMetrics = () => {
    const allRoomMetrics = rooms.map(r => getRoomMetrics(r)).filter(Boolean) as NonNullable<ReturnType<typeof getRoomMetrics>>[];
    if (allRoomMetrics.length === 0) return null;

    // Deduplicate: system profiles repeat across rooms, keep only one instance per id
    const seen = new Set<string>();
    const allParticipants = allRoomMetrics.flatMap(m => m.allParticipants).filter(p => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
    const moneyValues = allParticipants.map(p => p.money).sort((a, b) => b - a);
    const maxMoney = moneyValues[0] || 0;
    const minMoney = moneyValues[moneyValues.length - 1] || 0;
    const brecha = maxMoney - minMoney;
    const ratio = minMoney === 0 ? maxMoney : maxMoney / minMoney;
    const concentracionLevel = isFinal ? 'BAJO' : (ratio > 2 ? 'ALTO' : ratio > 1.5 ? 'MEDIO' : 'BAJO');
    const motivacionLevel = isFinal ? 'ALTO' : (ratio > 2 ? 'BAJO' : ratio > 1.5 ? 'MEDIO' : 'ALTO');

    return { brecha, ratio, maxMoney, concentracionLevel, motivacionLevel, allParticipants };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const globalMetrics = getGlobalMetrics();

  const levelColor = (level: string) =>
    level === 'ALTO' ? 'bg-red-500/20 text-red-400 border-red-500/50'
    : level === 'MEDIO' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
    : 'bg-green-500/20 text-green-400 border-green-500/50';

  const levelLabel = (level: string) =>
    level === 'ALTO' ? 'ALTO' : level === 'MEDIO' ? 'MEDIO' : 'BAJO';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-6 flex flex-col items-center">
      <div className="max-w-6xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white drop-shadow-2xl">
            <span className={`text-transparent bg-clip-text bg-gradient-to-r ${
              isFinal
                ? 'from-emerald-200 via-emerald-500 to-emerald-200'
                : 'from-yellow-200 via-yellow-500 to-yellow-200'
            }`}>
              {isFinal ? 'Simulación Igualitaria' : 'Análisis de Desigualdad'}
            </span>
          </h1>
          <p className="text-slate-200 text-sm uppercase tracking-widest">
            {isFinal
              ? 'Resultados con condiciones equitativas — Todas las salas'
              : 'Impacto del sistema en la distribución de recursos — Todas las salas'}
          </p>
        </div>

        {/* Global Metrics */}
        {globalMetrics && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Brecha Global */}
              <div className="bg-white/15 backdrop-blur-sm rounded-3xl border border-white/30 overflow-hidden shadow-2xl p-8">
                <div className="text-center">
                  <div className="text-slate-300 text-xs uppercase tracking-widest font-black mb-4">
                    Brecha Global
                  </div>
                  <div className={`text-6xl font-black mb-2 ${isFinal ? 'text-green-400' : 'text-red-400'}`}>
                    {globalMetrics.brecha}K €
                  </div>
                  <div className="text-slate-400 text-sm">
                    Diferencia entre el que más y el que menos (todas las salas)
                  </div>
                </div>
              </div>

              {/* Concentración Global */}
              <div className="bg-white/15 backdrop-blur-sm rounded-3xl border border-white/30 overflow-hidden shadow-2xl p-8">
                <div className="text-center">
                  <div className="text-slate-300 text-xs uppercase tracking-widest font-black mb-4">
                    Concentración Global
                  </div>
                  <div className={`text-4xl font-black mb-4 px-6 py-3 rounded-2xl inline-block border-2 ${levelColor(globalMetrics.concentracionLevel)}`}>
                    {levelLabel(globalMetrics.concentracionLevel)}
                  </div>
                  <div className="text-slate-400 text-sm">
                    Nivel de concentración de recursos
                  </div>
                </div>
              </div>

              {/* Ratio Global */}
              <div className="bg-white/15 backdrop-blur-sm rounded-3xl border border-white/30 overflow-hidden shadow-2xl p-8">
                <div className="text-center">
                  <div className="text-slate-300 text-xs uppercase tracking-widest font-black mb-4">
                    Ratio Ganador/a
                  </div>
                  <div className={`text-6xl font-black mb-2 ${isFinal ? 'text-green-400' : 'text-orange-400'}`}>
                    {globalMetrics.ratio.toFixed(1)}x
                  </div>
                  <div className="text-slate-400 text-sm">
                    Ganador/a acumula X veces más que el último
                  </div>
                </div>
              </div>

              {/* Motivación Global */}
              <div className="bg-white/15 backdrop-blur-sm rounded-3xl border border-white/30 overflow-hidden shadow-2xl p-8">
                <div className="text-center">
                  <div className="text-slate-300 text-xs uppercase tracking-widest font-black mb-4">
                    Motivación del Equipo
                  </div>
                  <div className={`text-4xl font-black mb-4 px-6 py-3 rounded-2xl inline-block border-2 ${
                    globalMetrics.motivacionLevel === 'ALTO'
                      ? 'bg-green-500/20 text-green-400 border-green-500/50'
                      : globalMetrics.motivacionLevel === 'MEDIO'
                      ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                      : 'bg-red-500/20 text-red-400 border-red-500/50'
                  }`}>
                    {levelLabel(globalMetrics.motivacionLevel)}
                  </div>
                  <div className="text-slate-400 text-sm">
                    Nivel de motivación basado en la equidad
                  </div>
                </div>
              </div>
            </div>

            {/* Global Distribution */}
            <div className="bg-white/15 backdrop-blur-sm rounded-3xl border border-white/30 overflow-hidden shadow-2xl p-8">
              <div className="text-slate-300 text-xs uppercase tracking-widest font-black mb-6 text-center">
                Distribución de Recursos — Global
              </div>
              <div className="space-y-4">
                {globalMetrics.allParticipants
                  .slice(0, 15)
                  .map((participant, idx) => {
                    const percentage = globalMetrics.maxMoney > 0 ? (participant.money / globalMetrics.maxMoney) * 100 : 0;
                    return (
                      <div key={`global-${participant.id}`} className="flex items-center gap-4">
                        <div className="w-8 text-slate-400 text-sm font-bold text-right">
                          #{idx + 1}
                        </div>
                        <div className="flex-1">
                          <div className="h-8 bg-slate-700/50 rounded-full overflow-hidden relative">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${
                                participant.isPlayer ? 'bg-gradient-to-r from-blue-500 to-blue-400' : 'bg-gradient-to-r from-slate-500 to-slate-400'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                            <div className="absolute inset-0 flex items-center justify-between px-4">
                              <span className="text-white text-xs font-bold truncate">
                                {participant.alias}
                              </span>
                              <span className="text-white text-xs font-black">
                                {participant.money}K €
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </>
        )}

        {/* Per-Room Metrics */}
        <div className="text-center mt-12 mb-4">
          <h2 className="text-3xl font-black text-white uppercase tracking-tight">
            Detalle por Sala
          </h2>
        </div>

        {rooms.map(room => {
          const metrics = getRoomMetrics(room);
          if (!metrics) return null;

          return (
            <div key={room.id} className="bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20 overflow-hidden shadow-2xl p-8 space-y-6">
              {/* Room Header */}
              <div className="text-center">
                <h3 className="text-2xl font-black text-white">
                  {room.name}
                </h3>
                <p className="text-slate-400 text-sm">
                  {metrics.playerCount} jugadores
                </p>
              </div>

              {/* Room Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Brecha */}
                <div className="bg-white/10 rounded-2xl p-5 text-center">
                  <div className="text-slate-400 text-[10px] uppercase tracking-widest font-black mb-2">
                    Brecha
                  </div>
                  <div className={`text-3xl font-black ${isFinal ? 'text-green-400' : 'text-red-400'}`}>
                    {metrics.brecha}K €
                  </div>
                </div>

                {/* Concentración */}
                <div className="bg-white/10 rounded-2xl p-5 text-center">
                  <div className="text-slate-400 text-[10px] uppercase tracking-widest font-black mb-2">
                    Concentración
                  </div>
                  <div className={`text-2xl font-black px-4 py-1 rounded-xl inline-block border-2 ${levelColor(metrics.concentracionLevel)}`}>
                    {levelLabel(metrics.concentracionLevel)}
                  </div>
                </div>

                {/* Ratio */}
                <div className="bg-white/10 rounded-2xl p-5 text-center">
                  <div className="text-slate-400 text-[10px] uppercase tracking-widest font-black mb-2">
                    Ratio
                  </div>
                  <div className={`text-3xl font-black ${isFinal ? 'text-green-400' : 'text-orange-400'}`}>
                    {metrics.ratio.toFixed(1)}x
                  </div>
                </div>

                {/* Motivación */}
                <div className="bg-white/10 rounded-2xl p-5 text-center">
                  <div className="text-slate-400 text-[10px] uppercase tracking-widest font-black mb-2">
                    Motivación
                  </div>
                  <div className={`text-2xl font-black px-4 py-1 rounded-xl inline-block border-2 ${
                    metrics.motivacionLevel === 'ALTO'
                      ? 'bg-green-500/20 text-green-400 border-green-500/50'
                      : metrics.motivacionLevel === 'MEDIO'
                      ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                      : 'bg-red-500/20 text-red-400 border-red-500/50'
                  }`}>
                    {levelLabel(metrics.motivacionLevel)}
                  </div>
                </div>
              </div>

              {/* Room Distribution */}
              <div>
                <div className="text-slate-300 text-xs uppercase tracking-widest font-black mb-4 text-center">
                  Distribución de Recursos
                </div>
                <div className="space-y-3">
                  {metrics.allParticipants
                    .slice(0, 10)
                    .map((participant, idx) => {
                      const percentage = metrics.maxMoney > 0 ? (participant.money / metrics.maxMoney) * 100 : 0;
                      return (
                        <div key={participant.id} className="flex items-center gap-3">
                          <div className="w-7 text-slate-400 text-xs font-bold text-right">
                            #{idx + 1}
                          </div>
                          <div className="flex-1">
                            <div className="h-7 bg-slate-700/50 rounded-full overflow-hidden relative">
                              <div
                                className={`h-full rounded-full transition-all duration-1000 ${
                                  participant.isPlayer ? 'bg-gradient-to-r from-blue-500 to-blue-400' : 'bg-gradient-to-r from-slate-500 to-slate-400'
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                              <div className="absolute inset-0 flex items-center justify-between px-3">
                                <span className="text-white text-xs font-bold truncate">
                                  {participant.alias}
                                </span>
                                <span className="text-white text-xs font-black">
                                  {participant.money}K €
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          );
        })}

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-slate-500 text-xs">
            {isFinal ? '🎯 Simulación Igualitaria' : '📊 Partida Inicial'} — {rooms.length} salas
          </p>
        </div>
      </div>
    </div>
  );
}
