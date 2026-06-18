(function () {
  'use strict';

  /* ===============================
     Preloader
     =============================== */
  const preloader = document.querySelector('.preloader');
  if (preloader) {
    window.addEventListener('load', function () {
      setTimeout(function () {
        preloader.classList.add('hidden');
        document.body.style.overflow = '';
      }, 600);
    });
  }

  /* ===============================
     Custom Cursor
     =============================== */
  const cursorDot = document.querySelector('.cursor-dot');
  const cursorRing = document.querySelector('.cursor-ring');

  if (cursorDot && cursorRing) {
    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;

    document.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorDot.style.left = mouseX + 'px';
      cursorDot.style.top = mouseY + 'px';
    });

    function animateCursor() {
      ringX += (mouseX - ringX) * 0.12;
      ringY += (mouseY - ringY) * 0.12;
      cursorRing.style.left = ringX + 'px';
      cursorRing.style.top = ringY + 'px';
      requestAnimationFrame(animateCursor);
    }
    animateCursor();

    const hoverTargets = document.querySelectorAll(
      'a, button, .btn, .work-card, .lookbook-item, .signature-piece, .interactive, .form-input, .form-textarea, .nav-toggle, .back-to-top'
    );
    hoverTargets.forEach(function (el) {
      el.addEventListener('mouseenter', function () { cursorRing.classList.add('hovering'); });
      el.addEventListener('mouseleave', function () { cursorRing.classList.remove('hovering'); });
    });

    document.addEventListener('mouseleave', function () {
      cursorDot.style.opacity = '0';
      cursorRing.style.opacity = '0';
    });
    document.addEventListener('mouseenter', function () {
      cursorDot.style.opacity = '1';
      cursorRing.style.opacity = '1';
    });
  }

  /* ===============================
     Particles (Hero)
     =============================== */
  (function () {
    var container = document.querySelector('.hero-particles');
    if (!container) return;
    var count = 20;
    for (var i = 0; i < count; i++) {
      var p = document.createElement('div');
      p.className = 'hero-particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.top = (80 + Math.random() * 30) + '%';
      p.style.animationDelay = (Math.random() * 6) + 's';
      p.style.animationDuration = (4 + Math.random() * 4) + 's';
      p.style.width = p.style.height = (2 + Math.random() * 4) + 'px';
      container.appendChild(p);
    }
  }());

  /* ===============================
     Nav: Scroll Effects
     =============================== */
  (function () {
    var nav = document.querySelector('.nav');
    if (!nav) return;
    var lastScroll = 0;

    window.addEventListener('scroll', function () {
      var scrollY = window.scrollY;

      /* scrolled background */
      if (scrollY > 60) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }

      /* hide/show on scroll direction */
      if (scrollY > 200) {
        if (scrollY > lastScroll) {
          nav.classList.add('hidden');
        } else {
          nav.classList.remove('hidden');
        }
      } else {
        nav.classList.remove('hidden');
      }

      lastScroll = scrollY;
    }, { passive: true });
  }());

  /* ===============================
     Mobile Nav Toggle
     =============================== */
  (function () {
    var toggle = document.querySelector('.nav-toggle');
    var links = document.querySelector('.nav-links');
    if (!toggle || !links) return;

    toggle.addEventListener('click', function () {
      toggle.classList.toggle('active');
      links.classList.toggle('open');
      document.body.style.overflow = links.classList.contains('open') ? 'hidden' : '';
    });

    /* close on link click */
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        toggle.classList.remove('active');
        links.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }());

  /* ===============================
     Back to Top
     =============================== */
  (function () {
    var btn = document.querySelector('.back-to-top');
    if (!btn) return;

    window.addEventListener('scroll', function () {
      if (window.scrollY > 600) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    }, { passive: true });

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }());

  /* ===============================
     Scroll Reveal (Intersection Observer)
     =============================== */
  (function () {
    var reveals = document.querySelectorAll('.reveal');
    if (!reveals.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    reveals.forEach(function (el) { observer.observe(el); });
  }());

  /* ===============================
     Process Timeline Observer
     =============================== */
  (function () {
    var steps = document.querySelectorAll('.process-step');
    if (!steps.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.2 });

    steps.forEach(function (s) { observer.observe(s); });
  }());

  /* ===============================
     Lightbox (Lookbook Gallery)
     =============================== */
  (function () {
    var lightbox = document.querySelector('.lightbox');
    var closeBtn = document.querySelector('.lightbox-close');
    var container = document.querySelector('.lightbox-content');
    if (!lightbox || !closeBtn || !container) return;

    document.querySelectorAll('.lookbook-item').forEach(function (item) {
      item.addEventListener('click', function () {
        var svg = item.querySelector('svg');
        if (svg) {
          container.innerHTML = '';
          var clone = svg.cloneNode(true);
          clone.style.maxWidth = '90vw';
          clone.style.maxHeight = '90vh';
          container.appendChild(clone);
          lightbox.classList.add('open');
          document.body.style.overflow = 'hidden';
        }
      });
    });

    function closeLightbox() {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
    }

    closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeLightbox();
    });
  }());

  /* ===============================
     Smooth Scroll for Nav Links
     =============================== */
  (function () {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var target = document.querySelector(this.getAttribute('href'));
        if (target) {
          e.preventDefault();
          var offset = 80;
          var top = target.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top: top, behavior: 'smooth' });
        }
      });
    });
  }());

  /* ===============================
     Contact Form
     =============================== */
  (function () {
    var form = document.querySelector('.contact-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('.form-submit');
      var originalText = btn.innerHTML;
      btn.innerHTML = 'Sending...';
      btn.disabled = true;

      /* simulate send – replace with actual form action */
      setTimeout(function () {
        btn.innerHTML = 'Message Sent!';
        btn.style.background = '#00C853';
        btn.style.boxShadow = '0 4px 24px rgba(0, 200, 83, 0.3)';

        setTimeout(function () {
          btn.innerHTML = originalText;
          btn.style.background = '';
          btn.style.boxShadow = '';
          btn.disabled = false;
          form.reset();
        }, 3000);
      }, 1500);
    });
  }());

  /* ===============================
     Gallery Images (SVG placeholders)
     =============================== */
  (function () {
    /* This generates inline SVG placeholder arts for dynamic elements
       that are not already hardcoded in the HTML */
    var containers = document.querySelectorAll('[data-svg-cap]');
    containers.forEach(function (el) {
      var type = el.getAttribute('data-svg-cap');
      var svg = createCapSVG(type);
      if (svg) el.appendChild(svg);
    });
  }());

  function createCapSVG(type) {
    var ns = 'http://www.w3.org/2000/svg';
    var bgId = 'bg' + (1 + Math.floor(Math.random() * 4));
    var gradientMap = { beanie: 'grad1', bucket: 'grad2', beret: 'grad3' };
    var g = gradientMap[type] || 'grad1';

    var defs =
      '<defs>' +
        '<linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">' +
          '<stop offset="0%" stop-color="#00D4FF"/>' +
          '<stop offset="100%" stop-color="#0066FF"/>' +
        '</linearGradient>' +
        '<linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">' +
          '<stop offset="0%" stop-color="#FF6B9D"/>' +
          '<stop offset="100%" stop-color="#C44AFF"/>' +
        '</linearGradient>' +
        '<linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">' +
          '<stop offset="0%" stop-color="#FFD700"/>' +
          '<stop offset="100%" stop-color="#FF6B35"/>' +
        '</linearGradient>' +
        '<linearGradient id="bg1" x1="0%" y1="0%" x2="100%" y2="100%">' +
          '<stop offset="0%" stop-color="#1A1A2E"/>' +
          '<stop offset="100%" stop-color="#16213E"/>' +
        '</linearGradient>' +
        '<linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%">' +
          '<stop offset="0%" stop-color="#2D1B2E"/>' +
          '<stop offset="100%" stop-color="#1A1A2E"/>' +
        '</linearGradient>' +
        '<linearGradient id="bg3" x1="0%" y1="0%" x2="100%" y2="100%">' +
          '<stop offset="0%" stop-color="#1B2D1B"/>' +
          '<stop offset="100%" stop-color="#1A1A2E"/>' +
        '</linearGradient>' +
        '<linearGradient id="bg4" x1="0%" y1="0%" x2="100%" y2="100%">' +
          '<stop offset="0%" stop-color="#2E2E1B"/>' +
          '<stop offset="100%" stop-color="#1A1A2E"/>' +
        '</linearGradient>' +
        '<pattern id="dots" patternUnits="userSpaceOnUse" width="12" height="12">' +
          '<circle cx="6" cy="6" r="1" fill="rgba(255,255,255,0.05)"/>' +
        '</pattern>' +
      '</defs>';

    var shapes = '';
    var bgShape = '<rect width="400" height="500" fill="url(#' + bgId + ')" rx="12"/>' +
                  '<rect width="400" height="500" fill="url(#dots)" rx="12"/>';

    switch (type) {
      case 'beanie':
        shapes = bgShape +
          '<ellipse cx="200" cy="320" rx="140" ry="120" fill="none" stroke="url(' + g + ')" stroke-width="3" opacity="0.3"/>' +
          '<path d="M60,280 Q60,120 200,100 Q340,120 340,280" fill="none" stroke="url(' + g + ')" stroke-width="4" opacity="0.8"/>' +
          '<path d="M80,260 L80,300 Q80,340 120,350" fill="none" stroke="url(' + g + ')" stroke-width="3" opacity="0.5"/>' +
          '<path d="M320,260 L320,300 Q320,340 280,350" fill="none" stroke="url(' + g + ')" stroke-width="3" opacity="0.5"/>' +
          '<ellipse cx="200" cy="280" rx="140" ry="40" fill="none" stroke="url(' + g + ')" stroke-width="5" opacity="0.9"/>' +
          '<ellipse cx="200" cy="280" rx="120" ry="30" fill="url(' + g + ')" opacity="0.15"/>' +
          '<circle cx="200" cy="240" r="60" fill="url(' + g + ')" opacity="0.08"/>' +
          '<circle cx="200" cy="100" r="18" fill="url(' + g + ')" opacity="0.6"/>' +
          '<path d="M200,82 L200,118 M182,100 L218,100" stroke="url(' + g + ')" stroke-width="2" opacity="0.6"/>' +
          '<circle cx="120" cy="120" r="4" fill="url(' + g + ')" opacity="0.4"/>' +
          '<circle cx="280" cy="120" r="4" fill="url(' + g + ')" opacity="0.4"/>' +
          '<path d="M60,280 Q60,380 200,420 Q340,380 340,280" fill="url(' + g + ')" opacity="0.05"/>';
        break;
      case 'bucket':
        shapes = bgShape +
          '<ellipse cx="200" cy="220" rx="160" ry="50" fill="none" stroke="url(' + g + ')" stroke-width="5" opacity="0.9"/>' +
          '<ellipse cx="200" cy="220" rx="140" ry="40" fill="url(' + g + ')" opacity="0.1"/>' +
          '<path d="M40,220 L80,350 Q200,380 320,350 L360,220" fill="none" stroke="url(' + g + ')" stroke-width="4" opacity="0.8"/>' +
          '<path d="M80,350 Q200,390 320,350" fill="none" stroke="url(' + g + ')" stroke-width="3" opacity="0.5"/>' +
          '<path d="M60,280 Q200,320 340,280" fill="none" stroke="url(' + g + ')" stroke-width="2" opacity="0.3"/>' +
          '<ellipse cx="200" cy="200" rx="100" ry="25" fill="url(' + g + ')" opacity="0.06"/>' +
          '<circle cx="200" cy="130" r="50" fill="url(' + g + ')" opacity="0.08"/>' +
          '<path d="M160,130 L240,130 M200,90 L200,170" stroke="url(' + g + ')" stroke-width="2" opacity="0.4"/>' +
          '<circle cx="150" cy="160" r="3" fill="url(' + g + ')" opacity="0.6"/>' +
          '<circle cx="250" cy="160" r="3" fill="url(' + g + ')" opacity="0.6"/>';
        break;
      case 'beret':
        shapes = bgShape +
          '<ellipse cx="200" cy="220" rx="170" ry="80" fill="none" stroke="url(' + g + ')" stroke-width="4" opacity="0.8"/>' +
          '<ellipse cx="200" cy="220" rx="150" ry="65" fill="url(' + g + ')" opacity="0.08"/>' +
          '<ellipse cx="200" cy="220" rx="120" ry="50" fill="url(' + g + ')" opacity="0.06"/>' +
          '<path d="M30,220 Q200,140 370,220" fill="none" stroke="url(' + g + ')" stroke-width="5" opacity="0.9"/>' +
          '<path d="M50,200 Q200,120 350,200" fill="none" stroke="url(' + g + ')" stroke-width="2" opacity="0.3"/>' +
          '<ellipse cx="200" cy="300" rx="100" ry="20" fill="url(' + g + ')" opacity="0.1"/>' +
          '<circle cx="200" cy="150" r="6" fill="url(' + g + ')" opacity="0.8"/>' +
          '<path d="M200,144 L200,156" stroke="url(' + g + ')" stroke-width="2" opacity="0.6"/>';
        break;
      default:
        shapes = bgShape +
          '<path d="M60,250 Q60,100 200,80 Q340,100 340,250 Z" fill="none" stroke="url(' + g + ')" stroke-width="4" opacity="0.8"/>' +
          '<path d="M80,230 L80,260 Q80,300 120,310" fill="none" stroke="url(' + g + ')" stroke-width="3" opacity="0.5"/>' +
          '<path d="M320,230 L320,260 Q320,300 280,310" fill="none" stroke="url(' + g + ')" stroke-width="3" opacity="0.5"/>' +
          '<path d="M60,250 Q200,300 340,250" fill="none" stroke="url(' + g + ')" stroke-width="5" opacity="0.9"/>' +
          '<ellipse cx="200" cy="250" rx="140" ry="35" fill="url(' + g + ')" opacity="0.1"/>' +
          '<circle cx="200" cy="200" r="70" fill="url(' + g + ')" opacity="0.06"/>' +
          '<circle cx="200" cy="210" r="40" fill="url(' + g + ')" opacity="0.08"/>' +
          '<path d="M160,80 Q200,50 240,80" fill="none" stroke="url(' + g + ')" stroke-width="2" opacity="0.4"/>' +
          '<circle cx="130" cy="100" r="4" fill="url(' + g + ')" opacity="0.5"/>' +
          '<circle cx="270" cy="100" r="4" fill="url(' + g + ')" opacity="0.5"/>' +
          '<path d="M200,80 L200,60" stroke="url(' + g + ')" stroke-width="2" opacity="0.3"/>' +
          '<circle cx="200" cy="56" r="8" fill="url(' + g + ')" opacity="0.6"/>' +
          '<circle cx="200" cy="56" r="3" fill="#fff" opacity="0.3"/>';
        break;
    }

    var full = '<svg xmlns="' + ns + '" viewBox="0 0 400 500" preserveAspectRatio="xMidYMid meet">' +
                defs + shapes + '</svg>';
    var parser = new DOMParser();
    var doc = parser.parseFromString(full, 'image/svg+xml');
    return doc.documentElement;
  }

  /* ===============================
     Parallax Effect (Hero)
     =============================== */
  (function () {
    var hero = document.querySelector('.hero');
    if (!hero) return;
    window.addEventListener('scroll', function () {
      var scrollY = window.scrollY;
      var bg = hero.querySelector('.hero-bg');
      if (bg && scrollY < window.innerHeight) {
        bg.style.transform = 'translateY(' + (scrollY * 0.3) + 'px)';
      }
    }, { passive: true });
  }());

  /* ===============================
     Responsive Lookbook SVG Generators
     =============================== */
  (function () {
    document.querySelectorAll('.lookbook-item[data-lookbook-type]').forEach(function (el) {
      var type = el.getAttribute('data-lookbook-type');
      var svg = createCapSVG(type);
      if (svg) {
        svg.classList.add('lookbook-item-image');
        el.insertBefore(svg, el.firstChild);
      }
    });

    document.querySelectorAll('.signature-piece[data-signature-type]').forEach(function (el) {
      var type = el.getAttribute('data-signature-type');
      var imgContainer = el.querySelector('.signature-piece-image');
      if (imgContainer) {
        var svg = createCapSVG(type);
        if (svg) imgContainer.appendChild(svg);
      }
    });
  }());

}());
