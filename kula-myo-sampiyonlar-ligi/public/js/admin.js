// admin.js - Admin panel logic
let isLoggedIn = false;

document.addEventListener('DOMContentLoaded', () => {
  // Check if already logged in (sessionStorage)
  if (sessionStorage.getItem('adminLoggedIn') === 'true') {
    showDashboard();
  }
  
  setupLoginForm();
  setupTeamForm();
  setupPlayerForm();
  setupStandingsForm();
  setupLiveScoreForm();
  setupLogout();
  
  Animations.createParticles();
});

function setupLoginForm() {
  document.getElementById('login-btn').addEventListener('click', async () => {
    const username = document.getElementById('admin-username').value;
    const password = document.getElementById('admin-password').value;
    const errorEl = document.getElementById('login-error');
    
    if (!username || !password) {
      errorEl.textContent = 'Kullanıcı adı ve şifre gerekli!';
      errorEl.style.display = 'block';
      return;
    }
    
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      
      if (data.success) {
        sessionStorage.setItem('adminLoggedIn', 'true');
        showDashboard();
        Animations.showToast('Giriş başarılı! Hoş geldiniz.');
      } else {
        errorEl.textContent = data.message || 'Hatalı giriş!';
        errorEl.style.display = 'block';
        errorEl.classList.add('shake');
        setTimeout(() => errorEl.classList.remove('shake'), 500);
      }
    } catch (err) {
      errorEl.textContent = 'Sunucu hatası!';
      errorEl.style.display = 'block';
    }
  });
}

function setupLogout() {
  document.getElementById('logout-btn').addEventListener('click', () => {
    sessionStorage.removeItem('adminLoggedIn');
    document.getElementById('admin-dashboard').style.display = 'none';
    document.getElementById('login-section').style.display = 'flex';
    isLoggedIn = false;
    Animations.showToast('Çıkış yapıldı.', 'success');
  });
}

function showDashboard() {
  isLoggedIn = true;
  document.getElementById('login-section').style.display = 'none';
  document.getElementById('admin-dashboard').style.display = 'block';
  document.getElementById('admin-dashboard').classList.add('fade-in');
  loadTeams();
  loadPlayers();
  loadTeamSelects();
  loadLiveScoreAdmin();
}

// ========== TEAMS ==========
function setupTeamForm() {
  document.getElementById('add-team-btn').addEventListener('click', async () => {
    const name = document.getElementById('team-name-input').value.trim();
    const shortName = document.getElementById('team-short-input').value.trim();
    const logo = document.getElementById('team-logo-input').value.trim();
    
    if (!name) {
      Animations.showToast('Takım adı gerekli!', 'error');
      return;
    }
    
    try {
      await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, shortName: shortName || name.substring(0, 2).toUpperCase(), logo: logo || '⚽' })
      });
      
      // Clear inputs
      document.getElementById('team-name-input').value = '';
      document.getElementById('team-short-input').value = '';
      document.getElementById('team-logo-input').value = '';
      
      loadTeams();
      loadTeamSelects();
      Animations.showToast(`${name} takımı eklendi!`);
    } catch (err) {
      Animations.showToast('Takım eklenemedi!', 'error');
    }
  });
}

