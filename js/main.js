(function () {
  'use strict';

  /* ===============================
     Preloader
     =============================== */
  const preloader = document.querySelector('.preloader');
  if (preloader) {
    function hidePreloader() {
      preloader.classList.add('hidden');
      document.body.style.overflow = '';
    }
    if (document.readyState === 'complete') {
      setTimeout(hidePreloader, 600);
    } else {
      window.addEventListener('load', function () {
        setTimeout(hidePreloader, 600);
      });
    }
    setTimeout(hidePreloader, 5000);
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
     Lightbox (Lookbook Gallery)
     =============================== */
  (function () {
    var lightbox = document.querySelector('.lightbox');
    var closeBtn = document.querySelector('.lightbox-close');
    var container = document.querySelector('.lightbox-content');
    if (!lightbox || !closeBtn || !container) return;

    document.querySelectorAll('.lookbook-item').forEach(function (item) {
      item.addEventListener('click', function () {
        var img = item.querySelector('img');
        if (img) {
          container.innerHTML = '';
          var clone = img.cloneNode(true);
          clone.style.maxWidth = '90vw';
          clone.style.maxHeight = '90vh';
          clone.style.objectFit = 'contain';
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

}());
