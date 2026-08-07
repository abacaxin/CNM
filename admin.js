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

  /* etapa: escolher outra corrida re-renderiza os grupos de resultado
     (nº de posições e tabela de pontos mudam entre normal/duelo) */
  document.getElementById('resultRace').addEventListener('change', () => renderResultEntries());

  /* etapa: toggle Normal/Duelo — grava o valor no input oculto "type" */
  const raceTypeToggle = document.getElementById('raceTypeToggle');
  const raceTypeInput = raceTypeToggle.querySelector('input[name="type"]');
  function setRaceType(value) {
    raceTypeInput.value = value;
    raceTypeToggle.querySelectorAll('.toggle-switch__option').forEach((btn) => btn.classList.toggle('is-active', btn.dataset.value === value));
  }
  raceTypeToggle.querySelectorAll('.toggle-switch__option').forEach((btn) => btn.addEventListener('click', () => setRaceType(btn.dataset.value)));

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

  const QUALIFYING_POSITIONS = service.QUALIFYING_POSITIONS;
  function getQualifyingPoints(position) { return service.getQualifyingPoints(position); }
  function getRacePoints(raceType, position) { return service.getRacePoints(raceType, position); }
  function getRacePositionsCount(raceType) { return service.getRacePositionsCount(raceType); }
  function currentRaceType() {
    const raceId = document.getElementById('resultRace').value;
    return state.races.find((race) => race.id === raceId)?.type || 'normal';
  }

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

  /* atualiza apenas as opções dos seletores de um grupo (sem recriá-los),
     preservando o valor selecionado de cada posição e o foco do usuário */
  function refreshDriverOptions(namePrefix) {
    const selects = document.querySelectorAll(`select[name^="${namePrefix}"]`);
    const taken = new Set(Array.from(selects).map((el) => el.value).filter(Boolean));
    selects.forEach((el) => {
      const current = el.value;
      el.innerHTML = driverOptionsHtml(current, taken);
      el.value = current;
    });
  }

  function clearResultDraft() {
    resultDraft.entries = {};
    resultDraft.qualifying = {};
  }
  clearResultDraft();

  /* monta um grupo de posições (classificação ou corrida); a troca de
     piloto apenas atualiza as opções dos demais seletores do MESMO
     grupo, sem destruir/recriar os campos */
  function renderEntryGroup({ container, title, draftKey, namePrefix, positions, pointsFor, withTime }) {
    const group = document.createElement('div');
    group.className = 'result-entries-group';

    const heading = document.createElement('p');
    heading.className = 'result-entries-group__title';
    heading.textContent = title;
    group.appendChild(heading);

    for (let pos = 1; pos <= positions; pos++) {
      const draft = resultDraft[draftKey];
      const currentValue = draft[pos]?.driverId || '';

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
      select.name = `${namePrefix}${pos}`;
      select.innerHTML = driverOptionsHtml(currentValue, new Set());
      select.value = currentValue;
      select.style.gridColumn = '1';

      const pointsInput = document.createElement('input');
      pointsInput.type = 'number';
      pointsInput.name = `${namePrefix}points-${pos}`;
      pointsInput.value = pointsFor(pos);
      pointsInput.placeholder = 'Pontos';
      pointsInput.style.gridColumn = '2';
      pointsInput.readOnly = true;
      pointsInput.style.backgroundColor = '#1a1a1a';
      pointsInput.style.cursor = 'not-allowed';
      pointsInput.style.opacity = '0.7';

      let timeInput = null;
      if (withTime && pos <= 3) {
        timeInput = document.createElement('input');
        timeInput.type = 'text';
        timeInput.name = `${namePrefix}time-${pos}`;
        timeInput.placeholder = 'Tempo (ex: 1:23.456)';
        timeInput.value = draft[pos]?.lapTime || '';
        timeInput.style.gridColumn = '1 / -1';
        timeInput.addEventListener('input', () => {
          draft[pos] = { ...(draft[pos] || {}), lapTime: timeInput.value };
        });
      }

      select.addEventListener('change', () => {
        draft[pos] = { ...(draft[pos] || {}), driverId: select.value, points: pointsFor(pos) };
        refreshDriverOptions(namePrefix);
      });

      posDiv.appendChild(label);
      posDiv.appendChild(select);
      posDiv.appendChild(pointsInput);
      if (timeInput) posDiv.appendChild(timeInput);
      group.appendChild(posDiv);
    }

    container.appendChild(group);
    refreshDriverOptions(namePrefix);
  }

  /* corrida normal: 15 pilotos pontuando, tabela fixa.
     corrida de duelo: 16 pilotos pontuando, tabela isolada (placeholder).
     a classificação pontua sempre 5 posições, nos dois formatos. */
  function renderResultEntries() {
    const container = document.getElementById('resultEntriesContainer');
    container.innerHTML = '';
    const raceType = currentRaceType();

    renderEntryGroup({
      container,
      title: 'Classificação (Qualifying)',
      draftKey: 'qualifying',
      namePrefix: 'quali-driver-',
      positions: QUALIFYING_POSITIONS,
      pointsFor: getQualifyingPoints,
      withTime: false
    });

    renderEntryGroup({
      container,
      title: raceType === 'duelo' ? 'Corrida (Duelo — 16 pilotos)' : 'Corrida (Normal — 15 pilotos)',
      draftKey: 'entries',
      namePrefix: 'driver-',
      positions: getRacePositionsCount(raceType),
      pointsFor: (pos) => getRacePoints(raceType, pos),
      withTime: true
    });
  }

  function render() {
    document.getElementById('driverTeam').innerHTML = options(state.teams, (team) => team.name);
    document.getElementById('resultRace').innerHTML = options(state.races, (race) => race.name);
    renderList('newsList', 'news', state.news, (item) => `<strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.category)}</span>`);
    renderList('teamsList', 'teams', state.teams, (item) => `<strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.base)} · ${escapeHtml(item.id)}</span>`);
    renderList('driversList', 'drivers', state.drivers, (item) => `<strong>#${escapeHtml(item.number)} ${escapeHtml(item.name)}</strong><span>${escapeHtml(teamName(item.teamId))} · ID: ${escapeHtml(item.id)}</span>`);
    renderList('racesList', 'races', state.races, (item) => {
      const status = service.raceStatus(item);
      return `<strong>${escapeHtml(item.name)} <span class="race-type-badge">${item.type === 'duelo' ? 'Duelo' : 'Normal'}</span></strong><span>${escapeHtml(formatRaceDateTime(item.dateTime))} · ${service.raceStatusLabel(status)}</span>`;
    });
    renderList('resultsList', 'results', state.results, (item) => `<strong>${escapeHtml(state.races.find((race) => race.id === item.raceId)?.name || 'Etapa removida')}</strong><span>${scoringDriversCount(item)} na corrida · ${(item.qualifying || []).length} na classificação</span>`);
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
      const raceType = state.races.find((race) => race.id === data.raceId)?.type || 'normal';

      const qualifying = [];
      for (let pos = 1; pos <= QUALIFYING_POSITIONS; pos++) {
        const driverId = data[`quali-driver-${pos}`];
        if (driverId) qualifying.push({ driverId, position: pos, points: getQualifyingPoints(pos) });
        delete data[`quali-driver-${pos}`];
        delete data[`quali-driver-points-${pos}`];
      }

      const entries = [];
      for (let pos = 1; pos <= getRacePositionsCount(raceType); pos++) {
        const driverId = data[`driver-${pos}`];
        const lapTime = String(data[`driver-time-${pos}`] || '').trim();
        if (driverId) {
          const entry = { driverId, position: pos, points: getRacePoints(raceType, pos) };
          if (lapTime) entry.lapTime = lapTime;
          entries.push(entry);
        }
        delete data[`driver-${pos}`];
        delete data[`driver-points-${pos}`];
        delete data[`driver-time-${pos}`];
      }

      data.qualifying = qualifying;
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
      if (form.id === 'raceForm') { setRaceType('normal'); }
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
    if (form.id === 'raceForm') { setRaceType('normal'); }
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
      setRaceType(item.type === 'duelo' ? 'duelo' : 'normal');
    }

    if (collection === 'results') {
      if (form.elements.publishedAt) form.elements.publishedAt.value = toLocalInputValue(item.publishedAt);
      const raceType = state.races.find((race) => race.id === item.raceId)?.type || 'normal';
      clearResultDraft();
      (item.qualifying || []).forEach((entry) => {
        resultDraft.qualifying[entry.position] = {
          driverId: entry.driverId || '',
          points: Number(entry.points || getQualifyingPoints(entry.position))
        };
      });
      (item.entries || []).forEach((entry) => {
        resultDraft.entries[entry.position] = {
          driverId: entry.driverId || '',
          points: Number(entry.points || getRacePoints(raceType, entry.position)),
          lapTime: entry.lapTime || ''
        };
      });
      renderResultEntries();
    }

    form.elements.id.value = id;
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
});
