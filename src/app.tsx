import React, { useState, useEffect, useCallback } from 'react';

// ----------------------------- البيانات -----------------------------
interface Team {
  id: string; name: string; logo: string; color: string; league: string;
  stadium: string; coach: string; stars: string[]; achievements: string[];
}

const TEAMS: Team[] = [
  { id: 'barcelona', name: 'برشلونة', logo: '🔵🔴', color: '#A50044', league: 'الإسباني', stadium: 'كامب نو', coach: 'تشافي', stars: ['ليفاندوفسكي', 'بيدري'], achievements: ['27 دوري', '5 أبطال أوروبا'] },
  { id: 'real_madrid', name: 'ريال مدريد', logo: '⚪', color: '#FEBE10', league: 'الإسباني', stadium: 'برنابيو', coach: 'أنشيلوتي', stars: ['فينيسيوس', 'بيلينغهام'], achievements: ['35 دوري', '14 أبطال أوروبا'] },
  { id: 'al_hilal', name: 'الهلال', logo: '🔵', color: '#0055A4', league: 'السعودي', stadium: 'الملك فهد', coach: 'جيسوس', stars: ['نيمار', 'مالكوم'], achievements: ['19 دوري', '4 أبطال آسيا'] },
  { id: 'al_nassr', name: 'النصر', logo: '🟡', color: '#FFD700', league: 'السعودي', stadium: 'مرسول بارك', coach: 'كاسترو', stars: ['رونالدو', 'ماني'], achievements: ['9 دوري'] },
  { id: 'raja', name: 'الرجاء', logo: '🟢', color: '#006400', league: 'المغربي', stadium: 'محمد الخامس', coach: 'زيمباور', stars: ['العروبي', 'زيلا'], achievements: ['13 بطولة', '3 أبطال أفريقيا'] },
  { id: 'wydad', name: 'الوداد', logo: '🔴', color: '#DC143C', league: 'المغربي', stadium: 'محمد الخامس', coach: 'رمزي', stars: ['جبران', 'العملود'], achievements: ['22 بطولة', '3 أبطال أفريقيا'] },
];

// ----------------------------- AI و RSS -----------------------------
const AI = {
  rewrite: (text: string) => {
    const options = [`في آخر المستجدات، ${text}`, `🔴 عاجل: ${text}`, `كشفت المصادر أن ${text}`];
    return options[Math.floor(Math.random() * options.length)];
  },
  predict: (teamA: string, teamB: string) => {
    const score = `${Math.floor(Math.random() * 3)}-${Math.floor(Math.random() * 2)}`;
    const winner = Math.random() > 0.5 ? teamA : teamB;
    return { score, winner, prob: Math.floor(Math.random() * 30) + 50 };
  }
};

const RSS = {
  fetch: async (teamName: string) => {
    const proxy = 'https://api.rss2json.com/v1/api.json?rss_url=';
    const sources = ['https://feeds.bbci.co.uk/sport/football/rss.xml', 'https://www.skysports.com/rss/12040'];
    for (const src of sources) {
      try {
        const res = await fetch(`${proxy}${encodeURIComponent(src)}`);
        const data = await res.json();
        const item = data.items?.find((i: any) => i.title?.toLowerCase().includes(teamName.toLowerCase()));
        if (item) return [{
          title: item.title,
          summary: (item.description || '').replace(/<[^>]+>/g, '').slice(0, 150),
          link: item.link,
          source: src.includes('bbc') ? 'BBC' : 'Sky'
        }];
      } catch (e) {}
    }
    return [{ title: `${teamName} - آخر الأخبار`, summary: `تابع أخبار ${teamName}`, link: '#', source: 'محلي' }];
  }
};

// ----------------------------- Hooks -----------------------------
const useLiveNews = (teamId: string) => {
  const [news, setNews] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [breaking, setBreaking] = useState<string | null>(null);
  useEffect(() => {
    let isMounted = true;
    const fetchNews = async () => {
      const team = TEAMS.find(t => t.id === teamId)!;
      const articles = await RSS.fetch(team.name);
      if (isMounted) { setNews(articles); setLastUpdate(new Date()); }
    };
    fetchNews();
    const interval = setInterval(fetchNews, 30000);
    const breakingInterval = setInterval(() => {
      if (isMounted) {
        const events = ['⚽ هدف!', '🟨 بطاقة حمراء', '🏁 نهاية المباراة', '📢 تصريح ناري'];
        const randomEvent = events[Math.floor(Math.random() * events.length)];
        setBreaking(randomEvent);
        setTimeout(() => setBreaking(null), 5000);
        if (Notification.permission === 'granted') new Notification('🔴 خبر عاجل', { body: randomEvent });
      }
    }, 45000);
    return () => { isMounted = false; clearInterval(interval); clearInterval(breakingInterval); };
  }, [teamId]);
  return { news, lastUpdate, breaking };
};

const useReminder = () => {
  const [permission, setPermission] = useState(Notification.permission);
  const requestPermission = useCallback(async () => {
    if (permission !== 'granted') { const p = await Notification.requestPermission(); setPermission(p); }
  }, [permission]);
  const remind = useCallback(async (match: { home: string; away: string }) => {
    if (permission !== 'granted') await requestPermission();
    if (permission === 'granted') new Notification('🔔 تذكير المباراة', { body: `${match.home} 🆚 ${match.away} بعد ساعة!` });
  }, [permission, requestPermission]);
  return { remind, requestPermission, permission };
};

