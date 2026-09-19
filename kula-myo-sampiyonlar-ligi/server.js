const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, 'data', 'db.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const readDB = () => {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Veritabanı okuma hatası:', error);
    return null;
  }
};

const writeDB = (data) => {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Veritabanı yazma hatası:', error);
    return false;
  }
};

// Teams
app.get('/api/teams', (req, res) => {
  const db = readDB();
  if (!db) return res.status(500).json({ error: 'Database error' });
  res.json(db.teams);
});

app.post('/api/teams', (req, res) => {
  const { name, shortName, logo } = req.body;
  if (!name || !shortName || !logo) return res.status(400).json({ error: 'Missing fields' });
  
  const db = readDB();
  if (!db) return res.status(500).json({ error: 'Database error' });

  const maxId = db.teams.reduce((max, team) => (team.id > max ? team.id : max), 0);
  const newTeam = { id: maxId + 1, name, shortName, logo };
  db.teams.push(newTeam);

  const newStandingsEntry = {
    teamId: newTeam.id,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0
  };
  db.standings.push(newStandingsEntry);

  if (writeDB(db)) {
    res.status(201).json(newTeam);
  } else {
    res.status(500).json({ error: 'Failed to write to database' });
  }
});

app.delete('/api/teams/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const db = readDB();
  if (!db) return res.status(500).json({ error: 'Database error' });

  const teamIndex = db.teams.findIndex(t => t.id === id);
  if (teamIndex === -1) return res.status(404).json({ error: 'Team not found' });

  db.teams.splice(teamIndex, 1);
  db.players = db.players.filter(p => p.teamId !== id);
  db.standings = db.standings.filter(s => s.teamId !== id);

  if (writeDB(db)) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: 'Failed to write to database' });
  }
});

// Players
app.get('/api/players', (req, res) => {
  const db = readDB();
  if (!db) return res.status(500).json({ error: 'Database error' });
  res.json(db.players);
});

app.post('/api/players', (req, res) => {
  const { name, teamId, goals, number } = req.body;
  const tId = parseInt(teamId);
  const db = readDB();
  if (!db) return res.status(500).json({ error: 'Database error' });

  const maxId = db.players.reduce((max, p) => (p.id > max ? p.id : max), 0);
  const newPlayer = { id: maxId + 1, name, teamId: tId, goals: parseInt(goals) || 0, number: parseInt(number) || null };
  db.players.push(newPlayer);

  if (writeDB(db)) {
    res.status(201).json(newPlayer);
  } else {
    res.status(500).json({ error: 'Failed to write to database' });
  }
});

app.put('/api/players/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const db = readDB();
  if (!db) return res.status(500).json({ error: 'Database error' });

  const player = db.players.find(p => p.id === id);
  if (!player) return res.status(404).json({ error: 'Player not found' });

  const { name, teamId, goals, number } = req.body;
  if (name !== undefined) player.name = name;
  if (teamId !== undefined) player.teamId = parseInt(teamId);
  if (goals !== undefined) player.goals = parseInt(goals);
  if (number !== undefined) player.number = parseInt(number);

  if (writeDB(db)) {
    res.json(player);
  } else {
    res.status(500).json({ error: 'Failed to write to database' });
  }
});

app.delete('/api/players/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const db = readDB();
  if (!db) return res.status(500).json({ error: 'Database error' });

  const playerIndex = db.players.findIndex(p => p.id === id);
  if (playerIndex === -1) return res.status(404).json({ error: 'Player not found' });

  db.players.splice(playerIndex, 1);

  if (writeDB(db)) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: 'Failed to write to database' });
  }
});

// Standings
app.get('/api/standings', (req, res) => {
  const db = readDB();
  if (!db) return res.status(500).json({ error: 'Database error' });

  const standingsWithTeams = db.standings.map(s => {
    const team = db.teams.find(t => t.id === s.teamId);
    return {
      ...s,
      teamName: team ? team.name : 'Unknown',
      teamLogo: team ? team.logo : ''
    };
  });

  standingsWithTeams.sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    const aGD = a.goalsFor - a.goalsAgainst;
    const bGD = b.goalsFor - b.goalsAgainst;
    return bGD - aGD;
  });

  res.json(standingsWithTeams);
});

