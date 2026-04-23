// ═══════════════════════════════════════════
// SHIELD App — Main JavaScript with Auth
// ═══════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {

  // ── Check Authentication Status ──
  updateUIForAuthState();

  // ── Preloader ──
  const preloader = document.getElementById('preloader');
  setTimeout(() => { if (preloader) preloader.classList.add('hidden'); }, 1800);

  // ── Toast System ──
  function showToast(msg, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.add('out'); setTimeout(() => toast.remove(), 300); }, 3500);
  }

  // ── Update UI based on auth state ──
  function updateUIForAuthState() {
    const isLoggedIn = ShieldAuth.isLoggedIn();
    const user = ShieldAuth.getUser();

    // Update nav buttons
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');

    if (isLoggedIn && user) {
      if (authButtons) authButtons.style.display = 'none';
      if (userMenu) {
        userMenu.style.display = 'flex';
        document.getElementById('userName').textContent = user.name;
        document.getElementById('userPlan').textContent = user.plan.toUpperCase();
      }
    } else {
      if (authButtons) authButtons.style.display = 'flex';
      if (userMenu) userMenu.style.display = 'none';
    }
  }

  // ── Navbar scroll effect ──
  const navbar = document.getElementById('navbar');
  const scrollTopBtn = document.getElementById('scrollTopBtn');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
    if (scrollTopBtn) scrollTopBtn.classList.toggle('visible', window.scrollY > 600);
  });

  // ── Scroll to Top ──
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ── Mobile hamburger + overlay menu ──
  const hamburger = document.getElementById('hamburgerBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.contains('open');
      mobileMenu.classList.toggle('open', !isOpen);
      hamburger.classList.toggle('active', !isOpen);
    });
    mobileMenu.querySelectorAll('.mobile-link').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        hamburger.classList.remove('active');
      });
    });
  }

  // ── FAQ Accordion ──
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      const wasActive = item.classList.contains('active');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
      if (!wasActive) item.classList.add('active');
    });
  });

  // ── Scroll-reveal animations ──
  const observerOptions = { threshold: 0.15, rootMargin: '0px 0px -40px 0px' };
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        revealObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.feature-card, .step, .testimonial-card, .pricing-card, .team-card, .faq-item').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = `all 0.6s ease ${i * 0.08}s`;
    revealObserver.observe(el);
  });

  // ═══════════════════════════════════════════
  // AUTH MODALS
  // ═══════════════════════════════════════════

  const loginModal = document.getElementById('loginModal');
  const registerModal = document.getElementById('registerModal');

  // ── Open Login Modal ──
  window.openLoginModal = function() {
    loginModal.style.display = 'flex';
  };

  // ── Open Register Modal ──
  window.openRegisterModal = function() {
    registerModal.style.display = 'flex';
  };

  // ── Close Modals ──
  window.closeLoginModal = function() {
    loginModal.style.display = 'none';
  };

  window.closeRegisterModal = function() {
    registerModal.style.display = 'none';
  };

  // ── Switch between modals ──
  window.switchToRegister = function() {
    closeLoginModal();
    openRegisterModal();
  };

  window.switchToLogin = function() {
    closeRegisterModal();
    openLoginModal();
  };

  // ── Handle Login Form ──
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      
      submitBtn.disabled = true;
      submitBtn.textContent = 'Logging in...';

      const result = await ShieldAuth.login(email, password);

      if (result.success) {
        showToast('🛡️ Welcome back! SHIELD is active.', 'success');
        closeLoginModal();
        updateUIForAuthState();
        loginForm.reset();
      } else {
        showToast(result.message || 'Login failed', 'error');
      }

      submitBtn.disabled = false;
      submitBtn.textContent = 'Login';
    });
  }

  // ── Handle Register Form ──
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('registerName').value;
      const email = document.getElementById('registerEmail').value;
      const phone = document.getElementById('registerPhone').value;
      const password = document.getElementById('registerPassword').value;
      const confirmPassword = document.getElementById('registerConfirmPassword').value;
      const submitBtn = registerForm.querySelector('button[type="submit"]');

      if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating account...';

      const result = await ShieldAuth.register(name, email, phone, password);

      if (result.success) {
        showToast('🛡️ Welcome to SHIELD! Your account is protected.', 'success');
        closeRegisterModal();
        updateUIForAuthState();
        registerForm.reset();
      } else {
        showToast(result.message || 'Registration failed', 'error');
      }

      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Account';
    });
  }

  // ── Logout ──
  window.handleLogout = function() {
    if (confirm('Are you sure you want to logout?')) {
      ShieldAuth.logout();
      showToast('Logged out successfully', 'info');
      updateUIForAuthState();
    }
  };

  // ═══════════════════════════════════════════
  // SOS DEMO BUTTON
  // ═══════════════════════════════════════════

  const sosBtn = document.getElementById('sosDemoBtn');
  const sosOverlay = document.getElementById('sosOverlay');
  const sosDismiss = document.getElementById('sosDismissBtn');
  const siren = document.getElementById('sirenSound');

  if (sosBtn && sosOverlay) {
    sosBtn.addEventListener('click', async () => {
      if (!ShieldAuth.isLoggedIn()) {
        showToast('Please login to use SOS features', 'warning');
        openLoginModal();
        return;
      }

      sosBtn.style.background = 'radial-gradient(circle, #ff1744, #b71c1c)';
      sosBtn.textContent = '🚨';
      sosBtn.style.transform = 'scale(1.15)';

      if (siren) {
        siren.loop = true;
        siren.play();
      }
  
      setTimeout(() => {
        sosOverlay.classList.add('active');
        showToast('🚨 SOS Demo Activated', 'warning');
      }, 400);
      
      setTimeout(() => {
        sosOverlay.classList.add('active');
        showToast('🚨 SOS Demo Activated', 'warning');
      }, 400);

      // In real app, trigger actual SOS
      // await ShieldAuth.apiCall('/sos/trigger', {
      //   method: 'POST',
      //   body: JSON.stringify({ triggerMethod: 'manual' })
      // });
    });
  }

  if (sosDismiss && sosOverlay) {
    sosDismiss.addEventListener('click', () => {
      sosOverlay.classList.remove('active');
      if (sosBtn) {
        sosBtn.textContent = 'SOS';
        sosBtn.style.transform = 'scale(1)';
        sosBtn.style.background = 'radial-gradient(circle, #ff3d5a, #c62828)';
      }
      if (siren) {
      siren.pause();
      siren.currentTime = 0;
    }
      showToast('✅ SOS Demo dismissed', 'success');
    });
  }

  // ═══════════════════════════════════════════
  // PRICING BUTTONS
  // ═══════════════════════════════════════════

  document.querySelectorAll('.pricing-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const plan = this.dataset.plan;
      
      if (!ShieldAuth.isLoggedIn()) {
        showToast('Please login to upgrade your plan', 'warning');
        openRegisterModal();
        return;
      }

      if (plan === 'free') {
        showToast('You are already on the free plan', 'info');
        return;
      }

      // Redirect to payment page or open payment modal
      showToast(`Upgrading to ${plan.toUpperCase()} plan...`, 'info');
      
      // In real app, handle payment
      // window.location.href = `/payment?plan=${plan}`;
    });
  });

  // ═══════════════════════════════════════════
  // CTA BUTTONS
  // ═══════════════════════════════════════════

  document.querySelectorAll('.cta-btn, .btn-primary').forEach(btn => {
    if (!btn.classList.contains('pricing-btn')) {
      btn.addEventListener('click', function(e) {
        if (this.textContent.includes('Get Started') || this.textContent.includes('Download')) {
          e.preventDefault();
          
          if (!ShieldAuth.isLoggedIn()) {
            openRegisterModal();
          } else {
            showToast('SHIELD app coming soon to Play Store & App Store!', 'info');
          }
        }
      });
    }
  });

  // ═══════════════════════════════════════════
  // SHIELD AI CHATBOT ASSISTANT
  // ═══════════════════════════════════════════

  const chatFab = document.getElementById('chatFab');
  const chatbot = document.getElementById('chatbot');
  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const chatSend = document.getElementById('chatSend');
  const chatCloseBtn = document.getElementById('chatCloseBtn');
  let chatOpen = false;
  let firstOpen = true;

  function toggleChat(open) {
    chatOpen = typeof open === 'boolean' ? open : !chatOpen;
    chatbot.classList.toggle('open', chatOpen);
    chatFab.textContent = chatOpen ? '✕' : '💬';
    if (firstOpen && chatOpen) { firstOpen = false; showWelcome(); }
    if (chatOpen) chatInput.focus();
  }

  chatFab.addEventListener('click', () => toggleChat());
  if (chatCloseBtn) chatCloseBtn.addEventListener('click', () => toggleChat(false));

  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && chatInput.value.trim()) sendUserMessage();
  });
  chatSend.addEventListener('click', () => {
    if (chatInput.value.trim()) sendUserMessage();
  });

  function showWelcome() {
    const user = ShieldAuth.getUser();
    const greeting = user ? `Hello ${user.name}!` : 'Hello!';
    
    addBotMessage(`🛡️ ${greeting} I'm <strong>SHIELD AI</strong> — your personal safety assistant. I'm here to keep you safe, help you set up your emergency features, and answer any questions you have.`);
    setTimeout(() => {
      addBotMessage("How can I help you today?");
      addQuickReplies(["How does SOS work?", "Set up contacts", "Pricing plans", "Safety tips"]);
    }, 800);
  }

  async function sendUserMessage() {
    const text = chatInput.value.trim();
    chatInput.value = '';
    addUserMessage(text);
    showTyping();

    // If logged in, use API
    if (ShieldAuth.isLoggedIn()) {
      const response = await ShieldAuth.apiCall('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message: text })
      });

      removeTyping();
      
      if (response.success) {
        addBotMessage(response.response.text);
        if (response.response.quickReplies) {
          setTimeout(() => addQuickReplies(response.response.quickReplies), 300);
        }
      } else {
        addBotMessage("I'm having trouble connecting. Please try again.");
      }
    } else {
      // Offline mode with basic responses
      setTimeout(() => {
        removeTyping();
        const response = getOfflineResponse(text);
        addBotMessage(response.msg);
        if (response.quickReplies) {
          setTimeout(() => addQuickReplies(response.quickReplies), 300);
        }
      }, 800);
    }
  }

  function addUserMessage(text) {
    const div = document.createElement('div');
    div.className = 'chat-msg user';
    div.textContent = text;
    chatMessages.appendChild(div);
    scrollChat();
  }

  function addBotMessage(html) {
    const div = document.createElement('div');
    div.className = 'chat-msg bot';
    div.innerHTML = html;
    chatMessages.appendChild(div);
    scrollChat();
  }

  function addQuickReplies(replies) {
    const container = document.createElement('div');
    container.className = 'quick-replies';
    replies.forEach(r => {
      const btn = document.createElement('button');
      btn.className = 'quick-reply';
      btn.textContent = r;
      btn.addEventListener('click', () => {
        container.remove();
        chatInput.value = r;
        sendUserMessage();
      });
      container.appendChild(btn);
    });
    chatMessages.appendChild(container);
    scrollChat();
  }

  function showTyping() {
    const div = document.createElement('div');
    div.className = 'chat-msg bot';
    div.id = 'typingIndicator';
    div.innerHTML = '<span class="typing-dots"><span></span><span></span><span></span></span>';
    chatMessages.appendChild(div);
    scrollChat();
  }

  function removeTyping() {
    const el = document.getElementById('typingIndicator');
    if (el) el.remove();
  }

  function scrollChat() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // ── Offline AI Response (basic) ──
  function getOfflineResponse(input) {
    const q = input.toLowerCase();

    if (q.includes('sos') || q.includes('trigger')) {
      return {
        msg: "🆘 <strong>SOS Trigger</strong><br>SHIELD's SOS can be activated by shaking your phone 3 times, saying 'SHIELD HELP', or tapping the SOS button. Please <strong>login</strong> to access full features.",
        quickReplies: ["Login", "Register", "Pricing"]
      };
    }

    if (q.includes('price') || q.includes('plan')) {
      return {
        msg: "💰 <strong>Pricing</strong><br>Free: ₹0 (2 contacts)<br>Premium: ₹99/mo (5 contacts + evidence recording)<br>Family: ₹199/mo (5 members)",
        quickReplies: ["Register", "Features", "Login"]
      };
    }

    return {
      msg: "I'd love to help! Please <strong>login</strong> to access the full AI assistant with emergency detection, safety tips, and personalized guidance.",
      quickReplies: ["Login", "Register", "Learn more"]
    };
  }

  // ── Smooth counter animation for stats ──
  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateStats();
        statObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  const statsSection = document.querySelector('.hero-stats');
  if (statsSection) statObserver.observe(statsSection);

  function animateStats() {
    const counters = [
      { el: document.querySelectorAll('.stat h3')[0], target: 50, suffix: 'K+' },
      { el: document.querySelectorAll('.stat h3')[1], target: 12, suffix: 'K+' },
      { el: document.querySelectorAll('.stat h3')[2], target: 99.9, suffix: '%', decimal: true }
    ];
    counters.forEach(({ el, target, suffix, decimal }) => {
      if (!el) return;
      let current = 0;
      const step = target / 40;
      const timer = setInterval(() => {
        current += step;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        el.textContent = (decimal ? current.toFixed(1) : Math.floor(current)) + suffix;
      }, 40);
    });
  }

});