// ----------------------------- المكونات -----------------------------
const Header: React.FC<{ dark: boolean; toggle: () => void }> = ({ dark, toggle }) => (
  <header style={{ display: 'flex', justifyContent: 'space-between', padding: 20, background: 'linear-gradient(135deg,#667eea,#764ba2)', color: 'white', borderRadius: '0 0 20px 20px' }}>
    <div><span style={{ fontSize: '2rem' }}>🧠⚽</span><h1 style={{ display: 'inline' }}>ذكي | أخبار كرة القدم</h1><p style={{ fontSize: '0.7rem' }}>قانوني · مجاني · ذكي · متخصص · سلس · متحدي</p></div>
    <button onClick={toggle} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 40, cursor: 'pointer' }}>{dark ? '☀️' : '🌙'}</button>
  </header>
);

const TeamSelector: React.FC<{ selected: string; onChange: (id: string) => void }> = ({ selected, onChange }) => (
  <select value={selected} onChange={e => onChange(e.target.value)} style={{ width: 'calc(100% - 30px)', margin: 15, padding: 12, border: '2px solid #667eea', borderRadius: 12, background: 'white' }}>
    {TEAMS.map(t => <option key={t.id} value={t.id}>{t.logo} {t.name}</option>)}
  </select>
);

const TeamInfo: React.FC<{ teamId: string }> = ({ teamId }) => {
  const team = TEAMS.find(t => t.id === teamId)!;
  return <div style={{ background: '#f0f2f5', borderRadius: 16, padding: 15, margin: '0 15px 15px' }}>
    <div><span style={{ fontSize: '2rem' }}>{team.logo}</span><h2>{team.name}</h2><p>{team.stadium} | مدرب: {team.coach}</p></div>
    <div>⭐ {team.stars.join(' · ')}</div>
  </div>;
};

const SmartDigest: React.FC<{ team: Team }> = ({ team }) => (
  <div style={{ background: '#f0f2f5', borderRadius: 20, padding: 15, marginBottom: 20, borderRight: `4px solid ${team.color}` }}>
    <div><span>🧠</span> الملخص الذكي - {team.name}</div>
    <div>📊 فوز {team.name} 3-1</div><div>📅 السبت ضد الغريم</div><div>🔴 {team.stars[0]} جاهز</div><div>💼 صفقة جديدة</div><div>🚑 لا إصابات</div>
  </div>
);

const TeamCompare: React.FC<{ teams: Team[]; onClose: () => void }> = ({ teams, onClose }) => {
  const [a, setA] = useState(teams[0].id);
  const [b, setB] = useState(teams[1].id);
  const [res, setRes] = useState<any>(null);
  const ta = teams.find(t => t.id === a)!;
  const tb = teams.find(t => t.id === b)!;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', borderRadius: 24, padding: 25, maxWidth: 500, width: '90%' }}>
        <button onClick={onClose} style={{ float: 'right' }}>✕</button>
        <h3>⚔️ مقارنة ذكية</h3>
        <select value={a} onChange={e => setA(e.target.value)}>{teams.map(t => <option key={t.id} value={t.id}>{t.logo} {t.name}</option>)}</select> 🆚
        <select value={b} onChange={e => setB(e.target.value)}>{teams.map(t => <option key={t.id} value={t.id}>{t.logo} {t.name}</option>)}</select>
        <button onClick={() => setRes({ ach: `${ta.achievements[0]} vs ${tb.achievements[0]}`, star: `${ta.stars[0]} vs ${tb.stars[0]}`, pred: AI.predict(ta.name, tb.name) })}>🧠 قارن</button>
        {res && <div><div>🏆 {res.ach}</div><div>⭐ {res.star}</div><div>🤖 توقع: {res.pred.score} ({res.pred.winner})</div></div>}
      </div>
    </div>
  );
};

const PredictionChallenge: React.FC<{ favoriteTeam: string; darkMode: boolean }> = ({ favoriteTeam, darkMode }) => {
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  useEffect(() => {
    const saved = localStorage.getItem('football_predictions');
    if (saved) setHistory(JSON.parse(saved));
  }, []);
  const totalPoints = history.reduce((acc, curr) => acc + curr.points, 0);
  const handleSave = () => {
    if (homeScore === '' || awayScore === '') return;
    const newPrediction = { id: Date.now().toString(), predictedScore: `${homeScore} - ${awayScore}`, points: 10, date: Date.now() };
    const updated = [newPrediction, ...history].slice(0, 5);
    setHistory(updated);
    localStorage.setItem('football_predictions', JSON.stringify(updated));
    setHomeScore('');
    setAwayScore('');
  };
  const bgColor = darkMode ? '#0f3460' : 'white';
  const textColor = darkMode ? 'white' : 'black';
  const borderColor = darkMode ? '#2a4a7a' : '#ddd';
  return (
    <div style={{ background: bgColor, borderRadius: 20, padding: 20, marginBottom: 20, border: `2px dashed #667eea`, color
