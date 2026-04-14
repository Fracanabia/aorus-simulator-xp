'use client'

import React, { useState, useMemo, useEffect } from 'react';
import {
  Calculator,
  TrendingUp,
  Zap,
  Sword,
  Gem,
  Clock,
  Calendar,
  ChevronRight,
  Info,
  BarChart3,
  Activity,
  LayoutDashboard,
  RefreshCw,
  AlertTriangle,
  Plus,
  Trash2,
  ListChecks,
  Repeat,
  Trophy,
  MapPin
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import HeaderLogo from '@/components/HeaderLogo';

interface BonusState {
  xp100: boolean;
  xp120: boolean;
  comp: boolean;
  pk: boolean;
  relic: boolean;
  vip: boolean;
  phoenix: boolean;
}

interface Quest {
  id: string;
  name: string;
  exp: number;
  active: boolean;
  type: 'daily' | 'daily_solo' | 'repetitive' | 'solo';
  mobsNeeded?: number;
  isFixed?: boolean;
}

interface MapConfig {
  id: string;
  name: string;
  mobsPerMin: number;
  expPerMob: number;
  activeTime: number;
  idleTime: number;
}

export default function App() {
  // Utility State
  const initialXpRecebida = 25740;
  const initialUBoosts: BonusState = {
    xp100: false,
    xp120: false,
    comp: false,
    pk: false,
    relic: false,
    vip: false,
    phoenix: false
  };

  const calculateBase = (xp: number, boosts: BonusState) => {
    let bonus = 0;
    if (boosts.xp100) bonus += 100;
    if (boosts.xp120) bonus += 120;
    if (boosts.comp) bonus += 10;
    if (boosts.pk) bonus += 15;
    if (boosts.relic) bonus += 15;
    if (boosts.vip) bonus += 10;
    if (boosts.phoenix) bonus += 20;
    return xp / (1 + bonus / 100);
  };

  const initialBase = calculateBase(initialXpRecebida, initialUBoosts);

  const [xpRecebida, setXpRecebida] = useState<number>(initialXpRecebida);
  const [uBoosts, setUBoosts] = useState<BonusState>(initialUBoosts);
  const [baseCalculada, setBaseCalculada] = useState<number>(initialBase);

  // Simulator State
  const [baseXP, setBaseXP] = useState<number>(initialBase);
  const [sBoosts, setSBoosts] = useState<BonusState>({
    xp100: false,
    xp120: false,
    comp: false,
    pk: false,
    relic: false,
    vip: false,
    phoenix: false
  });
  const [mobsPerMin, setMobsPerMin] = useState<number>(150);
  const [mapConfigs, setMapConfigs] = useState<MapConfig[]>([]);
  const [editingMapId, setEditingMapId] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [newMapConfig, setNewMapConfig] = useState({
    name: '',
    mobsPerMin: 0,
    expPerMob: 0,
    activeTime: 0,
    idleTime: 0
  });

  // Load Map Configs
  useEffect(() => {
    const saved = localStorage.getItem('aorus_map_configs');
    if (saved) {
      try {
        setMapConfigs(JSON.parse(saved));
      } catch (e) {
        setMapConfigs([]);
      }
    }
  }, []);

  // Save Map Configs
  useEffect(() => {
    localStorage.setItem('aorus_map_configs', JSON.stringify(mapConfigs));
  }, [mapConfigs]);

  const mapStats = useMemo(() => {
    if (mapConfigs.length === 0) {
      return {
        avgMobsPerMin: mobsPerMin,
        avgXPPerMob: xpRecebida,
        totalActiveTime: 0,
        totalIdleTime: 0,
        totalHours: 0
      };
    }

    const totalMobsInDay = mapConfigs.reduce((acc, map) => {
      return acc + (map.mobsPerMin * 60 * map.activeTime);
    }, 0);

    const totalXPInDay = mapConfigs.reduce((acc, map) => {
      return acc + (map.expPerMob * map.mobsPerMin * 60 * map.activeTime);
    }, 0);

    const totalActiveTime = mapConfigs.reduce((acc, m) => acc + m.activeTime, 0);
    const totalIdleTime = mapConfigs.reduce((acc, m) => acc + m.idleTime, 0);

    return {
      avgMobsPerMin: totalMobsInDay / 1440,
      avgXPPerMob: totalMobsInDay > 0 ? totalXPInDay / totalMobsInDay : 0,
      totalActiveTime,
      totalIdleTime,
      totalHours: totalActiveTime + totalIdleTime
    };
  }, [mapConfigs, mobsPerMin, xpRecebida]);

  const calculatedMobsPerMin = mapStats.avgMobsPerMin;
  const calculatedXPPerMob = mapStats.avgXPPerMob;

  // Sync xpRecebida and baseXP with map average
  useEffect(() => {
    if (mapConfigs.length > 0 && calculatedXPPerMob > 0) {
      const newXpRecebida = Math.round(calculatedXPPerMob);
      setXpRecebida(newXpRecebida);
      
      // Also update the base calculation automatically
      const rawBase = calculateBase(newXpRecebida, uBoosts);
      setBaseCalculada(Math.ceil(rawBase));
      setBaseXP(rawBase);
    }
  }, [calculatedXPPerMob, mapConfigs.length, uBoosts]);

  const addMapConfig = () => {
    if (!newMapConfig.name || newMapConfig.mobsPerMin <= 0 || newMapConfig.activeTime <= 0) return;

    const otherMapsHours = mapConfigs
      .filter(m => m.id !== editingMapId)
      .reduce((acc, m) => acc + m.activeTime + m.idleTime, 0);

    if (otherMapsHours + newMapConfig.activeTime + newMapConfig.idleTime > 24) {
      setMapError("O total de horas (Ativo + Ocioso) não pode ultrapassar 24 horas!");
      return;
    }

    setMapError(null);
    if (editingMapId) {
      setMapConfigs(mapConfigs.map(m => m.id === editingMapId ? { ...newMapConfig, id: editingMapId } : m));
      setEditingMapId(null);
    } else {
      const config: MapConfig = {
        id: Math.random().toString(36).substr(2, 9),
        ...newMapConfig
      };
      setMapConfigs([...mapConfigs, config]);
    }

    setNewMapConfig({ name: '', mobsPerMin: 0, expPerMob: 0, activeTime: 0, idleTime: 0 });
  };

  const startEditMap = (map: MapConfig) => {
    setEditingMapId(map.id);
    setNewMapConfig({
      name: map.name,
      mobsPerMin: map.mobsPerMin,
      expPerMob: map.expPerMob,
      activeTime: map.activeTime,
      idleTime: map.idleTime
    });
  };

  const removeMapConfig = (id: string) => {
    setMapConfigs(mapConfigs.filter(m => m.id !== id));
    if (editingMapId === id) {
      setEditingMapId(null);
      setNewMapConfig({ name: '', mobsPerMin: 0, expPerMob: 0, activeTime: 0, idleTime: 0 });
    }
  };

  const totalHoursConfigured = mapStats.totalHours;

  const [days, setDays] = useState<number>(30);
  const [partySize, setPartySize] = useState<number>(6);


  const getDefaultQuests = (): Quest[] => {
    const K = 1e3;
    const M = 1e6;
    const B = 1e9;
    const T = 1e12;
    const daily: Quest[] = [
      {
        id: "w52l04pgx",
        name: "Firelands",
        exp: 5.2 * B,
        active: false,
        type: "daily",
        isFixed: true
      },
      {
        id: "vow255ldw",
        name: "Mistery Desert 3",
        exp: 5.2 * B,
        active: false,
        type: "daily",
        isFixed: true
      },
      {
        id: "jfstwvbhl",
        name: "Ice mine",
        exp: 5.2 * B,
        active: false,
        type: "daily",
        isFixed: true
      },
      {
        id: "4dx5n1t5v",
        name: "Secret Laboratory",
        exp: 6.5 * B,
        active: false,
        type: "daily",
        isFixed: true
      },
      {
        id: "4dx5n1xt5v",
        name: "Secret Laboratory 2",
        exp: 6.5 * B,
        active: false,
        type: "daily",
        isFixed: true
      }
    ];

    const solo: Quest[] = [
      {
        id: "cn81pnor2",
        name: "Firelands",
        exp: 250 * M,
        active: false,
        type: "solo",
        mobsNeeded: 250,
        isFixed: true
      },
      {
        id: "okb8r13f7",
        name: "Ice mine",
        exp: 180 * M,
        active: false,
        type: "solo",
        mobsNeeded: 250,
        isFixed: true
      },
      {
        id: "1fjfq2ledi",
        name: "Mistery Desert 3",
        exp: 180 * M,
        active: false,
        type: "solo",
        mobsNeeded: 250,
        isFixed: true
      },
      {
        id: "1f1jfqledi",
        name: "Secret Laboratory",
        exp: 200 * M,
        active: false,
        type: "solo",
        mobsNeeded: 350,
        isFixed: true
      },
      {
        id: "1fj4fqledi",
        name: "Secret Laboratory 2",
        exp: 200 * M,
        active: false,
        type: "solo",
        mobsNeeded: 350,
        isFixed: true
      }
    ];

    const repetitive: Quest[] = [
      {
        id: "4ckhcmo1a",
        name: "Firelands",
        exp: 200 * M,
        active: false,
        type: "repetitive",
        mobsNeeded: 600,
        isFixed: true
      },
      {
        id: "4ckhxcmo1a",
        name: "Ice mine",
        exp: 90 * M,
        active: false,
        type: "repetitive",
        mobsNeeded: 600,
        isFixed: true
      },
      {
        id: "4ckhacmo1a",
        name: "Mistery Desert 3",
        exp: 90 * M,
        active: false,
        type: "repetitive",
        mobsNeeded: 600,
        isFixed: true
      },
      {
        id: "4ckhascmo1a",
        name: "Secret Laboratory",
        exp: 100 * M,
        active: false,
        type: "repetitive",
        mobsNeeded: 800,
        isFixed: true
      },
      {
        id: "4ckhasc2mo1a",
        name: "Secret Laboratory 2",
        exp: 100 * M,
        active: false,
        type: "repetitive",
        mobsNeeded: 800,
        isFixed: true
      },
    ];

    const dailySolo: Quest[] = [
      {
        id: "7239xavhhhj",
        name: "Shy",
        exp: 1.5 * B,
        active: false,
        type: "daily_solo",
        isFixed: true
      },
      {
        id: "7239xvahhhj",
        name: "Fury",
        exp: 1.5 * B,
        active: false,
        type: "daily_solo",
        isFixed: true
      },
      {
        id: "723s9avhhhj",
        name: "Mokova",
        exp: 1.5 * B,
        active: false,
        type: "daily_solo",
        isFixed: true
      },
      {
        id: "7239xvhhhj",
        name: "Kelvezu",
        exp: 1.5 * B,
        active: false,
        type: "daily_solo",
        isFixed: true
      },
      {
        id: "7239vhhhj",
        name: "Valento",
        exp: 1.5 * B,
        active: false,
        type: "daily_solo",
        isFixed: true
      },
      {
        id: "7239vhh1j",
        name: "Babel",
        exp: 1.5 * B,
        active: false,
        type: "daily_solo",
        isFixed: true
      },
      {
        id: "7239ahh1j",
        name: "Aorus God",
        exp: 1.5 * B,
        active: false,
        type: "daily_solo",
        isFixed: true
      },
      {
        id: "ysk6k22wr",
        name: "Hells Gate",
        exp: 2 * B,
        active: false,
        type: "daily_solo",
        isFixed: true
      },
      {
        id: "61xn4gfp9",
        name: "TULLA",
        exp: 1.5 * B,
        active: false,
        type: "daily_solo",
        isFixed: true
      },
      {
        id: "x61xn4gfp9",
        name: "BG 1 Vitória",
        exp: 2.4 * B,
        active: false,
        type: "daily_solo",
        isFixed: true
      },
      {
        id: "x61xn4gfp9x",
        name: "BG 1 Derrota",
        exp: 1.2 * B,
        active: false,
        type: "daily_solo",
        isFixed: true
      },
      {
        id: "x61xn4gfp9x2",
        name: "BG 2 Vitória",
        exp: 2.4 * B,
        active: false,
        type: "daily_solo",
        isFixed: true
      },
      {
        id: "x61xn4xgfp9x2",
        name: "BG 2 Derrota",
        exp: 1.2 * B,
        active: false,
        type: "daily_solo",
        isFixed: true
      }
    ];

    return [
      ...daily,
      ...solo,
      ...repetitive,
      ...dailySolo,
    ];
  };

  const [quests, setQuests] = useState<Quest[]>([]);
  const [editingQuestId, setEditingQuestId] = useState<string | null>(null);

  // 👇 carrega do localStorage no client
  useEffect(() => {
    const saved = localStorage.getItem('aorus_quests');
    const defaults = getDefaultQuests();

    if (saved) {
      try {
        const parsed: Quest[] = JSON.parse(saved);
        const existingIds = new Set(parsed.map(q => q.id));
        const missingDefaults = defaults.filter(d => !existingIds.has(d.id));

        if (missingDefaults.length > 0) {
          setQuests([...parsed, ...missingDefaults]);
        } else {
          setQuests(parsed);
        }
      } catch (e) {
        setQuests(defaults);
      }
    } else {
      setQuests(defaults);
    }
  }, []);

  // Load XP States
  useEffect(() => {
    const saved = localStorage.getItem('aorus_xp_states');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.xpRecebida) setXpRecebida(parsed.xpRecebida);
        if (parsed.uBoosts) setUBoosts(parsed.uBoosts);
        if (parsed.baseXP) setBaseXP(parsed.baseXP);
        if (parsed.sBoosts) setSBoosts(parsed.sBoosts);
        if (parsed.partySize) setPartySize(parsed.partySize);
        if (parsed.days) setDays(parsed.days);

        // Recalculate baseCalculada if needed
        if (parsed.xpRecebida && parsed.uBoosts) {
          setBaseCalculada(Math.ceil(calculateBase(parsed.xpRecebida, parsed.uBoosts)));
        }
      } catch (e) {
        console.error("Error loading XP states", e);
      }
    }
  }, []);

  const [newQuest, setNewQuest] = useState({
    name: '',
    exp: 0,
    mobsNeeded: 0,
    type: 'daily' as 'daily' | 'daily_solo' | 'repetitive' | 'solo'
  });

  // Save Quests
  useEffect(() => {
    localStorage.setItem('aorus_quests', JSON.stringify(quests));
  }, [quests]);

  // Save XP States
  useEffect(() => {
    const states = {
      xpRecebida,
      uBoosts,
      baseXP,
      sBoosts,
      partySize,
      days
    };
    localStorage.setItem('aorus_xp_states', JSON.stringify(states));
  }, [xpRecebida, uBoosts, baseXP, sBoosts, partySize, days]);

  // Header State
  const [secondsLeft, setSecondsLeft] = useState(300); // 5 minutes sync
  const [scraping, setScraping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Timer Effect
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 300));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleManualScrape = () => {
    setScraping(true);
    // Mock sync
    setTimeout(() => {
      setScraping(false);
      setSecondsLeft(300);
    }, 2000);
  };

  const handleCalcularBase = () => {
    const rawBase = calculateBase(xpRecebida, uBoosts);
    setBaseCalculada(Math.ceil(rawBase));
    setBaseXP(rawBase);
  };

  // Calculations
  const calcTotalXPPerMob = (base: number, boosts: BonusState) => {
    let bonus = 0;
    if (boosts.xp100) bonus += 100;
    if (boosts.xp120) bonus += 120;
    if (boosts.comp) bonus += 10;
    if (boosts.pk) bonus += 15;
    if (boosts.relic) bonus += 15;
    if (boosts.vip) bonus += 10;
    if (boosts.phoenix) bonus += 20;
    return base * (1 + bonus / 100);
  };

  const totalXPPerMob = useMemo(() => calcTotalXPPerMob(baseXP, sBoosts), [baseXP, sBoosts]);

  const chartData = useMemo(() => {
    const minPerDay = 1440;
    const data = [];
    const currentMobsPerMin = calculatedMobsPerMin;

    // Calculate daily quest XP (Group)
    const dailyQuestsXP = quests
      .filter(q => q.active && q.type === 'daily')
      .reduce((acc, q) => acc + q.exp, 0);

    // Calculate daily quest XP (Solo)
    const dailySoloQuestsXP = quests
      .filter(q => q.active && q.type === 'daily_solo')
      .reduce((acc, q) => acc + q.exp, 0);

    // Calculate repetitive quest XP per minute (Group)
    const activeRepetitiveQuests = quests.filter(q => q.active && q.type === 'repetitive');
    const totalRepetitiveMobs = activeRepetitiveQuests.reduce((acc, q) => acc + (q.mobsNeeded || 0), 0);
    const totalRepetitiveXP = activeRepetitiveQuests.reduce((acc, q) => acc + q.exp, 0);
    const repetitiveQuestsXPPerMin = totalRepetitiveMobs > 0 ? (currentMobsPerMin / totalRepetitiveMobs) * totalRepetitiveXP : 0;

    // Calculate solo repetitive quest XP per minute
    const activeSoloQuests = quests.filter(q => q.active && q.type === 'solo');
    const totalSoloMobs = activeSoloQuests.reduce((acc, q) => acc + (q.mobsNeeded || 0), 0);
    const totalSoloXP = activeSoloQuests.reduce((acc, q) => acc + q.exp, 0);
    const soloMobsPerMin = currentMobsPerMin / (partySize || 1);
    const soloQuestsXPPerMin = totalSoloMobs > 0 ? (soloMobsPerMin / totalSoloMobs) * totalSoloXP : 0;

    for (let i = 1; i <= days; i++) {
      const mins = minPerDay * i;
      const baseTotal = baseXP * currentMobsPerMin * mins;

      const xp100Val = sBoosts.xp100 ? baseXP : 0;
      const xp120Val = sBoosts.xp120 ? baseXP * 1.2 : 0;
      const compVal = sBoosts.comp ? baseXP * (10 / 100) : 0;
      const pkVal = sBoosts.pk ? baseXP * (15 / 100) : 0;
      const relicVal = sBoosts.relic ? baseXP * (15 / 100) : 0;
      const vipVal = sBoosts.vip ? baseXP * (10 / 100) : 0;
      const phoenixVal = sBoosts.phoenix ? baseXP * (20 / 100) : 0;

      const currentDailyXP = dailyQuestsXP * i;
      const currentDailySoloXP = dailySoloQuestsXP * i;
      const currentRepetitiveXP = Math.floor(repetitiveQuestsXPPerMin * mins);
      const currentSoloXP = Math.floor(soloQuestsXPPerMin * mins);

      const totalAccumulated = Math.floor(totalXPPerMob * currentMobsPerMin * mins) + currentDailyXP + currentDailySoloXP + currentRepetitiveXP + currentSoloXP;

      data.push({
        day: `Dia ${i}`,
        total: totalAccumulated,
        base: Math.floor(baseTotal),
        xp100: Math.floor((baseXP + xp100Val) * currentMobsPerMin * mins),
        xp120: Math.floor((baseXP + xp120Val) * currentMobsPerMin * mins),
        comp: Math.floor((baseXP + compVal) * currentMobsPerMin * mins),
        pk: Math.floor((baseXP + pkVal) * currentMobsPerMin * mins),
        relic: Math.floor((baseXP + relicVal) * currentMobsPerMin * mins),
        vip: Math.floor((baseXP + vipVal) * currentMobsPerMin * mins),
        phoenix: Math.floor((baseXP + phoenixVal) * currentMobsPerMin * mins),
        dailies: Math.floor(baseTotal + currentDailyXP),
        dailiesSolo: Math.floor(baseTotal + currentDailySoloXP),
        repetitives: Math.floor(baseTotal + currentRepetitiveXP),
        soloQuests: Math.floor(baseTotal + currentSoloXP)
      });
    }
    return data;
  }, [baseXP, sBoosts, totalXPPerMob, calculatedMobsPerMin, days, quests, partySize]);

  const formatXP = (n: number) => {
    if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
    if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
    if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
    return n.toString();
  };

  const compositionData = useMemo(() => {
    const minPerDay = 1440;
    const currentMobsPerMin = calculatedMobsPerMin;
    const base = baseXP * currentMobsPerMin * minPerDay;
    const xp100 = sBoosts.xp100 ? baseXP * currentMobsPerMin * minPerDay : 0;
    const xp120 = sBoosts.xp120 ? baseXP * 1.2 * currentMobsPerMin * minPerDay : 0;
    const comp = sBoosts.comp ? baseXP * (10 / 100) * currentMobsPerMin * minPerDay : 0;
    const pk = sBoosts.pk ? baseXP * (15 / 100) * currentMobsPerMin * minPerDay : 0;
    const relic = sBoosts.relic ? baseXP * (15 / 100) * currentMobsPerMin * minPerDay : 0;
    const vip = sBoosts.vip ? baseXP * (10 / 100) * currentMobsPerMin * minPerDay : 0;
    const phoenix = sBoosts.phoenix ? baseXP * (20 / 100) * currentMobsPerMin * minPerDay : 0;

    const activeRepetitiveQuests = quests.filter(q => q.active && q.type === 'repetitive');
    const totalRepetitiveMobs = activeRepetitiveQuests.reduce((acc, q) => acc + (q.mobsNeeded || 0), 0);
    const totalRepetitiveXP = activeRepetitiveQuests.reduce((acc, q) => acc + q.exp, 0);
    const repetitiveQuestsXPPerDay = totalRepetitiveMobs > 0 ? (currentMobsPerMin / totalRepetitiveMobs) * totalRepetitiveXP * minPerDay : 0;

    const dailyQuestsXP = quests
      .filter(q => q.active && q.type === 'daily')
      .reduce((acc, q) => acc + q.exp, 0);

    const dailySoloQuestsXP = quests
      .filter(q => q.active && q.type === 'daily_solo')
      .reduce((acc, q) => acc + q.exp, 0);

    const activeSoloQuests = quests.filter(q => q.active && q.type === 'solo');
    const totalSoloMobs = activeSoloQuests.reduce((acc, q) => acc + (q.mobsNeeded || 0), 0);
    const totalSoloXP = activeSoloQuests.reduce((acc, q) => acc + q.exp, 0);
    const soloMobsPerMin = currentMobsPerMin / (partySize || 1);
    const soloQuestsXPPerDay = totalSoloMobs > 0 ? (soloMobsPerMin / totalSoloMobs) * totalSoloXP * minPerDay : 0;

    return [
      { name: 'Base', value: base, color: '#475569' },
      ...(xp100 ? [{ name: 'XP 100%', value: xp100, color: '#3b82f6' }] : []),
      ...(xp120 ? [{ name: 'XP 120%', value: xp120, color: '#8b5cf6' }] : []),
      ...(comp ? [{ name: 'Complementar', value: comp, color: '#10b981' }] : []),
      ...(pk ? [{ name: 'PK', value: pk, color: '#ef4444' }] : []),
      ...(relic ? [{ name: 'Relíquia', value: relic, color: '#f59e0b' }] : []),
      ...(vip ? [{ name: 'VIP', value: vip, color: '#0ea5e9' }] : []),
      ...(phoenix ? [{ name: 'Phoenix', value: phoenix, color: '#f43f5e' }] : []),
      ...(dailyQuestsXP ? [{ name: 'Diárias (G)', value: dailyQuestsXP, color: '#3b82f6' }] : []),
      ...(dailySoloQuestsXP ? [{ name: 'Diárias (S)', value: dailySoloQuestsXP, color: '#06b6d4' }] : []),
      ...(repetitiveQuestsXPPerDay ? [{ name: 'Repetitivas (G)', value: repetitiveQuestsXPPerDay, color: '#a855f7' }] : []),
      ...(soloQuestsXPPerDay ? [{ name: 'Repetitivas (S)', value: soloQuestsXPPerDay, color: '#ec4899' }] : []),
    ];
  }, [baseXP, sBoosts, quests, calculatedMobsPerMin, partySize]);

  const currentRate = useMemo(() => {
    const currentMobsPerMin = calculatedMobsPerMin;
    const activeRepetitiveQuests = quests.filter(q => q.active && q.type === 'repetitive');
    const totalRepetitiveMobs = activeRepetitiveQuests.reduce((acc, q) => acc + (q.mobsNeeded || 0), 0);
    const totalRepetitiveXP = activeRepetitiveQuests.reduce((acc, q) => acc + q.exp, 0);
    const repetitiveXP = totalRepetitiveMobs > 0 ? (currentMobsPerMin / totalRepetitiveMobs) * totalRepetitiveXP : 0;

    const activeSoloQuests = quests.filter(q => q.active && q.type === 'solo');
    const totalSoloMobs = activeSoloQuests.reduce((acc, q) => acc + (q.mobsNeeded || 0), 0);
    const totalSoloXP = activeSoloQuests.reduce((acc, q) => acc + q.exp, 0);
    const soloMobsPerMin = currentMobsPerMin / (partySize || 1);
    const soloXP = totalSoloMobs > 0 ? (soloMobsPerMin / totalSoloMobs) * totalSoloXP : 0;

    const dailyXP = quests
      .filter(q => q.active && q.type === 'daily')
      .reduce((acc, q) => acc + q.exp, 0) / 1440;

    const dailySoloXP = quests
      .filter(q => q.active && q.type === 'daily_solo')
      .reduce((acc, q) => acc + q.exp, 0) / 1440;

    return (totalXPPerMob * currentMobsPerMin) + repetitiveXP + soloXP + dailyXP + dailySoloXP;
  }, [totalXPPerMob, calculatedMobsPerMin, quests, partySize]);

  const toggleBoost = (type: 'u' | 's', boost: keyof BonusState) => {
    const setter = type === 'u' ? setUBoosts : setSBoosts;
    setter(prev => {
      const next = { ...prev, [boost]: !prev[boost] };
      // Mutual exclusion for XP 100 and 120
      if (boost === 'xp100' && next.xp100) next.xp120 = false;
      if (boost === 'xp120' && next.xp120) next.xp100 = false;
      return next;
    });
  };

  const addQuest = () => {
    if (!newQuest.name || newQuest.exp <= 0) return;
    if ((newQuest.type === 'repetitive' || newQuest.type === 'solo') && newQuest.mobsNeeded <= 0) return;

    if (editingQuestId) {
      setQuests(quests.map(q => q.id === editingQuestId ? {
        ...q,
        name: newQuest.name,
        exp: newQuest.exp,
        mobsNeeded: (newQuest.type === 'repetitive' || newQuest.type === 'solo') ? newQuest.mobsNeeded : undefined
      } : q));
      setEditingQuestId(null);
    } else {
      const quest: Quest = {
        id: Math.random().toString(36).substr(2, 9),
        name: newQuest.name,
        exp: newQuest.exp,
        active: true,
        type: newQuest.type,
        mobsNeeded: (newQuest.type === 'repetitive' || newQuest.type === 'solo') ? newQuest.mobsNeeded : undefined
      };
      setQuests([...quests, quest]);
    }
    setNewQuest({ name: '', exp: 0, mobsNeeded: 0, type: newQuest.type });
  };

  const startEditQuest = (quest: Quest) => {
    setEditingQuestId(quest.id);
    setNewQuest({
      name: quest.name,
      exp: quest.exp,
      mobsNeeded: quest.mobsNeeded || 0,
      type: quest.type
    });
  };

  const removeQuest = (id: string) => {
    setQuests(quests.filter(q => q.id !== id || q.isFixed));
    if (editingQuestId === id) {
      setEditingQuestId(null);
      setNewQuest({ name: '', exp: 0, mobsNeeded: 0, type: newQuest.type });
    }
  };

  const toggleQuest = (id: string) => {
    setQuests(quests.map(q => q.id === id ? { ...q, active: !q.active } : q));
  };

  return (
    <div className="min-h-screen bg-black text-slate-300 p-4 md:p-8 font-['Exo'] selection:bg-[#ff9c00]/30">
      <div className="max-w-7xl mx-auto space-y-6 pb-20">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b-2 border-[#ff9c00]/20 pb-12">
          <HeaderLogo />

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="h-12 w-[1px] bg-white/10 mx-2 hidden sm:block" />

            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Current Rate</p>
              <p className="text-lg font-bold text-[#ff9c00]">
                {formatXP(currentRate)}/min
              </p>
            </div>
          </div>
        </header>

        {error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertTriangle className="text-red-500 w-16 h-16 mb-6 animate-bounce" />
            <h2 className="text-2xl font-black text-white uppercase mb-2 tracking-tight">Interface Offline</h2>
            <p className="text-slate-500 text-sm mb-6">{error}</p>
            <button
              onClick={() => setError(null)}
              className="px-6 py-2 bg-transparent border border-[#ff9c00] text-[#ff9c00] font-black uppercase text-xs rounded-lg hover:bg-[#ff9c00] hover:text-black transition-all"
            >
              Tentar Novamente
            </button>
          </div>
        ) : (
          <main className="space-y-8">
            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <StatCard
                title="XP BASE / MOB"
                value={Math.floor(baseXP).toLocaleString()}
                subtitle="Sem Boosts"
                icon={<Sword size={24} />}
                color="blue"
              />
              <StatCard
                title="XP TOTAL / MOB"
                value={Math.floor(totalXPPerMob).toLocaleString()}
                subtitle="Com Boosts Ativos"
                icon={<Zap size={24} />}
                color="orange"
              />
              <StatCard
                title="XP / HORA"
                value={formatXP(currentRate * 60)}
                subtitle="Taxa de Farm"
                icon={<Clock size={24} />}
                color="blue"
              />
              <StatCard
                title="XP / DIA"
                value={formatXP(currentRate * 1440)}
                subtitle="Projeção Diária"
                icon={<Calendar size={24} />}
                color="emerald"
              />
              <StatCard
                title="PROJEÇÃO MENSAL"
                value={formatXP(currentRate * 1440 * 30)}
                subtitle="Acumulado 30d"
                icon={<TrendingUp size={24} />}
                color="purple"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Configuração de Mapas */}
              <section
                className="aorus-card p-8 rounded-lg border-l-2 border-[#ff9c00] relative overflow-hidden"
              >
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={20} className="text-[#ff9c00]" />
                  <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">
                    Configuração de  <span className="text-[#ff9c00]">Mapas</span>
                  </h2>
                </div>

                <div className="space-y-4">
                  <div className="bg-white/5 border border-white/10 p-3 rounded-lg flex gap-3 items-start">
                    <Info size={16} className="text-[#ff9c00] shrink-0 mt-0.5" />
                    <p className="text-[10px] leading-relaxed text-slate-400">
                      <strong className="text-white block mb-1">COMO FUNCIONA A CONFIGURAÇÃO DO MAPA?</strong>
                      Cadastre os mapas onde você caça, informando os mobs/min e o tempo gasto. O sistema calculará uma média real baseada em um ciclo de 24 horas, considerando o tempo ocioso.
                    </p>
                  </div>

                    <div className="space-y-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Nome do mapa</label>
                        <input
                          type="text"
                          placeholder="Nome do Mapa"
                          value={newMapConfig.name}
                          onChange={(e) => {
                            setNewMapConfig({ ...newMapConfig, name: e.target.value });
                            setMapError(null);
                          }}
                          className="w-full bg-black border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#ff9c00] transition-all text-sm rounded-lg"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Mobs/Min</label>
                          <input
                            type="number"
                            placeholder="Mobs/Min"
                            value={newMapConfig.mobsPerMin || ''}
                            onChange={(e) => {
                              setNewMapConfig({ ...newMapConfig, mobsPerMin: Number(e.target.value) });
                              setMapError(null);
                            }}
                            className="w-full bg-black border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#ff9c00] transition-all text-sm rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Exp/Mob</label>
                          <input
                            type="number"
                            placeholder="Exp/Mob"
                            value={newMapConfig.expPerMob || ''}
                            onChange={(e) => {
                              setNewMapConfig({ ...newMapConfig, expPerMob: Number(e.target.value) });
                              setMapError(null);
                            }}
                            className="w-full bg-black border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#ff9c00] transition-all text-sm rounded-lg"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Horas Ativo</label>
                          <input
                            type="number"
                            placeholder="Horas Ativo"
                            value={newMapConfig.activeTime || ''}
                            onChange={(e) => {
                              setNewMapConfig({ ...newMapConfig, activeTime: Number(e.target.value) });
                              setMapError(null);
                            }}
                            className="w-full bg-black border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#ff9c00] transition-all text-sm rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Horas Ocioso</label>
                          <input
                            type="number"
                            placeholder="Horas Ocioso"
                            value={newMapConfig.idleTime || ''}
                            onChange={(e) => {
                              setNewMapConfig({ ...newMapConfig, idleTime: Number(e.target.value) });
                              setMapError(null);
                            }}
                            className="w-full bg-black border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#ff9c00] transition-all text-sm rounded-lg"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={addMapConfig}
                          className="rounded-lg flex-1 py-2 bg-[#ff9c00]/10 border border-[#ff9c00]/20 text-[#ff9c00] text-[10px] font-black uppercase tracking-widest hover:bg-[#ff9c00] hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                          {editingMapId ? <RefreshCw size={14} /> : <Plus size={14} />}
                          {editingMapId ? 'Salvar Alterações' : 'Adicionar Mapa'}
                        </button>
                        {editingMapId && (
                          <button
                            onClick={() => {
                              setEditingMapId(null);
                              setMapError(null);
                              setNewMapConfig({ name: '', mobsPerMin: 0, expPerMob: 0, activeTime: 0, idleTime: 0 });
                            }}
                            className="rounded-lg px-4 py-2 bg-white/5 border border-white/10 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                      {mapError && (
                        <p className="text-[10px] text-red-500 font-bold uppercase flex items-center gap-1 mt-1 ml-1 animate-pulse">
                          <AlertTriangle size={12} /> {mapError}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                      {mapConfigs.map(m => (
                        <div key={m.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 group rounded-lg">
                          <div className="flex-1">
                            <p className="text-[10px] font-bold text-white uppercase">{m.name}</p>
                            <p className="text-[8px] text-slate-500 uppercase">
                              {m.mobsPerMin} mobs/min • {m.expPerMob?.toLocaleString()} exp • {m.activeTime}h Ativo • {m.idleTime}h Ocioso
                            </p>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => startEditMap(m)} className="text-blue-500 hover:text-blue-400 p-1">
                              <RefreshCw size={14} />
                            </button>
                            <button onClick={() => removeMapConfig(m.id)} className="text-red-500 hover:text-red-400 p-1">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-white/5 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                          <span className="text-[8px] font-bold text-slate-500 uppercase block mb-1">Média Mobs/Min</span>
                          <span className="text-xs font-bold text-white">{calculatedMobsPerMin.toFixed(1)}</span>
                        </div>
                        <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                          <span className="text-[8px] font-bold text-slate-500 uppercase block mb-1">Média XP/Mob</span>
                          <span className="text-xs font-bold text-white">{Math.round(calculatedXPPerMob).toLocaleString()}</span>
                        </div>
                        <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                          <span className="text-[8px] font-bold text-slate-500 uppercase block mb-1">Total Ativo</span>
                          <span className="text-xs font-bold text-white">{mapStats.totalActiveTime}h</span>
                        </div>
                        <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                          <span className="text-[8px] font-bold text-slate-500 uppercase block mb-1">Total Ocioso</span>
                          <span className="text-xs font-bold text-white">{mapStats.totalIdleTime}h</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Total de Horas:</span>
                        <span className={`text-xs font-bold ${totalHoursConfigured > 24 ? 'text-red-500' : 'text-emerald-500'}`}>
                          {totalHoursConfigured}h / 24h
                        </span>
                      </div>
                      {totalHoursConfigured > 24 && (
                        <p className="text-[8px] text-red-500 uppercase font-bold flex items-center gap-1">
                          <AlertTriangle size={10} /> O total de horas excede 24h!
                        </p>
                      )}
                    </div>
                </div>
              </section>

              {/* Cálculo de Base */}
              <section
                className="aorus-card p-8 rounded-lg border-l-2 border-[#ff9c00] relative overflow-hidden"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Calculator size={20} className="text-[#ff9c00]" />
                  <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">
                    Cálculo de  <span className="text-[#ff9c00]">XP Base</span>
                  </h2>
                </div>
                <div className="space-y-4">
                  <div className="bg-white/5 border border-white/10 p-3 rounded-lg flex gap-3 items-start">
                    <Info size={16} className="text-[#ff9c00] shrink-0 mt-0.5" />
                    <p className="text-[10px] leading-relaxed text-slate-400">
                      <strong className="text-white block mb-1">COMO FUNCIONA O CÁLCULO BASE?</strong>
                      Insira a XP que você vê subindo na tela do jogo e selecione quais bônus estavam ativos naquele momento. O sistema irá calcular o valor real (base) do monstro sem nenhum multiplicador.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">XP Recebida no Jogo</label>
                    <input
                      type="number"
                      value={xpRecebida}
                      onChange={(e) => setXpRecebida(Number(e.target.value))}
                      className="w-full bg-black border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#ff9c00] transition-all text-sm rounded-lg" />
                  </div>

                  <div className="space-y-1">
                    <AorusCheckboxRow
                      active={uBoosts.xp100}
                      onClick={() => toggleBoost('u', 'xp100')}
                      label="XP 100%"
                    />
                    <AorusCheckboxRow
                      active={uBoosts.xp120}
                      onClick={() => toggleBoost('u', 'xp120')}
                      label="XP 120%"
                    />
                    <AorusCheckboxRow
                      active={uBoosts.comp}
                      onClick={() => toggleBoost('u', 'comp')}
                      label="10% Complementar"
                    />
                    <AorusCheckboxRow
                      active={uBoosts.pk}
                      onClick={() => toggleBoost('u', 'pk')}
                      label="15% PK"
                    />
                    <AorusCheckboxRow
                      active={uBoosts.relic}
                      onClick={() => toggleBoost('u', 'relic')}
                      label="15% Relíquia"
                    />
                    <AorusCheckboxRow
                      active={uBoosts.vip}
                      onClick={() => toggleBoost('u', 'vip')}
                      label="10% VIP"
                    />
                    <AorusCheckboxRow
                      active={uBoosts.phoenix}
                      onClick={() => toggleBoost('u', 'phoenix')}
                      label="20% Phoenix"
                    />
                  </div>

                  <button
                    onClick={handleCalcularBase}
                    className="w-full h-10 px-4 bg-[#ff9c00] hover:bg-[#ffb400] text-black font-black text-[10px] uppercase tracking-widest rounded-lg transition-all shadow-[0_0_20px_rgba(255,156,0,0.2)] flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                  >
                    CALCULAR BASE <ChevronRight size={18} />
                  </button>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Base Estimada:</span>
                    <span className="text-xl font-bold text-[#ff9c00]">{baseCalculada.toLocaleString()}</span>
                  </div>
                </div>
              </section>

              {/* Configurações */}
              <section
                className="aorus-card p-8 rounded-lg border-l-2 border-[#ff9c00] relative overflow-hidden"
              >
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={20} className="text-[#ff9c00]" />
                  <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">
                    Configuração de  <span className="text-[#ff9c00]">XP</span>
                  </h2>
                </div>

                <div className="space-y-4">
                  <div className="bg-white/5 border border-white/10 p-3 rounded-lg flex gap-3 items-start">
                    <Info size={16} className="text-[#ff9c00] shrink-0 mt-0.5" />
                    <p className="text-[10px] leading-relaxed text-slate-400">
                      <strong className="text-white block mb-1">COMO FUNCIONA A CONFIGURAÇÃO?</strong>
                      Defina o valor base do monstro (ou use o valor calculado ao lado) e selecione os bônus que pretende usar. O sistema calculará a XP final estimada por monstro com todos os multiplicadores aplicados.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Base XP do Mob</label>
                    <input
                      type="number"
                      value={baseXP}
                      onChange={(e) => setBaseXP(Number(e.target.value))}
                      className="w-full bg-black border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#ff9c00] transition-all text-sm rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase ml-1 mb-2">Boosts Ativos</label>
                    <div className="space-y-1">
                      <AorusCheckboxRow
                        active={sBoosts.xp100}
                        onClick={() => toggleBoost('s', 'xp100')}
                        label="XP 100%"
                        preview={`+ ${Math.round(baseXP).toLocaleString()}`}
                      />
                      <AorusCheckboxRow
                        active={sBoosts.xp120}
                        onClick={() => toggleBoost('s', 'xp120')}
                        label="XP 120%"
                        preview={`+ ${Math.round(baseXP * 1.2).toLocaleString()}`}
                      />
                      <AorusCheckboxRow
                        active={sBoosts.comp}
                        onClick={() => toggleBoost('s', 'comp')}
                        label="10% Complementar"
                        preview={`+ ${Math.round(baseXP * (10 / 100)).toLocaleString()}`}
                      />
                      <AorusCheckboxRow
                        active={sBoosts.pk}
                        onClick={() => toggleBoost('s', 'pk')}
                        label="15% PK"
                        preview={`+ ${Math.round(baseXP * (15 / 100)).toLocaleString()}`}
                      />
                      <AorusCheckboxRow
                        active={sBoosts.relic}
                        onClick={() => toggleBoost('s', 'relic')}
                        label="15% Relíquia"
                        preview={`+ ${Math.round(baseXP * (15 / 100)).toLocaleString()}`}
                      />
                      <AorusCheckboxRow
                        active={sBoosts.vip}
                        onClick={() => toggleBoost('s', 'vip')}
                        label="10% VIP"
                        preview={`+ ${Math.round(baseXP * (10 / 100)).toLocaleString()}`}
                      />
                      <AorusCheckboxRow
                        active={sBoosts.phoenix}
                        onClick={() => toggleBoost('s', 'phoenix')}
                        label="20% Phoenix"
                        preview={`+ ${Math.round(baseXP * (20 / 100)).toLocaleString()}`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                        <Gem size={10} /> Players
                      </label>
                      <input
                        type="number"
                        value={partySize}
                        onChange={(e) => setPartySize(Number(e.target.value))}
                        className="w-full bg-black border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#ff9c00] transition-all text-sm rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                        <Calendar size={10} /> Dias
                      </label>
                      <input
                        type="number"
                        value={days}
                        onChange={(e) => setDays(Number(e.target.value))}
                        className="w-full bg-black border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#ff9c00] transition-all text-sm rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Mobs/Min (Média):</span>
                    <span className="text-xl font-bold text-[#ff9c00]">{calculatedMobsPerMin.toFixed(1)}</span>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">XP Estimada:</span>
                    <span className="text-xl font-bold text-[#ff9c00]">{Math.round(totalXPPerMob).toLocaleString()}</span>
                  </div>
                </div>
              </section>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {/* Daily Quests (Group) */}
              <section className="aorus-card p-8 rounded-lg border-l-2 border-[#ff9c00]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <ListChecks size={20} className="text-[#ff9c00]" />
                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">
                      Quests Diárias <span className="text-[#ff9c00]">Grupo</span>
                    </h2>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Nova Diária (G)</label>
                      <input
                        type="text"
                        placeholder="Nome da Quest"
                        value={newQuest.type === 'daily' ? newQuest.name : ''}
                        onChange={(e) => setNewQuest({ ...newQuest, name: e.target.value, type: 'daily' })}
                        className="w-full bg-black border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#ff9c00] transition-all text-sm rounded-lg text-xs mb-2"
                      />
                      <input
                        type="number"
                        placeholder="XP Recompensa"
                        value={newQuest.type === 'daily' ? (newQuest.exp || '') : ''}
                        onChange={(e) => setNewQuest({ ...newQuest, exp: Number(e.target.value), type: 'daily' })}
                        className="w-full bg-black border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#ff9c00] transition-all text-sm rounded-lg"
                      />
                    </div>
                    <div className="flex gap-2 col-span-2">
                      <button
                        onClick={addQuest}
                        className="rounded-lg flex-1 py-2 bg-[#ff9c00]/10 border border-[#ff9c00]/20 text-[#ff9c00] text-[10px] font-black uppercase tracking-widest hover:bg-[#ff9c00] hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        {editingQuestId && newQuest.type === 'daily' ? <RefreshCw size={14} /> : <Plus size={14} />}
                        {editingQuestId && newQuest.type === 'daily' ? 'Salvar' : 'Adicionar Diária (G)'}
                      </button>
                      {editingQuestId && newQuest.type === 'daily' && (
                        <button
                          onClick={() => {
                            setEditingQuestId(null);
                            setNewQuest({ name: '', exp: 0, mobsNeeded: 0, type: 'daily' });
                          }}
                          className="rounded-lg px-4 py-2 bg-white/5 border border-white/10 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                    {quests.filter(q => q.type === 'daily').map(q => (
                      <div key={q.id} className="flex items-center justify-between p-2 bg-white/5 border border-white/5 group rounded-lg">
                        <div className="flex items-center gap-3">
                          <button onClick={() => toggleQuest(q.id)} className={`w-4 h-4 border flex items-center justify-center ${q.active ? 'bg-[#ff9c00] border-[#ff9c00]' : 'border-white/20'}`}>
                            {q.active && <Zap size={10} className="text-white fill-white" />}
                          </button>
                          <span className={`text-[10px] font-bold uppercase ${q.active ? 'text-white' : 'text-slate-500'}`}>{q.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[#ff9c00] mr-2">{formatXP(q.exp)}</span>
                          {!q.isFixed && (
                            <button onClick={() => startEditQuest(q)} className="opacity-0 group-hover:opacity-100 text-blue-500 hover:text-blue-400 transition-all p-1">
                              <RefreshCw size={12} />
                            </button>
                          )}
                          {!q.isFixed && (
                            <button onClick={() => removeQuest(q.id)} className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 transition-all p-1">
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Daily Quests (Solo) */}
              <section className="aorus-card p-8 rounded-lg border-l-2 border-[#ff9c00]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <ListChecks size={20} className="text-[#ff9c00]" />
                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">
                      Quests Diárias <span className="text-[#ff9c00]">Solo</span>
                    </h2>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Nova Diária (S)</label>
                      <input
                        type="text"
                        placeholder="Nome da Quest"
                        value={newQuest.type === 'daily_solo' ? newQuest.name : ''}
                        onChange={(e) => setNewQuest({ ...newQuest, name: e.target.value, type: 'daily_solo' })}
                        className="w-full bg-black border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#ff9c00] transition-all text-sm rounded-lg text-xs mb-2"
                      />
                      <input
                        type="number"
                        placeholder="XP Recompensa"
                        value={newQuest.type === 'daily_solo' ? (newQuest.exp || '') : ''}
                        onChange={(e) => setNewQuest({ ...newQuest, exp: Number(e.target.value), type: 'daily_solo' })}
                        className="w-full bg-black border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#ff9c00] transition-all text-sm rounded-lg"
                      />
                    </div>
                    <div className="flex gap-2 col-span-2">
                      <button
                        onClick={addQuest}
                        className="rounded-lg flex-1 py-2 bg-[#ff9c00]/10 border border-[#ff9c00]/20 text-[#ff9c00] text-[10px] font-black uppercase tracking-widest hover:bg-[#ff9c00] hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        {editingQuestId && newQuest.type === 'daily_solo' ? <RefreshCw size={14} /> : <Plus size={14} />}
                        {editingQuestId && newQuest.type === 'daily_solo' ? 'Salvar' : 'Adicionar Diária (S)'}
                      </button>
                      {editingQuestId && newQuest.type === 'daily_solo' && (
                        <button
                          onClick={() => {
                            setEditingQuestId(null);
                            setNewQuest({ name: '', exp: 0, mobsNeeded: 0, type: 'daily_solo' });
                          }}
                          className="rounded-lg px-4 py-2 bg-white/5 border border-white/10 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                    {quests.filter(q => q.type === 'daily_solo').map(q => (
                      <div key={q.id} className="flex items-center justify-between p-2 bg-white/5 border border-white/5 group rounded-lg">
                        <div className="flex items-center gap-3">
                          <button onClick={() => toggleQuest(q.id)} className={`w-4 h-4 border flex items-center justify-center ${q.active ? 'bg-[#ff9c00] border-[#ff9c00]' : 'border-white/20'}`}>
                            {q.active && <Zap size={10} className="text-white fill-white" />}
                          </button>
                          <span className={`text-[10px] font-bold uppercase ${q.active ? 'text-white' : 'text-slate-500'}`}>{q.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[#ff9c00] mr-2">{formatXP(q.exp)}</span>
                          {!q.isFixed && (
                            <button onClick={() => startEditQuest(q)} className="opacity-0 group-hover:opacity-100 text-blue-500 hover:text-blue-400 transition-all p-1">
                              <RefreshCw size={12} />
                            </button>
                          )}
                          {!q.isFixed && (
                            <button onClick={() => removeQuest(q.id)} className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 transition-all p-1">
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Repetitive Quests (Group) */}
              <section className="aorus-card p-8 rounded-lg border-l-2 border-[#ff9c00]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Repeat size={20} className="text-[#ff9c00]" />
                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">
                      Quests Repetitivas <span className="text-[#ff9c00]">Grupo</span>
                    </h2>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Nova Repetitiva (Grupo)</label>
                    <input
                      type="text"
                      placeholder="Nome da Quest"
                      value={newQuest.type === 'repetitive' ? newQuest.name : ''}
                      onChange={(e) => setNewQuest({ ...newQuest, name: e.target.value, type: 'repetitive' })}
                      className="w-full bg-black border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#ff9c00] transition-all text-sm rounded-lg"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="XP Recompensa"
                        value={newQuest.type === 'repetitive' ? (newQuest.exp || '') : ''}
                        onChange={(e) => setNewQuest({ ...newQuest, exp: Number(e.target.value), type: 'repetitive' })}
                        className="w-full bg-black border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#ff9c00] transition-all text-sm rounded-lg"
                      />
                      <input
                        type="number"
                        placeholder="Mobs Necessários"
                        value={newQuest.type === 'repetitive' ? (newQuest.mobsNeeded || '') : ''}
                        onChange={(e) => setNewQuest({ ...newQuest, mobsNeeded: Number(e.target.value), type: 'repetitive' })}
                        className="w-full bg-black border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#ff9c00] transition-all text-sm rounded-lg"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={addQuest}
                        className="rounded-lg flex-1 py-2 bg-[#ff9c00]/10 border border-[#ff9c00]/20 text-[#ff9c00] text-[10px] font-black uppercase tracking-widest hover:bg-[#ff9c00] hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        {editingQuestId && newQuest.type === 'repetitive' ? <RefreshCw size={14} /> : <Plus size={14} />}
                        {editingQuestId && newQuest.type === 'repetitive' ? 'Salvar' : 'Adicionar Repetitiva (G)'}
                      </button>
                      {editingQuestId && newQuest.type === 'repetitive' && (
                        <button
                          onClick={() => {
                            setEditingQuestId(null);
                            setNewQuest({ name: '', exp: 0, mobsNeeded: 0, type: 'repetitive' });
                          }}
                          className="rounded-lg px-4 py-2 bg-white/5 border border-white/10 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                    {quests.filter(q => q.type === 'repetitive').map(q => (
                      <div key={q.id} className="flex items-center justify-between p-2 bg-white/5 border border-white/5 group rounded-lg">
                        <div className="flex items-center gap-3">
                          <button onClick={() => toggleQuest(q.id)} className={`w-4 h-4 border flex items-center justify-center ${q.active ? 'bg-[#ff9c00] border-[#ff9c00]' : 'border-white/20'}`}>
                            {q.active && <Zap size={10} className="text-white fill-white" />}
                          </button>
                          <div>
                            <p className={`text-[10px] font-bold uppercase ${q.active ? 'text-white' : 'text-slate-500'}`}>{q.name}</p>
                            <p className="text-[8px] text-slate-600 uppercase font-bold">{q.mobsNeeded} Mobs</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[#ff9c00] mr-2">{formatXP(q.exp)}</span>
                          {!q.isFixed && (
                            <button onClick={() => startEditQuest(q)} className="opacity-0 group-hover:opacity-100 text-blue-500 hover:text-blue-400 transition-all p-1">
                              <RefreshCw size={12} />
                            </button>
                          )}
                          {!q.isFixed && (
                            <button onClick={() => removeQuest(q.id)} className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 transition-all p-1">
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Repetitive Quests (Solo) */}
              <section className="aorus-card p-8 rounded-lg border-l-2 border-[#ff9c00]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Repeat size={20} className="text-[#ff9c00]" />
                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">
                      Quests Repetitivas <span className="text-[#ff9c00]">Solo</span>
                    </h2>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Nova Repetitiva (Solo)</label>
                    <input
                      type="text"
                      placeholder="Nome da Quest"
                      value={newQuest.type === 'solo' ? newQuest.name : ''}
                      onChange={(e) => setNewQuest({ ...newQuest, name: e.target.value, type: 'solo' })}
                      className="w-full bg-black border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#ff9c00] transition-all text-sm rounded-lg"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="XP Recompensa"
                        value={newQuest.type === 'solo' ? (newQuest.exp || '') : ''}
                        onChange={(e) => setNewQuest({ ...newQuest, exp: Number(e.target.value), type: 'solo' })}
                        className="w-full bg-black border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#ff9c00] transition-all text-sm rounded-lg"
                      />
                      <input
                        type="number"
                        placeholder="Mobs Necessários"
                        value={newQuest.type === 'solo' ? (newQuest.mobsNeeded || '') : ''}
                        onChange={(e) => setNewQuest({ ...newQuest, mobsNeeded: Number(e.target.value), type: 'solo' })}
                        className="w-full bg-black border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#ff9c00] transition-all text-sm rounded-lg"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={addQuest}
                        className="rounded-lg flex-1 py-2 bg-[#ff9c00]/10 border border-[#ff9c00]/20 text-[#ff9c00] text-[10px] font-black uppercase tracking-widest hover:bg-[#ff9c00] hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        {editingQuestId && newQuest.type === 'solo' ? <RefreshCw size={14} /> : <Plus size={14} />}
                        {editingQuestId && newQuest.type === 'solo' ? 'Salvar' : 'Adicionar Repetitiva (S)'}
                      </button>
                      {editingQuestId && newQuest.type === 'solo' && (
                        <button
                          onClick={() => {
                            setEditingQuestId(null);
                            setNewQuest({ name: '', exp: 0, mobsNeeded: 0, type: 'solo' });
                          }}
                          className="rounded-lg px-4 py-2 bg-white/5 border border-white/10 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                    {quests.filter(q => q.type === 'solo').map(q => (
                      <div key={q.id} className="flex items-center justify-between p-2 bg-white/5 border border-white/5 group rounded-lg">
                        <div className="flex items-center gap-3">
                          <button onClick={() => toggleQuest(q.id)} className={`w-4 h-4 border flex items-center justify-center ${q.active ? 'bg-[#ff9c00] border-[#ff9c00]' : 'border-white/20'}`}>
                            {q.active && <Zap size={10} className="text-white fill-white" />}
                          </button>
                          <div>
                            <p className={`text-[10px] font-bold uppercase ${q.active ? 'text-white' : 'text-slate-500'}`}>{q.name}</p>
                            <p className="text-[8px] text-slate-600 uppercase font-bold">{q.mobsNeeded} Mobs</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[#ff9c00] mr-2">{formatXP(q.exp)}</span>
                          {!q.isFixed && (
                            <button onClick={() => startEditQuest(q)} className="opacity-0 group-hover:opacity-100 text-blue-500 hover:text-blue-400 transition-all p-1">
                              <RefreshCw size={12} />
                            </button>
                          )}
                          {!q.isFixed && (
                            <button onClick={() => removeQuest(q.id)} className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 transition-all p-1">
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>

            {/* Charts Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <BarChart3 className="text-[#ff9c00]" size={24} />
                <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">
                  Análise de  <span className="text-[#ff9c00]">Rendimento Detalhada</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {/* Composition Pie Chart */}
                <section
                  className="aorus-card p-8 rounded-lg flex flex-col h-[400px] lg:col-span-1"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Activity size={20} className="text-[#ff9c00] animate-pulse" />
                      <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">
                        Composição de <span className="text-[#ff9c00]">XP</span>
                      </h2>
                    </div>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">Distribuição de XP por dia</p>
                  </div>
                  <div className="flex-1 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={compositionData}
                        margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />

                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                          interval={0}
                          angle={-15}
                          textAnchor="end"
                        />

                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                          tickFormatter={formatXP}
                        />

                        <Tooltip
                          cursor={{ fill: '#ffffff05' }}
                          contentStyle={{
                            backgroundColor: '#0a0a0a',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '16px',
                            padding: '12px',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            color: '#fff'
                          }}
                          itemStyle={{ color: '#ff9c00', textTransform: 'uppercase' }}
                          labelStyle={{ marginBottom: '4px', color: '#64748b' }}
                          formatter={(value: number) => [`${value.toLocaleString()} (${formatXP(value)})`, 'XP']}
                        />

                        <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                          {compositionData.map((_entry, index) => (
                            <Cell
                              key={`shel-${index}`}
                              fill={index === 0 ? '#ff9c00' : '#ff9c0044'}
                              className="transition-all duration-300 hover:fill-orange-400"
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>

              </div>

              {/* Main Accumulated Chart */}
              <div className="lg:col-span-2">
                <ChartContainer
                  title={
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy size={20} className="text-[#ff9c00]" />
                      <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">
                        Acumulado <span className="text-[#ff9c00]">Total</span>
                      </h2>
                    </div>
                  }
                  subtitle="Crescimento total projetado"
                  data={chartData}
                  dataKey="total"
                  color="#ff9c00"
                  days={days}
                  formatXP={formatXP}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Base XP Chart */}
                <ChartContainer
                  title={
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy size={20} className="text-[#ff9c00]" />
                      <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">
                        XP <span className="text-[#ff9c00]">Base</span>
                      </h2>
                    </div>
                  }
                  subtitle="Rendimento Base (Sem Boosts)"
                  data={chartData}
                  dataKey="base"
                  color="#f59e0b"
                  days={days}
                  formatXP={formatXP}
                />

                {/* Individual Boost Charts */}
                {quests.some(q => q.active && q.type === 'daily') && (
                  <ChartContainer
                    title={
                      <div className="flex items-center gap-2 mb-2">
                        <Trophy size={20} className="text-[#ff9c00]" />
                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">
                          QUEST DIÁRIA<span className="text-[#ff9c00]"> GRUPO</span>
                        </h2>
                      </div>
                    }
                    subtitle="XP acumulada de diárias em grupo"
                    data={chartData}
                    dataKey="dailies"
                    color="#f59e0b"
                    days={days}
                    formatXP={formatXP}
                  />
                )}

                {quests.some(q => q.active && q.type === 'repetitive') && (
                  <ChartContainer
                    title={
                      <div className="flex items-center gap-2 mb-2">
                        <Trophy size={20} className="text-[#ff9c00]" />
                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">
                          QUEST REPETITIVAS<span className="text-[#ff9c00]"> GRUPO</span>
                        </h2>
                      </div>
                    }
                    subtitle="XP acumulada de repetitivas em grupo"
                    data={chartData}
                    dataKey="repetitives"
                    color="#f59e0b"
                    days={days}
                    formatXP={formatXP}
                  />
                )}

                {quests.some(q => q.active && q.type === 'daily_solo') && (
                  <ChartContainer
                    title={
                      <div className="flex items-center gap-2 mb-2">
                        <Trophy size={20} className="text-[#ff9c00]" />
                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">
                          QUEST DIÁRIAS<span className="text-[#ff9c00]"> SOLO</span>
                        </h2>
                      </div>
                    }
                    subtitle="XP acumulada de diárias solo"
                    data={chartData}
                    dataKey="dailiesSolo"
                    color="#f59e0b"
                    days={days}
                    formatXP={formatXP}
                  />
                )}

                {quests.some(q => q.active && q.type === 'solo') && (
                  <ChartContainer
                    title={
                      <div className="flex items-center gap-2 mb-2">
                        <Trophy size={20} className="text-[#ff9c00]" />
                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">
                          QUEST REPETITIVAS<span className="text-[#ff9c00]"> SOLO</span>
                        </h2>
                      </div>
                    }
                    subtitle="XP acumulada de repetitivas solo"
                    data={chartData}
                    dataKey="soloQuests"
                    color="#f59e0b"
                    days={days}
                    formatXP={formatXP}
                  />
                )}

                {sBoosts.xp100 && (
                  <ChartContainer
                    title={
                      <div className="flex items-center gap-2 mb-2">
                        <Trophy size={20} className="text-[#ff9c00]" />
                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">
                          POÇÃO<span className="text-[#ff9c00]"> XP 100%</span>
                        </h2>
                      </div>
                    }
                    subtitle="Bônus direto de 100%"
                    data={chartData}
                    dataKey="xp100"
                    color="#f59e0b"
                    days={days}
                    formatXP={formatXP}
                  />
                )}

                {sBoosts.xp120 && (
                  <ChartContainer
                    title={
                      <div className="flex items-center gap-2 mb-2">
                        <Trophy size={20} className="text-[#ff9c00]" />
                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">
                          POÇÃO<span className="text-[#ff9c00]"> XP 120%</span>
                        </h2>
                      </div>
                    }
                    subtitle="Bônus direto de 120%"
                    data={chartData}
                    dataKey="xp120"
                    color="#f59e0b"
                    days={days}
                    formatXP={formatXP}
                  />
                )}

                {sBoosts.comp && (
                  <ChartContainer
                    title={
                      <div className="flex items-center gap-2 mb-2">
                        <Trophy size={20} className="text-[#ff9c00]" />
                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">
                          BÔNUS<span className="text-[#ff9c00]"> COMPLEMENTAR</span>
                        </h2>
                      </div>
                    }
                    subtitle="Bônus de 10%"
                    data={chartData}
                    dataKey="comp"
                    color="#f59e0b"
                    days={days}
                    formatXP={formatXP}
                  />
                )}

                {sBoosts.pk && (
                  <ChartContainer
                    title={
                      <div className="flex items-center gap-2 mb-2">
                        <Trophy size={20} className="text-[#ff9c00]" />
                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">
                          BÔNUS<span className="text-[#ff9c00]"> PK</span>
                        </h2>
                      </div>
                    }
                    subtitle="Bônus de 15%"
                    data={chartData}
                    dataKey="pk"
                    color="#f59e0b"
                    days={days}
                    formatXP={formatXP}
                  />
                )}

                {sBoosts.relic && (
                  <ChartContainer
                    title={<div className="flex items-center gap-2 mb-2">
                      <Trophy size={20} className="text-[#ff9c00]" />
                      <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">
                        BÔNUS<span className="text-[#ff9c00]"> RELÍQUIA</span>
                      </h2>
                    </div>}
                    subtitle="Bônus de 15%"
                    data={chartData}
                    dataKey="relic"
                    color="#f59e0b"
                    days={days}
                    formatXP={formatXP}
                  />
                )}

                {sBoosts.vip && (
                  <ChartContainer
                    title={
                      <div className="flex items-center gap-2 mb-2">
                        <Trophy size={20} className="text-[#ff9c00]" />
                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">
                          BÔNUS<span className="text-[#ff9c00]"> VIP</span>
                        </h2>
                      </div>
                    }
                    subtitle="Bônus de 10%"
                    data={chartData}
                    dataKey="vip"
                    color="#f59e0b"
                    days={days}
                    formatXP={formatXP}
                  />
                )}

                {sBoosts.phoenix && (
                  <ChartContainer
                    title={
                      <div className="flex items-center gap-2 mb-2">
                        <Trophy size={20} className="text-[#ff9c00]" />
                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">
                          BÔNUS<span className="text-[#ff9c00]"> PHOENIX</span>
                        </h2>
                      </div>
                    }
                    subtitle="Bônus de 20%"
                    data={chartData}
                    dataKey="phoenix"
                    color="#f59e0b"
                    days={days}
                    formatXP={formatXP}
                  />
                )}
              </div>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  color: 'blue' | 'emerald' | 'purple' | 'orange';
}

const colorVariants = {
  orange: {
    border: 'hover:border-orange-500/50',
    glow: 'bg-orange-500/5 group-hover:bg-orange-500/10',
    iconBg: 'bg-orange-500/10',
    iconText: 'text-orange-500'
  },
  blue: {
    border: 'hover:border-blue-500/50',
    glow: 'bg-blue-500/5 group-hover:bg-blue-500/10',
    iconBg: 'bg-blue-500/10',
    iconText: 'text-blue-400'
  },
  emerald: {
    border: 'hover:border-emerald-500/50',
    glow: 'bg-emerald-500/5 group-hover:bg-emerald-500/10',
    iconBg: 'bg-emerald-500/10',
    iconText: 'text-emerald-400'
  },
  purple: {
    border: 'hover:border-purple-500/50',
    glow: 'bg-purple-500/5 group-hover:bg-purple-500/10',
    iconBg: 'bg-purple-500/10',
    iconText: 'text-purple-400'
  }
};

function StatCard({ title, value, subtitle, icon, color }: StatCardProps) {
  const styles = colorVariants[color] || colorVariants.orange;

  return (
    <div className={`aorus-card p-8 rounded-lg flex flex-col relative overflow-hidden group ${styles.border} transition-all duration-500`}>
      <div className={`absolute -right-8 -top-8 w-40 h-40 ${styles.glow} rounded-full blur-[60px] transition-all duration-700`}></div>

      <div className="flex items-center justify-between mb-8 relative z-10">
        <span className="text-slate-500 text-[11px] font-black uppercase tracking-[0.3em]">{title}</span>
        <div className={`p-4 rounded-lg ${styles.iconBg} ${styles.iconText} transition-all duration-500 group-hover:scale-110 border border-white/5`}>
          {icon}
        </div>
      </div>

      <div className="flex flex-col relative z-10">
        <span className="text-3xl font-black text-white mb-2 tracking-tight">{value}</span>
        <div className={`w-12 h-1 ${styles.iconBg} rounded-full mb-4 opacity-40`}></div>
        <span className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">{subtitle}</span>
      </div>
    </div>
  );
}

function ChartContainer({ title, subtitle, data, dataKey, color, days, formatXP }: any) {
  return (
    <section
      className="aorus-card p-8 rounded-lg flex flex-col h-[400px]"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          {title}
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">{subtitle}</p>
        </div>
        <div className="text-right">
          <p className="text-[14px] font-black text-white">{formatXP(data[data.length - 1]?.[dataKey] || 0)}</p>
        </div>
      </div>

      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`color${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
            <XAxis
              dataKey="day"
              stroke="#404040"
              fontSize={8}
              tickLine={false}
              axisLine={false}
              interval={Math.floor(days / 4)}
            />
            <YAxis
              stroke="#404040"
              fontSize={8}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatXP}
            />
            <Tooltip
              cursor={{ fill: '#ffffff05' }}
              contentStyle={{
                backgroundColor: '#0a0a0a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                padding: '12px',
                fontSize: '10px',
                fontWeight: 'bold',
                color: '#fff'
              }}
              itemStyle={{ color: '#ff9c00', textTransform: 'uppercase' }}
              labelStyle={{ marginBottom: '4px', color: '#64748b' }}
              formatter={(value: number) => [`${value.toLocaleString()} (${formatXP(value)})`, 'XP']}
            />
            <Area
              type="linear"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#color${dataKey})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function AorusCheckboxRow({ active, onClick, label, preview }: { active: boolean, onClick: () => void, label: string, preview?: string }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between p-3 cursor-pointer transition-all border border-white/5 rounded-lg mb-1 ${active ? "bg-[#ff9c00]/10 border-[#ff9c00]/30" : "bg-black/40 hover:bg-white/5"
        }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-4 h-4 border flex items-center justify-center transition-all rounded-sm ${active ? "bg-[#ff9c00] border-[#ff9c00]" : "bg-transparent border-white/20"
          }`}>
          {active && <Zap size={10} className={`text-black fill-black`} />}
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-widest ${active ? "text-white" : "text-slate-500"}`}>{label}</span>
      </div>
      {active && preview && (
        <span className="text-[10px] font-black text-[#ff9c00]">
          {preview}
        </span>
      )}
    </div>
  );
}