async function loadTeams() {
  try {
    const res = await fetch('/api/teams');
    const teams = await res.json();
    const container = document.getElementById('teams-list');
    container.innerHTML = '';
    
    teams.forEach(team => {
      const card = document.createElement('div');
      card.className = 'item-card fade-in';
      card.innerHTML = `
        <span class="item-info">${team.logo} ${team.name} (${team.shortName})</span>
        <button class="btn btn-danger btn-sm" onclick="deleteTeam(${team.id})">🗑️ Sil</button>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error('Takımlar yüklenemedi:', err);
  }
}

async function deleteTeam(id) {
  if (!confirm('Bu takımı silmek istediğinize emin misiniz?')) return;
  try {
    await fetch(`/api/teams/${id}`, { method: 'DELETE' });
    loadTeams();
    loadTeamSelects();
    loadPlayers();
    Animations.showToast('Takım silindi!');
  } catch (err) {
    Animations.showToast('Takım silinemedi!', 'error');
  }
}

// ========== PLAYERS ==========
function setupPlayerForm() {
  document.getElementById('add-player-btn').addEventListener('click', async () => {
    const name = document.getElementById('player-name-input').value.trim();
    const teamId = parseInt(document.getElementById('player-team-select').value);
    const number = parseInt(document.getElementById('player-number-input').value) || 0;
    const goals = parseInt(document.getElementById('player-goals-input').value) || 0;
    
    if (!name || !teamId) {
      Animations.showToast('Oyuncu adı ve takım gerekli!', 'error');
      return;
    }
    
    try {
      await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, teamId, number, goals })
      });
      
      document.getElementById('player-name-input').value = '';
      document.getElementById('player-number-input').value = '';
      document.getElementById('player-goals-input').value = '0';
      
      loadPlayers();
      Animations.showToast(`${name} oyuncusu eklendi!`);
    } catch (err) {
      Animations.showToast('Oyuncu eklenemedi!', 'error');
    }
  });
}

async function loadPlayers() {
  try {
    const [playersRes, teamsRes] = await Promise.all([
      fetch('/api/players'),
      fetch('/api/teams')
    ]);
    const players = await playersRes.json();
    const teams = await teamsRes.json();
    const container = document.getElementById('players-list');
    container.innerHTML = '';
    
    players.forEach(player => {
      const team = teams.find(t => t.id === player.teamId);
      const card = document.createElement('div');
      card.className = 'item-card fade-in';
      card.innerHTML = `
        <span class="item-info">
          #${player.number} ${player.name} 
          <small>(${team ? team.name : 'Bilinmeyen'} - ⚽${player.goals} gol)</small>
        </span>
        <div class="item-actions">
          <button class="btn btn-primary btn-sm" onclick="editPlayerGoals(${player.id}, ${player.goals})">⚽ Gol+</button>
          <button class="btn btn-danger btn-sm" onclick="deletePlayer(${player.id})">🗑️</button>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error('Oyuncular yüklenemedi:', err);
  }
}

async function editPlayerGoals(id, currentGoals) {
  try {
    await fetch(`/api/players/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goals: currentGoals + 1 })
    });
    loadPlayers();
    Animations.showToast('Gol eklendi! ⚽');
  } catch (err) {
    Animations.showToast('Güncellenemedi!', 'error');
  }
}

async function deletePlayer(id) {
  if (!confirm('Bu oyuncuyu silmek istediğinize emin misiniz?')) return;
  try {
    await fetch(`/api/players/${id}`, { method: 'DELETE' });
    loadPlayers();
    Animations.showToast('Oyuncu silindi!');
  } catch (err) {
    Animations.showToast('Oyuncu silinemedi!', 'error');
  }
}

// ========== TEAM SELECTS ==========
async function loadTeamSelects() {
  try {
    const res = await fetch('/api/teams');
    const teams = await res.json();
    
    const selects = ['player-team-select', 'standings-team-select', 'live-home-team', 'live-away-team'];
    selects.forEach(selectId => {
      const select = document.getElementById(selectId);
      if (!select) return;
      const currentVal = select.value;
      select.innerHTML = '<option value="">Takım Seçin</option>';
      teams.forEach(team => {
        select.innerHTML += `<option value="${team.id}">${team.logo} ${team.name}</option>`;
      });
      if (currentVal) select.value = currentVal;
    });
  } catch (err) {
    console.error('Takım seçenekleri yüklenemedi:', err);
  }
}

// ========== STANDINGS ==========
function setupStandingsForm() {
  // When team is selected, load its current standings
  document.getElementById('standings-team-select').addEventListener('change', async (e) => {
    const teamId = parseInt(e.target.value);
    if (!teamId) return;
    
    try {
      const res = await fetch('/api/standings');
      const standings = await res.json();
      const team = standings.find(s => s.teamId === teamId);
      
      if (team) {
        document.getElementById('st-played').value = team.played;
        document.getElementById('st-won').value = team.won;
        document.getElementById('st-drawn').value = team.drawn;
        document.getElementById('st-lost').value = team.lost;
        document.getElementById('st-gf').value = team.goalsFor;
        document.getElementById('st-ga').value = team.goalsAgainst;
        document.getElementById('st-points').value = team.points;
      }
    } catch (err) {
      console.error('Puan bilgileri yüklenemedi:', err);
    }
  });
  
  document.getElementById('update-standings-btn').addEventListener('click', async () => {
    const teamId = parseInt(document.getElementById('standings-team-select').value);
    if (!teamId) {
      Animations.showToast('Bir takım seçin!', 'error');
      return;
    }
    
    const data = {
      played: parseInt(document.getElementById('st-played').value) || 0,
      won: parseInt(document.getElementById('st-won').value) || 0,
      drawn: parseInt(document.getElementById('st-drawn').value) || 0,
      lost: parseInt(document.getElementById('st-lost').value) || 0,
      goalsFor: parseInt(document.getElementById('st-gf').value) || 0,
      goalsAgainst: parseInt(document.getElementById('st-ga').value) || 0,
      points: parseInt(document.getElementById('st-points').value) || 0
    };
    
    try {
      await fetch(`/api/standings/${teamId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      Animations.showToast('Puan tablosu güncellendi! 📊');
    } catch (err) {
      Animations.showToast('Güncellenemedi!', 'error');
    }
  });
}

// ========== LIVE SCORE ==========
function setupLiveScoreForm() {
  document.getElementById('update-live-btn').addEventListener('click', async () => {
    const homeTeamId = parseInt(document.getElementById('live-home-team').value);
    const awayTeamId = parseInt(document.getElementById('live-away-team').value);
    const homeScore = parseInt(document.getElementById('live-home-score').value) || 0;
    const awayScore = parseInt(document.getElementById('live-away-score').value) || 0;
    const minute = parseInt(document.getElementById('live-minute').value) || 0;
    const status = document.getElementById('live-status').value;
    const isLive = document.getElementById('live-is-live').checked;
    
    if (!homeTeamId || !awayTeamId) {
      Animations.showToast('Her iki takımı da seçin!', 'error');
      return;
    }
    if (homeTeamId === awayTeamId) {
      Animations.showToast('Aynı takım seçilemez!', 'error');
      return;
    }
    
    try {
      await fetch('/api/live', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homeTeamId, awayTeamId, homeScore, awayScore, minute, isLive, status })
      });
      Animations.showToast('Canlı skor güncellendi! 📺');
    } catch (err) {
      Animations.showToast('Güncellenemedi!', 'error');
    }
  });
}

async function loadLiveScoreAdmin() {
  try {
    const res = await fetch('/api/live');
    const data = await res.json();
    
    // Wait a tick for selects to be populated
    setTimeout(() => {
      document.getElementById('live-home-team').value = data.homeTeamId || '';
      document.getElementById('live-away-team').value = data.awayTeamId || '';
      document.getElementById('live-home-score').value = data.homeScore || 0;
      document.getElementById('live-away-score').value = data.awayScore || 0;
      document.getElementById('live-minute').value = data.minute || 0;
      document.getElementById('live-status').value = data.status || 'Maç Bekleniyor';
      document.getElementById('live-is-live').checked = data.isLive || false;
    }, 500);
  } catch (err) {
    console.error('Canlı skor yüklenemedi:', err);
  }
}

// Make functions globally available for onclick handlers
window.deleteTeam = deleteTeam;
window.deletePlayer = deletePlayer;
window.editPlayerGoals = editPlayerGoals;
