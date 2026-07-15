/* global firebase, CNM_FIREBASE_CONFIG */
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

  function toPlain(snapshot) {
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async function getCollection(name, orderField) {
    if (!db) return [];
    let query = db.collection(name);
    if (orderField) query = query.orderBy(orderField, 'desc');
    try {
      return toPlain(await query.get());
    } catch (error) {
      console.warn(`Não foi possível carregar ${name}.`, error);
      return [];
    }
  }

  function getStandings(drivers, results) {
    const totals = new Map(drivers.map((driver) => [driver.id, 0]));
    results.forEach((result) => (result.entries || []).forEach((entry) => {
      if (totals.has(entry.driverId)) totals.set(entry.driverId, totals.get(entry.driverId) + Number(entry.points || 0));
    }));
    return drivers
      .map((driver) => ({ ...driver, points: totals.get(driver.id) || 0 }))
      .sort((a, b) => b.points - a.points || String(a.name).localeCompare(String(b.name)))
      .map((driver, index) => ({ ...driver, pos: index + 1 }));
  }

  async function loadPublicData() {
    const [news, races, teams, drivers, results] = await Promise.all([
      getCollection('news', 'createdAt'),
      getCollection('races', 'dateTime'),
      getCollection('teams', 'name'),
      getCollection('drivers', 'name'),
      getCollection('results', 'publishedAt')
    ]);
    return { news, races, teams, drivers, results, standings: getStandings(drivers, results) };
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
    getStandings
  };
})();
