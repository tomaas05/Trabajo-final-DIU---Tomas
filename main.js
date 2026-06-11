document.addEventListener('DOMContentLoaded', () => {

  /* ============================================================
     NAV — Hamburger mobile + sombra al hacer scroll
  ============================================================ */
  const toggle   = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  const nav      = document.querySelector('.nav');

  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open.toString());
      toggle.textContent = open ? '✕' : '☰';
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.textContent = '☰';
      });
    });

    // Cerrar menú al pulsar fuera (mejora UX móvil)
    document.addEventListener('click', e => {
      if (!nav.contains(e.target) && navLinks.classList.contains('open')) {
        navLinks.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.textContent = '☰';
      }
    });
  }

  // Sombra nav al hacer scroll (microinteracción)
  if (nav) {
    const handleNavScroll = () => {
      nav.classList.toggle('scrolled', window.scrollY > 10);
    };
    window.addEventListener('scroll', handleNavScroll, { passive: true });
    handleNavScroll();
  }

  /* ============================================================
     SCROLL-REVEAL — Microinteracción de entrada al viewport
     Aplica clase .reveal automáticamente a secciones clave
  ============================================================ */
  const revealTargets = [
    '.step-card',
    '.market-card',
    '.producer-card',
    '.season-card',
    '.gallery-item',
    '.section-header',
  ];

  const allReveal = document.querySelectorAll(revealTargets.join(','));

  // Añadir clase reveal + delay escalonado a tarjetas en grid
  allReveal.forEach((el, i) => {
    el.classList.add('reveal');
    // Delay escalonado para elementos en la misma fila (grupos de 4)
    const posInGroup = i % 4;
    if (posInGroup > 0) {
      el.classList.add(`reveal-delay-${posInGroup}`);
    }
  });

  const revealObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target); // solo una vez
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  allReveal.forEach(el => revealObserver.observe(el));

  /* ============================================================
     FILTRO DE MERCADOS — Patrón live-filter con animación
  ============================================================ */
  const filterBtns  = document.querySelectorAll('.filter-btn');
  const marketCards = document.querySelectorAll('.market-card');
  const marketsGrid = document.getElementById('markets-grid');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      filterBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');

      let visible = 0;
      marketCards.forEach(card => {
        const tags  = card.dataset.tags || '';
        const show  = filter === 'all' || tags.includes(filter);
        // Animar entrada/salida de tarjetas
        if (show) {
          card.style.display = '';
          // Forzar reflow para que la transición dispare
          card.offsetHeight; // eslint-disable-line no-unused-expressions
          card.classList.add('visible');
          visible++;
        } else {
          card.style.display = 'none';
          card.classList.remove('visible');
        }
      });

      const noResults = document.getElementById('markets-no-results');
      if (noResults) noResults.hidden = visible > 0;

      if (marketsGrid) {
        marketsGrid.setAttribute(
          'aria-label',
          `Lista de mercados — ${visible} resultado${visible !== 1 ? 's' : ''}`
        );
      }
    });
  });

  /* ============================================================
     VOLVER ARRIBA — aparece/desaparece con animación CSS
  ============================================================ */
  const backBtn = document.getElementById('back-to-top');

  if (backBtn) {
    const toggleBackBtn = () => {
      backBtn.classList.toggle('visible', window.scrollY > 400);
    };
    window.addEventListener('scroll', toggleBackBtn, { passive: true });
    toggleBackBtn();
  }

  /* ============================================================
     FORMULARIO DE PRODUCTOR — Validación, feedback inline y
     microinteracción de envío (loading → confirmación)
     H9: mensajes de error comprensibles y recuperables
  ============================================================ */
  const form = document.querySelector('.join-form');

  if (form) {
    const fields = {
      'prod-nombre': 'Por favor, indica el nombre de tu explotación.',
      'prod-email':  'Por favor, introduce un correo electrónico válido.'
    };

    const showError = (id, message) => {
      const input = document.getElementById(id);
      if (!input) return;
      input.setAttribute('aria-invalid', 'true');
      let errorEl = document.getElementById(`${id}-error`);
      if (!errorEl) {
        errorEl = document.createElement('span');
        errorEl.id = `${id}-error`;
        errorEl.setAttribute('role', 'alert');
        errorEl.style.cssText = 'font-size:0.8rem; color:#ffb3b3; margin-top:2px; display:block;';
        input.insertAdjacentElement('afterend', errorEl);
      }
      errorEl.textContent = message;
      // Microinteracción: shake del campo con error
      input.style.animation = 'none';
      input.offsetHeight; // reflow
      input.style.animation = 'field-shake 0.35s ease';
    };

    const clearError = id => {
      const input = document.getElementById(id);
      if (input) {
        input.removeAttribute('aria-invalid');
        input.style.animation = '';
      }
      const errorEl = document.getElementById(`${id}-error`);
      if (errorEl) errorEl.textContent = '';
    };

    // Añadir animación shake al CSS dinámicamente (solo una vez)
    if (!document.getElementById('shake-style')) {
      const style = document.createElement('style');
      style.id = 'shake-style';
      style.textContent = `
        @keyframes field-shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-6px); }
          40%      { transform: translateX(6px); }
          60%      { transform: translateX(-4px); }
          80%      { transform: translateX(4px); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes field-shake { 0%,100% { transform: none; } }
        }
      `;
      document.head.appendChild(style);
    }

    Object.keys(fields).forEach(id => {
      const input = document.getElementById(id);
      if (input) {
        input.addEventListener('input', () => clearError(id));
        // Validación en blur para feedback temprano (H9)
        input.addEventListener('blur', () => {
          const val = input.value.trim();
          if (id === 'prod-email' && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
            showError(id, fields[id]);
          }
        });
      }
    });

    form.addEventListener('submit', e => {
      e.preventDefault();

      const nombre = document.getElementById('prod-nombre').value.trim();
      const email  = document.getElementById('prod-email').value.trim();
      let hasError = false;

      if (!nombre) {
        showError('prod-nombre', fields['prod-nombre']);
        hasError = true;
      } else {
        clearError('prod-nombre');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        showError('prod-email', fields['prod-email']);
        hasError = true;
      } else {
        clearError('prod-email');
      }

      if (hasError) {
        // Hacer scroll al primer error
        const firstError = form.querySelector('[aria-invalid="true"]');
        if (firstError) firstError.focus();
        return;
      }

      // Microinteracción de carga: botón spinning
      const submitBtn = form.querySelector('[type="submit"]');
      if (submitBtn) {
        submitBtn.classList.add('loading');
        submitBtn.textContent = 'Enviando…';
      }

      // Simular latencia de red (500ms) antes de mostrar confirmación
      setTimeout(() => {
        const confirmHTML = `
          <div tabindex="-1" style="text-align:center; padding: 2.5rem 1rem; color:#fff; animation: hero-fadein 0.5s ease both;">
            <div style="font-size:3.5rem; margin-bottom:1rem; animation: check-pop 0.5s ease 0.1s both;">✅</div>
            <h3 style="font-family:'Playfair Display',Georgia,serif; font-size:1.5rem; margin-bottom:0.75rem;">
              ¡Solicitud enviada!
            </h3>
            <p style="opacity:0.9; line-height:1.6; max-width:400px; margin:0 auto;">
              Hemos recibido tu solicitud, <strong>${escapeHTML(nombre)}</strong>.
              Nos pondremos en contacto contigo en
              <strong>ecomercado@ugr.es</strong> en menos de 48 horas.
            </p>
          </div>
        `;
        // Inyectar keyframes para animación del check (solo una vez)
        if (!document.getElementById('confirm-style')) {
          const st = document.createElement('style');
          st.id = 'confirm-style';
          st.textContent = `
            @keyframes check-pop {
              from { transform: scale(0.5); opacity:0; }
              70%  { transform: scale(1.2); opacity:1; }
              to   { transform: scale(1);   opacity:1; }
            }
          `;
          document.head.appendChild(st);
        }
        form.innerHTML = confirmHTML;
        const confirmDiv = form.querySelector('[tabindex="-1"]');
        if (confirmDiv) confirmDiv.focus();
      }, 500);
    });
  }

  /* ============================================================
     GALERÍA — Lightbox accesible sin dependencias
  ============================================================ */
  const galleryItems = document.querySelectorAll('.gallery-item');

  if (galleryItems.length > 0) {
    // Inyectar estilos del lightbox en <head> para evitar conflictos con inline styles
    if (!document.getElementById('lightbox-style')) {
      const ls = document.createElement('style');
      ls.id = 'lightbox-style';
      ls.textContent = `
        .lightbox-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0);
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
          cursor: zoom-out;
          transition: background 250ms ease;
        }
        .lightbox-overlay.is-open {
          display: flex;
        }
        .lightbox-img {
          max-width: 90vw;
          max-height: 90vh;
          border-radius: 8px;
          object-fit: contain;
          transform: scale(0.9);
          opacity: 0;
          transition: transform 250ms ease, opacity 250ms ease;
          cursor: default;
        }
        .lightbox-overlay.is-open .lightbox-img {
          transform: scale(1);
          opacity: 1;
        }
        .lightbox-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: rgba(255,255,255,0.15);
          border: none;
          color: #fff;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          font-size: 1.2rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 200ms ease, transform 200ms ease;
        }
        .lightbox-close:hover {
          background: rgba(255,255,255,0.3);
          transform: scale(1.1);
        }
        .lightbox-close:focus-visible {
          outline: 3px solid #fff;
          outline-offset: 2px;
        }
      `;
      document.head.appendChild(ls);
    }

    const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Imagen ampliada');

    const overlayImg = document.createElement('img');
    overlayImg.className = 'lightbox-img';
    overlayImg.alt = '';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'lightbox-close';
    closeBtn.textContent = '✕';
    closeBtn.setAttribute('aria-label', 'Cerrar imagen ampliada');

    overlay.appendChild(overlayImg);
    overlay.appendChild(closeBtn);
    document.body.appendChild(overlay);

    // Guardar el elemento que abrió el lightbox para restaurar el foco al cerrar
    let lastFocused = null;

    const openOverlay = (src, alt, trigger) => {
      lastFocused = trigger || null;
      overlayImg.src = src;
      overlayImg.alt = alt;
      overlay.classList.add('is-open');
      // doble rAF para que la transición CSS dispare tras el display:flex
      requestAnimationFrame(() => requestAnimationFrame(() => {
        overlay.style.background = 'rgba(0,0,0,0.88)';
      }));
      closeBtn.focus();
      document.body.style.overflow = 'hidden';
    };

    const closeOverlay = () => {
      overlay.style.background = 'rgba(0,0,0,0)';
      setTimeout(() => {
        overlay.classList.remove('is-open');
        overlay.style.background = '';
        document.body.style.overflow = '';
        if (lastFocused) lastFocused.focus();
      }, 250);
    };

    galleryItems.forEach(item => {
      const img = item.querySelector('img');
      if (!img) return;

      item.setAttribute('tabindex', '0');
      item.setAttribute('role', 'button');
      item.setAttribute('aria-label', `Ampliar: ${img.alt}`);

      item.addEventListener('click', () => openOverlay(img.src, img.alt, item));
      item.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openOverlay(img.src, img.alt, item);
        }
      });
    });

    closeBtn.addEventListener('click', closeOverlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeOverlay(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeOverlay();
    });
  }

  /* ============================================================
     UTILIDAD — Escapar HTML para evitar XSS
  ============================================================ */
  function escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  
  /* ============================================================
     BANNER DE COOKIES — Lógica de consentimiento
  ============================================================ */
  const cookieBanner = document.getElementById('cookie-banner');
  const btnAccept = document.getElementById('btn-accept-cookies');
  const btnReject = document.getElementById('btn-reject-cookies');

  if (cookieBanner && btnAccept && btnReject) {
    // Comprobar si ya existe una preferencia guardada
    if (!localStorage.getItem('ecoCookiesAccepted')) {
      cookieBanner.hidden = false;
      // Pequeño retardo para permitir el reflow y que la animación CSS se ejecute
      setTimeout(() => cookieBanner.classList.add('visible'), 100);
    }

    const closeCookieBanner = (accepted) => {
      // Guardar la elección en el almacenamiento local
      localStorage.setItem('ecoCookiesAccepted', accepted);
      
      // Ocultar con animación
      cookieBanner.classList.remove('visible');
      
      // Añadir el atributo hidden después de que acabe la transición CSS (350ms)
      setTimeout(() => { 
        cookieBanner.hidden = true; 
      }, 350);
    };

    btnAccept.addEventListener('click', () => closeCookieBanner('true'));
    btnReject.addEventListener('click', () => closeCookieBanner('false'));
  }

});
