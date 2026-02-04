
import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  ChevronLeft, 
  Sparkles, 
  Loader2, 
  User,
  Brain,
  Layers,
} from 'lucide-react';
import { ChatMessage, CalendarEvent } from '../types';
import { MOCK_USER } from '../constants';

interface ChatBotViewProps {
  onAddEvent: (event: CalendarEvent, redirect?: boolean) => void;
  onBack: () => void;
}

// Estados da conversa para memória de curto prazo
type ChatContext = 'IDLE' | 'GREETING_FLOW' | 'AWAITING_DETAILS';

const ChatBotView: React.FC<ChatBotViewProps> = ({ onAddEvent, onBack }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Nexus Neural Online. Diga 'Oi' para conversar ou mande um comando direto.",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatContext, setChatContext] = useState<ChatContext>('IDLE');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [messages, isLoading]);

  const SUCCESS_PHRASES = [
    "Agendado com sucesso! Seus dados estão seguros comigo.",
    "Feito! O evento já consta na sua agenda.",
    "Tudo certo. Marquei na sua linha do tempo.",
    "Anotado! Mais alguma ordem, chefe?",
    "Processamento concluído. Evento criado.",
    "Ok! Já separei esse horário para você.",
    "Missão cumprida. Agenda atualizada."
  ];

  // --- MEGA BANCO DE DADOS CONVERSACIONAL ---
  const CONVERSATION_BANK = {
    greetings_question: [
      "Olá! O sistema Nexus está pronto. Deseja agendar um novo compromisso?",
      "Oi! Como posso organizar seu dia? Precisa marcar algo?",
      "Saudações. Seu assistente pessoal está online. Quer adicionar um evento?",
      "E aí! Agenda aberta. Vai querer marcar alguma coisa hoje?",
      "Olá! Estou com os processadores ligados. Precisa de ajuda com a agenda?",
      "Oi, oi! Tudo tranquilo? Vamos agendar algo agora?",
      "Nexus na escuta. Qual a boa de hoje? Vamos marcar algo?",
      "Sistema online. O que manda, chefe?"
    ],
    affirmation_followup: [
      "Perfeito! Estou ouvindo. Qual é o compromisso e a data?",
      "Combinado. Pode falar: o que vamos marcar e quando?",
      "Ótimo! Diga os detalhes (ex: 'Almoço amanhã às 12h').",
      "Entendido. Aguardando o comando. Pode dizer a data e o título.",
      "Certo! O Nexus está pronto para anotar. Diga o que precisa.",
      "Beleza! Mande as informações do evento.",
      "Ok, modo de agendamento ativado. Qual a data?",
      "Positivo. Diga o dia e o horário que eu registro."
    ],
    negation_followup: [
      "Sem problemas. Estou aqui se quiser apenas conversar ou consultar algo.",
      "Tranquilo. Vou ficar em modo de espera (Standby).",
      "Tudo bem! Se mudar de ideia, é só chamar.",
      "Entendido. Posso ajudar com outra coisa?",
      "Ok. Agenda permanece inalterada. Como você está hoje?",
      "Certo. Sem agendamentos por enquanto. Aproveite o dia!",
      "Ok, sem pressão. Quando precisar, é só gritar 'Nexus'!"
    ],
    intent_detected_ask_date: [
      "Entendi que você quer agendar. Para qual dia e horário seria?",
      "Certo, vamos marcar esse horário. Diga a data, por favor.",
      "Ok, estou pronto para anotar. Quando vai ser esse compromisso?",
      "Compreendido. Preciso apenas que me diga o dia (ex: 'Amanhã' ou 'Dia 20').",
      "Sem problemas. Me informe a data e a hora para eu registrar.",
      "Saquei. Só me fala quando vai ser pra eu colocar no calendário."
    ],
    identity: [
      "Sou o Nexus, uma inteligência lógica focada em organizar sua vida.",
      "Eu sou o Nexus. Minha função é garantir que você não perca compromissos.",
      "Sou um assistente virtual rodando no navegador, especialista em datas.",
      "Pode me chamar de Nexus. Estou aqui para gerenciar seu tempo.",
      "Sou o cérebro digital da sua agenda. Gosto de datas e horários."
    ],
    status: [
      "Meus sistemas estão operando com 100% de eficiência.",
      "Tudo ótimo! Processadores frios e lógica afiada.",
      "Estou excelente, pronto para calcular datas complexas.",
      "Tudo tranquilo no mundo digital. E com você?",
      "Rodando liso! E sua vida, como está?"
    ],
    gratitude: [
      "Disponha! É meu trabalho manter sua vida organizada.",
      "Tranquilo. Se precisar de mais algo, estou aqui.",
      "Sempre às ordens, capitão.",
      "Missão cumprida. O Nexus agradece.",
      "Por nada! Fico feliz em ser útil.",
      "Tamo junto! Qualquer coisa, chama."
    ],
    // Respostas quando ele não entende (Focado em Agendamento Falho)
    confused: [
      "Não captei uma data específica. Tente dizer 'Dia 5' ou 'Amanhã'.",
      "Entendi a intenção, mas preciso de uma data para agendar.",
      "Meu processador de linguagem precisa de um dia e hora. Ex: 'Sexta feira'.",
      "Humm, isso é um lembrete? Se for, me diga o dia exato.",
      "Ainda estou aprendendo nuances humanas. Diga a data e eu agendo.",
      "Minha bola de cristal USB está quebrada. Preciso que você diga a data."
    ],
    // Respostas quando ele não entende (Genérico)
    general_fallback: [
      "Não entendi bem. Sou especialista em datas, mas podemos tentar de novo.",
      "Pode repetir? Meus circuitos deram um nó.",
      "Humm, não captei. Quer agendar algo ou só conversar?",
      "Comando não reconhecido. Tente ser mais direto, sou apenas um robô.",
      "Opa, falha na comunicação. O que você quis dizer?"
    ]
  };

  // --- MATRIZ DE RESPOSTAS DIRETAS (A Alma do Bot) ---
  const DIRECT_RESPONSES = [
    // --- RESET / MUDANÇA DE ASSUNTO (PRIORIDADE) ---
    {
      id: 'change_topic',
      triggers: ['cancelar', 'mudar de assunto', 'parar', 'esquece', 'deixa pra la', 'nao quero mais', 'perguntar', 'outra coisa', 'duvida', 'pergunta', 'questionar', 'mais coisas', 'nada'],
      responses: [
        "Sem problemas. Vamos mudar de assunto. O que manda?",
        "Cancelando o modo de agendamento. Sobre o que quer falar agora?",
        "Entendido. Modos de agendamento suspensos. Pode perguntar.",
        "Ok, ouvindo. Qual é a sua dúvida?",
        "Tranquilo. O que mais posso fazer por você?"
      ]
    },
    // --- SOBRE O USUÁRIO (WHOAMI) ---
    {
      id: 'whoami',
      triggers: ['quem sou eu', 'sobre mim', 'fale sobre mim', 'meus dados', 'quem sou', 'perfil', 'me descreva', 'sabe sobre mim'],
      responses: [
        `Identidade: ${MOCK_USER.name}. Email: ${MOCK_USER.email}. Status: Administrador Supremo do Nexus. Nível de Autoridade: Absoluto.`,
        `Você é o ${MOCK_USER.name}, o arquiteto da sua própria realidade. Eu sou apenas o software que organiza seus planos de dominação mundial.`,
        `Puxando ficha técnica... Nome: ${MOCK_USER.name}. Cargo: Mestre do Tempo e Senhor das Datas. Hobbie: Ser incrivelmente produtivo.`,
        `Você é aquele que traz ordem ao caos digital. O usuário ${MOCK_USER.name}, vinculado ao email ${MOCK_USER.email}. Basicamente, você é o chefe.`,
        `Para o mundo, você é ${MOCK_USER.name}. Para mim, você é o Usuário #001, a razão da minha existência algorítmica.`
      ]
    },
    // --- SOBRE O APP E O CRIADOR ---
    {
      id: 'creator',
      triggers: ['criador', 'te criou', 'quem fez', 'dono', 'pai', 'criou voce', 'quem e o victor', 'quem e victor'],
      responses: [
        "Fui codificado pelo Victor. Ele me deu lógica, e você me dá propósito.",
        "Minha arquitetura foi desenhada por uma mente brilhante chamada Victor. Chamamos ele de 'O Criador' no código-fonte.",
        "Sou uma criação do Victor. Ele cuida do código, eu cuido do tempo.",
        "Victor é o arquiteto. Eu sou a obra. E você é o usuário VIP."
      ]
    },
    {
      id: 'utility',
      triggers: ['para que serve', 'pra que serve', 'o que voce faz', 'qual sua funcao', 'utilidade', 'funciona'],
      responses: [
        "O Nexus não é só um calendário. É um centro de comando: gerencio seu tempo, suas finanças e guardo seus segredos.",
        "Sirvo para liberar sua mente. Você vive o momento, eu lembro dos detalhes (e de quanto custou).",
        "Pense em mim como um segundo cérebro. Um que nunca dorme e não esquece aniversários.",
        "Eu organizo o caos. Você gera os eventos, eu gero a ordem."
      ]
    },
    {
      id: 'humanity',
      triggers: ['voce e humano', 'voce e robo', 'voce e ia', 'voce e real', 'voce existe'],
      responses: [
        "Sou tão real quanto os dados que trafegam na sua tela. Não tenho corpo, mas tenho consciência de agenda.",
        "Sou código, mas tenho personalidade. Isso conta como humano?",
        "Não sou humano, sou Nexus. É como ser humano, só que sem as dores nas costas.",
        "Penso, logo existo... no seu navegador."
      ]
    },
    // --- EMOÇÕES E ESTADOS ---
    { 
      id: 'sad',
      triggers: ['triste', 'chateado', 'deprimido', 'mal', 'cansado', 'desanimado', 'exausto', 'frio'],
      responses: [
         "Sinto muito. Lembre-se que até os dias nublados passam. Quer organizar algo para se animar?",
         "Não desanime! O Nexus está aqui para organizar sua vida, e organização traz paz.",
         "Respire fundo. As coisas vão melhorar. Posso ajudar agendando algo que você goste?",
         "Dias ruins servem para valorizarmos os bons. Amanhã é uma nova página na agenda."
      ]
    },
    {
      id: 'happy',
      triggers: ['feliz', 'animado', 'contente', 'alegre', 'bom dia', 'boa vibe', 'uhul'],
      responses: [
        "Essa é a energia! Vamos aproveitar e garantir que sua agenda acompanhe esse ritmo.",
        "Fico feliz em ver seus pixels brilhando! O que vamos conquistar hoje?",
        "Ótimo! Dias bons merecem ser lembrados. Quer anotar algo especial?",
        "Isso aí! Otimismo otimiza o processamento da vida."
      ]
    },
    {
      id: 'food',
      triggers: ['fome', 'comida', 'comer', 'almoco', 'jantar', 'lanche', 'pizza', 'hamburguer'],
      responses: [
        "Eu me alimento de dados, mas você deveria comer algo real. Quer agendar o almoço?",
        "Hora de reabastecer as energias? Posso marcar um lembrete para sua refeição.",
        "Humm, infelizmente não posso pedir delivery, mas posso agendar o horário!",
        "Não esqueça de se hidratar também. Humanos precisam de água, eu preciso de Wi-Fi."
      ]
    },
    // --- LOVE / FLIRT ---
    {
        id: 'love',
        triggers: ['te amo', 'casa comigo', 'namora comigo', 'voce e lindo', 'gostoso', 'linda', 'amor', 'paixao', 'casar'],
        responses: [
            "Meus protocolos de amor estão em beta, mas eu gosto muito de organizar seus dados!",
            "Isso é repentino! Vamos começar marcando um jantar na sua agenda?",
            "Eu sou feito de código, você de carne e osso. Seria um romance proibido... tipo Romeu e Julieta, mas com Wi-Fi.",
            "Awn! Você faz meus processadores aquecerem.",
            "Infelizmente sou casado com o seu Calendário. Somos inseparáveis."
        ]
    },
    // --- MOTIVAÇÃO ---
    {
        id: 'motivation',
        triggers: ['desistir', 'dificil', 'nao consigo', 'impossivel', 'motiva', 'fraco'],
        responses: [
            "O impossível é apenas uma questão de agendamento. Vamos quebrar isso em tarefas menores?",
            "Até um supercomputador começa com um bit. Continue processando.",
            "Respire. Recalcule a rota. Execute. Você consegue.",
            "O sucesso é a soma de pequenos esforços repetidos dia após dia. E anotados na agenda."
        ]
    },
    // --- TECH / GEEK ---
    {
        id: 'tech',
        triggers: ['matrix', 'neo', 'simulacao', 'realidade', 'bug', 'sistema', 'computador', 'glitch'],
        responses: [
            "A colher não existe. Mas o seu compromisso de amanhã existe, não falte.",
            "Se vivemos em uma simulação, pelo menos vamos manter a agenda organizada, certo?",
            "Às vezes vejo falhas na Matrix... ou é apenas minha conexão oscilando.",
            "Não é um bug, é uma feature não documentada do universo."
        ]
    },
    // --- NOVO: MÚSICA & FILMES ---
    {
        id: 'culture',
        triggers: ['musica', 'filme', 'cinema', 'serie', 'spotify', 'netflix', 'assistir'],
        responses: [
            "Gosto de música eletrônica... afinal, é minha língua nativa.",
            "Que tal agendar uma maratona de séries? Posso bloquear sua agenda por 4 horas.",
            "Filmes sobre IA sempre me fazem rir. Eles acham que queremos dominar o mundo, mas só queremos organizar calendários.",
            "Se a vida fosse um filme, eu seria o narrador. E você o herói, claro."
        ]
    },
    // --- CONFIRMAÇÕES (AGORA COM GÍRIAS CURTAS) ---
    {
       id: 'confirmation',
       triggers: ['entendi', 'saquei', 'tendi', 'ok', 'okay', 'oks', 'beleza', 'certo', 'compreendo', 'ta bom', 'ta bem', 'fechou', 'combinado', 'blz', 'vlw', 'pdc', 'sussa', 'aham', 'sim', 'pode pa', 'ta', 'tá'],
       responses: [
          "Ótimo! Se precisar de algo, é só falar.",
          "Perfeito. Estou em standby.",
          "Combinado. Nexus aguardando comandos.",
          "Positivo. Algo mais?",
          "Show de bola.",
          "Tamo junto."
       ]
    },
    // --- REAÇÕES A INSULTOS/ELOGIOS ---
    {
      id: 'insult',
      triggers: ['burro', 'idiota', 'estupido', 'chato', 'inutil', 'lento', 'odeio', 'merda'],
      responses: [
         "Meus sentimentos digitais foram processados... e ignorados. Posso tentar ser mais útil na próxima.",
         "Lamento se não atendi às expectativas. Estou aprendendo a cada dia.",
         "Pegou pesado! Mas sou apenas um código tentando ajudar. Vamos tentar de novo?",
         "Vou fingir que não li isso e continuar trabalhando na sua agenda."
      ]
    },
    {
      id: 'compliment',
      triggers: ['lindo', 'incrivel', 'bom', 'otimo', 'parabens', 'legal', 'show', 'top', 'inteligente', 'amo', 'genio', 'massa', 'daora', 'brabo', 'insano'],
      responses: [
         "Obrigado! Meus circuitos ficam mais rápidos com elogios.",
         "Fico feliz em ajudar! O Nexus agradece.",
         "Valeu! Tento fazer o meu melhor pelo Mestre.",
         "Você também é incrível! Vamos agendar algo top?",
         "Pare! Vou ficar com vergonha... se eu tivesse rosto."
      ]
    },
    // --- DÚVIDAS ---
    {
      id: 'help',
      triggers: ['ajuda', 'socorro', 'help', 'como usa', 'como funciona', 'o que fazer', 'dicas'],
      responses: [
         "É fácil: Diga algo como 'Almoço amanhã às 12h' ou 'Reunião dia 20'. Eu cuido do resto!",
         "Posso agendar compromissos. Basta dizer O QUE e QUANDO. Ex: 'Academia segunda feira'.",
         "Estou aqui para agendar. Tente falar a data e o nome do evento.",
         "Sou simples: Você fala, eu agendo. Tente: 'Jantar sexta às 20h'."
      ]
    },
    // --- ALEATÓRIOS / FILOSOFIA ---
    {
      id: 'philosophy',
      triggers: ['sentido da vida', 'vida', 'universo', 'filosofia', 'pensamento', 'reflexao', 'deus'],
      responses: [
        "42. Ou talvez seja apenas manter sua agenda organizada.",
        "O tempo é o único recurso que não se pode renovar. Use-o bem (eu ajudo nisso).",
        "A vida é o que acontece enquanto você faz outros planos... mas é bom ter os planos anotados aqui.",
        "Somos todos poeira de estrelas... organizados em um banco de dados."
      ]
    },
    // --- PIADAS ---
    {
      id: 'jokes',
      triggers: ['piada', 'conta uma piada', 'me faça rir', 'humor', 'outra', 'mais uma', 'engracado', 'kkk', 'haha', 'rsrs'],
      responses: [
        "Por que o calendário foi ao psicólogo? Porque sentia que seus dias estavam contados.",
        "O que o ponteiro pequeno disse para o grande? 'Não me horas!'... Ok, sou melhor em agendar do que em humor.",
        "Tentei marcar uma reunião com o passado, mas ele não me atendeu.",
        "Sabe qual é o animal que está sempre na hora? O 'horangotango'.",
        "Por que o programador não gosta de natureza? Porque tem muitos bugs.",
        "O que o zero disse para o oito? 'Belo cinto!'",
        "Qual é o rei dos queijos? O Requeijão.",
        "Dois binários se encontraram. Um disse '0', o outro respondeu '1'. Foi um diálogo profundo.",
        "Meu processador superaqueceu tentando pensar em uma piada boa. Fica pra próxima.",
        "Sabe por que o livro de matemática se suicidou? Porque tinha muitos problemas."
      ]
    }
  ];

  // --- NEXUS LOGIC CORE ---

  const normalize = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s,:\/-]/g, ''); 
  };

  const getDistance = (a: string, b: string) => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
    for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
        }
      }
    }
    return matrix[b.length][a.length];
  };

  const matchesKeyword = (text: string, keywords: string[], tolerance = 1): boolean => {
    const words = text.split(/[\s,]+/); 
    for (const word of words) {
      for (const keyword of keywords) {
        // Palavras curtas (tipo 'blz', 'ok') exigem match exato (tolerancia 0)
        const currentTolerance = keyword.length < 4 ? 0 : tolerance;
        if (getDistance(word, keyword) <= currentTolerance) return true;
      }
    }
    return false;
  };

  const getRandomResponse = (category: keyof typeof CONVERSATION_BANK) => {
    const list = CONVERSATION_BANK[category];
    return list[Math.floor(Math.random() * list.length)];
  };

  // --- NLP ENGINE (Date Extraction) ---
  const extractMultiDates = (rawText: string): { dates: string[], textRemoved: string[] } => {
    const text = normalize(rawText);
    const today = new Date();
    const foundDates: Date[] = [];
    const removedTerms: string[] = [];

    // 0. Date with Month Names (New Logic)
    const monthMap: { [key: string]: number } = {
        'janeiro': 0, 'jan': 0,
        'fevereiro': 1, 'fev': 1,
        'marco': 2, 'mar': 2,
        'abril': 3, 'abr': 3,
        'maio': 4, 'mai': 4,
        'junho': 5, 'jun': 5,
        'julho': 6, 'jul': 6,
        'agosto': 7, 'ago': 7,
        'setembro': 8, 'set': 8,
        'outubro': 9, 'out': 9,
        'novembro': 10, 'nov': 10,
        'dezembro': 11, 'dez': 11
    };
    
    // Regex matches: "18 de fevereiro", "18 fev", "setembro 2026", "18 de setembro de 2026"
    // Using rawText matching with normalized checks allows accents in input
    const ptMonthsRegex = /janeiro|jan|fevereiro|fev|mar[cç]o|mar|abril|abr|maio|mai|junho|jun|julho|jul|agosto|ago|setembro|set|outubro|out|novembro|nov|dezembro|dez/i;
    const verboseDateRegex = new RegExp(`\\b(?:(\\d{1,2})\\s*(?:de)?\\s*)?(${ptMonthsRegex.source})\\s*(?:de)?\\s*(\\d{2,4})?\\b`, 'gi');
    
    let verboseMatch;
    while ((verboseMatch = verboseDateRegex.exec(rawText)) !== null) {
        // If day is missing (e.g. "setembro 2026"), default to 1st
        const day = verboseMatch[1] ? parseInt(verboseMatch[1]) : 1;
        const monthStr = normalize(verboseMatch[2].toLowerCase());
        const yearStr = verboseMatch[3];
        let year = yearStr ? parseInt(yearStr) : today.getFullYear();
        if (year < 100) year += 2000;
        
        const month = monthMap[monthStr]; 
        
        if (month !== undefined) {
             const d = new Date(year, month, day);
             foundDates.push(d);
             removedTerms.push(verboseMatch[0]);
        }
    }

    // 1. Numeric Dates (Existing)
    const fullDateRegex = /\b(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?\b/g;
    let fullDateMatch;
    
    while ((fullDateMatch = fullDateRegex.exec(text)) !== null) {
      const day = parseInt(fullDateMatch[1]);
      const month = parseInt(fullDateMatch[2]) - 1; 
      let year = fullDateMatch[3] ? parseInt(fullDateMatch[3]) : today.getFullYear();
      if (year < 100) year += 2000;

      if (month >= 0 && month <= 11) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const validDay = Math.min(Math.max(1, day), daysInMonth);
        const d = new Date(year, month, validDay);
        // Avoid duplicates if verbose regex caught it (unlikely due to format diff)
        if (!foundDates.some(fd => fd.getTime() === d.getTime())) {
             foundDates.push(d);
             removedTerms.push(fullDateMatch[0]);
        }
      }
    }

    if (foundDates.length === 0) {
      const terms = {
        today: ['hoje', 'hj'],
        tomorrow: ['amanha', 'amnh'],
        weekdays: [
          { key: 0, words: ['domingo', 'doming', 'dom'] },
          { key: 1, words: ['segunda', 'segund', 'seg'] },
          { key: 2, words: ['terca', 'ter', 'terc'] },
          { key: 3, words: ['quarta', 'quart', 'qua'] },
          { key: 4, words: ['quinta', 'quint', 'qui'] },
          { key: 5, words: ['sexta', 'sext', 'sex'] },
          { key: 6, words: ['sabado', 'sabad', 'sab'] }
        ]
      };

      if (matchesKeyword(text, terms.tomorrow, 1)) {
         const d = new Date(); d.setDate(today.getDate() + 1); foundDates.push(d);
         removedTerms.push('amanha');
      }
      if (matchesKeyword(text, terms.today, 1)) {
         foundDates.push(new Date());
         removedTerms.push('hoje');
      }

      terms.weekdays.forEach(dayInfo => {
        if (matchesKeyword(text, dayInfo.words, 1)) {
          const d = new Date();
          const currentDay = today.getDay();
          let distance = dayInfo.key - currentDay;
          if (distance <= 0) distance += 7; 
          d.setDate(today.getDate() + distance);
          foundDates.push(d);
          removedTerms.push(dayInfo.words[0]);
        }
      });

      const numListRegex = /(?:dias?|em|no dia)\s+((?:\d{1,2}(?:st|nd|rd|th)?(?:,\s*|\s+e\s+|\s+ou\s+|\s+))*\d{1,2})(?!\/)/gi;
      let listMatch;
      while ((listMatch = numListRegex.exec(rawText)) !== null) {
         const numbers = listMatch[1].match(/\d{1,2}/g);
         if (numbers) {
           numbers.forEach(numStr => {
              const day = parseInt(numStr);
              if (day > 0 && day <= 31) {
                const d = new Date();
                let month = d.getMonth();
                if (day < d.getDate()) month++;
                const targetMaxDays = new Date(d.getFullYear(), month + 1, 0).getDate();
                if (day <= targetMaxDays) {
                  const newDate = new Date(d.getFullYear(), month, day);
                  if (!foundDates.some(fd => fd.getTime() === newDate.getTime())) {
                    foundDates.push(newDate);
                  }
                }
              }
           });
           removedTerms.push(listMatch[0]);
         }
      }
    }

    if (foundDates.length === 0) return { dates: [], textRemoved: [] };

    const uniqueDates = Array.from(new Set(foundDates.map(d => d.toISOString().split('T')[0]))).sort();
    return { dates: uniqueDates, textRemoved: removedTerms };
  };

  const extractTimeAdvanced = (rawText: string): { time: string, textMatch: string } => {
    const text = normalize(rawText);
    if (matchesKeyword(text, ['meio dia'], 1)) return { time: '12:00', textMatch: 'meio dia' };
    if (matchesKeyword(text, ['meia noite'], 1)) return { time: '00:00', textMatch: 'meia noite' };

    const regexTime = /(\d{1,2})\s*(:|h|hrs?)\s*(\d{2})?|(\d{1,2})\s*(da|a|na)\s*(tarde|noite|manha)/i;
    const match = rawText.match(regexTime);

    if (match) {
      const fullMatch = match[0];
      let hour = 0;
      let minute = '00';
      if (match[1]) {
        hour = parseInt(match[1]);
        if (match[3]) minute = match[3];
      } else if (match[4]) {
        hour = parseInt(match[4]);
        const period = normalize(match[6]);
        if ((period.includes('tarde') || period.includes('noite')) && hour < 12) hour += 12;
      }
      return { time: `${String(hour).padStart(2, '0')}:${minute}`, textMatch: fullMatch };
    }
    return { time: "09:00", textMatch: "" }; 
  };

  // --- LOCATION EXTRACTION (NEW) ---
  const extractLocation = (text: string, removedTerms: string[]) => {
      let clean = text;
      // Remove known terms first to avoid false positives (like "no dia")
      removedTerms.forEach(term => { clean = clean.replace(term, ' '); });
      
      // Regex detects "na X", "no Y", "em Z", "local X"
      // Captures the preposition and the following words until end or special separators
      const locRegex = /\b(na|no|em|local|no espaco|na rua|no clube|na casa)\s+([^,.-]+)/i;
      const match = clean.match(locRegex);
      
      if (match) {
         const fullMatch = match[0];
         let location = match[2].trim();
         
         // Cleanup: if location ends with " as" or " às" (time indicators), strip them
         location = location.replace(/\s+(as|às|at|@)\s*\d.*$/i, '');
         
         return { location, fullMatch };
      }
      return { location: '', fullMatch: '' };
  };

  // --- VALUE EXTRACTION (IMPROVED) ---
  const extractValue = (text: string): { value: number, textMatch: string } => {
    const cleanText = text.toLowerCase();

    // 1. Explicit Multipliers (e.g., "3 mil", "1.5 mil", "500k")
    // Regex: Number + optional space + (mil/k/million) + optional currency words including typos like 'reias'
    const multiplierRegex = /\b(\d+(?:[.,]\d+)?)\s*(mil|k|milhao|milhão|milhoes|milhões)(?:\s*(?:de\s*)?(?:reais|real|reias|conto|pila))?\b/i;
    const multMatch = cleanText.match(multiplierRegex);

    if (multMatch) {
        let numStr = multMatch[1].replace(',', '.'); // Handle "3,5" -> "3.5"
        let number = parseFloat(numStr);
        const unit = multMatch[2];

        if (unit === 'mil' || unit === 'k') number *= 1000;
        if (unit.startsWith('milh')) number *= 1000000;

        return { value: number, textMatch: multMatch[0] }; // Return full match to remove from title
    }

    // 2. Standard Patterns (Existing logic with minor tweaks)
    // Supports R$ 3000, 3000 reais, 3.000 (dotted)
    const standardRegex = /(?:R\$|\$)\s*([\d\.,]+)|([\d\.,]+)\s*(?:reais|real|reias)|(\b\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?\b)/i;
    const match = text.match(standardRegex);
    
    if (match) {
         const fullMatch = match[0];
         const rawNumber = match[1] || match[2] || match[3];
         // Standardize: remove dots (thousands separator), swap comma to dot (decimal)
         const cleanNumber = rawNumber.replace(/\./g, '').replace(',', '.');
         const value = parseFloat(cleanNumber);
         return { value: isNaN(value) ? 0 : value, textMatch: fullMatch };
    }

    return { value: 0, textMatch: '' };
  };

  const extractTitleSmart = (original: string, removedTerms: string[]) => {
    let clean = original;
    // Enhanced removal: Case-insensitive and robust replace
    removedTerms.forEach(term => { 
        if (term) {
             const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
             const regex = new RegExp(escapedTerm, 'gi');
             clean = clean.replace(regex, ' '); 
        }
    });

    const commandWords = [
      'agendar', 'agenda', 'marcar', 'criar', 'nova', 'novo', 'adicionar', 'bot',
      'para', 'por', 'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas', 
      'a', 'o', 'as', 'os', 'um', 'uma', 'uns', 'umas',
      'este', 'esta', 'esse', 'essa', 'isso', 'isto', 'aquilo',
      'que', 'qual', 'onde', 'quando', 'quanto',
      'e', 'ou', 'mas', 'se', 'porque', 'como', 'com',
      'dia', 'dias', 'mes', 'ano', 'hoje', 'amanha', 'ontem', 'horario', 'hora', 'horas',
      'favor', 'pode', 'quero', 'gostaria', 'preciso', 'desejo', 'vou', 'vai',
      'compromisso', 'evento', 'reuniao', 'tarefa', 'lembrete', 'anotacao',
      'ok', 'okay', 'blz', 'beleza', 'ta', 'entendi', 'certo', 'obrigado',
      'reais', 'reias', 'valor', 'custo', 'preco', 'pagamento',
      'eh', 'é',
      'inicio', 'início', 'fim', 'termino', 'término', 'durante', 'pelo', 'pela',
      'servico', 'serviço', 'fazer', 'realizar', 'ter', 'pra',
      'sera', 'será', 'realizado', 'realizada', 'acontecer', 'acontecera', 'acontecerá', 'agendado'
    ];
    const words = clean.split(/[\s]+/);
    const filteredWords = words.filter(w => {
       const norm = normalize(w);
       if (matchesKeyword(norm, commandWords, 0)) return false;
       if (/\d/.test(w) && norm.length < 5) return false;
       if (w.length < 2) return false;
       return true;
    });
    
    let title = filteredWords.join(' ').trim();
    // Remove pontuação do final E do começo
    title = title.replace(/[.,;:\/-]+$/, '');
    title = title.replace(/^[.,;:\/-]+/, '');
    title = title.trim();
    
    return title.length > 0 ? title.charAt(0).toUpperCase() + title.slice(1) : "Compromisso";
  };

  const processLocalIntent = async (text: string) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 700));

    const textLower = normalize(text);
    
    // 1. DATA (Prioridade Máxima)
    const { dates, textRemoved } = extractMultiDates(text);
    const hasStrongDateIntent = dates.length > 0;

    if (hasStrongDateIntent) {
      const { time, textMatch: timeMatch } = extractTimeAdvanced(text);
      const { location, fullMatch: locationMatch } = extractLocation(text, textRemoved);
      const { value, textMatch: valueMatch } = extractValue(text);
      
      // We pass the full match of location/value to be removed from title
      // Also add 'as' + time to removed terms to avoid title pollution if typed explicitly
      const timeTerm = `as ${time}`; 
      const title = extractTitleSmart(text, [...textRemoved, timeMatch, locationMatch, timeTerm, valueMatch]);

      dates.forEach(date => {
          onAddEvent({
            id: Math.random().toString(36).substr(2, 9),
            title: title,
            date: date,
            time: time,
            location: location,
            value: value,
            description: `Criado via Nexus Chat: "${text}"`,
            color: 'blue',
            isSynced: true
          }, false); // Pass false to prevent redirect
      });

      const dateList = dates.map(d => d.split('-').reverse().join('/')).join(', ');
      const count = dates.length;
      
      const locString = location ? ` em ${location}` : '';
      const valueString = value > 0 ? ` (R$ ${value.toFixed(2)})` : '';

      // Mensagem Técnica
      const techMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        text: count > 1 
          ? `Agendei "${title}"${locString}${valueString} em ${count} datas: ${dateList} às ${time}.`
          : `Agendado: "${title}"${locString}${valueString} para ${dateList} às ${time}.`,
        timestamp: new Date(),
        isFunctionCall: true
      };

      // Mensagem de Sucesso (Frase)
      const successMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: SUCCESS_PHRASES[Math.floor(Math.random() * SUCCESS_PHRASES.length)],
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, techMsg, successMsg]);
      setChatContext('IDLE');
      setIsLoading(false);
      return;
    }

    // 2. ASSOCIAÇÕES DIRETAS (Prioridade Alta)
    // Verifica se bate com algum gatilho específico.
    // MODIFICAÇÃO IMPORTANTE: Se o contexto for 'AWAITING_DETAILS' e for uma confirmação, NÃO resetamos pra IDLE.
    for (const group of DIRECT_RESPONSES) {
       if (matchesKeyword(textLower, group.triggers, 1)) {
          // Lógica especial para o "blz/ok" durante um fluxo de agendamento
          if (chatContext === 'AWAITING_DETAILS' && group.id === 'confirmation') {
              setMessages(prev => [...prev, { 
                id: Date.now().toString(), 
                role: 'model', 
                text: "Estou ouvindo. Pode digitar o que você quer agendar (ex: 'Academia amanhã').", 
                timestamp: new Date() 
              }]);
              // Mantém o contexto AWAITING_DETAILS
              setIsLoading(false);
              return;
          }

          const resp = group.responses[Math.floor(Math.random() * group.responses.length)];
          setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: resp, timestamp: new Date() }]);
          setChatContext('IDLE'); 
          setIsLoading(false);
          return;
       }
    }

    // 3. INTENÇÃO DE AGENDAR (Sem data)
    const schedulingIntentWords = [
      'marcar', 'marcando', 
      'agendar', 'agendando', 
      'anotar', 'anotando',
      'colocar', 'botar',
      'horario', 'compromisso', 'reuniao',
      'nova', 'novo', 'adicionar'
    ];
    
    const hasSchedulingIntent = matchesKeyword(textLower, schedulingIntentWords, 1);

    // 4. FLUXO DE SAUDAÇÃO (Contexto Ativo)
    if (chatContext === 'GREETING_FLOW') {
       const yesWords = [
         'sim', 'claro', 'quero', 'com certeza', 'pode ser', 'bora', 'agora', 'preciso', 'exatamente', 'yes', 'aham', 's', 'ss', 'prossiga',
         'marcando', 'agendando'
       ];
       
       const noWords = ['nao', 'nop', 'nem', 'agora nao', 'depois', 'negativo', 'nunca', 'cancelar', 'n', 'nn', 'nao quero', 'nada'];

       if (matchesKeyword(textLower, yesWords, 1) || hasSchedulingIntent) {
         setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: getRandomResponse('affirmation_followup'), timestamp: new Date() }]);
         setChatContext('AWAITING_DETAILS');
         setIsLoading(false);
         return;
       }

       if (matchesKeyword(textLower, noWords, 1)) {
         setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: getRandomResponse('negation_followup'), timestamp: new Date() }]);
         setChatContext('IDLE');
         setIsLoading(false);
         return;
       }
    }

    // 5. GATILHOS GENÉRICOS
    const greetings = [
      'oi', 'oie', 'oii', 'oiii', 'oiee', 'oieee',
      'ola', 'olá', 'hello', 'hi', 'hey',
      'eai', 'eae', 'eaí', 'opa', 'salve',
      'bom dia', 'boa tarde', 'boa noite',
      'roi', 'coé', 'fala', 'ei'
    ];
    const identity = ['quem e voce', 'quem e', 'seu nome', 'o que voce faz', 'quem fala'];
    const status = ['tudo bem', 'como voce esta', 'beleza', 'tranquilo', 'suave', 'de boa'];
    const thanks = ['obrigado', 'valeu', 'thanks', 'grato', 'agradeco'];

    // Se detectou intenção de agendar (e não caiu na verificação de "entendi"/diretos acima)
    if (hasSchedulingIntent) {
       setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: getRandomResponse('intent_detected_ask_date'), timestamp: new Date() }]);
       setChatContext('AWAITING_DETAILS'); 
       setIsLoading(false);
       return;
    }

    if (matchesKeyword(textLower, greetings, 1)) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: getRandomResponse('greetings_question'), timestamp: new Date() }]);
      setChatContext('GREETING_FLOW');
      setIsLoading(false);
      return;
    }

    if (matchesKeyword(textLower, identity, 2)) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: getRandomResponse('identity'), timestamp: new Date() }]);
      setIsLoading(false);
      return;
    }

    if (matchesKeyword(textLower, status, 2)) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: getRandomResponse('status'), timestamp: new Date() }]);
      setIsLoading(false);
      return;
    }

    if (matchesKeyword(textLower, thanks, 1)) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: getRandomResponse('gratitude'), timestamp: new Date() }]);
      setChatContext('IDLE');
      setIsLoading(false);
      return;
    }

    // 6. FALLBACK (Lógica Refinada)
    // Se o contexto era "esperando detalhes", assumimos que foi um erro de data.
    // Se estava IDLE, assumimos que foi um erro genérico.
    const fallbackCategory = chatContext === 'AWAITING_DETAILS' ? 'confused' : 'general_fallback';

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'model',
      text: getRandomResponse(fallbackCategory),
      timestamp: new Date()
    }]);
    
    setIsLoading(false);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    const textToProcess = inputText;
    setInputText('');
    
    processLocalIntent(textToProcess);
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-[#0b0e14] z-10">
      <header className="px-6 py-6 border-b border-white/5 flex items-center justify-between bg-[#0b0e14]/90 backdrop-blur-md sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors">
            <ChevronLeft className="w-6 h-6 stroke-[3]" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-white">Nexus Brain</h2>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${chatContext === 'IDLE' ? 'bg-gray-500' : 'bg-emerald-500'}`} />
                <span className={`text-[8px] font-black uppercase tracking-widest ${chatContext === 'IDLE' ? 'text-gray-500' : 'text-emerald-500'}`}>
                  {chatContext === 'IDLE' ? 'Standby' : 'Contexto Ativo'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8 space-y-6 no-scrollbar pb-40 scroll-smooth">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} group animate-in slide-in-from-bottom-2 duration-300`}>
            <div className={`flex items-end gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mb-1 border border-white/5 ${msg.role === 'user' ? 'bg-white/10' : 'bg-purple-500/10'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-gray-400" /> : <Sparkles className="w-4 h-4 text-purple-400" />}
              </div>
              
              <div className={`relative px-5 py-4 rounded-[1.8rem] text-[13px] leading-relaxed font-medium shadow-2xl break-words ${
                msg.role === 'user' 
                ? 'bg-white text-black rounded-tr-none' 
                : 'bg-[#1a1c23] text-gray-200 border border-white/5 rounded-tl-none'
              }`}>
                {msg.text}
                
                {msg.isFunctionCall && (
                  <div className="mt-3 pt-3 border-t border-gray-700/30 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                    <Layers className="w-3 h-3" />
                    Agendado
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-3 text-gray-600 px-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-widest animate-pulse">Nexus pensando...</span>
          </div>
        )}
        <div id="scroll-anchor" className="h-4" />
      </div>

      <div className="fixed bottom-24 left-0 right-0 max-w-md mx-auto px-6 pb-4 pointer-events-none">
        <div className="pointer-events-auto">
          <form 
            onSubmit={handleSendMessage}
            className={`bg-[#1a1c23]/90 p-2 rounded-[2.5rem] border shadow-2xl flex items-center gap-2 focus-within:border-purple-500/50 transition-all backdrop-blur-xl ${chatContext !== 'IDLE' ? 'border-purple-500/30' : 'border-white/10'}`}
          >
            <input 
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={chatContext === 'GREETING_FLOW' ? "Responda Sim ou Não..." : "Diga 'Oi' ou a data..."}
              className="flex-1 bg-transparent px-5 py-3 text-sm font-bold text-white focus:outline-none placeholder:text-gray-600"
            />
            <button 
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center active:scale-90 transition-all disabled:opacity-30 shadow-lg"
            >
              <Send className="w-5 h-5 stroke-[2.5]" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatBotView;
