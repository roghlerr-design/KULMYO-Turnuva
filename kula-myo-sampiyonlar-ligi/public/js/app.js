// app.js - Main page logic
document.addEventListener('DOMContentLoaded', () => {
  loadLiveScore();
  loadStandings();
  
  // Auto-refresh live score every 5 seconds
  setInterval(loadLiveScore, 5000);
  
  // Initialize particles
  Animations.createParticles();
});

async function loadLiveScore() {
  try {
    const res = await fetch('/api/live');
    const data = await res.json();
    
    const section = document.getElementById('live-score-section');
    const badge = document.getElementById('live-badge');
    const homeTeamLogo = document.getElementById('home-team-logo');
    const awayTeamLogo = document.getElementById('away-team-logo');
    const homeTeamName = document.getElementById('home-team-name');
    const awayTeamName = document.getElementById('away-team-name');
    const homeScore = document.getElementById('home-score');
    const awayScore = document.getElementById('away-score');
    const matchMinute = document.getElementById('match-minute');
    const matchStatus = document.getElementById('match-status');
    
    if (data.isLive) {
      badge.style.display = 'inline-flex';
      badge.textContent = '🔴 CANLI';
      section.classList.add('is-live');
    } else {
      badge.style.display = data.status === 'Maç Bekleniyor' ? 'none' : 'inline-flex';
      badge.textContent = data.status === 'Maç Bitti' ? '🏁 BİTTİ' : '';
      section.classList.remove('is-live');
    }
    
    homeTeamLogo.textContent = data.homeTeamLogo || '⚽';
    awayTeamLogo.textContent = data.awayTeamLogo || '⚽';
    homeTeamName.textContent = data.homeTeamName || 'Ev Sahibi';
    awayTeamName.textContent = data.awayTeamName || 'Deplasman';
    
    // Animate score if changed
    const oldHome = homeScore.textContent;
    const oldAway = awayScore.textContent;
    homeScore.textContent = data.homeScore;
    awayScore.textContent = data.awayScore;
    
    if (oldHome !== '' && oldHome !== String(data.homeScore)) {
      Animations.animateScoreChange(homeScore);
      Animations.createConfetti();
    }
    if (oldAway !== '' && oldAway !== String(data.awayScore)) {
      Animations.animateScoreChange(awayScore);
      Animations.createConfetti();
    }
    
    matchMinute.textContent = data.isLive ? `${data.minute}'` : '';
    matchStatus.textContent = data.status || '';
  } catch (err) {
    console.error('Canlı skor yüklenemedi:', err);
  }
}

async function loadStandings() {
  try {
    const res = await fetch('/api/standings');
    const standings = await res.json();
    const tbody = document.getElementById('standings-tbody');
    tbody.innerHTML = '';
    
    standings.forEach((team, index) => {
      const rank = index + 1;
      const goalDiff = team.goalsFor - team.goalsAgainst;
      const diffStr = goalDiff > 0 ? `+${goalDiff}` : goalDiff;
      const rankClass = rank <= 3 ? `rank-${rank}` : '';
      
      const tr = document.createElement('tr');
      tr.className = `table-row fade-in-up stagger-${Math.min(rank, 10)}`;
      tr.innerHTML = `
        <td class="rank-cell ${rankClass}">${rank}</td>
        <td class="team-cell">
          <span class="team-logo">${team.teamLogo || '⚽'}</span>
          <span class="team-name">${team.teamName}</span>
        </td>
        <td>${team.played}</td>
        <td>${team.won}</td>
        <td>${team.drawn}</td>
        <td>${team.lost}</td>
        <td>${team.goalsFor}</td>
        <td>${team.goalsAgainst}</td>
        <td class="${goalDiff > 0 ? 'positive' : goalDiff < 0 ? 'negative' : ''}">${diffStr}</td>
        <td class="points-cell">${team.points}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Puan tablosu yüklenemedi:', err);
  }
}
