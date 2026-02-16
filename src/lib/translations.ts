// Sistema de traducciones para Igualopoly
export type Language = 'ES' | 'EN' | 'CAT';

export const translations = {
  // Lobby
  lobby: {
    title: {
      ES: 'IGUALOPOLY',
      EN: 'IGUALOPOLY',
      CAT: 'IGUALOPOLY'
    },
    nameLabel: {
      ES: 'Nombre (mín. 2 caracteres)',
      EN: 'Name (min. 2 characters)',
      CAT: 'Nom (mín. 2 caràcters)'
    },
    namePlaceholder: {
      ES: 'Introduce tu nombre',
      EN: 'Enter your name',
      CAT: 'Introdueix el teu nom'
    },
    languageLabel: {
      ES: 'Selecciona Idioma',
      EN: 'Select Language',
      CAT: 'Selecciona Idioma'
    },
    languageOptions: {
      ES: { ES: 'Español', EN: 'English', CAT: 'Català' },
      EN: { ES: 'Español', EN: 'English', CAT: 'Català' },
      CAT: { ES: 'Español', EN: 'English', CAT: 'Català' }
    },
    enterButton: {
      ES: 'Entrar a la sesión',
      EN: 'Join session',
      CAT: 'Entrar a la sessió'
    }
  },

  // Character Creation
  characterCreation: {
    title: {
      ES: 'Configura tu Personaje',
      EN: 'Configure Your Character',
      CAT: 'Configura el teu Personatge'
    },
    publicAlias: {
      ES: 'Alias público',
      EN: 'Public alias',
      CAT: 'Àlies públic'
    },
    aliasPlaceholder: {
      ES: 'Tu nombre en el ranking...',
      EN: 'Your name in the ranking...',
      CAT: 'El teu nom al rànquing...'
    },
    aliasHelper: {
      ES: 'Este nombre es el que verán los demás.',
      EN: 'This is the name others will see.',
      CAT: 'Aquest nom és el que veuran els altres.'
    },
    customizeAvatar: {
      ES: 'Personaliza tu Avatar',
      EN: 'Customize your Avatar',
      CAT: 'Personalitza el teu Avatar'
    },
    genderMale: {
      ES: '♂ Hombre',
      EN: '♂ Male',
      CAT: '♂ Home'
    },
    genderFemale: {
      ES: '♀ Mujer',
      EN: '♀ Female',
      CAT: '♀ Dona'
    },
    chooseRoom: {
      ES: 'Selecciona tu Sala',
      EN: 'Select your Room',
      CAT: 'Selecciona la teva Sala'
    },
    loadingRooms: {
      ES: 'Cargando salas...',
      EN: 'Loading rooms...',
      CAT: 'Carregant sales...'
    },
    roomHelper: {
      ES: 'Consulta con tu facilitador qué sala te corresponde.',
      EN: 'Check with your facilitator which room you belong to.',
      CAT: 'Consulta amb el teu facilitador quina sala et correspon.'
    },
    readyToPlay: {
      ES: 'Listo para jugar',
      EN: 'Ready to play',
      CAT: 'A punt per jugar'
    },
    variableLabels: {
      tiempo: {
        ES: '🕒 Disponibilidad',
        EN: '🕒 Availability',
        CAT: '🕒 Disponibilitat'
      },
      visibilidad: {
        ES: '👀 Visibilidad',
        EN: '👀 Visibility',
        CAT: '👀 Visibilitat'
      },
      red: {
        ES: '🤝 Red / Capital social',
        EN: '🤝 Network / Social capital',
        CAT: '🤝 Xarxa / Capital social'
      },
      margen_error: {
        ES: '⚠️ Margen de error',
        EN: '⚠️ Error margin',
        CAT: '⚠️ Marge d\'error'
      },
      responsabilidades: {
        ES: '🎒 Cargas invisibles',
        EN: '🎒 Invisible burdens',
        CAT: '🎒 Càrregues invisibles'
      }
    },
    levels: {
      ALTO: {
        ES: 'ALTO',
        EN: 'HIGH',
        CAT: 'ALT'
      },
      MEDIO: {
        ES: 'MEDIO',
        EN: 'MEDIUM',
        CAT: 'MIG'
      },
      BAJO: {
        ES: 'BAJO',
        EN: 'LOW',
        CAT: 'BAIX'
      }
    }
  },

  // Game
  game: {
    yourVariables: {
      ES: 'Tu Perfil',
      EN: 'Your Profile',
      CAT: 'El teu Perfil'
    },
    yourCapital: {
      ES: 'Tu Capital',
      EN: 'Your Capital',
      CAT: 'El teu Capital'
    },
    reflection: {
      ES: 'Reflexión',
      EN: 'Reflection',
      CAT: 'Reflexió'
    },
    proposeChange: {
      ES: 'Propón un cambio de regla',
      EN: 'Propose a rule change',
      CAT: 'Proposa un canvi de regla'
    },
    proposalPlaceholder: {
      ES: 'Si pudieras cambiar algo del sistema...',
      EN: 'If you could change something in the system...',
      CAT: 'Si poguessis canviar alguna cosa del sistema...'
    },
    sendIdea: {
      ES: 'ENVIAR IDEA 💡',
      EN: 'SEND IDEA 💡',
      CAT: 'ENVIAR IDEA 💡'
    },
    sending: {
      ES: 'ENVIANDO...',
      EN: 'SENDING...',
      CAT: 'ENVIANT...'
    },
    proposalSent: {
      ES: 'Propuesta enviada con éxito',
      EN: 'Proposal sent successfully',
      CAT: 'Proposta enviada amb èxit'
    },
    waitingLeader: {
      ES: 'Esperando al líder para empezar...',
      EN: 'Waiting for the leader to start...',
      CAT: 'Esperant el líder per començar...'
    },
    youAreLeader: {
      ES: '🌟 Eres el Líder',
      EN: '🌟 You are the Leader',
      CAT: '🌟 Ets el Líder'
    },
    trajectoryComplete: {
      ES: '¡Trayectoria Completa!',
      EN: 'Trajectory Complete!',
      CAT: 'Trajectòria Completa!'
    },
    openRanking: {
      ES: 'ABRIR RANKING',
      EN: 'OPEN RANKING',
      CAT: 'OBRIR RANKING'
    },
    openVoting: {
      ES: 'ABRIR VOTACIÓN GLOBAL 💡',
      EN: 'OPEN GLOBAL VOTING 💡',
      CAT: 'OBRIR VOTACIÓ GLOBAL 💡'
    },
    leaderDeciding: {
      ES: 'El líder está decidiendo el siguiente paso...',
      EN: 'The leader is deciding the next step...',
      CAT: 'El líder està decidint el següent pas...'
    },
    next: {
      ES: 'Siguiente →',
      EN: 'Next →',
      CAT: 'Següent →'
    },
    cardDidYouKnow: {
      ES: '💡 ¿Sabías que...?',
      EN: '💡 Did you know...?',
      CAT: '💡 Sabies que...?'
    },
    cardHowAffects: {
      ES: '👥 Cómo afecta a los perfiles',
      EN: '👥 How it affects profiles',
      CAT: '👥 Com afecta els perfils'
    },
    cardScore: {
      ES: '🎯 Puntuación',
      EN: '🎯 Score',
      CAT: '🎯 Puntuació'
    },
    cardReflection: {
      ES: '💬 Preguntas de reflexión',
      EN: '💬 Reflection questions',
      CAT: '💬 Preguntes de reflexió'
    },
    cardRewrite: {
      ES: '✍️ Reescribe la regla',
      EN: '✍️ Rewrite the rule',
      CAT: '✍️ Reescriu la regla'
    },
    stadiumTitle: {
      ES: 'Stadium: Carrera de Capital',
      EN: 'Stadium: Capital Race',
      CAT: 'Estadi: Cursa de Capital'
    },
    rollDice: {
      ES: 'Lanzar Dado',
      EN: 'Roll Dice',
      CAT: 'Llançar Dau'
    },
    rolling: {
      ES: 'Lanzando...',
      EN: 'Rolling...',
      CAT: 'Llançant...'
    },
    movementHistory: {
      ES: 'Registro de Movimientos',
      EN: 'Movement History',
      CAT: 'Registre de Moviments'
    },
    noMovements: {
      ES: 'Sin movimientos registrados',
      EN: 'No movements recorded',
      CAT: 'Sense moviments registrats'
    },
    roomProgress: {
      ES: 'Progreso de la Minisala',
      EN: 'Room Progress',
      CAT: 'Progrés de la Minisala'
    },
    finalSimulation: {
      ES: 'Simulación Final',
      EN: 'Final Simulation',
      CAT: 'Simulació Final'
    },
    finalSimulationDesc: {
      ES: 'Vamos a repetir el juego con condiciones más igualitarias para ver cómo habría sido el resultado.',
      EN: 'Let\'s replay the game with more equal conditions to see how the result would have been.',
      CAT: 'Repetirem el joc amb condicions més igualitàries per veure com hauria estat el resultat.'
    },
    startSimulation: {
      ES: 'EMPEZAR SIMULACIÓN',
      EN: 'START SIMULATION',
      CAT: 'COMENÇAR SIMULACIÓ'
    },
    waitingLeaderSimulation: {
      ES: 'Esperando al líder para empezar la simulación...',
      EN: 'Waiting for the leader to start the simulation...',
      CAT: 'Esperant el líder per començar la simulació...'
    },
    simulatingProgress: {
      ES: 'Simulando trayectoria automáticamente...',
      EN: 'Simulating trajectory automatically...',
      CAT: 'Simulant trajectòria automàticament...'
    },
    steps: {
      ES: 'pasos',
      EN: 'steps',
      CAT: 'passos'
    },
    simulationComplete: {
      ES: '¡Simulación Completa!',
      EN: 'Simulation Complete!',
      CAT: 'Simulació Completa!'
    },
    scoreComboAltoAlto: {
      ES: 'Ambas en ALTO',
      EN: 'Both at HIGH',
      CAT: 'Ambdues en ALT'
    },
    scoreComboOneAlto: {
      ES: 'Una en ALTO',
      EN: 'One at HIGH',
      CAT: 'Una en ALT'
    },
    scoreComboNoneAlto: {
      ES: 'Ninguna en ALTO',
      EN: 'None at HIGH',
      CAT: 'Cap en ALT'
    }
  },

  // Voting
  voting: {
    title: {
      ES: 'Votación de Reglas Propuestas',
      EN: 'Proposed Rules Voting',
      CAT: 'Votació de Regles Proposades'
    },
    subtitle: {
      ES: 'Vota por las ideas que crees que mejorarían el sistema',
      EN: 'Vote for the ideas you think would improve the system',
      CAT: 'Vota per les idees que creus que millorarien el sistema'
    },
    yourVotes: {
      ES: 'Tus votos',
      EN: 'Your votes',
      CAT: 'Els teus vots'
    },
    noProposals: {
      ES: 'No hay propuestas disponibles',
      EN: 'No proposals available',
      CAT: 'No hi ha propostes disponibles'
    },
    voted: {
      ES: 'VOTADO',
      EN: 'VOTED',
      CAT: 'VOTAT'
    },
    vote: {
      ES: 'VOTAR',
      EN: 'VOTE',
      CAT: 'VOTAR'
    }
  },

  // Podium
  podium: {
    votingClosed: {
      ES: '¡Votación Finalizada!',
      EN: 'Voting Closed!',
      CAT: 'Votació Finalitzada!'
    },
    title: {
      ES: 'Reglas Ganadoras',
      EN: 'Winning Rules',
      CAT: 'Regles Guanyadores'
    },
    position: {
      ES: 'Puesto',
      EN: 'Position',
      CAT: 'Posició'
    },
    votes: {
      ES: 'Votos',
      EN: 'Votes',
      CAT: 'Vots'
    },
    author: {
      ES: 'Autor',
      EN: 'Author',
      CAT: 'Autor'
    },
    backToStart: {
      ES: 'Volver al inicio',
      EN: 'Back to start',
      CAT: 'Tornar a l\'inici'
    }
  },

  // Ranking
  ranking: {
    title: {
      ES: 'Ranking Final',
      EN: 'Final Ranking',
      CAT: 'Rànquing Final'
    },
    subtitle: {
      ES: 'Puntuaciones de todos los participantes',
      EN: 'Scores of all participants',
      CAT: 'Puntuacions de tots els participants'
    },
    participants: {
      ES: 'Participantes',
      EN: 'Participants',
      CAT: 'Participants'
    },
    systemProfiles: {
      ES: 'Arquetipos del Sistema',
      EN: 'System Archetypes',
      CAT: 'Arquetips del Sistema'
    },
    position: {
      ES: 'Pos.',
      EN: 'Pos.',
      CAT: 'Pos.'
    },
    name: {
      ES: 'Nombre',
      EN: 'Name',
      CAT: 'Nom'
    },
    capital: {
      ES: 'Capital',
      EN: 'Capital',
      CAT: 'Capital'
    }
  },

  // Common
  common: {
    room: {
      ES: 'Sala',
      EN: 'Room',
      CAT: 'Sala'
    }
  }
};

// Hook para obtener traducciones
export function useTranslation(language: Language) {
  return {
    t: (key: string) => {
      const keys = key.split('.');
      let value: any = translations;

      for (const k of keys) {
        value = value[k];
        if (!value) return key;
      }

      return value[language] || key;
    },
    language
  };
}

// Función helper para obtener traducción directa
export function getTranslation(key: string, language: Language): string {
  const keys = key.split('.');
  let value: any = translations;

  for (const k of keys) {
    value = value[k];
    if (!value) return key;
  }

  return value[language] || key;
}
