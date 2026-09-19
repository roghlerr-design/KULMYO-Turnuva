// animations.js - Animation utilities for KULA MYO Şampiyonlar Ligi

const Animations = {
  // Create floating particles in the background
  createParticles(containerId = 'particles', count = 15) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.textContent = ['⚽', '🥅', '⭐', '🏆'][Math.floor(Math.random() * 4)];
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      particle.style.animationDuration = (3 + Math.random() * 4) + 's';
      particle.style.animationDelay = (Math.random() * 3) + 's';
      particle.style.fontSize = (0.8 + Math.random() * 1.2) + 'rem';
      particle.style.opacity = 0.1 + Math.random() * 0.15;
      container.appendChild(particle);
    }
  },

  // Counter animation: animates a number from 0 to target
  countUp(element, target, duration = 1000) {
    if (!element) return;
    const start = parseInt(element.textContent) || 0;
    const increment = (target - start) / (duration / 16);
    let current = start;
    const timer = setInterval(() => {
      current += increment;
      if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
        current = target;
        clearInterval(timer);
      }
      element.textContent = Math.round(current);
    }, 16);
  },

  // Confetti explosion effect
  createConfetti(count = 50) {
    const colors = ['#f0c040', '#e74c3c', '#2ecc71', '#3498db', '#ffffff', '#1a8a4a'];
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;overflow:hidden;';
    document.body.appendChild(container);
    for (let i = 0; i < count; i++) {
      const confetti = document.createElement('div');
      confetti.style.cssText = `
        position:absolute;
        width:${5 + Math.random() * 10}px;
        height:${5 + Math.random() * 10}px;
        background:${colors[Math.floor(Math.random() * colors.length)]};
        left:${Math.random() * 100}%;
        top:-10px;
        border-radius:${Math.random() > 0.5 ? '50%' : '0'};
        animation: confettiFall ${2 + Math.random() * 3}s linear ${Math.random() * 0.5}s forwards;
      `;
      container.appendChild(confetti);
    }
    setTimeout(() => container.remove(), 5000);
  },

  // Show toast notification
  showToast(message, type = 'success', duration = 3000) {
    const container = document.getElementById('toast-container') || document.body;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${type === 'success' ? '✅' : '❌'}</span>
      <span class="toast-message">${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  // Observe elements and add animation class when they enter viewport
  observeElements(selector, animationClass = 'fade-in-up') {
    const elements = document.querySelectorAll(selector);
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add(animationClass);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    elements.forEach(el => observer.observe(el));
  },

  // Pulse an element
  pulseElement(element) {
    if (!element) return;
    element.classList.add('pulse');
    setTimeout(() => element.classList.remove('pulse'), 2000);
  },

  // Score change animation
  animateScoreChange(element) {
    if (!element) return;
    element.style.animation = 'none';
    element.offsetHeight; // trigger reflow
    element.style.animation = 'scoreChange 0.6s ease';
  },

  // Add stagger classes to children
  addStagger(parentSelector) {
    const parent = document.querySelector(parentSelector);
    if (!parent) return;
    Array.from(parent.children).forEach((child, i) => {
      child.classList.add(`stagger-${Math.min(i + 1, 10)}`);
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('particles')) {
    Animations.createParticles();
  }
});
