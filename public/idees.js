const STATUTS = [
  { value: 'a_explorer', label: 'A explorer' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'publie', label: 'Publie' },
];

const ideesStatusEl = document.getElementById('idees-status');
const columns = {
  a_explorer: document.getElementById('col-a_explorer'),
  en_cours: document.getElementById('col-en_cours'),
  publie: document.getElementById('col-publie'),
};

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function loadIdees() {
  ideesStatusEl.textContent = 'Chargement...';

  try {
    const res = await fetch('/api/idees');
    const idees = await res.json();

    if (!res.ok) {
      ideesStatusEl.textContent = idees.error || 'Erreur lors du chargement des idees.';
      return;
    }

    ideesStatusEl.textContent = '';
    renderIdees(idees);
  } catch (err) {
    ideesStatusEl.textContent = 'Erreur reseau lors du chargement des idees.';
  }
}

function renderIdees(idees) {
  for (const statut of Object.keys(columns)) {
    columns[statut].innerHTML = '';
  }

  const parStatut = { a_explorer: [], en_cours: [], publie: [] };
  for (const idee of idees) {
    (parStatut[idee.statut] || parStatut.a_explorer).push(idee);
  }

  for (const statut of Object.keys(columns)) {
    const container = columns[statut];
    const liste = parStatut[statut];

    if (liste.length === 0) {
      container.innerHTML = '<p class="empty-column">Aucune idee.</p>';
      continue;
    }

    for (const idee of liste) {
      container.appendChild(renderIdeeCard(idee));
    }
  }
}

function renderIdeeCard(idee) {
  const card = document.createElement('div');
  card.className = 'idee-card';

  const universLabel = idee.univers?.nom ? idee.univers.nom : '(mot-cle libre)';

  card.innerHTML = `
    <div class="idee-texte">${escapeHtml(idee.texte)}</div>
    <div class="idee-meta">${escapeHtml(idee.source || '')} - ${escapeHtml(universLabel)}</div>
    <div class="idee-actions">
      <select></select>
      <button class="btn btn-danger btn-delete">Supprimer</button>
    </div>
  `;

  const select = card.querySelector('select');
  for (const s of STATUTS) {
    const opt = document.createElement('option');
    opt.value = s.value;
    opt.textContent = s.label;
    if (s.value === idee.statut) opt.selected = true;
    select.appendChild(opt);
  }
  select.addEventListener('change', () => changeStatut(idee.id, select.value));

  card.querySelector('.btn-delete').addEventListener('click', () => deleteIdee(idee));

  return card;
}

async function changeStatut(id, statut) {
  const res = await fetch(`/api/idees/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ statut }),
  });

  if (!res.ok) {
    const data = await res.json();
    alert(data.error || 'Erreur lors du changement de statut.');
    return;
  }

  await loadIdees();
}

async function deleteIdee(idee) {
  const ok = confirm(`Supprimer l'idee "${idee.texte}" ?`);
  if (!ok) return;

  await fetch(`/api/idees/${idee.id}`, { method: 'DELETE' });
  await loadIdees();
}

loadIdees();
