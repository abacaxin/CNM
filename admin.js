document.addEventListener('DOMContentLoaded', () => {
  const service = window.CNMFirebase;
  const notice = document.getElementById('adminMessage');
  const state = { news: [], races: [], teams: [], drivers: [], results: [] };
  const resultDraft = {};

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
    state.races.sort((a, b) => raceTimestamp(a) - raceTimestamp(b));
    state.teams.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    state.drivers.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    render();
  }

  function teamName(teamId) { return state.teams.find((team) => team.id === teamId)?.name || 'Equipe não cadastrada'; }
  function driverName(driverId) { return state.drivers.find((driver) => driver.id === driverId)?.name || 'Piloto não cadastrado'; }
  function options(items, label) { return `<option value="">Selecione</option>${items.map((item) => `<option value="${item.id}">${escapeHtml(label(item))}</option>`).join('')}`; }
  function raceTimestamp(race) {
    const time = new Date(race.dateTime || '').getTime();
    return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
  }
  function raceStatus(dateTime, referenceDate = new Date()) {
    const raceDate = new Date(dateTime || '');
    if (Number.isNaN(raceDate.getTime())) return 'proxima';
    const start = new Date(raceDate.getFullYear(), raceDate.getMonth(), raceDate.getDate(), 12, 0, 0, 0);
    const end = new Date(raceDate.getFullYear(), raceDate.getMonth(), raceDate.getDate() + 1, 0, 0, 0, 0);
    if (referenceDate < start) return 'proxima';
    if (referenceDate < end) return 'andamento';
    return 'finalizada';
  }
  function raceStatusLabel(status) {
    return ({ proxima: 'A seguir', andamento: 'Em andamento', finalizada: 'Expirado' })[status] || 'A seguir';
  }
  function scoringDriversCount(result) {
    return (result.entries || []).filter((entry) => entry.driverId && Number(entry.points || 0) > 0).length;
  }
  function renderList(id, collection, rows, markup) {
    document.getElementById(id).innerHTML = rows.length ? rows.map((row) => `<article class="admin-list__item"><div>${markup(row)}</div><div class="list-actions"><button class="btn btn--ghost btn--sm" data-action="edit" data-collection="${collection}" data-id="${row.id}">Editar</button><button class="btn btn--danger btn--sm" data-action="delete" data-collection="${collection}" data-id="${row.id}">Excluir</button></div></article>`).join('') : '<p class="admin-empty">Nenhum item cadastrado.</p>';
  }

  function getF1Points(position) {
    const pointsTable = {
      1: 25, 2: 18, 3: 15, 4: 12, 5: 10, 6: 8, 7: 6, 8: 4, 9: 2, 10: 1
    };
    return pointsTable[position] || 0;
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
    for (let pos = 1; pos <= 22; pos++) {
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

  /* monta as 22 linhas de posição uma única vez; a troca de piloto apenas
     atualiza as opções dos demais seletores, sem destruir/recriar os campos
     (o que fazia a seleção "não ser aplicada") */
  function renderResultEntries() {
    const container = document.getElementById('resultEntriesContainer');
    container.innerHTML = '';

    for (let pos = 1; pos <= 22; pos++) {
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
      const status = raceStatus(item.dateTime);
      return `<strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.dateTime)} - ${raceStatusLabel(status)}</span>`;
    });
    renderList('resultsList', 'results', state.results, (item) => `<strong>${escapeHtml(state.races.find((race) => race.id === item.raceId)?.name || 'Etapa removida')}</strong><span>${scoringDriversCount(item)} pilotos pontuaram</span>`);
    renderResultEntries();
  }

  function autoSetRaceStatus(dateTime) {
    const raceDate = new Date(dateTime);
    const now = new Date();
    
    if (raceDate < now) {
      return 'finalizada';
    }
    
    // Encontra a próxima corrida mais perto
    const futureRaces = state.races.filter(r => new Date(r.dateTime) >= now);
    const nextRace = futureRaces.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))[0];
    
    if (nextRace && nextRace.dateTime === dateTime) {
      return 'proxima';
    }
    
    return 'proxima';
  }

  function formData(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    delete data.id;
    
    if (form.id === 'raceForm') {
      const date = data.date;
      const time = data.time;
      data.dateTime = `${date}T${time}:00`;
      delete data.date;
      delete data.time;
      
      // Auto-set status se estiver vazio
      if (!data.status || data.status === '') {
        data.status = autoSetRaceStatus(data.dateTime);
      }
    }
    
    if (form.id === 'raceForm') {
      delete data.status;
    }

    if (form.id === 'resultForm') {
      const entries = [];
      for (let pos = 1; pos <= 22; pos++) {
        const driverId = data[`driver-${pos}`];
        const points = data[`points-${pos}`];
        if (driverId && points) {
          const entry = { driverId, position: pos, points: Number(points) };
          if (data[`time-${pos}`]) {
            entry.lapTime = data[`time-${pos}`];
          }
          entries.push(entry);
          delete data[`driver-${pos}`];
          delete data[`points-${pos}`];
          delete data[`time-${pos}`];
        } else {
          delete data[`driver-${pos}`];
          delete data[`points-${pos}`];
          delete data[`time-${pos}`];
        }
      }
      data.entries = entries;
      delete data.entriesText;
      data.publishedAt = data.publishedAt || new Date().toISOString();
    }
    
    if (form.id === 'driverForm') {
      data.number = Number(data.number);
      data.nat = data.nat.toUpperCase();
      data.showInHallOfFame = form.elements.showInHallOfFame?.checked || false;
    }
    
    if (form.id === 'newsForm') {
      data.createdAt = new Date().toISOString();
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
      const data = formData(form);
      if (id) await db().collection(collection).doc(id).set(data, { merge: true });
      else await db().collection(collection).add(data);
      form.reset(); form.elements.id.value = '';
      if (form.id === 'resultForm') clearResultDraft();
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
      if (form.elements[key]) {
        if (key === 'showInHallOfFame') {
          form.elements[key].checked = value || false;
        } else {
          form.elements[key].value = value;
        }
      }
    });
    
    // Separar dateTime em date e time para o formulário de corridas
    if (collection === 'races' && item.dateTime) {
      const dt = new Date(item.dateTime);
      const date = dt.toISOString().split('T')[0];
      const time = dt.toTimeString().slice(0, 5);
      if (form.elements.date) form.elements.date.value = date;
      if (form.elements.time) form.elements.time.value = time;
    }
    
    form.elements.id.value = id;
    if (collection === 'results') {
      clearResultDraft();
      if (item.entries) {
        item.entries.forEach((entry) => {
          resultDraft[entry.position] = {
            driverId: entry.driverId || '',
            points: Number(entry.points || getF1Points(entry.position)),
            lapTime: entry.lapTime || ''
          };
        });
      }
      document.getElementById('resultEntriesContainer').innerHTML = '';
      renderResultEntries();
    }
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
});
