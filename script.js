(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---------- smooth scroll (Lenis) ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ duration: 1.15, easing: t => 1 - Math.pow(1 - t, 4), smoothWheel: true });
    const raf = time => { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

  const nav = $('#nav');
  const scrollToTarget = target => {
    const offset = target.id === 'inicio' ? 0 : -70;
    if (lenis) lenis.scrollTo(target, { offset });
    else window.scrollTo({ top: target.getBoundingClientRect().top + scrollY + offset, behavior: reduce ? 'auto' : 'smooth' });
  };

  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      const target = id.length > 1 && document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      scrollToTarget(target);
    });
  });

  /* ---------- mobile menu ---------- */
  const toggle = $('#navToggle');
  function closeMenu() {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    lenis && lenis.start();
  }
  toggle.addEventListener('click', () => {
    const open = !nav.classList.contains('is-open');
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    lenis && (open ? lenis.stop() : lenis.start());
  });

  /* ---------- scroll-driven UI ---------- */
  const wa = $('.wa-float');
  const parallaxEls = $$('.parallax');
  const sections = $$('main section[id]');
  const links = $$('.nav__links a');
  let lastY = 0, ticking = false;

  function onScroll() {
    const y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 40);
    if (!nav.classList.contains('is-open')) nav.classList.toggle('is-hidden', y > lastY && y > 500);
    wa.classList.toggle('is-visible', y > innerHeight * 0.6);
    lastY = y;

    if (!reduce) {
      parallaxEls.forEach(img => {
        const r = img.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        const p = Math.max(-1, Math.min(1, (r.top + r.height / 2 - innerHeight / 2) / innerHeight));
        // image is 118% tall, so it can travel between -15% and 0% without gaps
        img.style.transform = `translate3d(0, ${(-7.5 + p * 7).toFixed(2)}%, 0)`;
      });
    }

    let current = '';
    sections.forEach(s => { if (s.getBoundingClientRect().top < innerHeight * 0.4) current = s.id; });
    links.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === '#' + current));
    ticking = false;
  }
  window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  onScroll();

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(el => io.observe(el));
  // safety net: never leave above-the-fold content hidden
  setTimeout(() => $$('.hero .reveal').forEach(el => el.classList.add('is-in')), 1200);

  /* ---------- hero video: pause when off-screen ---------- */
  const video = $('.phone__video');
  if (video) {
    if (reduce) video.removeAttribute('autoplay'), video.pause();
    new IntersectionObserver(([en]) => {
      if (reduce) return;
      en.isIntersecting ? video.play().catch(() => {}) : video.pause();
    }).observe(video);
  }

  /* ---------- 3D tilt + magnetic buttons (pointer devices) ---------- */
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (fine && !reduce) {
    $$('.tilt').forEach(el => {
      const host = el.parentElement;
      host.addEventListener('mousemove', e => {
        const r = host.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 14}deg)`;
      });
      host.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
    $$('.magnetic').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }

  /* ---------- destinations prefill form ---------- */
  $$('.dest').forEach(d => d.addEventListener('click', () => {
    const v = d.dataset.dest;
    const input = $('#f-destino');
    input.value = v || '';
    setTimeout(() => (v ? $('#f-nome') : input).focus({ preventScroll: true }), 900);
  }));

  /* ---------- quote form -> WhatsApp ---------- */
  const form = $('#quoteForm');
  form.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    $$('input[required]', form).forEach(inp => {
      const bad = !inp.value.trim();
      inp.parentElement.classList.toggle('is-invalid', bad);
      if (bad && ok) { inp.focus(); ok = false; }
    });
    if (!ok) return;

    const f = new FormData(form);
    const data = f.get('data') ? new Date(f.get('data') + 'T12:00').toLocaleDateString('pt-BR') : 'a definir';
    const msg =
`Olá, Ara Vans! Vim pelo site e gostaria de um orçamento:

*Nome:* ${f.get('nome')}
*Tipo:* ${f.get('tipo')}
*Saída:* ${f.get('origem')}
*Destino:* ${f.get('destino')}
*Data:* ${data}
*Passageiros:* ${f.get('passageiros') || 'a definir'}`;
    window.open('https://api.whatsapp.com/send?phone=5548999999180&text=' + encodeURIComponent(msg), '_blank', 'noopener');
  });
  $$('input', form).forEach(inp => inp.addEventListener('input', () => inp.parentElement.classList.remove('is-invalid')));
})();
