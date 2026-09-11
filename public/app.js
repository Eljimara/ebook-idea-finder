const universListEl = document.getElementById('univers-list');
const selectUniversEl = document.getElementById('select-univers');
const inputKeywordEl = document.getElementById('input-keyword');
const searchModeRadios = document.querySelectorAll('input[name="search-mode"]');
const btnSearch = document.getElementById('btn-search');
const resultsTableWrap = document.getElementById('results-table-wrap');
const resultsBody = document.getElementById('results-body');
const resultsStatus = document.getElementById('results-status');
const searchSummary = document.getElementById('search-summary');

const universDialog = document.getElementById('univers-dialog');
const universForm = document.getElementById('univers-form');
const universDialogTitle = document.getElementById('univers-dialog-title');
const universIdField = document.getElementById('univers-id');
const universNomField = document.getElementById('univers-nom');
const universDescriptionField = document.getElementById('univers-description');
const universMotsClesField = document.getElementById('univers-mots-cles');
const universMotsExclusField = document.getElementById('univers-mots-exclus');

let universCache = [];
let currentUniversId = null;

async function loadUnivers() {
  const res = await fetch('/api/univers');
  universCache = await res.json();
  renderUniversList();
  renderUniversSelect();
}

function renderUniversList() {
  universListEl.innerHTML = '';
  for (const u of universCache) {
    const card = document.createElement('div');
    card.className = 'univers-card';
    card.innerHTML = `
      <h3>${escapeHtml(u.nom)}</h3>
      <p>${escapeHtml(u.description || '')}</p>
      <p class="card-mots-cles">Mots-cles : ${escapeHtml(u.mots_cles || '(non renseignes)')}</p>
      <p class="card-mots-exclus">Mots exclus : ${escapeHtml(u.mots_exclus || '(aucun)')}</p>
      <div class="card-actions">
        <button class="btn btn-edit">Modifier</button>
        <button class="btn btn-danger btn-delete">Supprimer</button>
      </div>
    `;
    card.querySelector('.btn-edit').addEventListener('click', () => openEditDialog(u));
    card.querySelector('.btn-delete').addEventListener('click', () => deleteUnivers(u));
    universListEl.appendChild(card);
  }
}

