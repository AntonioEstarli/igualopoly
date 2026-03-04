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
    },
    recoveryTitle: {
      ES: 'Sesión guardada',
      EN: 'Saved session',
      CAT: 'Sessió guardada'
    },
    recoveryMessage: {
      ES: 'Se encontró tu perfil de jugador. ¿Quieres continuar la partida?',
      EN: 'Your player profile was found. Do you want to continue the game?',
      CAT: 'S\'ha trobat el teu perfil de jugador. Vols continuar la partida?'
    },
    continueButton: {
      ES: 'Continuar partida',
      EN: 'Continue game',
      CAT: 'Continua la partida'
    },
    newGameButton: {
      ES: 'Empezar de nuevo',
      EN: 'Start fresh',
      CAT: 'Comença de nou'
    },
    haveRecoveryCode: {
      ES: '¿Tienes un código de recuperación?',
      EN: 'Have a recovery code?',
      CAT: 'Tens un codi de recuperació?'
    },
    enterRecoveryCode: {
      ES: 'Introduce tu código',
      EN: 'Enter your code',
      CAT: 'Introdueix el teu codi'
    },
    recoverButton: {
      ES: 'Recuperar sesión',
      EN: 'Recover session',
      CAT: 'Recuperar sessió'
    },
    invalidCode: {
      ES: 'Código inválido o no encontrado',
      EN: 'Invalid or not found code',
      CAT: 'Codi invàlid o no trobat'
    },
    codeHelper: {
      ES: 'Introduce el código de 6 caracteres (ej: ABC-123)',
      EN: 'Enter the 6-character code (e.g., ABC-123)',
      CAT: 'Introdueix el codi de 6 caràcters (ex: ABC-123)'
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
    recoveryCodeTitle: {
      ES: '¡Tu código de recuperación!',
      EN: 'Your recovery code!',
      CAT: 'El teu codi de recuperació!'
    },
    recoveryCodeMessage: {
      ES: 'Guarda este código para recuperar tu sesión si pierdes la conexión o cambias de dispositivo.',
      EN: 'Save this code to recover your session if you lose connection or change devices.',
      CAT: 'Guarda aquest codi per recuperar la teva sessió si perds la connexió o canvies de dispositiu.'
    },
    yourCode: {
      ES: 'Tu código',
      EN: 'Your code',
      CAT: 'El teu codi'
    },
    important: {
      ES: 'Importante',
      EN: 'Important',
      CAT: 'Important'
    },
    saveCodeWarning: {
      ES: 'Anota este código en papel o haz una captura de pantalla. Lo necesitarás si tienes que volver a entrar.',
      EN: 'Write down this code on paper or take a screenshot. You\'ll need it if you have to log in again.',
      CAT: 'Anota aquest codi en paper o fes una captura de pantalla. El necessitaràs si has de tornar a entrar.'
    },
    continueToGame: {
      ES: 'Continuar al juego',
      EN: 'Continue to game',
      CAT: 'Continuar al joc'
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
    },
    // Preguntas para determinar variables
    questions: {
      tiempo: {
        question: {
          ES: '¿Cuánta flexibilidad real tienes para dedicar tiempo adicional al trabajo si es necesario?',
          EN: 'How much real flexibility do you have to dedicate additional time to work if needed?',
          CAT: 'Quanta flexibilitat real tens per dedicar temps addicional a la feina si cal?'
        },
        options: [
          {
            ES: 'Puedo alargar jornadas, viajar o trabajar fines de semana si hace falta.',
            EN: 'I can extend my workday, travel, or work weekends if necessary.',
            CAT: 'Puc allargar jornades, viatjar o treballar caps de setmana si cal.'
          },
          {
            ES: 'Normalmente cumplo mi horario y puedo hacer algún esfuerzo muy puntual.',
            EN: 'I usually keep my schedule and can make very occasional extra efforts.',
            CAT: 'Normalment compleixo el meu horari i puc fer algun esforç molt puntual.'
          },
          {
            ES: 'Tengo limitaciones claras (cuidados, responsabilidades externas u otras circunstancias) que me impiden dedicar tiempo extra o incluso han hecho que me reduzca la jornada.',
            EN: 'I have clear limitations (caregiving, external responsibilities, or other circumstances) that prevent me from dedicating extra time or have even led to reducing my hours.',
            CAT: 'Tinc limitacions clares (cures, responsabilitats externes o altres circumstàncies) que m\'impedeixen dedicar temps extra o fins i tot han fet que redueixi la jornada.'
          }
        ]
      },
      red: {
        question: {
          ES: 'Si mañana surgiera una oportunidad interna interesante, ¿con qué red contarías para apoyar tu candidatura?',
          EN: 'If an interesting internal opportunity arose tomorrow, what network would you count on to support your candidacy?',
          CAT: 'Si demà sorgís una oportunitat interna interessant, amb quina xarxa comptaries per donar suport a la teva candidatura?'
        },
        options: [
          {
            ES: 'Conozco a personas influyentes y sé a quién acudir para mover oportunidades.',
            EN: 'I know influential people and know whom to approach to move opportunities forward.',
            CAT: 'Conec persones influents i sé a qui acudir per moure oportunitats.'
          },
          {
            ES: 'Tengo algunos contactos, pero no en todos los niveles de decisión.',
            EN: 'I have some contacts, but not at all decision-making levels.',
            CAT: 'Tinc alguns contactes, però no en tots els nivells de decisió.'
          },
          {
            ES: 'Mi red es limitada o me cuesta acceder a personas con poder de decisión.',
            EN: 'My network is limited or I find it difficult to access decision-makers.',
            CAT: 'La meva xarxa és limitada o em costa accedir a persones amb poder de decisió.'
          }
        ]
      },
      visibilidad: {
        question: {
          ES: '¿Qué nivel de exposición tienes en tu entorno profesional?',
          EN: 'What level of exposure do you have in your professional environment?',
          CAT: 'Quin nivell d\'exposició tens en el teu entorn professional?'
        },
        options: [
          {
            ES: 'Mi trabajo es visible y suelo participar en espacios donde se toman decisiones.',
            EN: 'My work is visible and I usually participate in decision-making spaces.',
            CAT: 'La meva feina és visible i acostumo a participar en espais on es prenen decisions.'
          },
          {
            ES: 'Mi trabajo es conocido dentro de mi equipo, pero no siempre más allá.',
            EN: 'My work is known within my team, but not always beyond.',
            CAT: 'La meva feina és coneguda dins del meu equip, però no sempre més enllà.'
          },
          {
            ES: 'Mi trabajo pasa bastante desapercibido o no suelo estar en espacios clave.',
            EN: 'My work goes largely unnoticed or I\'m not usually in key spaces.',
            CAT: 'La meva feina passa força desapercebuda o no acostumo a estar en espais clau.'
          }
        ]
      },
      responsabilidades: {
        question: {
          ES: 'Más allá de tu desempeño, ¿hasta qué punto sientes que factores personales pueden influir en cómo se percibe tu trabajo (género, origen, edad, responsabilidades de cuidado u otros)?',
          EN: 'Beyond your performance, to what extent do you feel that personal factors can influence how your work is perceived (gender, origin, age, caregiving responsibilities, or others)?',
          CAT: 'Més enllà del teu rendiment, fins a quin punt sents que factors personals poden influir en com es percep la teva feina (gènere, origen, edat, responsabilitats de cura o altres)?'
        },
        options: [
          {
            ES: 'Rara vez siento que estos factores influyan en cómo se valora mi trabajo.',
            EN: 'I rarely feel that these factors influence how my work is valued.',
            CAT: 'Rarament sento que aquests factors influeixin en com es valora la meva feina.'
          },
          {
            ES: 'En algunas situaciones noto que pueden influir, dependiendo del contexto.',
            EN: 'In some situations, I notice they can influence, depending on the context.',
            CAT: 'En algunes situacions noto que poden influir, depenent del context.'
          },
          {
            ES: 'Con frecuencia siento que debo demostrar más o que estos factores afectan cómo se me percibe profesionalmente.',
            EN: 'I frequently feel I must prove more or that these factors affect how I\'m perceived professionally.',
            CAT: 'Amb freqüència sento que haig de demostrar més o que aquests factors afecten com em perceben professionalment.'
          }
        ]
      },
      margen_error: {
        question: {
          ES: 'Si cometieras un error "importante" en el trabajo, ¿qué crees que pasaría?',
          EN: 'If you made a "significant" mistake at work, what do you think would happen?',
          CAT: 'Si cometessis un error "important" a la feina, què creus que passaria?'
        },
        options: [
          {
            ES: 'Probablemente se interpretaría como algo puntual y podría recuperarme fácilmente.',
            EN: 'It would probably be interpreted as a one-time thing and I could recover easily.',
            CAT: 'Probablement s\'interpretaria com una cosa puntual i podria recuperar-me fàcilment.'
          },
          {
            ES: 'Dependería mucho del contexto y de quién esté mirando.',
            EN: 'It would depend heavily on the context and who is watching.',
            CAT: 'Dependria molt del context i de qui estigui mirant.'
          },
          {
            ES: 'Sentiría que tendría consecuencias duraderas o afectaría mi reputación.',
            EN: 'I would feel it would have lasting consequences or affect my reputation.',
            CAT: 'Sentiria que tindria conseqüències duradores o afectaria la meva reputació.'
          }
        ]
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
    onlyLeaderPropose: {
      ES: 'Solo el líder de tu sala puede proponer una nueva regla.',
      EN: 'Only your room leader can propose a new rule.',
      CAT: 'Només el líder de la teva sala pot proposar una nova regla.'
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
    back: {
      ES: '← Atrás',
      EN: '← Back',
      CAT: '← Enrere'
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
    startGame: {
      ES: 'INICIAR EL JUEGO',
      EN: 'START THE GAME',
      CAT: 'INICIAR EL JOC'
    },
    startGameDesc: {
      ES: 'Los jugadores comenzarán la partida con 10K €',
      EN: 'Players will start the game with 10K €',
      CAT: 'Els jugadors començaran la partida amb 10K €'
    },
    waitingGameStart: {
      ES: 'Esperando al líder para iniciar el juego...',
      EN: 'Waiting for the leader to start the game...',
      CAT: 'Esperant el líder per iniciar el joc...'
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
    },
    finalReflectionTitle: {
      ES: '¿Qué reflexión te llevas del juego?\n¿Y qué puedes hacer tú para aplicar lo aprendido?',
      EN: 'What reflection do you take from the game?\nAnd what can you do to apply what you learned?',
      CAT: 'Quina reflexió t\'emportes del joc?\nI què pots fer tu per aplicar l\'après?'
    },
    finalReflectionPlaceholder: {
      ES: 'Escribe aquí tu reflexión...',
      EN: 'Write your reflection here...',
      CAT: 'Escriu aquí la teva reflexió...'
    },
    finalReflectionSave: {
      ES: 'Guardar reflexión',
      EN: 'Save reflection',
      CAT: 'Desa la reflexió'
    },
    finalReflectionSaved: {
      ES: '¡Reflexión guardada!',
      EN: 'Reflection saved!',
      CAT: 'Reflexió desada!'
    },
    showFinalMetrics: {
      ES: 'Ver Resultados Finales',
      EN: 'View Final Results',
      CAT: 'Veure Resultats Finals'
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
    subtitleObserver: {
      ES: 'Solo el líder puede votar en nombre de la sala',
      EN: 'Only the leader can vote on behalf of the room',
      CAT: 'Només el líder pot votar en nom de la sala'
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

  // Metrics
  metrics: {
    title: {
      ES: 'Análisis de Desigualdad',
      EN: 'Inequality Analysis',
      CAT: 'Anàlisi de Desigualtat'
    },
    subtitle: {
      ES: 'Impacto del sistema en la distribución de recursos',
      EN: 'System impact on resource distribution',
      CAT: 'Impacte del sistema en la distribució de recursos'
    },
    titleFinal: {
      ES: 'Simulación Igualitaria',
      EN: 'Egalitarian Simulation',
      CAT: 'Simulació Igualitària'
    },
    subtitleFinal: {
      ES: 'Resultados con condiciones equitativas',
      EN: 'Results with equitable conditions',
      CAT: 'Resultats amb condicions equitatives'
    },
    brecha: {
      ES: 'Brecha',
      EN: 'Gap',
      CAT: 'Bretxa'
    },
    brechaDesc: {
      ES: 'Diferencia entre el que más y el que menos',
      EN: 'Difference between highest and lowest',
      CAT: 'Diferència entre el que més i el que menys'
    },
    concentracion: {
      ES: 'Concentración',
      EN: 'Concentration',
      CAT: 'Concentració'
    },
    concentracionDesc: {
      ES: 'Nivel de concentración de recursos',
      EN: 'Resource concentration level',
      CAT: 'Nivell de concentració de recursos'
    },
    ratioGanador: {
      ES: 'Ratio Ganador/a',
      EN: 'Winner Ratio',
      CAT: 'Ràtio Guanyador/a'
    },
    ratioGanadorDesc: {
      ES: 'Ganador/a acumula X veces más que el último',
      EN: 'Winner accumulates X times more than last',
      CAT: 'Guanyador/a acumula X vegades més que l\'últim'
    },
    motivacion: {
      ES: 'Motivación del Equipo',
      EN: 'Team Motivation',
      CAT: 'Motivació de l\'Equip'
    },
    motivacionDesc: {
      ES: 'Nivel de motivación basado en la equidad',
      EN: 'Motivation level based on equity',
      CAT: 'Nivell de motivació basat en l\'equitat'
    },
    propuestas: {
      ES: 'Ideas Propuestas',
      EN: 'Proposed Ideas',
      CAT: 'Idees Proposades'
    },
    propuestasDesc: {
      ES: 'Ideas del equipo para reducir la brecha',
      EN: 'Team ideas to reduce the gap',
      CAT: 'Idees de l\'equip per reduir la bretxa'
    },
    distribucion: {
      ES: 'Distribución de Recursos',
      EN: 'Resource Distribution',
      CAT: 'Distribució de Recursos'
    },
    level: {
      ALTO: {
        ES: 'ALTO',
        EN: 'HIGH',
        CAT: 'ALT'
      },
      MEDIO: {
        ES: 'MEDIO',
        EN: 'MEDIUM',
        CAT: 'MITJÀ'
      },
      BAJO: {
        ES: 'BAJO',
        EN: 'LOW',
        CAT: 'BAIX'
      }
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
