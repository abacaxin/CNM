document.addEventListener('DOMContentLoaded', () => {
  const service = window.CNMFirebase;
  const notice = document.getElementById('adminMessage');
  const state = { news: [], races: [], teams: [], drivers: [], results: [] };

  const escapeHtml = (value) => String(value || '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  const show = (text, error = false) => { notice.textContent = text; notice.classList.toggle('is-error', error); };
  const db = () => service.db();

  if (!service.configured) {
    show('Configure firebase-config.js antes de usar o painel.', true);
    return;
  }

  service.auth().onAuthStateChanged(async (user) => {
    if (!user || !await service.isAdmin(user)) {
      if (user) await service.auth().signOut();
      window.location.replace('login.html');
      return;
    }
    document.getElementById('adminEmail').textContent = user.email;
    await refresh();
  });

  document.getElementById('logoutButton').addEventListener('click', () => service.auth().signOut());
  document.querySelectorAll('.admin-tab').forEach((tab) => tab.addEventListener('click', () => {
    document.querySelectorAll('.admin-tab, .admin-panel').forEach((item) => item.classList.remove('is-active'));
    tab.classList.add('is-active');
    document.getElementById(`panel-${tab.dataset.tab}`).classList.add('is-active');
  }));

  async function refresh() {
    const names = Object.keys(state);
    const snapshots = await Promise.all(names.map((name) => db().collection(name).get()));
    names.forEach((name, index) => { state[name] = snapshots[index].docs.map((doc) => ({ id: doc.id, ...doc.data() })); });
    state.news.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    state.races.sort((a, b) => String(a.dateTime || '').localeCompare(String(b.dateTime || '')));
    state.teams.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    state.drivers.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    render();
  }

  function teamName(teamId) { return state.teams.find((team) => team.id === teamId)?.name || 'Equipe não cadastrada'; }
  function options(items, label) { return `<option value="">Selecione</option>${items.map((item) => `<option value="${item.id}">${escapeHtml(label(item))}</option>`).join('')}`; }
  function renderList(id, collection, rows, markup) {
    document.getElementById(id).innerHTML = rows.length ? rows.map((row) => `<article class="admin-list__item"><div>${markup(row)}</div><div class="list-actions"><button class="btn btn--ghost btn--sm" data-action="edit" data-collection="${collection}" data-id="${row.id}">Editar</button><button class="btn btn--danger btn--sm" data-action="delete" data-collection="${collection}" data-id="${row.id}">Excluir</button></div></article>`).join('') : '<p class="admin-empty">Nenhum item cadastrado.</p>';
  }

  function render() {
    document.getElementById('driverTeam').innerHTML = options(state.teams, (team) => team.name);
    document.getElementById('resultRace').innerHTML = options(state.races, (race) => race.name);
    renderList('newsList', 'news', state.news, (item) => `<strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.category)}</span>`);
    renderList('teamsList', 'teams', state.teams, (item) => `<strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.base)} · ${escapeHtml(item.id)}</span>`);
    renderList('driversList', 'drivers', state.drivers, (item) => `<strong>#${escapeHtml(item.number)} ${escapeHtml(item.name)}</strong><span>${escapeHtml(teamName(item.teamId))} · ID: ${escapeHtml(item.id)}</span>`);
    renderList('racesList', 'races', state.races, (item) => `<strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.dateTime)} · ${escapeHtml(item.status)}</span>`);
    renderList('resultsList', 'results', state.results, (item) => `<strong>${escapeHtml(state.races.find((race) => race.id === item.raceId)?.name || 'Etapa removida')}</strong><span>${(item.entries || []).length} pilotos pontuaram</span>`);
  }

  function parseResultEntries(text) {
    const entries = text.trim().split('\n').filter(Boolean).map((line) => {
      const [driverId, position, points] = line.split(',').map((value) => value.trim());
      if (!state.drivers.some((driver) => driver.id === driverId) || !position || Number.isNaN(Number(points))) throw new Error('Use IDs de pilotos válidos e informe posição e pontos em cada linha.');
      return { driverId, position: Number(position), points: Number(points) };
    });
    if (!entries.length) throw new Error('Informe pelo menos um piloto no resultado.');
    return entries;
  }

  function formData(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    delete data.id;
    if (form.id === 'resultForm') {
      data.entries = parseResultEntries(data.entriesText);
      delete data.entriesText;
      data.publishedAt = data.publishedAt || new Date().toISOString();
    }
    if (form.id === 'driverForm') { data.number = Number(data.number); data.nat = data.nat.toUpperCase(); }
    if (form.id === 'newsForm') data.createdAt = new Date().toISOString();
    return data;
  }

  document.querySelectorAll('.admin-form[data-collection]').forEach((form) => form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('[type="submit"]');
    button.disabled = true;
    try {
      const id = form.elements.id.value;
      const collection = form.dataset.collection;
      const data = formData(form);
      if (id) await db().collection(collection).doc(id).set(data, { merge: true });
      else await db().collection(collection).add(data);
      form.reset(); form.elements.id.value = '';
      show('Alteração salva e publicada.');
      await refresh();
    } catch (error) { show(error.message || 'Não foi possível salvar a alteração.', true); }
    finally { button.disabled = false; }
  }));

  document.querySelectorAll('.reset-form').forEach((button) => button.addEventListener('click', () => {
    const form = button.closest('form'); form.reset(); form.elements.id.value = '';
  }));

  document.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const { action, collection, id } = button.dataset;
    const item = state[collection].find((record) => record.id === id);
    if (!item) return;
    if (action === 'delete') {
      if (!window.confirm('Excluir este item? Esta ação não pode ser desfeita.')) return;
      await db().collection(collection).doc(id).delete(); show('Item excluído.'); await refresh(); return;
    }
    const form = document.querySelector(`form[data-collection="${collection}"]`);
    Object.entries(item).forEach(([key, value]) => { if (form.elements[key]) form.elements[key].value = value; });
    form.elements.id.value = id;
    if (collection === 'results') form.elements.entriesText.value = (item.entries || []).map((entry) => `${entry.driverId}, ${entry.position}, ${entry.points}`).join('\n');
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
});
