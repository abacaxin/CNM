/* ===================================================================
   CNM — painel administrativo
   Lê e grava via window.CNMFirebase (camada de dados única).
   Toda gravação é feita em formato CANÔNICO com set() sem merge:
   reeditar e salvar um registro antigo remove automaticamente os
   campos legados (driver-N, points-N, entriesText, date/time soltos).
   =================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const service = window.CNMFirebase;
  const notice = document.getElementById('adminMessage');
  const state = { news: [], races: [], teams: [], drivers: [], results: [] };
  const resultDraft = {};

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
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
    try {
      const data = await service.loadPublicData();
      state.news = data.news;
      state.races = data.races;
      state.teams = data.teams;
      state.drivers = data.drivers;
      state.results = data.results;
      render();
    } catch (error) {
      show(error.message || 'Não foi possível carregar os dados do banco.', true);
    }
  }

  function teamName(teamId) { return state.teams.find((team) => team.id === teamId)?.name || 'Equipe não cadastrada'; }
  function options(items, label) { return `<option value="">Selecione</option>${items.map((item) => `<option value="${item.id}">${escapeHtml(label(item))}</option>`).join('')}`; }
  function scoringDriversCount(result) {
    return (result.entries || []).filter((entry) => entry.driverId && Number(entry.points || 0) > 0).length;
  }
  function renderList(id, collection, rows, markup) {
    document.getElementById(id).innerHTML = rows.length ? rows.map((row) => `<article class="admin-list__item"><div>${markup(row)}</div><div class="list-actions"><button class="btn btn--ghost btn--sm" data-action="edit" data-collection="${collection}" data-id="${row.id}">Editar</button><button class="btn btn--danger btn--sm" data-action="delete" data-collection="${collection}" data-id="${row.id}">Excluir</button></div></article>`).join('') : '<p class="admin-empty">Nenhum item cadastrado.</p>';
  }

  const F1_POINTS = { 1: 25, 2: 18, 3: 15, 4: 12, 5: 10, 6: 8, 7: 6, 8: 4, 9: 2, 10: 1 };
  const MAX_POSITIONS = 22;
  function getF1Points(position) { return F1_POINTS[position] || 0; }

  function formatRaceDateTime(dateTime) {
    const date = new Date(dateTime || '');
    if (Number.isNaN(date.getTime())) return 'Data a definir';
    return date.toLocaleDateString('pt-BR');
  }

  /* valor aceito por <input type="datetime-local"> a partir de um ISO */
  function toLocalInputValue(isoString) {
    const date = new Date(isoString || '');
    if (Number.isNaN(date.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  /* monta as <option> de um seletor de piloto, escondendo pilotos já
     escolhidos em outras posições, mas mantendo o valor atual selecionável */
  function driverOptionsHtml(currentValue, takenIds) {
    let html = '<option value="">Selecione</option>';
    state.drivers.forEach((driver) => {
      if (takenIds.has(driver.id) && driver.id !== currentValue) return;
      const selected = driver.id === currentValue ? ' selected' : '';
      html += `<option value="${driver.id}"${selected}>#${escapeHtml(driver.number)} ${escapeHtml(driver.name)}</option>`;
    });
    return html;
  }

  /* atualiza apenas as opções dos seletores existentes (sem recriá-los),
     preservando o valor selecionado de cada posição e o foco do usuário */
  function refreshDriverOptions() {
    const selects = [];
    for (let pos = 1; pos <= MAX_POSITIONS; pos++) {
      const el = document.querySelector(`select[name="driver-${pos}"]`);
      if (el) selects.push(el);
    }
    const taken = new Set(selects.map((el) => el.value).filter(Boolean));
    selects.forEach((el) => {
      const current = el.value;
      el.innerHTML = driverOptionsHtml(current, taken);
      el.value = current;
    });
  }

  function clearResultDraft() {
    Object.keys(resultDraft).forEach((key) => delete resultDraft[key]);
  }

  /* monta as linhas de posição uma única vez; a troca de piloto apenas
     atualiza as opções dos demais seletores, sem destruir/recriar os campos */
  function renderResultEntries() {
    const container = document.getElementById('resultEntriesContainer');
    container.innerHTML = '';

    for (let pos = 1; pos <= MAX_POSITIONS; pos++) {
      const currentValue = resultDraft[pos]?.driverId || '';

      const posDiv = document.createElement('div');
      posDiv.className = 'result-entry';
      posDiv.style.display = 'grid';
      posDiv.style.gridTemplateColumns = '1fr 1fr';
      posDiv.style.gap = '0.5rem';
      posDiv.style.alignItems = 'center';

      const label = document.createElement('label');
      label.style.gridColumn = '1 / -1';
      label.textContent = `Posição ${pos}`;

      const select = document.createElement('select');
      select.name = `driver-${pos}`;
      select.innerHTML = driverOptionsHtml(currentValue, new Set());
      select.value = currentValue;
      select.style.gridColumn = '1';

      const pointsInput = document.createElement('input');
      pointsInput.type = 'number';
      pointsInput.name = `points-${pos}`;
      pointsInput.value = getF1Points(pos);
      pointsInput.placeholder = 'Pontos';
      pointsInput.style.gridColumn = '2';
      pointsInput.readOnly = true;
      pointsInput.style.backgroundColor = '#1a1a1a';
      pointsInput.style.cursor = 'not-allowed';
      pointsInput.style.opacity = '0.7';

      let timeInput = null;
      if (pos <= 3) {
        timeInput = document.createElement('input');
        timeInput.type = 'text';
        timeInput.name = `time-${pos}`;
        timeInput.placeholder = 'Tempo (ex: 1:23.456)';
        timeInput.value = resultDraft[pos]?.lapTime || '';
        timeInput.style.gridColumn = '1 / -1';
        timeInput.addEventListener('input', () => {
          resultDraft[pos] = { ...(resultDraft[pos] || {}), lapTime: timeInput.value };
        });
      }

      select.addEventListener('change', () => {
        resultDraft[pos] = { ...(resultDraft[pos] || {}), driverId: select.value, points: getF1Points(pos) };
        refreshDriverOptions();
      });

      posDiv.appendChild(label);
      posDiv.appendChild(select);
      posDiv.appendChild(pointsInput);
      if (timeInput) posDiv.appendChild(timeInput);
      container.appendChild(posDiv);
    }

    refreshDriverOptions();
  }

  function render() {
    document.getElementById('driverTeam').innerHTML = options(state.teams, (team) => team.name);
    document.getElementById('resultRace').innerHTML = options(state.races, (race) => race.name);
    renderList('newsList', 'news', state.news, (item) => `<strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.category)}</span>`);
    renderList('teamsList', 'teams', state.teams, (item) => `<strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.base)} · ${escapeHtml(item.id)}</span>`);
    renderList('driversList', 'drivers', state.drivers, (item) => `<strong>#${escapeHtml(item.number)} ${escapeHtml(item.name)}</strong><span>${escapeHtml(teamName(item.teamId))} · ID: ${escapeHtml(item.id)}</span>`);
    renderList('racesList', 'races', state.races, (item) => {
      const status = service.raceStatus(item);
      return `<strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(formatRaceDateTime(item.dateTime))} · ${service.raceStatusLabel(status)}</span>`;
    });
    renderList('resultsList', 'results', state.results, (item) => `<strong>${escapeHtml(state.races.find((race) => race.id === item.raceId)?.name || 'Etapa removida')}</strong><span>${scoringDriversCount(item)} pilotos pontuaram</span>`);
    renderResultEntries();
  }

  /* transforma o formulário em um documento canônico para o Firestore */
  function formData(form, editingId) {
    const data = Object.fromEntries(new FormData(form).entries());
    delete data.id;

    if (form.id === 'raceForm') {
      /* só a data importa: quali às 12:00 do dia, corrida de 00:00 a 00:00 do dia seguinte */
      data.dateTime = `${data.date}T00:00:00`;
      delete data.date;
    }

    if (form.id === 'resultForm') {
      const entries = [];
      for (let pos = 1; pos <= MAX_POSITIONS; pos++) {
        const driverId = data[`driver-${pos}`];
        const lapTime = String(data[`time-${pos}`] || '').trim();
        if (driverId) {
          const entry = { driverId, position: pos, points: getF1Points(pos) };
          if (lapTime) entry.lapTime = lapTime;
          entries.push(entry);
        }
        delete data[`driver-${pos}`];
        delete data[`points-${pos}`];
        delete data[`time-${pos}`];
      }
      data.entries = entries;
      data.publishedAt = data.publishedAt ? new Date(data.publishedAt).toISOString() : new Date().toISOString();
    }

    if (form.id === 'driverForm') {
      data.number = Number(data.number) || 0;
      data.nat = String(data.nat || '').trim().toUpperCase();
      data.photoUrl = String(data.photoUrl || '').trim();
      /* boolean de verdade — o valor "on" do checkbox quebrava o filtro do Hall da Fama */
      data.showInHallOfFame = Boolean(form.elements.showInHallOfFame?.checked);
    }

    if (form.id === 'newsForm') {
      data.imageUrl = String(data.imageUrl || '').trim();
      /* preserva a data de criação original ao editar; só cria nova em cadastro novo */
      const current = editingId ? state.news.find((item) => item.id === editingId) : null;
      data.createdAt = current?.createdAt || new Date().toISOString();
    }

    return data;
  }

  document.querySelectorAll('.admin-form[data-collection]').forEach((form) => form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('[type="submit"]');
    button.disabled = true;
    try {
      const id = form.elements.id.value;
      const collection = form.dataset.collection;
      const data = formData(form, id);
      /* set SEM merge: o documento é totalmente substituído pelo formato
         canônico, o que também migra/limpa registros legados ao reeditar */
      if (id) await db().collection(collection).doc(id).set(data);
      else await db().collection(collection).add(data);
      form.reset(); form.elements.id.value = '';
      if (form.id === 'resultForm') { clearResultDraft(); }
      show('Alteração salva e publicada.');
      await refresh();
    } catch (error) { show(error.message || 'Não foi possível salvar a alteração.', true); }
    finally { button.disabled = false; }
  }));

  document.querySelectorAll('.reset-form').forEach((button) => button.addEventListener('click', () => {
    const form = button.closest('form'); form.reset(); form.elements.id.value = '';
    if (form.id === 'resultForm') {
      clearResultDraft();
      renderResultEntries();
    }
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
    Object.entries(item).forEach(([key, value]) => {
      const field = form.elements[key];
      if (!field || field instanceof RadioNodeList) return;
      if (field.type === 'checkbox') field.checked = value === true;
      else if (typeof value !== 'object') field.value = value;
    });

    if (collection === 'races') {
      /* extrai a data do dateTime salvo (string local) sem converter para UTC —
         new Date().toISOString() deslocava a data em fusos negativos */
      const [datePart = ''] = String(item.dateTime || '').split('T');
      if (form.elements.date) form.elements.date.value = datePart;
    }

    if (collection === 'results') {
      if (form.elements.publishedAt) form.elements.publishedAt.value = toLocalInputValue(item.publishedAt);
      clearResultDraft();
      (item.entries || []).forEach((entry) => {
        resultDraft[entry.position] = {
          driverId: entry.driverId || '',
          points: Number(entry.points || getF1Points(entry.position)),
          lapTime: entry.lapTime || ''
        };
      });
      renderResultEntries();
    }

    form.elements.id.value = id;
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
});
