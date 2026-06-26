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
     Custom Cursor + Trail
     =============================== */
  const cursorDot = document.querySelector('.cursor-dot');
  const cursorRing = document.querySelector('.cursor-ring');
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  if (cursorDot && cursorRing && !isTouch) {
    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;

    /* trail: create trailing dots */
    var trail = [];
    var trailCount = 5;
    var trailContainer = document.createElement('div');
    trailContainer.className = 'cursor-trail';
    trailContainer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(trailContainer);

    for (var t = 0; t < trailCount; t++) {
      var dot = document.createElement('div');
      dot.className = 'cursor-trail-dot';
      dot.style.cssText = 'position:fixed;width:4px;height:4px;background:var(--color-accent,gold);border-radius:50%;pointer-events:none;z-index:9998;opacity:' + (0.5 - t * 0.08) + ';transform:translate(-50%,-50%);transition:opacity 0.3s';
      trailContainer.appendChild(dot);
      trail.push({ el: dot, x: 0, y: 0 });
    }

    document.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorDot.style.left = mouseX + 'px';
      cursorDot.style.top = mouseY + 'px';
    });

    /* click burst effect */
    document.addEventListener('mousedown', function (e) {
      var burstCount = 8;
      var burstColor = '#FFD700';
      for (var b = 0; b < burstCount; b++) {
        var spark = document.createElement('div');
        var angle = (b / burstCount) * 2 * Math.PI;
        var dist = 20 + Math.random() * 20;
        spark.style.cssText = 'position:fixed;width:' + (2 + Math.random() * 3) + 'px;height:' + (2 + Math.random() * 3) + 'px;background:' + burstColor + ';border-radius:50%;pointer-events:none;z-index:9997;left:' + e.clientX + 'px;top:' + e.clientY + 'px;transform:translate(-50%,-50%)';
        document.body.appendChild(spark);
        var start = performance.now();
        (function (el, angle, dist) {
          function animateBurst(now) {
            var elapsed = now - start;
            var progress = elapsed / 400;
            if (progress >= 1) { el.remove(); return; }
            var x = e.clientX + Math.cos(angle) * dist * (1 - Math.pow(1 - progress, 2));
            var y = e.clientY + Math.sin(angle) * dist * (1 - Math.pow(1 - progress, 2));
            el.style.left = x + 'px';
            el.style.top = y + 'px';
            el.style.opacity = 1 - progress;
            requestAnimationFrame(animateBurst);
          }
          requestAnimationFrame(animateBurst);
        })(spark, angle, dist);
      }
    });

    function animateCursor() {
      ringX += (mouseX - ringX) * 0.12;
      ringY += (mouseY - ringY) * 0.12;
      cursorRing.style.left = ringX + 'px';
      cursorRing.style.top = ringY + 'px';

      /* trail follows with increasing delay */
      for (var i = 0; i < trailCount; i++) {
        var prevX = i === 0 ? mouseX : trail[i - 1].x;
        var prevY = i === 0 ? mouseY : trail[i - 1].y;
        trail[i].x += (prevX - trail[i].x) * (0.15 - i * 0.02);
        trail[i].y += (prevY - trail[i].y) * (0.15 - i * 0.02);
        trail[i].el.style.left = trail[i].x + 'px';
        trail[i].el.style.top = trail[i].y + 'px';
      }

      requestAnimationFrame(animateCursor);
    }
    animateCursor();

    const hoverTargets = document.querySelectorAll(
      'a, button, .btn, .work-card, .lookbook-item, .signature-piece, .interactive, .form-input, .form-textarea, .nav-toggle, .back-to-top'
    );
    hoverTargets.forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        cursorRing.classList.add('hovering');
        trail.forEach(function (d) { d.el.style.opacity = '0.8'; });
      });
      el.addEventListener('mouseleave', function () {
        cursorRing.classList.remove('hovering');
        trail.forEach(function (d) {
          /* restore original opacity based on index */
          var idx = Array.prototype.indexOf.call(trail, d);
          d.el.style.opacity = 0.5 - idx * 0.08;
        });
      });
    });

    document.addEventListener('mouseleave', function () {
      cursorDot.style.opacity = '0';
      cursorRing.style.opacity = '0';
      trail.forEach(function (d) { d.el.style.opacity = '0'; });
    });
    document.addEventListener('mouseenter', function () {
      cursorDot.style.opacity = '1';
      cursorRing.style.opacity = '1';
      trail.forEach(function (d) { d.el.style.opacity = 0.5 - Array.prototype.indexOf.call(trail, d) * 0.08; });
    });
  } else if (cursorDot && cursorRing) {
    cursorDot.style.display = 'none';
    cursorRing.style.display = 'none';
  }

  /* ===============================
     Mobile 100vh fix
     =============================== */
  (function () {
    function setVh() {
      var vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', vh + 'px');
    }
    setVh();
    window.addEventListener('resize', setVh);
  }());

  /* ===============================
     Particles (Hero)
     =============================== */
  (function () {
    var container = document.querySelector('.hero-particles');
    if (!container) return;
    var count = window.innerWidth < 768 ? 10 : 20;
    for (var i = 0; i < count; i++) {
      var p = document.createElement('div');
      p.className = 'hero-particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.top = (70 + Math.random() * 40) + '%';
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

      if (scrollY > 60) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }

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
     Scroll Reveal
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
     Lightbox
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
     Smooth Scroll
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
     Shipping + Paystack Payment (2-step)
     =============================== */
  (function () {
    var shippingModal = document.getElementById('shippingModal');
    var shippingCloseBtn = document.getElementById('shippingModalClose');
    var shippingForm = document.getElementById('shippingForm');
    var shippingProductEl = document.getElementById('shippingModalProduct');
    var shippingPriceEl = document.getElementById('shippingModalPrice');
    var shippingSubmitBtn = document.getElementById('shippingSubmitBtn');

    var paymentModal = document.getElementById('paymentModal');
    var paymentCloseBtn = document.getElementById('paymentModalClose');
    var paymentForm = document.getElementById('paymentForm');
    var paymentEmailInput = document.getElementById('payment-email');
    var paymentProductEl = document.getElementById('paymentModalProduct');
    var paymentPriceEl = document.getElementById('paymentModalPrice');
    var paymentSubmitBtn = document.getElementById('paymentSubmitBtn');

    var paymentSubmitPrice = document.getElementById('paymentSubmitPrice');

    var currentProduct = null;
    var currentShipping = null;

    var paymentStepShipping = document.getElementById('paymentStepShipping');

    if (!shippingModal || !shippingForm || !paymentModal || !paymentForm) return;

    function openShippingModal(product) {
      currentProduct = product;
      currentShipping = null;
      shippingProductEl.textContent = product.name;
      shippingPriceEl.textContent = 'KES ' + product.price.toLocaleString() + ' / $' + (product.price / 130).toFixed(0);
      shippingForm.reset();
      if (paymentStepShipping) paymentStepShipping.classList.remove('active');
      shippingModal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function closeShippingModal() {
      shippingModal.classList.remove('open');
      document.body.style.overflow = '';
    }

    function openPaymentModal() {
      paymentProductEl.textContent = currentProduct.name;
      paymentPriceEl.textContent = 'KES ' + currentProduct.price.toLocaleString() + ' / $' + (currentProduct.price / 130).toFixed(0);
      paymentEmailInput.value = currentShipping?.email || '';
      if (paymentSubmitPrice) paymentSubmitPrice.textContent = currentProduct.price.toLocaleString();
      if (paymentStepShipping) paymentStepShipping.classList.add('active');
      shippingModal.classList.remove('open');
      paymentModal.classList.add('open');
    }

    function closePaymentModal() {
      paymentModal.classList.remove('open');
      document.body.style.overflow = '';
    }

    document.querySelectorAll('.btn-buy').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        openShippingModal({
          id: btn.dataset.productId,
          name: btn.dataset.productName,
          price: parseInt(btn.dataset.price, 10),
        });
      });
    });

    shippingCloseBtn.addEventListener('click', closeShippingModal);
    shippingModal.addEventListener('click', function (e) {
      if (e.target === shippingModal || e.target.classList.contains('payment-modal-backdrop')) closeShippingModal();
    });

    paymentCloseBtn.addEventListener('click', closePaymentModal);
    paymentModal.addEventListener('click', function (e) {
      if (e.target === paymentModal || e.target.classList.contains('payment-modal-backdrop')) closePaymentModal();
    });

    shippingForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!currentProduct) return;

      var shipping = {
        name: document.getElementById('shipping-name').value.trim(),
        email: document.getElementById('shipping-email').value.trim(),
        phone: document.getElementById('shipping-phone').value.trim(),
        address: document.getElementById('shipping-address').value.trim(),
        city: document.getElementById('shipping-city').value.trim(),
        country: document.getElementById('shipping-country').value,
        postalCode: document.getElementById('shipping-postal').value.trim(),
        notes: document.getElementById('shipping-notes').value.trim(),
      };

      if (!shipping.name || !shipping.email || !shipping.phone || !shipping.address || !shipping.city) {
        alert('Please fill in all required fields.');
        return;
      }

      currentShipping = shipping;
      shippingSubmitBtn.disabled = true;
      var submitText = shippingSubmitBtn.querySelector('.shipping-submit-text');
      var submitArrow = shippingSubmitBtn.querySelector('.shipping-submit-arrow');
      if (submitText) submitText.textContent = 'Processing...';
      if (submitArrow) submitArrow.style.display = 'none';

      setTimeout(function () {
        shippingSubmitBtn.disabled = false;
        if (submitText) submitText.textContent = 'Continue to Payment';
        if (submitArrow) submitArrow.style.display = 'flex';
        openPaymentModal();
      }, 300);
    });

    paymentForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!currentProduct || !currentShipping) return;

      var email = paymentEmailInput.value.trim();
      if (!email) return;

      var payBtnText = paymentSubmitBtn.querySelector('.shipping-submit-text');
      var payBtnArrow = paymentSubmitBtn.querySelector('.shipping-submit-arrow');

      paymentSubmitBtn.disabled = true;
      if (payBtnText) payBtnText.textContent = 'Processing...';
      if (payBtnArrow) payBtnArrow.style.display = 'none';

      fetch('/api/initialize-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          amount: currentProduct.price,
          productId: currentProduct.id,
          productName: currentProduct.name,
        }),
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.status && data.data && data.data.authorization_url) {
            var reference = data.data.reference;
            fetch('/api/create-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                shipping: currentShipping,
                productId: currentProduct.id,
                productName: currentProduct.name,
                amount: currentProduct.price,
                currency: 'KES',
                paymentReference: reference,
              }),
            }).then(function () {
              window.location.href = data.data.authorization_url;
            });
          } else {
            alert('Payment could not be initiated. Please try again.');
            paymentSubmitBtn.disabled = false;
            if (payBtnText) payBtnText.textContent = 'Pay Now';
            if (payBtnArrow) payBtnArrow.style.display = 'flex';
          }
        })
        .catch(function () {
          alert('Connection error. Please try again.');
          paymentSubmitBtn.disabled = false;
          if (payBtnText) payBtnText.textContent = 'Pay Now';
          if (payBtnArrow) payBtnArrow.style.display = 'flex';
        });
    });
  }());

  /* ===============================
     Contact Form (Backend)
     =============================== */
  (function () {
    var form = document.querySelector('.contact-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('.form-submit');
      var data = {
        name: document.getElementById('contact-name')?.value || '',
        email: document.getElementById('contact-email')?.value || '',
        message: document.getElementById('contact-message')?.value || '',
      };

      btn.innerHTML = 'Sending...';
      btn.disabled = true;

      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
        .then(function (r) { return r.json(); })
        .then(function () {
          btn.innerHTML = 'Message Sent!';
          btn.style.background = '#FFD700';
          setTimeout(function () {
            btn.innerHTML = 'Send It <span class="btn-arrow">→</span>';
            btn.style.background = '';
            btn.disabled = false;
            form.reset();
          }, 3000);
        })
        .catch(function () {
          btn.innerHTML = 'Error! Try Again';
          setTimeout(function () {
            btn.innerHTML = 'Send It <span class="btn-arrow">→</span>';
            btn.disabled = false;
          }, 2000);
        });
    });
  }());

  /* ===============================
     Parallax (Hero)
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
     Smooth Scroll (Lenis)
     =============================== */
  if (typeof Lenis !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var lenis = new Lenis({
      duration: 0.6,
      easing: function (t) { return 1 - Math.pow(1 - t, 3); },
      orientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.2,
      touchMultiplier: 0.5,
      infinite: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

}());
