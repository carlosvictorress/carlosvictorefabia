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

  // Player de Áudio Ambiente Global
  const globalAudio = document.getElementById('global-audio');
  const audioStartBanner = document.getElementById('audio-start-banner');

  // Toast / Notificações
  const toastEl = document.getElementById('toast');
  const toastMessageEl = document.getElementById('toast-message');

  // PWA & Notificações Elements
  const pwaModal = document.getElementById('pwa-install-modal');
  const installBtn = document.getElementById('install-pwa-btn');
  const closePwaBtn = document.getElementById('close-pwa-modal-btn');
  const iosInstructions = document.getElementById('ios-install-instructions');
  const androidBtnContainer = document.getElementById('android-install-btn-container');

  const notifBanner = document.getElementById('notification-permission-banner');
  const enableNotifBtn = document.getElementById('enable-notifications-btn');

  // Estado da Aplicação
  let calendarData = loadCalendarData();
  let currentOpenDayIndex = -1;
  let isGlobalAudioPlaying = false;
  let deferredPrompt = null;

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
  initServiceWorker();
  initBackgroundPhotoWall();
  initCanvasPetals();
  renderCalendar();
  setupEventListeners();
  initBackgroundMusic();
  setupPWAandNotifications();

  /**
   * Registrar Service Worker
   */
  function initServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').then((reg) => {
        console.log('Service Worker registrado!', reg);
      }).catch((err) => {
        console.log('Erro ao registrar Service Worker:', err);
      });
    }
  }

  /**
   * Configuração de Instalação na Tela Inicial (PWA) e Notificações Diárias
   */
  function setupPWAandNotifications() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

    // Se ainda não estiver instalado como App
    if (!isStandalone && !localStorage.getItem('PWA_MODAL_CLOSED')) {
      if (isIOS) {
        setTimeout(() => {
          if (pwaModal) {
            pwaModal.classList.remove('hidden');
            if (iosInstructions) iosInstructions.classList.remove('hidden');
            if (androidBtnContainer) androidBtnContainer.classList.add('hidden');
          }
        }, 2000);
      }
    }

    // Evento do Android / Chrome para Instalação PWA
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      if (pwaModal && !isStandalone && !localStorage.getItem('PWA_MODAL_CLOSED')) {
        setTimeout(() => {
          pwaModal.classList.remove('hidden');
        }, 1500);
      }
    });

    if (installBtn) {
      installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          console.log('Resultado PWA Install:', outcome);
          deferredPrompt = null;
          if (pwaModal) pwaModal.classList.add('hidden');
        }
      });
    }

    if (closePwaBtn) {
      closePwaBtn.addEventListener('click', () => {
        if (pwaModal) pwaModal.classList.add('hidden');
        localStorage.setItem('PWA_MODAL_CLOSED', 'true');
      });
    }

    // Verificar e solicitar Notificações Diárias
    checkDailyNotifications();
  }

  /**
   * Notificação Diária da Nova Memória
   */
  function checkDailyNotifications() {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'default') {
      if (notifBanner && !localStorage.getItem('NOTIF_BANNER_CLOSED')) {
        setTimeout(() => {
          notifBanner.classList.remove('hidden');
        }, 3500);
      }
    } else if (Notification.permission === 'granted') {
      triggerDailyCheckNotification();
    }

    if (enableNotifBtn) {
      enableNotifBtn.addEventListener('click', () => {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            if (notifBanner) notifBanner.classList.add('hidden');
            triggerDailyCheckNotification(true);
          } else {
            if (notifBanner) notifBanner.classList.add('hidden');
          }
          localStorage.setItem('NOTIF_BANNER_CLOSED', 'true');
        });
      });
    }
  }

  function triggerDailyCheckNotification(isFirstTime = false) {
    const todayStr = getTodayDate().toDateString();
    const lastNotifiedDate = localStorage.getItem('LAST_NOTIFIED_DATE');

    if (isFirstTime || lastNotifiedDate !== todayStr) {
      localStorage.setItem('LAST_NOTIFIED_DATE', todayStr);
      
      const currentDiff = getDiffDays();
      const currentCard = calendarData[currentDiff] || calendarData[0];
      
      const title = "Calendário do Nosso Amor ❤️";
      const body = `Fábia, a sua nova memória de hoje (${currentCard.dateString}) está pronta! Clique para abrir ✨`;

      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'TRIGGER_NOTIFICATION',
          title: title,
          body: body
        });
      } else if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body: body,
          icon: 'https://cdn-icons-png.flaticon.com/512/2904/2904973.png'
        });
      }
    }
  }

  /**
   * Gera o Mural de Fotos de Fundo em Quadrinhos (Marquee em Loop Infinito)
   */
  function initBackgroundPhotoWall() {
    const wallContainer = document.getElementById('bg-photo-wall');
    if (!wallContainer) return;

    wallContainer.innerHTML = '';

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

      const shuffled = [...LOCAL_PHOTOS.slice(cfg.offset), ...LOCAL_PHOTOS.slice(0, cfg.offset)];
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
   */
  function initBackgroundMusic() {
    if (!globalAudio) return;

    const playMusic = () => {
      globalAudio.play().then(() => {
        isGlobalAudioPlaying = true;
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

    playMusic();

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

  function getTodayDate() {
    const overrideDate = localStorage.getItem('LOVE_CALENDAR_OVERRIDE_DATE');
    if (overrideDate) {
      return new Date(overrideDate);
    }
    return new Date();
  }

  function getStartDate() {
    const savedStart = localStorage.getItem('LOVE_CALENDAR_START_DATE') || DEFAULT_START_DATE;
    return new Date(savedStart + 'T00:00:00');
  }

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

  function getDiffDays() {
    const today = getTodayDate();
    const start = getStartDate();
    
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    
    const diffTime = t - s;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays : 0;
  }

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

  function openCardModal(index) {
    currentOpenDayIndex = index;
    const item = calendarData[index];

    modalImage.src = item.image;
    modalImage.alt = item.title;
    modalTitle.textContent = item.title;
    modalSubtitle.textContent = item.subtitle + " • " + item.dateString;
    modalMessage.textContent = item.message;

    if (globalAudio && globalAudio.paused) {
      globalAudio.play().then(() => {
        isGlobalAudioPlaying = true;
        if (audioStartBanner) audioStartBanner.classList.add('hidden');
      }).catch(() => {});
    }

    const currentDiff = getDiffDays();
    prevCardBtn.disabled = index === 0;
    nextCardBtn.disabled = index >= calendarData.length - 1 || calendarData[index + 1].offsetDays > currentDiff;

    modalOverlay.classList.remove('hidden');
    modalOverlay.classList.add('flex');
  }

  function closeCardModal() {
    modalOverlay.classList.add('hidden');
    modalOverlay.classList.remove('flex');
  }

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

  function setupEventListeners() {
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeCardModal);
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeCardModal();
    });

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
  }

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