app.put('/api/standings/:teamId', (req, res) => {
  const teamId = parseInt(req.params.teamId);
  const db = readDB();
  if (!db) return res.status(500).json({ error: 'Database error' });

  const standing = db.standings.find(s => s.teamId === teamId);
  if (!standing) return res.status(404).json({ error: 'Standings entry not found' });

  const { played, won, drawn, lost, goalsFor, goalsAgainst, points } = req.body;
  if (played !== undefined) standing.played = parseInt(played);
  if (won !== undefined) standing.won = parseInt(won);
  if (drawn !== undefined) standing.drawn = parseInt(drawn);
  if (lost !== undefined) standing.lost = parseInt(lost);
  if (goalsFor !== undefined) standing.goalsFor = parseInt(goalsFor);
  if (goalsAgainst !== undefined) standing.goalsAgainst = parseInt(goalsAgainst);
  if (points !== undefined) standing.points = parseInt(points);

  if (writeDB(db)) {
    res.json(standing);
  } else {
    res.status(500).json({ error: 'Failed to write to database' });
  }
});

// Scorers
app.get('/api/scorers', (req, res) => {
  const db = readDB();
  if (!db) return res.status(500).json({ error: 'Database error' });

  const playersWithTeams = db.players.map(p => {
    const team = db.teams.find(t => t.id === p.teamId);
    return {
      ...p,
      teamName: team ? team.name : 'Unknown'
    };
  });

  playersWithTeams.sort((a, b) => b.goals - a.goals);
  res.json(playersWithTeams.slice(0, 20));
});

// Live Match
app.get('/api/live', (req, res) => {
  const db = readDB();
  if (!db) return res.status(500).json({ error: 'Database error' });

  const live = { ...db.liveMatch };
  const homeTeam = db.teams.find(t => t.id === live.homeTeamId);
  const awayTeam = db.teams.find(t => t.id === live.awayTeamId);

  live.homeTeamName = homeTeam ? homeTeam.name : 'Unknown';
  live.homeTeamLogo = homeTeam ? homeTeam.logo : '';
  live.awayTeamName = awayTeam ? awayTeam.name : 'Unknown';
  live.awayTeamLogo = awayTeam ? awayTeam.logo : '';

  res.json(live);
});

app.put('/api/live', (req, res) => {
  const db = readDB();
  if (!db) return res.status(500).json({ error: 'Database error' });

  const { homeTeamId, awayTeamId, homeScore, awayScore, minute, isLive, status } = req.body;
  
  if (homeTeamId !== undefined) db.liveMatch.homeTeamId = parseInt(homeTeamId);
  if (awayTeamId !== undefined) db.liveMatch.awayTeamId = parseInt(awayTeamId);
  if (homeScore !== undefined) db.liveMatch.homeScore = parseInt(homeScore);
  if (awayScore !== undefined) db.liveMatch.awayScore = parseInt(awayScore);
  if (minute !== undefined) db.liveMatch.minute = parseInt(minute);
  if (isLive !== undefined) db.liveMatch.isLive = !!isLive;
  if (status !== undefined) db.liveMatch.status = status;

  if (writeDB(db)) {
    const live = { ...db.liveMatch };
    const homeTeam = db.teams.find(t => t.id === live.homeTeamId);
    const awayTeam = db.teams.find(t => t.id === live.awayTeamId);

    live.homeTeamName = homeTeam ? homeTeam.name : 'Unknown';
    live.homeTeamLogo = homeTeam ? homeTeam.logo : '';
    live.awayTeamName = awayTeam ? awayTeam.name : 'Unknown';
    live.awayTeamLogo = awayTeam ? awayTeam.logo : '';

    res.json(live);
  } else {
    res.status(500).json({ error: 'Failed to write to database' });
  }
});

// Admin
app.post('/api/login', (req, res) => {
  const db = readDB();
  if (!db) return res.status(500).json({ error: 'Database error' });

  const { username, password } = req.body;
  if (username === db.admin.username && password === db.admin.password) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Hatalı kullanıcı adı veya şifre' });
  }
});

// Catch-all
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`KULA MYO Şampiyonlar Ligi sunucusu http://localhost:${PORT} adresinde çalışıyor!`);
});
