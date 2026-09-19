// gol-krallari.js - Top scorers page logic
document.addEventListener('DOMContentLoaded', () => {
  loadScorers();
  Animations.createParticles();
});

async function loadScorers() {
  try {
    const res = await fetch('/api/scorers');
    const scorers = await res.json();
    const container = document.getElementById('scorers-list');
    container.innerHTML = '';
    
    if (scorers.length === 0) {
      container.innerHTML = '<p class="no-data">Henüz gol atılmadı</p>';
      return;
    }
    
    scorers.forEach((scorer, index) => {
      const rank = index + 1;
      const trophy = rank === 1 ? '🏆' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
      const rankClass = rank <= 3 ? `rank-${rank}` : '';
      
      const card = document.createElement('div');
      card.className = `scorer-card fade-in-up stagger-${Math.min(rank, 10)} ${rankClass}`;
      card.innerHTML = `
        <div class="scorer-rank">${trophy || rank}</div>
        <div class="scorer-info">
          <span class="scorer-name">${scorer.name}</span>
          <span class="scorer-team">${scorer.teamName || 'Bilinmeyen Takım'}</span>
        </div>
        <div class="scorer-goals">
          <span class="goal-count">⚽ ${scorer.goals}</span>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error('Gol kralları yüklenemedi:', err);
  }
}
