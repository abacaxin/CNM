/* global firebase, CNM_FIREBASE_CONFIG */
/* ===================================================================
   CNM — camada de dados única (Firestore)
   Todo acesso ao banco passa por aqui. O painel e a landing page
   consomem os MESMOS normalizadores, garantindo que um dado salvo
   pelo Admin seja lido de forma idêntica pelo portal.

   Regra de ouro: nenhuma consulta usa orderBy — no Firestore, orderBy
   EXCLUI documentos que não possuem o campo ordenado, o que fazia
   registros legados sumirem silenciosamente. A ordenação acontece no
   cliente, sobre dados já normalizados.
   =================================================================== */
(function () {
  const config = window.CNM_FIREBASE_CONFIG || {};
  const configured = Boolean(config.apiKey && !config.apiKey.startsWith('SUBSTITUA') && config.projectId && !config.projectId.startsWith('SUBSTITUA'));
  let db = null;
  let auth = null;

  if (configured && window.firebase) {
    firebase.initializeApp(config);
    db = firebase.firestore();
    auth = firebase.auth();
  }

  /* ---------------- datas e status de corrida (fonte única) ----------------
     Modelo do evento (definido pela organização da CNM):
       - Classificação (quali): 12:00 do dia cadastrado até 00:00
       - Corrida (GP): 00:00 do dia seguinte, com 24h de duração
     Ou seja, o evento fica ATIVO das 12:00 do dia D até 00:00 do dia D+2.
     Só a DATA importa — a hora eventualmente presente no dateTime é ignorada. */

  const HOUR_MS = 60 * 60 * 1000;
  const QUALI_START_MS = 12 * HOUR_MS;  /* 12:00 do dia D */
  const RACE_START_MS = 24 * HOUR_MS;   /* 00:00 do dia D+1 */
  const EVENT_END_MS = 48 * HOUR_MS;    /* 00:00 do dia D+2 */

  /* 00:00 (hora local) do dia cadastrado, ou null se não houver data válida */
  function raceDayStart(race) {
    const date = new Date(race?.dateTime || '');
    if (Number.isNaN(date.getTime())) return null;
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  }

  /* início da quali — referência para ordenação e contagem regressiva */
  function raceTimestamp(race) {
    const day = raceDayStart(race);
    return day === null ? null : day + QUALI_START_MS;
  }

  /* corridas sem data válida vão para o fim da ordenação cronológica */
  function raceSortValue(race) {
    const ts = raceTimestamp(race);
    return ts === null ? Number.MAX_SAFE_INTEGER : ts;
  }

  function raceStatus(race, referenceDate = new Date()) {
    const day = raceDayStart(race);
    if (day === null) return 'proxima';
    const now = referenceDate.getTime();
    if (now < day + QUALI_START_MS) return 'proxima';
    if (now < day + EVENT_END_MS) return 'andamento';
    return 'finalizada';
  }

  /* durante "andamento", informa a fase atual: 'quali' ou 'corrida' */
  function racePhase(race, referenceDate = new Date()) {
    const day = raceDayStart(race);
    if (day === null) return null;
    const now = referenceDate.getTime();
    if (now >= day + QUALI_START_MS && now < day + RACE_START_MS) return 'quali';
    if (now >= day + RACE_START_MS && now < day + EVENT_END_MS) return 'corrida';
    return null;
  }

  const STATUS_LABELS = { proxima: 'A seguir', andamento: 'Ao vivo', finalizada: 'Finalizada' };
  function raceStatusLabel(status) { return STATUS_LABELS[status] || 'A seguir'; }

  /* ---------------- normalizadores (toleram documentos legados) ---------------- */

  function normalizeNews(doc) {
    return {
      id: doc.id,
      title: String(doc.title || '').trim(),
      category: String(doc.category || '').trim(),
      desc: String(doc.desc || '').trim(),
      icon: doc.icon || 'flag',
      imageUrl: String(doc.imageUrl || '').trim(),
      createdAt: String(doc.createdAt || '')
    };
  }

  function normalizeRace(doc) {
    let dateTime = String(doc.dateTime || '').trim();
    if (dateTime && Number.isNaN(new Date(dateTime).getTime())) dateTime = '';
    /* documentos legados guardavam "date" e "time" separados (e dateTime vazio) */
    if (!dateTime && doc.date) {
      const legacy = `${String(doc.date).trim()}T${String(doc.time || '00:00').trim()}:00`;
      if (!Number.isNaN(new Date(legacy).getTime())) dateTime = legacy;
    }
    return {
      id: doc.id,
      name: String(doc.name || '').trim(),
      circuit: String(doc.circuit || '').trim(),
      dateTime
    };
  }

  function normalizeTeam(doc) {
    return {
      id: doc.id,
      name: String(doc.name || '').trim(),
      base: String(doc.base || '').trim(),
      color: doc.color || '#E10600'
    };
  }

  function normalizeDriver(doc) {
    return {
      id: doc.id,
      name: String(doc.name || '').trim(),
      number: Number(doc.number) || 0,
      nat: String(doc.nat || '').trim().toUpperCase(),
      teamId: doc.teamId || '',
      color: doc.color || '',
      photoUrl: String(doc.photoUrl || '').trim(),
      /* legado: checkbox era salvo como a string "on" em vez de boolean */
      showInHallOfFame: doc.showInHallOfFame === true || doc.showInHallOfFame === 'on'
    };
  }

  function normalizeResult(doc) {
    let entries = Array.isArray(doc.entries) ? doc.entries : null;
    if (!entries) {
      /* documentos legados: campos soltos driver-N / points-N / time-N */
      entries = [];
      for (let pos = 1; pos <= 30; pos++) {
        const driverId = doc[`driver-${pos}`];
        if (!driverId) continue;
        entries.push({ driverId, position: pos, points: doc[`points-${pos}`], lapTime: doc[`time-${pos}`] });
      }
    }
    entries = entries
      .filter((entry) => entry && entry.driverId)
      .map((entry) => ({
        driverId: entry.driverId,
        position: Number(entry.position) || 0,
        points: Number(entry.points) || 0,
        lapTime: String(entry.lapTime || '').trim()
      }))
      .sort((a, b) => a.position - b.position);
    return {
      id: doc.id,
      raceId: doc.raceId || '',
      publishedAt: String(doc.publishedAt || ''),
      entries
    };
  }

  /* ---------------- consultas ---------------- */

  function toPlain(snapshot) {
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async function getCollection(name) {
    if (!db) return [];
    return toPlain(await db.collection(name).get());
  }

  /* ---------------- estatísticas e classificação ---------------- */

  /* mapa driverId -> { points, wins, podiums, races }, calculado dos resultados */
  function getDriverStats(drivers, results) {
    const stats = new Map(drivers.map((driver) => [driver.id, { points: 0, wins: 0, podiums: 0, races: 0 }]));
    results.forEach((result) => (result.entries || []).forEach((entry) => {
      const record = stats.get(entry.driverId);
      if (!record) return;
      record.points += Number(entry.points || 0);
      record.races += 1;
      const position = Number(entry.position);
      if (position === 1) record.wins += 1;
      if (position >= 1 && position <= 3) record.podiums += 1;
    }));
    return stats;
  }

  function getStandings(drivers, results) {
    const stats = getDriverStats(drivers, results);
    return drivers
      .map((driver) => ({ ...driver, ...(stats.get(driver.id) || { points: 0, wins: 0, podiums: 0, races: 0 }) }))
      .sort((a, b) => b.points - a.points || b.wins - a.wins || String(a.name).localeCompare(String(b.name)))
      .map((driver, index) => ({ ...driver, pos: index + 1 }));
  }

  /* ---------------- carga pública (landing e painel) ---------------- */

  async function loadPublicData() {
    const [news, races, teams, drivers, results] = await Promise.all([
      getCollection('news'),
      getCollection('races'),
      getCollection('teams'),
      getCollection('drivers'),
      getCollection('results')
    ]);

    const data = {
      news: news.map(normalizeNews).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      races: races.map(normalizeRace).sort((a, b) => raceSortValue(a) - raceSortValue(b)),
      teams: teams.map(normalizeTeam).sort((a, b) => a.name.localeCompare(b.name)),
      drivers: drivers.map(normalizeDriver).sort((a, b) => a.name.localeCompare(b.name)),
      results: results.map(normalizeResult)
    };

    /* resultados: mais recente primeiro (pela data da etapa; publishedAt como desempate) */
    const raceTimeById = new Map(data.races.map((race) => [race.id, raceTimestamp(race)]));
    data.results.sort((a, b) => {
      const timeA = raceTimeById.get(a.raceId) ?? new Date(a.publishedAt).getTime() ?? 0;
      const timeB = raceTimeById.get(b.raceId) ?? new Date(b.publishedAt).getTime() ?? 0;
      return (Number.isNaN(timeB) ? 0 : timeB) - (Number.isNaN(timeA) ? 0 : timeA) || b.publishedAt.localeCompare(a.publishedAt);
    });

    data.standings = getStandings(data.drivers, data.results);
    return data;
  }

  async function isAdmin(user) {
    if (!db || !user) return false;
    const snapshot = await db.collection('admins').doc(user.uid).get();
    return snapshot.exists && snapshot.data().active === true;
  }

  window.CNMFirebase = {
    configured,
    db: () => db,
    auth: () => auth,
    loadPublicData,
    isAdmin,
    getStandings,
    getDriverStats,
    raceTimestamp,
    raceSortValue,
    raceStatus,
    racePhase,
    raceStatusLabel,
    normalizeNews,
    normalizeRace,
    normalizeTeam,
    normalizeDriver,
    normalizeResult
  };
})();
