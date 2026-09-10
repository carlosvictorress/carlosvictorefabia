/**
 * Lógica Principal do Calendário do Nosso Amor
 * Carlos & Fábia Emanoely ❤️
 */

document.addEventListener('DOMContentLoaded', () => {
  // Data Inicial do Calendário (Hoje: 10/09/2026)
  const DEFAULT_START_DATE = '2026-09-10';
  
  // Elementos do DOM
  const calendarGrid = document.getElementById('calendar-grid');
  const unlockedCountEl = document.getElementById('unlocked-count');
  const modalOverlay = document.getElementById('card-modal');
  const modalImage = document.getElementById('modal-image');
  const modalTitle = document.getElementById('modal-title');
  const modalSubtitle = document.getElementById('modal-subtitle');
  const modalMessage = document.getElementById('modal-message');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const prevCardBtn = document.getElementById('prev-card-btn');
  const nextCardBtn = document.getElementById('next-card-btn');

  // Player de Áudio Ambiente Global (Música da pasta /music)
  const globalAudio = document.getElementById('global-audio');
  const globalAudioToggle = document.getElementById('global-audio-toggle');
  const globalAudioIcon = document.getElementById('global-audio-icon');
  const audioStartBanner = document.getElementById('audio-start-banner');

  // Toast / Notificações
  const toastEl = document.getElementById('toast');
  const toastMessageEl = document.getElementById('toast-message');

  // Modal de Personalização (Admin)
  const customizerModal = document.getElementById('customizer-modal');
  const openCustomizerBtn = document.getElementById('open-customizer-btn');
  const closeCustomizerBtn = document.getElementById('close-customizer-btn');
  const customizerForm = document.getElementById('customizer-form');
  const customizerDaySelect = document.getElementById('customizer-day-select');
  const customizerTitleInput = document.getElementById('customizer-title');
  const customizerTextInput = document.getElementById('customizer-text');
  const customizerImageInput = document.getElementById('customizer-image');
  const customizerImageFile = document.getElementById('customizer-image-file');
  const resetDefaultBtn = document.getElementById('reset-default-btn');

  // Estado da Aplicação
  let calendarData = loadCalendarData();
  let currentOpenDayIndex = -1;
  let isGlobalAudioPlaying = false;

  // Lista de 27 fotos locais da pasta /img
  const LOCAL_PHOTOS = [
    "img/WhatsApp Image 2026-09-10 at 12.05.53.jpeg",
    "img/WhatsApp Image 2026-09-10 at 12.05.56.jpeg",
    "img/WhatsApp Image 2026-09-10 at 12.12.29.jpeg",
    "img/cghj,jh.jpeg",
    "img/cghkg.jpeg",
    "img/cghkgkj.jpeg",
    "img/chkmcgkm.jpeg",
    "img/dfhxgthfghj.jpeg",
    "img/fghkjdtyk.jpeg",
    "img/fjj.jpeg",
    "img/gfnjfgn.jpeg",
    "img/ghkvjk.jpeg",
    "img/gjl,hjk,.jpeg",
    "img/gykfuk,y.jpeg",
    "img/hkjmghkm.jpeg",
    "img/hkmtguk.jpeg",
    "img/sfhbdhn.jpeg",
    "img/sgtjdfrj.jpeg",
    "img/srtghjf.jpeg",
    "img/tghnfgjhg.jpeg",
    "img/tgjnyhjyt.jpeg",
    "img/vhjl,ihl.jpeg",
    "img/vhklj.vk.jpeg",
    "img/vjh,lhj.jpeg",
    "img/vjlkjl.jpeg",
    "img/xgfhjcghkjm.jpeg",
    "img/zdfhxgfh.jpeg"
  ];

  // Inicialização
  initBackgroundPhotoWall();
  initCanvasPetals();
  renderCalendar();
  setupEventListeners();
  initBackgroundMusic();

  /**
   * Gera o Mural de Fotos de Fundo em Quadrinhos (Marquee em Loop Infinito)
   */
  function initBackgroundPhotoWall() {
    const wallContainer = document.getElementById('bg-photo-wall');
    if (!wallContainer) return;

    wallContainer.innerHTML = '';

    // Criar 4 fileiras com movimentos alternados e velocidades diferentes
    const rowsConfig = [
      { direction: 'animate-marquee-left', speed: 'animate-marquee-slow', offset: 0 },
      { direction: 'animate-marquee-right', speed: 'animate-marquee-fast', offset: 7 },
      { direction: 'animate-marquee-left', speed: '', offset: 14 },
      { direction: 'animate-marquee-right', speed: 'animate-marquee-slow', offset: 20 }
    ];

    rowsConfig.forEach((cfg) => {
      const rowWrapper = document.createElement('div');
      rowWrapper.className = 'w-full overflow-hidden py-1';

      const track = document.createElement('div');
      track.className = `${cfg.direction} ${cfg.speed} flex items-center`;

      // Reordenar fotos a partir do offset
      const shuffled = [...LOCAL_PHOTOS.slice(cfg.offset), ...LOCAL_PHOTOS.slice(0, cfg.offset)];

      // Duplicar a lista de fotos 2 vezes para garantir loop perfeito e contínuo
      const fullList = [...shuffled, ...shuffled];

      fullList.forEach((src) => {
        const img = document.createElement('img');
        img.src = src;
        img.alt = 'Foto de Fundo';
        img.className = 'bg-photo-tile';
        img.loading = 'lazy';
        track.appendChild(img);
      });

      rowWrapper.appendChild(track);
      wallContainer.appendChild(rowWrapper);
    });
  }

  /**
   * Tenta iniciar a música de fundo da pasta /music imediatamente ao abrir o site
   * E escuta qualquer interatividade (clique/toque) caso o navegador exija permissão de áudio
   */
  function initBackgroundMusic() {
    if (!globalAudio) return;

    const playMusic = () => {
      globalAudio.play().then(() => {
        isGlobalAudioPlaying = true;
        updateGlobalAudioIcon();
        if (audioStartBanner) {
          audioStartBanner.classList.add('hidden');
        }
      }).catch(err => {
        console.log('Autoplay travado pelo navegador. Exibindo banner de toque...', err);
        if (audioStartBanner) {
          audioStartBanner.classList.remove('hidden');
        }
      });
    };

    // Tentar tocar no carregamento do site
    playMusic();

    // Tocar ao primeiro toque ou clique na tela
    const enableAudioOnUserAction = () => {
      if (globalAudio.paused) {
        playMusic();
      }
      document.removeEventListener('click', enableAudioOnUserAction);
      document.removeEventListener('touchstart', enableAudioOnUserAction);
    };

    document.addEventListener('click', enableAudioOnUserAction);
    document.addEventListener('touchstart', enableAudioOnUserAction);

    if (audioStartBanner) {
      audioStartBanner.addEventListener('click', playMusic);
    }
  }

  /**
   * Obtém a data atual em relação ao início do calendário.
   */
  function getTodayDate() {
    const overrideDate = localStorage.getItem('LOVE_CALENDAR_OVERRIDE_DATE');
    if (overrideDate) {
      return new Date(overrideDate);
    }
    return new Date(); // Data real
  }

  function getStartDate() {
    const savedStart = localStorage.getItem('LOVE_CALENDAR_START_DATE') || DEFAULT_START_DATE;
    return new Date(savedStart + 'T00:00:00');
  }

  /**
   * Carrega os dados do Calendário (LocalStorage ou Padrão)
   */
  function loadCalendarData() {
    const saved = localStorage.getItem('LOVE_CALENDAR_CUSTOM_DATA');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Erro ao carregar dados salvos:', e);
      }
    }
    return window.LOVE_CALENDAR_DATA || [];
  }

  /**
   * Salva os dados customizados no LocalStorage
   */
  function saveCalendarData(data) {
    localStorage.setItem('LOVE_CALENDAR_CUSTOM_DATA', JSON.stringify(data));
    calendarData = data;
    renderCalendar();
  }

  /**
   * Calcula o índice de dias desbloqueados com base no dia atual
   */
  function getDiffDays() {
    const today = getTodayDate();
    const start = getStartDate();
    
    // Normalizar para ignorar horas/minutos
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    
    const diffTime = t - s;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays : 0;
  }

  /**
   * Renderiza a grade de 30 cards no DOM
   */
  function renderCalendar() {
    const currentDiffDays = getDiffDays();
    let unlockedCount = 0;

    calendarGrid.innerHTML = '';

    calendarData.forEach((item, index) => {
      const isUnlocked = item.offsetDays <= currentDiffDays;
      const isToday = item.offsetDays === currentDiffDays;
      
      if (isUnlocked) unlockedCount++;

      const card = document.createElement('div');
      card.className = `glass-card p-5 rounded-2xl flex flex-col justify-between transition-all duration-300 ${
        isUnlocked ? 'card-unlocked' : 'card-locked'
      } ${isToday ? 'card-today' : ''}`;

      // Conteúdo do Card
      card.innerHTML = `
        <div>
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${
              isToday
                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                : isUnlocked
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'bg-gray-800/60 text-gray-400 border border-gray-700'
            }">
              ${isToday ? '✨ HOJE' : `Dia ${item.dayIndex}`}
            </span>
            <span class="text-sm font-medium ${isUnlocked ? 'text-amber-200' : 'text-gray-500'}">
              ${item.dateString}
            </span>
          </div>

          <h3 class="font-serif text-xl font-bold mb-2 ${isUnlocked ? 'text-rose-100' : 'text-gray-400'} line-clamp-1">
            ${item.title}
          </h3>

          <p class="text-xs ${isUnlocked ? 'text-rose-200/80' : 'text-gray-500'} line-clamp-2 italic mb-4">
            "${item.subtitle}"
          </p>
        </div>

        <div class="pt-3 border-t border-white/5 flex items-center justify-between">
          ${
            isUnlocked
              ? `<span class="text-xs font-semibold text-rose-300 flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                  <i class="fas font-solid fa-heart text-rose-400 animate-pulse"></i> Abrir Memória
                </span>
                <i class="fas fa-chevron-right text-xs text-amber-300"></i>`
              : `<span class="text-xs text-gray-400 flex items-center gap-1.5">
                  <i class="fas fa-lock text-gray-500"></i> Trancado
                </span>
                <span class="text-[10px] text-gray-500 font-mono">Em breve</span>`
          }
        </div>
      `;

      // Evento de Clique no Card
      card.addEventListener('click', () => {
        if (isUnlocked) {
          openCardModal(index);
        } else {
          showLockedToast(item);
        }
      });

      calendarGrid.appendChild(card);
    });

    if (unlockedCountEl) {
      unlockedCountEl.textContent = `${unlockedCount} / ${calendarData.length}`;
    }
  }

  /**
   * Abre o Modal de Carta Desbloqueada
   */
  function openCardModal(index) {
    currentOpenDayIndex = index;
    const item = calendarData[index];

    modalImage.src = item.image;
    modalImage.alt = item.title;
    modalTitle.textContent = item.title;
    modalSubtitle.textContent = item.subtitle + " • " + item.dateString;
    modalMessage.textContent = item.message;

    // Garantir que a música da pasta /music CONTINUE TOCANDO SEM PARAR!
    if (globalAudio && globalAudio.paused) {
      globalAudio.play().then(() => {
        isGlobalAudioPlaying = true;
        updateGlobalAudioIcon();
        if (audioStartBanner) audioStartBanner.classList.add('hidden');
      }).catch(() => {});
    }

    // Atualizar navegação
    const currentDiff = getDiffDays();
    prevCardBtn.disabled = index === 0;
    nextCardBtn.disabled = index >= calendarData.length - 1 || calendarData[index + 1].offsetDays > currentDiff;

    // Exibir Modal com Animação
    modalOverlay.classList.remove('hidden');
    modalOverlay.classList.add('flex');
  }

  /**
   * Fecha o Modal de Carta
   */
  function closeCardModal() {
    modalOverlay.classList.add('hidden');
    modalOverlay.classList.remove('flex');
    // A MÚSICA DE FUNDO NÃO PARA AO FECHAR O MODAL!
  }

  /**
   * Notificação quando clica em dia futuro bloqueado
   */
  function showLockedToast(item) {
    toastMessageEl.innerHTML = `
      <strong>Esta memória ainda está trancada! 🔒</strong><br>
      Ela estará disponível no dia <strong>${item.dateString}</strong>. Volte no dia certinho para abrir essa surpresa especial para você, meu amor! ❤️
    `;
    toastEl.classList.remove('translate-y-20', 'opacity-0');
    toastEl.classList.add('translate-y-0', 'opacity-100');

    setTimeout(() => {
      toastEl.classList.remove('translate-y-0', 'opacity-100');
      toastEl.classList.add('translate-y-20', 'opacity-0');
    }, 4500);
  }

  /**
   * Configuração de Ouvintes de Eventos
   */
  function setupEventListeners() {
    // Fechar Modal
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeCardModal);
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeCardModal();
    });

    // Navegação entre cartas no modal
    if (prevCardBtn) {
      prevCardBtn.addEventListener('click', () => {
        if (currentOpenDayIndex > 0) openCardModal(currentOpenDayIndex - 1);
      });
    }

    if (nextCardBtn) {
      nextCardBtn.addEventListener('click', () => {
        const currentDiff = getDiffDays();
        if (currentOpenDayIndex < calendarData.length - 1 && calendarData[currentOpenDayIndex + 1].offsetDays <= currentDiff) {
          openCardModal(currentOpenDayIndex + 1);
        }
      });
    }

    // Toggle de Música Global
    if (globalAudioToggle) {
      globalAudioToggle.addEventListener('click', () => {
        if (globalAudio.paused) {
          globalAudio.play().then(() => {
            isGlobalAudioPlaying = true;
            updateGlobalAudioIcon();
            if (audioStartBanner) audioStartBanner.classList.add('hidden');
          }).catch(err => console.log('Erro áudio:', err));
        } else {
          globalAudio.pause();
          isGlobalAudioPlaying = false;
          updateGlobalAudioIcon();
        }
      });
    }

    // Abrir Painel de Personalização (Admin)
    if (openCustomizerBtn) {
      openCustomizerBtn.addEventListener('click', () => {
        populateCustomizerSelect();
        customizerModal.classList.remove('hidden');
        customizerModal.classList.add('flex');
      });
    }

    if (closeCustomizerBtn) {
      closeCustomizerBtn.addEventListener('click', () => {
        customizerModal.classList.add('hidden');
        customizerModal.classList.remove('flex');
      });
    }

    if (customizerDaySelect) {
      customizerDaySelect.addEventListener('change', () => {
        const selIdx = parseInt(customizerDaySelect.value);
        fillCustomizerForm(selIdx);
      });
    }

    // Salvar Customização Form
    if (customizerForm) {
      customizerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const selIdx = parseInt(customizerDaySelect.value);
        
        let imageUrl = customizerImageInput.value.trim();

        // Se houver upload de arquivo de imagem local
        if (customizerImageFile && customizerImageFile.files.length > 0) {
          const file = customizerImageFile.files[0];
          imageUrl = await readFileAsDataURL(file);
        }

        calendarData[selIdx].title = customizerTitleInput.value.trim();
        calendarData[selIdx].message = customizerTextInput.value.trim();
        if (imageUrl) calendarData[selIdx].image = imageUrl;

        saveCalendarData(calendarData);
        alert('Cartão atualizado com sucesso! ❤️');
        customizerModal.classList.add('hidden');
        customizerModal.classList.remove('flex');
      });
    }

    // Restaurar Padrão
    if (resetDefaultBtn) {
      resetDefaultBtn.addEventListener('click', () => {
        if (confirm('Tem certeza que deseja restaurar todas as mensagens para o padrão original?')) {
          localStorage.removeItem('LOVE_CALENDAR_CUSTOM_DATA');
          calendarData = window.LOVE_CALENDAR_DATA;
          renderCalendar();
          alert('Mensagens restauradas!');
          customizerModal.classList.add('hidden');
          customizerModal.classList.remove('flex');
        }
      });
    }
  }

  function updateGlobalAudioIcon() {
    if (globalAudioIcon) {
      if (isGlobalAudioPlaying) {
        globalAudioIcon.className = 'fas fa-music text-amber-200 animate-pulse';
      } else {
        globalAudioIcon.className = 'fas fa-volume-mute text-gray-400';
      }
    }
  }

  function populateCustomizerSelect() {
    customizerDaySelect.innerHTML = '';
    calendarData.forEach((item, index) => {
      const opt = document.createElement('option');
      opt.value = index;
      opt.textContent = `Dia ${item.dayIndex} (${item.dateString}) - ${item.title}`;
      customizerDaySelect.appendChild(opt);
    });
    fillCustomizerForm(0);
  }

  function fillCustomizerForm(index) {
    const item = calendarData[index];
    customizerTitleInput.value = item.title;
    customizerTextInput.value = item.message;
    customizerImageInput.value = item.image;
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Efeito de Pétalas Caindo (Canvas API)
   */
  function initCanvasPetals() {
    const canvas = document.getElementById('petals-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const petals = [];
    const numPetals = 35;

    for (let i = 0; i < numPetals; i++) {
      petals.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 8 + 6,
        speedY: Math.random() * 1.2 + 0.5,
        speedX: Math.random() * 0.8 - 0.4,
        angle: Math.random() * 360,
        spin: Math.random() * 2 - 1,
        color: Math.random() > 0.3 ? '#d88b9a' : '#801328',
        opacity: Math.random() * 0.5 + 0.3
      });
    }

    function drawPetal(p) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.angle * Math.PI) / 180);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-p.size, -p.size, -p.size, p.size, 0, p.size * 1.5);
      ctx.bezierCurveTo(p.size, p.size, p.size, -p.size, 0, 0);
      ctx.fill();

      ctx.restore();
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);

      petals.forEach(p => {
        p.y += p.speedY;
        p.x += Math.sin(p.y * 0.01) + p.speedX;
        p.angle += p.spin;

        if (p.y > height + 20) {
          p.y = -20;
          p.x = Math.random() * width;
        }

        drawPetal(p);
      });

      requestAnimationFrame(animate);
    }

    animate();
  }
});
