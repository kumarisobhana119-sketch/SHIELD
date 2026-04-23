// ═══════════════════════════════════════════
// SHIELD App — Main JavaScript
// ═══════════════════════════════════════════

console.log("app.js loaded ✅");
document.addEventListener('DOMContentLoaded', () => {

  // ── Preloader ──
  const preloader = document.getElementById('preloader');
  setTimeout(() => { if (preloader) preloader.classList.add('hidden'); }, 1800);

  // ── Toast System ──
  function showToast(msg) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.add('out'); setTimeout(() => toast.remove(), 300); }, 3500);
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

  // ── SOS Demo Button → Cinematic Overlay ──
  const sosBtn = document.getElementById('sosDemoBtn');
  const sosOverlay = document.getElementById('sosOverlay');
  const sosDismiss = document.getElementById('sosDismissBtn');

  if (sosBtn && sosOverlay) {
    sosBtn.addEventListener('click', () => {
      sosBtn.style.background = 'radial-gradient(circle, #ff1744, #b71c1c)';
      sosBtn.textContent = '🚨';
      sosBtn.style.transform = 'scale(1.15)';
      setTimeout(() => {
        sosOverlay.classList.add('active');
        showToast('🚨 SOS Demo Activated — This is a demonstration');
      }, 400);
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
      showToast('✅ SOS Demo dismissed — You are safe!');
    });
  }

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
    addBotMessage("🛡️ Hello! I'm <strong>SHIELD AI</strong> — your personal safety assistant. I'm here to keep you safe, help you set up your emergency features, and answer any questions you have.");
    setTimeout(() => {
      addBotMessage("How can I help you today?");
      addQuickReplies(["How does SOS work?", "Set up contacts", "I'm in danger!", "Pricing plans"]);
    }, 800);
  }

  function sendUserMessage() {
    const text = chatInput.value.trim();
    chatInput.value = '';
    addUserMessage(text);
    showTyping();
    setTimeout(() => {
      removeTyping();
      const response = getResponse(text);
      addBotMessage(response.msg);
      if (response.quickReplies) {
        setTimeout(() => addQuickReplies(response.quickReplies), 300);
      }
    }, 800 + Math.random() * 600);
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

  // ── AI Response Engine ──
  function getResponse(input) {
    const q = input.toLowerCase();

    // DANGER / EMERGENCY (English + Hindi)
    if (q.includes('danger') || q.includes('help me') || q.includes('emergency') || q.includes('scared') || q.includes('attack') || q.includes('follow') || q.includes('unsafe') || q.includes('threat') || q.includes('afraid') || q.includes('someone is') || q.includes('i need help') || q.includes('please help') || q.includes('bachao') || q.includes('darr') || q.includes('khatara') || q.includes('madad') || q.includes('help karo') || q.includes('unsafe feel')) {
      return {
        msg: "🚨 <strong>SHIELD EMERGENCY MODE ACTIVATED</strong><br><br>" +
          "→ <strong>SHAKE YOUR PHONE 3 TIMES NOW</strong> to trigger SOS<br>" +
          "→ OR say: <strong>SHIELD HELP</strong> out loud<br>" +
          "→ <strong>CALL 112</strong> immediately (all emergencies)<br><br>" +
          "Your location will be sent to your trusted contacts automatically.<br><br>" +
          "📍 Move toward crowded, well-lit areas<br>" +
          "🏃 Keep moving — don't stop<br>" +
          "📱 Stay on call with someone you trust<br>" +
          "🔊 Activate loud alarm if needed<br><br>" +
          "<strong>I am here with you. You are not alone. Help is on the way.</strong> 🛡️<br><br>" +
          "📞 <strong>Emergency Numbers:</strong><br>• 112 — All emergencies<br>• 1091 — Women helpline<br>• 100 — Police<br>• 181 — Women helpline (state)<br>• 1098 — Child helpline",
        quickReplies: ["Call 112 now", "How does SOS work?", "I'm safe now"]
      };
    }

    // SOS TRIGGER
    if (q.includes('sos') || q.includes('trigger') || q.includes('shake') || q.includes('voice command') || q.includes('activate')) {
      return {
        msg: "🆘 <strong>Instant SOS Trigger</strong><br><br>" +
          "SHIELD's SOS can be activated in 3 ways:<br><br>" +
          "📱 <strong>Shake your phone</strong> — Just shake it vigorously 3 times<br>" +
          "🗣️ <strong>Voice command</strong> — Say \"SHIELD HELP\"<br>" +
          "👆 <strong>Quick tap</strong> — Tap the SOS button in the app<br><br>" +
          "The best part? <strong>No need to unlock your phone or open the app!</strong> It works from the lock screen.",
        quickReplies: ["What happens after SOS?", "Set up contacts", "Offline alerts"]
      };
    }

    // WHAT HAPPENS AFTER SOS
    if (q.includes('after sos') || q.includes('what happens')) {
      return {
        msg: "When SOS is triggered, SHIELD does <strong>5 things instantly</strong>:<br><br>" +
          "📍 Shares your <strong>live GPS location</strong> with trusted contacts<br>" +
          "📹 Starts <strong>audio & video recording</strong> in the background<br>" +
          "📱 Sends <strong>SMS alerts</strong> (works even offline!)<br>" +
          "🔊 Triggers a <strong>110dB loud alarm</strong> to attract attention<br>" +
          "🔄 Keeps <strong>updating your location</strong> every 10 seconds<br>" +
          "⏱️ If you don't respond in 10 minutes, alerts are <strong>re-sent automatically</strong><br><br>" +
          "All of this happens <strong>automatically</strong> — no extra steps needed.",
        quickReplies: ["Auto recording details", "Offline alerts", "Loud alarm"]
      };
    }

    // LOCATION TRACKING
    if (q.includes('location') || q.includes('gps') || q.includes('track')) {
      return {
        msg: "📍 <strong>Live Location Tracking</strong><br><br>" +
          "When SOS is activated, SHIELD shares your <strong>real-time GPS coordinates</strong> with your trusted contacts via:<br><br>" +
          "• SMS with Google Maps link<br>" +
          "• In-app live map view<br>" +
          "• Location updates every 30 seconds<br><br>" +
          "Your contacts can track your exact movement until you mark yourself as safe.",
        quickReplies: ["Set up contacts", "Offline alerts", "Auto recording"]
      };
    }

    // AUTO RECORDING
    if (q.includes('record') || q.includes('video') || q.includes('audio') || q.includes('evidence')) {
      return {
        msg: "🎥 <strong>Auto Evidence Recording</strong><br><br>" +
          "During an emergency, SHIELD automatically:<br><br>" +
          "• Starts <strong>video recording</strong> using the front/back camera<br>" +
          "• Captures <strong>continuous audio</strong><br>" +
          "• Saves everything to <strong>secure cloud storage</strong><br>" +
          "• Evidence is <strong>tamper-proof</strong> and timestamped<br><br>" +
          "This runs completely in the <strong>background</strong> — no user action needed. Available in the <strong>Pro plan</strong>.",
        quickReplies: ["Pricing plans", "How does SOS work?", "Offline alerts"]
      };
    }

    // OFFLINE ALERTS
    if (q.includes('offline') || q.includes('sms') || q.includes('no internet') || q.includes('signal')) {
      return {
        msg: "📶 <strong>Offline Alert System</strong><br><br>" +
          "No internet? No problem! SHIELD sends SOS alerts via <strong>SMS</strong> when you're offline:<br><br>" +
          "• Pre-composed emergency SMS sent instantly<br>" +
          "• Includes your <strong>last known GPS coordinates</strong><br>" +
          "• Works with <strong>basic cellular signal</strong><br>" +
          "• Falls back to SMS automatically if data is unavailable<br><br>" +
          "This feature is <strong>free</strong> for all users! 🆓",
        quickReplies: ["Set up contacts", "How does SOS work?", "Pricing plans"]
      };
    }

    // TRUSTED CONTACTS
    if (q.includes('contact') || q.includes('trusted') || q.includes('set up') || q.includes('setup') || q.includes('add people')) {
      return {
        msg: "👥 <strong>Setting Up Trusted Contacts</strong><br><br>" +
          "Here's how to add your emergency contacts:<br><br>" +
          "1️⃣ Open SHIELD app → <strong>Settings</strong><br>" +
          "2️⃣ Tap <strong>\"Trusted Contacts\"</strong><br>" +
          "3️⃣ Add names and phone numbers<br>" +
          "4️⃣ They'll receive a <strong>verification link</strong><br>" +
          "5️⃣ Once verified, they're ready to receive your SOS alerts!<br><br>" +
          "Free plan: <strong>3 contacts</strong> | Pro plan: <strong>Unlimited</strong>",
        quickReplies: ["Pricing plans", "What happens after SOS?", "Offline alerts"]
      };
    }

    // ALARM
    if (q.includes('alarm') || q.includes('loud') || q.includes('sound') || q.includes('siren')) {
      return {
        msg: "🔊 <strong>Loud Alarm System</strong><br><br>" +
          "When SOS is triggered, SHIELD can sound a <strong>loud alarm</strong> (up to max volume):<br><br>" +
          "• <strong>110 decibels</strong> — louder than a car horn<br>" +
          "• Designed to <strong>deter attackers</strong><br>" +
          "• Attracts <strong>attention from bystanders</strong><br>" +
          "• Deactivates only when you enter your <strong>PIN</strong><br>" +
          "• Works even in <strong>silent/vibrate mode</strong><br><br>" +
          "This feature is <strong>free</strong> for everyone!",
        quickReplies: ["How does SOS work?", "Set up contacts", "Pricing plans"]
      };
    }

    // PRICING
    if (q.includes('price') || q.includes('pricing') || q.includes('cost') || q.includes('plan') || q.includes('premium') || q.includes('free') || q.includes('pay')) {
      return {
        msg: "💰 <strong>SHIELD Pricing Plans</strong><br><br>" +
          "🆓 <strong>Free</strong> — ₹0 forever<br>" +
          "• SOS trigger (shake + voice + button)<br>• 2 trusted contacts<br>• Offline SMS alerts<br>• 110dB alarm<br>• Location sharing (30s updates)<br><br>" +
          "⭐ <strong>Premium</strong> — ₹99/month or ₹799/year<br>" +
          "• 5 contacts, 10s GPS updates (3× faster)<br>• Auto evidence recording + cloud storage<br>• Auto re-alert, route safety check<br>• Full AI assistant 24/7<br><br>" +
          "👨‍👩‍👧‍👦 <strong>Family</strong> — ₹199/month or ₹1499/year<br>" +
          "• 5 members, 10 contacts each<br>• Family dashboard + group SOS<br>• Child & senior safety modes<br>• Priority 24/7 support<br><br>" +
          "Core safety features are <strong>always free</strong>! 🛡️",
        quickReplies: ["What's in Free?", "What's in Premium?", "Upgrade help"]
      };
    }

    // SAFE NOW
    if (q.includes('safe') || q.includes('thank') || q.includes('okay now')) {
      return {
        msg: "💜 I'm so glad you're safe! Remember:<br><br>" +
          "• Keep SHIELD <strong>running in the background</strong> always<br>" +
          "• Make sure your <strong>trusted contacts are verified</strong><br>" +
          "• Test your SOS trigger periodically<br>" +
          "• <strong>You are strong</strong>, and SHIELD has your back 24/7<br><br>" +
          "Stay safe! Is there anything else I can help with? 🛡️",
        quickReplies: ["How does SOS work?", "Set up contacts", "Pricing plans"]
      };
    }

    // CALL 112 / EMERGENCY NUMBERS
    if (q.includes('112') || q.includes('call') || q.includes('police') || q.includes('helpline') || q.includes('number')) {
      return {
        msg: "📞 <strong>India Emergency Helpline Numbers</strong><br><br>" +
          "• <strong>112</strong> — All emergencies (Police + Ambulance + Fire)<br>" +
          "• <strong>100</strong> — Police direct<br>" +
          "• <strong>1091</strong> — Women helpline (national)<br>" +
          "• <strong>181</strong> — Women helpline (state level)<br>" +
          "• <strong>1098</strong> — Child helpline<br>" +
          "• <strong>102</strong> — Ambulance<br>" +
          "• <strong>101</strong> — Fire emergency<br>" +
          "• <strong>1930</strong> — Cyber crime helpline<br>" +
          "• <strong>14567</strong> — Senior citizen helpline<br><br>" +
          "SHIELD can <strong>auto-dial 112</strong> on SOS trigger. Enable in <strong>Settings → Emergency Preferences</strong>.<br><br>" +
          "<strong>If you're in danger, call 112 immediately.</strong>",
        quickReplies: ["I'm in danger!", "How does SOS work?", "I'm safe now"]
      };
    }

    // ABOUT / WHAT IS / VISION / MISSION
    if (q.includes('what is shield') || q.includes('about') || q.includes('tell me') || q.includes('who made') || q.includes('team') || q.includes('creator') || q.includes('vision') || q.includes('mission') || q.includes('why shield')) {
      return {
        msg: "🛡️ <strong>About SHIELD</strong><br><br>" +
          "<strong>Vision:</strong> A safer world where every woman feels secure, confident, and protected anytime, anywhere.<br><br>" +
          "<strong>Mission:</strong> Empowering women with a reliable, fast-response safety platform for instant SOS, real-time tracking, and immediate emergency help.<br><br>" +
          "Created by <strong>Sobhana Kumari, Sanskriti Tyagi, Vaidehi Gupta & Jay Tyagi</strong>.<br><br>" +
          "<strong>Because safety should not wait.</strong><br><br>" +
          "• Instant SOS via shake, voice, or tap<br>" +
          "• Live GPS tracking (updates every 10s)<br>" +
          "• Auto evidence recording (audio + video)<br>" +
          "• Offline SMS alerts — works without internet<br>" +
          "• 110dB alarm to deter threats<br>" +
          "• AI safety companion 24/7<br><br>" +
          "📧 kumarisobhana119@gmail.com",
        quickReplies: ["How does SOS work?", "Pricing plans", "Set up contacts"]
      };
    }

    // HELLO / GREETINGS (English + Hindi)
    if (q.includes('hi') || q.includes('hello') || q.includes('hey') || q.match(/^(hii+|hola|namaste|namaskar)/)) {
      // Hindi greeting
      if (q.includes('namaste') || q.includes('namaskar')) {
        return {
          msg: "🛡️ नमस्ते! मैं SHIELD AI हूँ — आपकी सुरक्षा सहायक। मैं 24/7 आपकी सुरक्षा के लिए यहाँ हूँ।<br><br>मैं आपकी मदद कर सकती हूँ:<br>→ SOS और trusted contacts सेटअप<br>→ Emergency features<br>→ सुरक्षा से जुड़े सवाल<br><br>आप सुरक्षित हैं। मैं यहाँ हूँ। 🛡️",
          quickReplies: ["SOS कैसे काम करता है?", "How does SOS work?", "Set up contacts", "Pricing plans"]
        };
      }
      return {
        msg: "🛡️ Hello! I'm SHIELD AI — your personal safety assistant, active 24/7, always by your side.<br><br>I can help you:<br>→ Set up your SOS & trusted contacts<br>→ Activate emergency features<br>→ Answer any safety questions<br>→ Guide you in an emergency<br><br>You are safe. I am here. How can I help you today?",
        quickReplies: ["What is SHIELD?", "How does SOS work?", "Set up contacts", "Pricing plans"]
      };
    }

    // UPGRADE GUIDANCE
    if (q.includes('upgrade') || q.includes('premium') || q.includes('family plan')) {
      return {
        msg: "⬆️ <strong>Upgrade Your SHIELD Plan</strong><br><br>" +
          "<strong>Free → Premium (₹99/mo or ₹799/yr):</strong><br>" +
          "Go to Settings → Upgrade → Choose Premium<br>" +
          "Unlocks: evidence recording, 5 contacts, 10s GPS, route safety, full AI<br><br>" +
          "<strong>Premium → Family (₹199/mo or ₹1499/yr):</strong><br>" +
          "Go to Settings → Upgrade → Choose Family Plan<br>" +
          "Covers 5 members with 10 contacts each, family dashboard, child & senior safety modes<br><br>" +
          "💡 <strong>Save more with annual plans!</strong>",
        quickReplies: ["Pricing plans", "Set up contacts", "How does SOS work?"]
      };
    }

    // SAFETY TIPS
    if (q.includes('tip') || q.includes('advice') || q.includes('suggest')) {
      return {
        msg: "💡 <strong>Safety Tips from SHIELD</strong><br><br>" +
          "🔋 Keep your phone charged above 20% when going out alone<br>" +
          "📍 Share your live location when traveling alone at night<br>" +
          "📱 Test your SOS trigger every week to make sure it works<br>" +
          "📞 Save 112 as your first speed dial contact<br>" +
          "🗺️ Tell someone your route and expected arrival time<br>" +
          "🚗 Enable Travel Mode when commuting late — SHIELD auto-tracks your route<br>" +
          "👤 Add your most trusted person as Contact #1 for fastest response<br>" +
          "🔒 Keep SHIELD running in the background always",
        quickReplies: ["How does SOS work?", "Set up contacts", "Offline alerts"]
      };
    }

    // FALLBACK
    return {
      msg: "I'd love to help! I can assist you with:<br><br>" +
        "• 🆘 SOS trigger setup & usage<br>" +
        "• 📍 Live location tracking<br>" +
        "• 🎥 Auto evidence recording<br>" +
        "• 📶 Offline alert system<br>" +
        "• 👥 Trusted contacts setup<br>" +
        "• 🔊 Loud alarm system<br>" +
        "• 💰 Pricing & plans<br>" +
        "• 💡 Safety tips<br><br>" +
        "Try asking about any of these! 👇",
      quickReplies: ["How does SOS work?", "Set up contacts", "I'm in danger!", "Safety tips"]
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
  function startApp() {
    fetch("http://localhost:3000/api/health")
      .then(res => res.json())
      .then(data => {
       alert("Backend Connected ✅");
       console.log(data);
    })
    .catch(err => {
      alert("Connection failed ❌");
      console.error(err);
    });
}
  }
  }

);