function renderUniversSelect() {
  selectUniversEl.innerHTML = '';
  for (const u of universCache) {
    const opt = document.createElement('option');
    opt.value = u.id;
    opt.textContent = u.nom;
    selectUniversEl.appendChild(opt);
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function openAddDialog() {
  universDialogTitle.textContent = 'Ajouter un univers';
  universIdField.value = '';
  universNomField.value = '';
  universDescriptionField.value = '';
  universMotsClesField.value = '';
  universMotsExclusField.value = '';
  universDialog.showModal();
}

function openEditDialog(u) {
  universDialogTitle.textContent = "Modifier l'univers";
  universIdField.value = u.id;
  universNomField.value = u.nom;
  universDescriptionField.value = u.description || '';
  universMotsClesField.value = u.mots_cles || '';
  universMotsExclusField.value = u.mots_exclus || '';
  universDialog.showModal();
}

async function deleteUnivers(u) {
  const ok = confirm(`Supprimer l'univers "${u.nom}" ?`);
  if (!ok) return;
  await fetch(`/api/univers/${u.id}`, { method: 'DELETE' });
  await loadUnivers();
}

universForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = universIdField.value;
  const payload = {
    nom: universNomField.value,
    description: universDescriptionField.value,
    mots_cles: universMotsClesField.value,
    mots_exclus: universMotsExclusField.value,
  };

  if (id) {
    await fetch(`/api/univers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } else {
    await fetch('/api/univers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  universDialog.close();
  await loadUnivers();
});

document.getElementById('btn-add-univers').addEventListener('click', openAddDialog);
document.getElementById('btn-cancel-univers').addEventListener('click', () => universDialog.close());

for (const radio of searchModeRadios) {
  radio.addEventListener('change', () => {
    const mode = document.querySelector('input[name="search-mode"]:checked').value;
    selectUniversEl.disabled = mode !== 'univers';
    inputKeywordEl.disabled = mode !== 'keyword';
  });
}

btnSearch.addEventListener('click', async () => {
  const mode = document.querySelector('input[name="search-mode"]:checked').value;
  const params = new URLSearchParams();

  if (mode === 'univers') {
    if (!selectUniversEl.value) {
      resultsStatus.textContent = 'Aucun univers disponible.';
      return;
    }
    currentUniversId = selectUniversEl.value;
    params.set('univers_id', currentUniversId);
  } else {
    const kw = inputKeywordEl.value.trim();
    if (!kw) {
      resultsStatus.textContent = 'Merci de saisir un mot-cle.';
      return;
    }
    currentUniversId = null;
    params.set('keyword', kw);
  }

  resultsStatus.textContent = 'Recherche en cours...';
  resultsTableWrap.hidden = true;
  searchSummary.textContent = '';

  try {
    const res = await fetch(`/api/search?${params.toString()}`);
    const data = await res.json();

    if (!res.ok) {
      resultsStatus.textContent = data.error || 'Erreur lors de la recherche.';
      return;
    }

    renderResults(data);
  } catch (err) {
    resultsStatus.textContent = 'Erreur reseau lors de la recherche.';
  }
});

function renderResults(data) {
  resultsBody.innerHTML = '';

  const motsClesLabel = (data.motsCles || []).join(', ');

  if (!data.resultats || data.resultats.length === 0) {
    resultsStatus.textContent = `Aucun resultat pour "${motsClesLabel}".`;
    resultsTableWrap.hidden = true;
    return;
  }

  for (const r of data.resultats) {
    const tr = document.createElement('tr');
    const recurrenceLabel = r.occurrences > 1 ? `×${r.occurrences}` : '';
    tr.innerHTML = `
      <td>${escapeHtml(r.texte)}</td>
      <td>${escapeHtml(r.source)}</td>
      <td>${escapeHtml(r.motCle)}</td>
      <td>${escapeHtml(recurrenceLabel)}</td>
      <td></td>
    `;
    const actionCell = tr.lastElementChild;
    const btn = document.createElement('button');
    btn.className = 'btn btn-icon btn-save';
    btn.textContent = '💾';
    btn.title = 'Sauvegarder cette idee';
    btn.setAttribute('aria-label', 'Sauvegarder cette idee');
    btn.addEventListener('click', () => saveIdee(r, btn));
    actionCell.appendChild(btn);
    resultsBody.appendChild(tr);
  }

  searchSummary.textContent = `pour "${motsClesLabel}" (${data.resultats.length})`;
  resultsStatus.textContent = '';
  resultsTableWrap.hidden = false;
}

async function saveIdee(r, btn) {
  btn.disabled = true;
  btn.textContent = '…';

  try {
    const res = await fetch('/api/idees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        univers_id: currentUniversId,
        texte: r.texte,
        source: r.source,
        mot_cle: r.motCle,
      }),
    });
    const data = await res.json();

    if (res.status === 409) {
      btn.textContent = '✓';
      btn.title = 'Deja sauvegardee';
      btn.setAttribute('aria-label', 'Deja sauvegardee');
      btn.classList.add('btn-saved');
      return;
    }

    if (!res.ok) {
      btn.disabled = false;
      btn.textContent = '💾';
      alert(data.error || "Erreur lors de la sauvegarde de l'idee.");
      return;
    }

    btn.textContent = '✓';
    btn.title = 'Sauvegardee';
    btn.setAttribute('aria-label', 'Sauvegardee');
    btn.classList.add('btn-saved');
  } catch (err) {
    btn.disabled = false;
    btn.textContent = '💾';
    alert('Erreur reseau lors de la sauvegarde.');
  }
}

loadUnivers();
